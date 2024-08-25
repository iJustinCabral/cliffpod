import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY as string);

const MAX_CHUNK_SIZE = 15 * 1024 * 1024; // 15 MB to be safe
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });
}

async function splitAudio(inputBuffer: Buffer): Promise<string[]> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-'));
  const inputPath = path.join(tempDir, 'input.mp3');
  await fs.writeFile(inputPath, inputBuffer);

  const duration = await getAudioDuration(inputPath);
  const chunkDuration = (MAX_CHUNK_SIZE / inputBuffer.length) * duration;
  const chunks: string[] = [];

  for (let start = 0; start < duration; start += chunkDuration) {
    const outputPath = path.join(tempDir, `chunk_${chunks.length}.mp3`);
    chunks.push(outputPath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(start)
        .setDuration(chunkDuration)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  return chunks;
}

async function transcribeChunkWithRetry(chunkPath: string, retries = MAX_RETRIES): Promise<string> {
  try {
    const chunk = await fs.readFile(chunkPath);
    const base64Audio = chunk.toString('base64');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      "Transcribe the following audio file:",
      {
        inlineData: {
          mimeType: "audio/mpeg",
          data: base64Audio
        }
      }
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying transcription. Attempts left: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return transcribeChunkWithRetry(chunkPath, retries - 1);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { audioUrl } = await request.json();
    console.log('Received audio URL:', audioUrl);

    if (!audioUrl) {
      throw new Error("Audio URL is missing");
    }

    // Validate URL
    new URL(audioUrl);

    console.log('Downloading audio file...', audioUrl);
    const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(audioResponse.data);

    console.log('Splitting audio into chunks...');
    const chunks = await splitAudio(audioBuffer);

    console.log(`Split audio into ${chunks.length} chunks`);

    console.log('Transcribing chunks...');
    const transcriptions = await Promise.all(chunks.map(async (chunk, index) => {
      console.log(`Transcribing chunk ${index + 1}/${chunks.length}`);
      return transcribeChunkWithRetry(chunk);
    }));

    const fullTranscription = transcriptions.join(' ');

    console.log('Cleaning up temporary files...');
    for (const chunk of chunks) {
      await fs.unlink(chunk);
    }

    console.log('Transcription complete');
    return NextResponse.json({ transcription: fullTranscription });
  } catch (error) {
    console.error('Error in transcription process:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to transcribe audio: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred during transcription' },
        { status: 500 }
      );
    }
  }
}