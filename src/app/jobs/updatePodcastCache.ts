import cron from 'node-cron';
import { fetchLatestEpisode } from '@/utils/PodcastAPI';
import { CacheService } from '@/services/CacheService';

const PODCAST_FEEDS = [
  'https://feeds.megaphone.fm/GLT1412515089',
  'https://feeds.megaphone.fm/hubermanlab',
  'https://feeds.simplecast.com/54nAGcIl',
  'https://feeds.npr.org/510289/podcast.xml',
  'https://allinchamathjason.libsyn.com/rss',
];

const updatePodcastCache = async () => {
  try {
    const episodes = await Promise.all(PODCAST_FEEDS.map(fetchLatestEpisode));
    CacheService.set('latestEpisodes', episodes, 3600 * 4); // Cache for 4 hours
  } catch (error) {
    console.error('Error updating podcast cache:', error);
  }
};

export const startPodcastCacheJob = () => {
  cron.schedule('0 */4 * * *', updatePodcastCache); // Run every 4 hours
};