import { PODCAST_FEEDS } from '@/utils/PodcastFeeds';
import { fetchYesterdayEpisodes as fetchEpisodesFromFeed } from '@/utils/PodcastAPI';
import { supabase } from '@/lib/supabase';
import { PodcastEpisode } from '@/types';
import { storeEpisodes } from './storeEpisodes';
import { CacheService } from '@/services/CacheService';

export async function fetchYesterdayEpisodes(): Promise<PodcastEpisode[]> {
  const cacheKey = 'yesterdayEpisodes';
  console.log('Checking cache for yesterday\'s episodes...');
  const cachedEpisodes = CacheService.get(cacheKey) as PodcastEpisode[] | null;

  if (cachedEpisodes) {
    console.log(`Cache hit! Returning ${cachedEpisodes.length} cached episodes`);
    return cachedEpisodes;
  }

  console.log('Cache miss. Fetching episodes from database...');
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
    console.log(`Fetched ${episodes.length} episodes from the database. Caching...`);
    CacheService.set(cacheKey, episodes, 3600 * 24); // Cache for 24 hours
    console.log('Episodes cached successfully.');
    return episodes as PodcastEpisode[];
  }

  console.log('No episodes found in database. Fetching from feeds...');
  const allYesterdayEpisodes = await Promise.all(PODCAST_FEEDS.map(fetchEpisodesFromFeed));
  const flattenedEpisodes = allYesterdayEpisodes.flat();

  console.log(`Fetched ${flattenedEpisodes.length} new episodes from feeds`);

  if (flattenedEpisodes.length > 0) {
    await storeEpisodes(flattenedEpisodes);
    console.log(`Stored ${flattenedEpisodes.length} new episodes in the database. Caching...`);
    CacheService.set(cacheKey, flattenedEpisodes, 3600 * 24); // Cache for 24 hours
    console.log('Episodes cached successfully.');
  } else {
    console.log('No new episodes found from feeds.');
  }

  return flattenedEpisodes;
}