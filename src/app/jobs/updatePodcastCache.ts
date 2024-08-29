import cron from 'node-cron';
import { fetchYesterdayEpisodes } from '@/utils/PodcastAPI';
import { CacheService } from '@/services/CacheService';

const PODCAST_FEEDS = [
  'https://feeds.megaphone.fm/GLT1412515089', // The Joe Rogan Experience
  'https://feeds.megaphone.fm/hubermanlab', // Huberman Lab
  'https://feeds.simplecast.com/54nAGcIl', // The Daily
  'https://feeds.npr.org/510289/podcast.xml', // Planet Money
  'https://allinchamathjason.libsyn.com/rss', // All in
  'https://feeds.simplecast.com/tI57z_LN', // The Wirecutter
  'https://feeds.simplecast.com/4T39_jAj', // StarTalk Radio
  'https://feeds.feedburner.com/radiolab', // Radiolab
  'https://anchor.fm/s/348575e4/podcast/rss', // Found My Fitness
  'https://lexfridman.com/feed/podcast/', // Lex Fridman
  'https://feeds.feedburner.com/TEDTalks_audio' // Ted Talks
];

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