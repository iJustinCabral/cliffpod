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
const MAX_CONCURRENT_REQUESTS = 5;
const REQUEST_DELAY = 1000; // 1 second delay between requests

function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });
}

async function splitAudio(inputBuffer: Buffer, onProgress: (progress: number) => void): Promise<string[]> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-'));
    const inputPath = path.join(tempDir, 'input.mp3');
    await fs.writeFile(inputPath, inputBuffer);
  
    const duration = await getAudioDuration(inputPath);
    const chunkDuration = 60; // 1 minute chunks
    const chunks: string[] = [];
  
    for (let start = 0; start < duration; start += chunkDuration) {
      const outputPath = path.join(tempDir, `chunk_${chunks.length}.mp3`);
      chunks.push(outputPath);
  
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .setStartTime(start)
          .setDuration(chunkDuration)
          .output(outputPath)
          .on('end', () => {
            onProgress(Math.min(100, Math.round((start + chunkDuration) / duration * 100)));
            resolve();
          })
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
  
      if (base64Audio.length > MAX_CHUNK_SIZE) {
        console.warn(`Chunk size (${base64Audio.length} bytes) exceeds limit. Skipping transcription.`);
        return ''; // Return empty string for oversized chunks
      }
  
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      const result = await model.generateContent([
        "Transcribe the following audio file accurately:",
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
      console.error('Error in transcribeChunkWithRetry:', error);
      if (retries > 0) {
        const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
        console.log(`Retrying transcription in ${delay}ms. Attempts left: ${retries - 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return transcribeChunkWithRetry(chunkPath, retries - 1);
      }
      throw error;
    }
  }
  
  async function transcribeChunksWithRateLimit(chunks: string[]): Promise<string[]> {
    const transcriptions: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await transcribeChunkWithRetry(chunks[i]);
        transcriptions.push(result);
      } catch (error) {
        console.error(`Failed to transcribe chunk ${i}:`, error);
        transcriptions.push(''); // Push empty string for failed chunks
      }
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
      }
    }
    return transcriptions;
  }
  
  export async function POST(request: Request) {
    const { audioUrl } = await request.json();
  
    if (!audioUrl) {
      return NextResponse.json({ error: "Audio URL is missing" }, { status: 400 });
    }
  
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
  
    const sendProgress = async (type: string, progress: number) => {
      await writer.write(encoder.encode(JSON.stringify({ [type]: progress }) + '\n'));
    };
  
    (async () => {
      try {
        await sendProgress('downloadProgress', 0);
        const audioResponse = await axios.get(audioUrl, {
          responseType: 'arraybuffer',
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
            sendProgress('downloadProgress', percentCompleted);
          },
        });
        await sendProgress('downloadProgress', 100);
  
        const audioBuffer = Buffer.from(audioResponse.data);
  
        await sendProgress('splitProgress', 0);
        const chunks = await splitAudio(audioBuffer, (progress) => sendProgress('splitProgress', progress));
        await sendProgress('splitProgress', 100);
  
        await sendProgress('transcribeProgress', 0);
        const transcriptions = await transcribeChunksWithRateLimit(chunks);
        const fullTranscription = transcriptions.filter(t => t !== '').join(' ');
  
        for (let i = 0; i < transcriptions.length; i++) {
          await sendProgress('transcribeProgress', Math.round(((i + 1) / transcriptions.length) * 100));
        }
  
        for (const chunk of chunks) {
          await fs.unlink(chunk);
        }
  
        if (!fullTranscription.trim()) {
          throw new Error('Transcription is empty');
        }
  
        await writer.write(encoder.encode(JSON.stringify({ transcription: fullTranscription }) + '\n'));
      } catch (error) {
        console.error('Error in transcription process:', error);
        if (error instanceof Error) {
          await writer.write(encoder.encode(JSON.stringify({ error: `Failed to transcribe audio: ${error.message}` }) + '\n'));
        } else {
          await writer.write(encoder.encode(JSON.stringify({ error: 'An unknown error occurred during transcription' }) + '\n'));
        }
      } finally {
        await writer.close();
      }
    })();
  
    return new Response(stream.readable, {
      headers: { 'Content-Type': 'application/json' },
    });
  }