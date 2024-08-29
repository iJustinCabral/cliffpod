import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { CacheService } from '@/services/CacheService';

const parser = new Parser();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }
  
    const cacheKey = `podcast_${url}`;
    const cachedData = CacheService.get(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    try {
      console.log('Fetching podcast feed:', url);
      const feed = await parser.parseURL(url);
      console.log('Parsed feed:', feed);
      
      const podcastInfo = {
        title: feed.title || '',
        artwork: feed.image?.url || '',
        episodes: feed.items.map(item => ({
          title: item.title || '',
          pubDate: item.pubDate || '',
          audioUrl: item.enclosure?.url || item.media?.url || item.link || '',
          guid: item.guid || item.id || '',
        }))
      };
      
      CacheService.set(cacheKey, podcastInfo, 3600 * 24); // Cache for 24 hours
      return NextResponse.json(podcastInfo);
    } catch (error) {
      console.error('Error fetching podcast feed:', error);
      return NextResponse.json({ error: 'Failed to fetch podcast feed' }, { status: 500 });
    }
}