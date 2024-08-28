import { NextResponse } from 'next/server';
import { fetchLatestEpisode } from '@/utils/PodcastAPI';
import { CacheService } from '@/services/CacheService';

const PODCAST_FEEDS = [
  'https://feeds.megaphone.fm/GLT1412515089', // JRE
  'https://feeds.megaphone.fm/hubermanlab', // HUBERMAN
  'https://feeds.simplecast.com/54nAGcIl', // NYT Headlines
  'https://feeds.npr.org/510289/podcast.xml',// Planet Money
  'https://allinchamathjason.libsyn.com/rss', // All In
];

export async function GET() {
  try {
    const cachedEpisodes = CacheService.get('latestEpisodes');
    
    if (cachedEpisodes && Array.isArray(cachedEpisodes)) {
      const combinedDescription = cachedEpisodes.map((ep: any) => ep.description).join('\n\n');
      const article = {
        title: "Latest Podcast Episodes",
        content: combinedDescription,
        episodes: cachedEpisodes
      };
      return NextResponse.json({ article });
    }

    const episodePromises = PODCAST_FEEDS.map(feed => fetchLatestEpisode(feed));
    const episodes = await Promise.all(episodePromises);

    // Cache the fetched episodes
    CacheService.set('latestEpisodes', episodes, 3600 * 4); // Cache for 4 hours

    const combinedDescription = episodes.map(ep => ep.description).join('\n\n');

    const article = {
      title: "Latest Podcast Episodes",
      content: combinedDescription,
      episodes: episodes
    };

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching latest episodes:', error);
    return NextResponse.json({ error: 'Failed to fetch latest episodes' }, { status: 500 });
  }
}