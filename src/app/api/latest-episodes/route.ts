import { NextResponse } from 'next/server';
import { fetchLatestEpisode } from '@/utils/PodcastAPI';
import { CacheService } from '@/services/CacheService';
import { PODCAST_FEEDS } from '@/utils/PodcastFeeds';
import { transcribeEpisode, summarizeTranscription } from '@/services/PodcastService';

export async function GET() {
  console.log('Latest episodes API route called');
  try {
    const cachedNewsletter = CacheService.get('latestNewsletter');
    
    if (cachedNewsletter) {
      console.log('Returning cached newsletter');
      return NextResponse.json({ article: cachedNewsletter });
    }

    // Fetch the latest episode from the first feed in PODCAST_FEEDS
    const latestEpisode = await fetchLatestEpisode(PODCAST_FEEDS[2]);

    if (!latestEpisode) {
      console.log('No episodes found');
      return NextResponse.json({ message: 'No episodes found' }, { status: 404 });
    }

    console.log('Latest episode:', latestEpisode);

    // Transcribe the episode
    let transcription;
    try {
      console.log('Starting transcription for:', latestEpisode.audioUrl);
      const result = await transcribeEpisode(latestEpisode.audioUrl, {
        onDownloadProgress: (progress) => console.log(`Download progress: ${progress}%`),
        onSplitProgress: (progress) => console.log(`Split progress: ${progress}%`),
        onTranscribeProgress: (progress) => console.log(`Transcribe progress: ${progress}%`),
      });
      transcription = result.transcription;
      console.log('Transcription completed, length:', transcription.length);
    } catch (transcriptionError) {
      console.error('Error during transcription:', transcriptionError);
      return NextResponse.json({ error: 'Failed to transcribe episode' }, { status: 500 });
    }

    if (!transcription || transcription.trim() === '') {
      return NextResponse.json({ error: 'Transcription is empty' }, { status: 500 });
    }

    // Summarize the transcription
    let newsletter;
    try {
      const result = await summarizeTranscription(transcription);
      newsletter = result.newsletter;
    } catch (summarizationError) {
      console.error('Error during summarization:', summarizationError);
      return NextResponse.json({ error: 'Failed to summarize transcription' }, { status: 500 });
    }

    const article = {
      title: `Today's Podcast Summary: ${latestEpisode.title}`,
      content: newsletter,
      episodes: [latestEpisode],
    };

    CacheService.set('latestNewsletter', article, 3600 * 24); // Cache for 24 hours
    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error in GET latest episodes:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
/* 
export async function GET() {
  try {
    const cachedEpisodes = CacheService.get('yesterdayEpisodes');
    
    if (cachedEpisodes && Array.isArray(cachedEpisodes) && cachedEpisodes.length > 0) {
      const combinedDescription = cachedEpisodes.map((ep: any) => ep.description).join('\n\n');
      const article = {
        title: "Yesterday's Podcast Episodes",
        content: combinedDescription,
        episodes: cachedEpisodes
      };
      return NextResponse.json({ article });
    }

    // If no cached episodes, try to fetch them
    const allYesterdayEpisodes = await Promise.all(PODCAST_FEEDS.map(fetchYesterdayEpisodes));
    const flattenedEpisodes = allYesterdayEpisodes.flat();

    if (flattenedEpisodes.length > 0) {
      const combinedDescription = flattenedEpisodes.map((ep: any) => ep.description).join('\n\n');
      const article = {
        title: "Yesterday's Podcast Episodes",
        content: combinedDescription,
        episodes: flattenedEpisodes
      };
      CacheService.set('yesterdayEpisodes', flattenedEpisodes, 3600 * 24); // Cache for 24 hours
      return NextResponse.json({ article });
    }

    return NextResponse.json({ message: 'No episodes found for yesterday' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching yesterday\'s episodes:', error);
    return NextResponse.json({ error: 'Failed to fetch yesterday\'s episodes' }, { status: 500 });
  }
}
  */
