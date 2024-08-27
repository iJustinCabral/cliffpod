import crypto from 'crypto';
import Parser from 'rss-parser';

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
        };
      }
      throw new Error('No episodes found in the feed');
    } catch (error) {
      console.error(`Error fetching feed from ${feedUrl}:`, error);
      throw error;
    }
  }