import { NextResponse } from 'next/server';
import { DownloadService } from '@/services/DownloadService';
import { AudioSplitService } from '@/services/AudioSplitService';
import { TranscriptionService } from '@/services/TranscriptionService';
import { promises as fs } from 'fs';

export async function POST(request: Request) {
  console.log('Transcribe API route called');
  let audioUrl;
  try {
    const body = await request.json();
    audioUrl = body.audioUrl;
    console.log('Received audioUrl:', audioUrl);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!audioUrl) {
    console.log('Audio URL is missing');
    return NextResponse.json({ error: "Audio URL is missing" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (type: string, progress: number) => {
    console.log(`Progress update: ${type} - ${progress}%`);
    await writer.write(encoder.encode(JSON.stringify({ progress: { type, value: progress } }) + '\n'));
  };

  try {
    // Download
    console.log('Starting audio download');
    const audioBuffer = await DownloadService.downloadAudio(audioUrl, 
      (progress) => sendProgress('downloadProgress', progress)
    );
    console.log(`Audio downloaded, size: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Split
    console.log('Starting audio splitting');
    const chunks = await AudioSplitService.splitAudio(audioBuffer, 
      (progress) => sendProgress('splitProgress', progress)
    );
    console.log(`Audio split into ${chunks.length} chunks`);

    // Transcribe
    console.log('Starting transcription');
    const fullTranscription = await TranscriptionService.transcribeChunks(chunks, 
      (progress) => sendProgress('transcribeProgress', progress)
    );
    console.log(`Transcription complete, length: ${fullTranscription.length} characters`);

    // Cleanup
    await AudioSplitService.cleanup(chunks);

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

  return new Response(stream.readable, {
    headers: { 'Content-Type': 'application/json' },
  });
}