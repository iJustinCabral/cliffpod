import { NextResponse } from 'next/server';
import { fetchYesterdayEpisodes } from '@/backend/jobs/fetchEpisodes';

export async function GET() {
  try {
    const episodes = await fetchYesterdayEpisodes();
    return NextResponse.json({ episodes });
  } catch (error) {
    console.error('Error fetching yesterday\'s episodes:', error);
    return NextResponse.json({ error: 'Failed to fetch yesterday\'s episodes' }, { status: 500 });
  }
}