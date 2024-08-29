import { NextResponse } from 'next/server';
import { fetchLatestEpisode, fetchYesterdayEpisodes} from '@/utils/PodcastAPI';
import { CacheService } from '@/services/CacheService';
import { PODCAST_FEEDS } from '@/utils/PodcastFeeds';

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