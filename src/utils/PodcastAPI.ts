import crypto from 'crypto';
import Parser from 'rss-parser';
import { PODCAST_FEEDS } from './PodcastFeeds';

const parser = new Parser();

const apiKey = process.env.PODCAST_INDEX_API_KEY;
const apiSecret = process.env.PODCAST_INDEX_API_SECRET;

function generateAuthHeaders(): Record<string, string> {
  if (typeof window !== 'undefined') {
    console.error('Auth headers cannot be generated on the client side');
    return {};
  }

  const apiHeaderTime = Math.floor(Date.now() / 1000);
  const hash = crypto.createHash('sha1');
  hash.update(`${apiKey}${apiSecret}${apiHeaderTime}`);
  const apiHash = hash.digest('hex');

  return {
    'X-Auth-Date': apiHeaderTime.toString(),
    'X-Auth-Key': apiKey || '',
    'Authorization': apiHash,
    'User-Agent': 'YourAppName/1.0'
  };
}

export async function searchPodcasts(term: string) {
  if (typeof window !== 'undefined') {
    throw new Error('API calls must be made from the server');
  }

  if (!apiKey || !apiSecret) {
    console.error('API key or secret is not set');
    throw new Error('API key and secret are not set');
  }

  const url = `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(term)}`;
  const headers = generateAuthHeaders();
  
    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      return data.feeds;
    } catch (error) {
      console.error('Error in searchPodcasts:', error);
      throw error;
    }
  }

  export async function fetchLatestEpisode(feedUrl: string) {
    try {
      const feed = await parser.parseURL(feedUrl);
      if (feed.items && feed.items.length > 0) {
        const latestEpisode = feed.items[0];
        return {
          title: latestEpisode.title || '',
          description: latestEpisode.contentSnippet || latestEpisode.content || '',
          pubDate: latestEpisode.pubDate || '',
          link: latestEpisode.link || '',
          artwork: feed.image?.url || '', // Add this line
          audioUrl: latestEpisode.enclosure?.url || '',
        };
      }
      throw new Error('No episodes found in the feed');
    } catch (error) {
      console.error(`Error fetching feed from ${feedUrl}:`, error);
      throw error;
    }
  }

  export async function fetchYesterdayEpisodes(feedUrl: string) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const yesterdayEpisodes = feed.items
        .filter(item => {
          const pubDate = new Date(item.pubDate || '');
          return pubDate >= yesterday && pubDate < today;
        })
        .map(item => ({
          title: item.title || '',
          description: item.contentSnippet || item.content || '',
          pubDate: item.pubDate || '',
          link: item.link || '',
          artwork: feed.image?.url || '',
          audioUrl: item.enclosure?.url || '',
        }));
  
      return yesterdayEpisodes;
    } catch (error) {
      console.error(`Error fetching feed from ${feedUrl}:`, error);
      return [];
    }
  }

  export async function checkForTranscript(feedUrl: string): Promise<boolean> {
    try {
      const feed = await parser.parseURL(feedUrl);
      if (feed.items && feed.items.length > 0) {
        const latestEpisode = feed.items[0] as any; // Type assertion for custom fields
  
        // Check for podcast:transcript tag
        if (latestEpisode.podcastTranscript) {
          return true;
        }
  
        // Check for transcript in content:encoded
        if (latestEpisode.contentEncoded && latestEpisode.contentEncoded.includes('transcript')) {
          return true;
        }
  
        // Check for transcript in description or summary
        const description = latestEpisode.description || latestEpisode['itunes:summary'];
        if (description && description.toLowerCase().includes('transcript')) {
          return true;
        }
      }
      return false; // No transcript found
    } catch (error) {
      console.error(`Error checking for transcript in feed ${feedUrl}:`, error);
      return false;
    }
  }

export async function checkAllFeedsForTranscripts() {
  console.log("Checking all podcast feeds for transcripts...");
  
  for (const feedUrl of PODCAST_FEEDS) {
    try {
      const hasTranscript = await checkForTranscript(feedUrl);
      console.log(`${feedUrl}: ${hasTranscript ? 'Has transcript' : 'No transcript found'}`);
    } catch (error) {
      console.error(`Error checking ${feedUrl}:`, error);
    }
  }
  
  console.log("Finished checking all feeds.");
}