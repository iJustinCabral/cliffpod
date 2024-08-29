import cron from 'node-cron';
import { fetchYesterdayEpisodes } from '@/utils/PodcastAPI';
import { CacheService } from '@/services/CacheService';
import { PODCAST_FEEDS } from '@/utils/PodcastFeeds';

const updatePodcastCache = async () => {
    try {
      const allYesterdayEpisodes = await Promise.all(PODCAST_FEEDS.map(fetchYesterdayEpisodes));
      const flattenedEpisodes = allYesterdayEpisodes.flat();
      if (flattenedEpisodes.length > 0) {
        CacheService.set('yesterdayEpisodes', flattenedEpisodes, 3600 * 24); // Cache for 24 hours
        console.log(`Cached ${flattenedEpisodes.length} episodes from yesterday`);
      } else {
        console.log('No episodes found for yesterday');
      }
    } catch (error) {
      console.error('Error updating podcast cache:', error);
    }
  };
export const startPodcastCacheJob = () => {
    // Run every day at 12:00 AM EST
    cron.schedule('0 0 * * *', updatePodcastCache, {
      timezone: "America/New_York"
    });
};