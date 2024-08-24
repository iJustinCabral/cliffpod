import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }
  
    try {
      console.log('Fetching podcast feed:', url);
      const feed = await parser.parseURL(url);
      console.log('Parsed feed:', feed);
      const episodes = feed.items.map(item => {
        const audioUrl = item.enclosure?.url || item.media?.url || item.link;
        return {
          title: item.title || '',
          pubDate: item.pubDate || '',
          audioUrl: audioUrl || '',
          guid: item.guid || item.id || '',
        };
      });
      return NextResponse.json({ episodes });
    } catch (error) {
      console.error('Error fetching podcast feed:', error);
      return NextResponse.json({ error: 'Failed to fetch podcast feed' }, { status: 500 });
    }
  }