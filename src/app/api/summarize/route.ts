import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CacheService } from '@/services/CacheService';

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.error('GOOGLE_AI_API_KEY is not set in the environment variables');
  throw new Error('GOOGLE_AI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY as string);

export async function POST(request: Request) {
  try {
    const { transcription, isPartial, partNumber, totalParts } = await request.json();

    if (!transcription) {
      throw new Error('Transcription is missing');
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content 
    let prompt = `Summarize the following podcast transcription into a concise format fit for 5 minute read newsletter:`;
    if (isPartial) {
      prompt += ` This is part ${partNumber} of ${totalParts}. Focus on the key points in this section.`;
    }
    prompt += `\n\n${transcription}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text(); 

    return NextResponse.json({ newsletter: summary });
  } catch (error) {
    console.error('Error in summarization process:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to summarize transcription: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred during summarization' },
        { status: 500 }
      );
    }
  }
}

// Uses real podcast transcripts
/* export async function POST(request: Request) {
  try {
    const { transcription } = await request.json();

    if (!transcription) {
      throw new Error('Transcription is missing');
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content 
    const prompt = `Please summarize the following podcast transcription into a 10-minute read in a news article format:\n\n${transcription}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text(); 

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in summarization process:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to summarize transcription: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred during summarization' },
        { status: 500 }
      );
    }
  }
} */