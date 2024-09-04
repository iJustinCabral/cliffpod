import NodeCache from 'node-cache';
import { supabase } from '@/lib/supabase';

const cache = new NodeCache({ stdTTL: 4 * 60 * 60 }); // 4 hours in seconds

export interface Episode {
  title: string;
  description: string;
  pub_date: string;
  link: string;
  artwork: string;
}

export async function getEpisodes(): Promise<Episode[]> {
  const cacheKey = 'episodes';
  const cachedEpisodes = cache.get<Episode[]>(cacheKey);

  if (cachedEpisodes) {
    return cachedEpisodes;
  }

  try {
    const { data, error } = await supabase
      .from('podcast_episodes')
      .select('*')
      .order('pub_date', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (data) {
      cache.set(cacheKey, data);
      return data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return [];
  }
}

export default cache;