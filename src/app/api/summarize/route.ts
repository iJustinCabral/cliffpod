import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { mockTranscripts } from '@/utils/MockTranscripts';
import { CacheService } from '@/services/CacheService';

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.error('GOOGLE_AI_API_KEY is not set in the environment variables');
  throw new Error('GOOGLE_AI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY as string);

export async function POST(request: Request) {
  try {
    // Check if we have a cached newsletter
    const cachedNewsletter = CacheService.get('latestNewsletter');
    if (cachedNewsletter) {
      return NextResponse.json({ newsletter: cachedNewsletter });
    }

    // If not cached, generate a new newsletter
    const combinedTranscript = mockTranscripts.map(t => 
      `${t.podcastName} - ${t.episode}:\n${t.transcript}`
    ).join('\n\n');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Please create a newsletter summarizing the following podcast transcripts. The newsletter should have the following sections:
    1. Daily Title
    2. Main Headlines (3-5 bullet points)
    3. Detailed Summaries (one paragraph for each podcast)
    4. Key Takeaways (3-5 bullet points)
    5. Further Reading (2-3 suggested topics or resources)

    Here are the transcripts:

    ${combinedTranscript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const newsletter = response.text();

    // Cache the generated newsletter
    CacheService.set('latestNewsletter', newsletter, 3600 * 24); // Cache for 24 hours
    return NextResponse.json({ newsletter });
  } catch (error) {
    console.error('Error in newsletter generation process:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate newsletter: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred during newsletter generation' },
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