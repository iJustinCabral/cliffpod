import { PODCAST_FEEDS } from '@/utils/PodcastFeeds';
import { fetchYesterdayEpisodes as fetchEpisodesFromFeed } from '@/utils/PodcastAPI';
import { storeEpisodes } from './storeEpisodes';
import { supabase } from '@/lib/supabase';
import { CacheService } from '@/services/CacheService';
import { PodcastEpisode } from '@/types';

export async function fetchYesterdayEpisodes(): Promise<PodcastEpisode[]> {
  const cacheKey = 'yesterdayEpisodes';
  const cachedEpisodes = CacheService.get(cacheKey) as PodcastEpisode[] | null;

  if (cachedEpisodes) {
    return cachedEpisodes;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const { data: episodes, error } = await supabase
    .from('podcast_episodes')
    .select('*')
    .gte('pub_date', yesterday.toISOString())
    .lt('pub_date', new Date().toISOString())
    .order('pub_date', { ascending: false });

  if (error) {
    console.error('Error fetching episodes from database:', error);
    throw error;
  }

  if (episodes && episodes.length > 0) {
    const typedEpisodes = episodes as PodcastEpisode[];
    CacheService.set(cacheKey, typedEpisodes, 3600 * 24); // Cache for 24 hours
    return typedEpisodes;
  }

  // If no episodes in the database, fetch and store them
  console.log('No episodes found in database. Fetching and storing...');
  const allYesterdayEpisodes = await Promise.all(PODCAST_FEEDS.map(fetchEpisodesFromFeed));
  const flattenedEpisodes = allYesterdayEpisodes.flat();
  
  // Don't store episodes here, as we'll do it in the server.ts file
  CacheService.set(cacheKey, flattenedEpisodes, 3600 * 24); // Cache for 24 hours
  return flattenedEpisodes;
}