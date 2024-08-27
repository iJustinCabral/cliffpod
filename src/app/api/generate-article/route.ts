import { NextResponse } from 'next/server';
import { searchPodcasts } from '@/utils/PodcastAPI';

export async function GET() {
  try {
    const podcasts = await searchPodcasts('Joe Rogan Experience');
    if (!podcasts || podcasts.length === 0) {
      return NextResponse.json({ error: 'No podcasts found' }, { status: 404 });
    }

    const joeRoganPodcast = podcasts[0];
    const latestEpisode = joeRoganPodcast.episodes[0];

    const article = {
      id: 1,
      title: latestEpisode.title,
      summary: latestEpisode.description.substring(0, 200) + '...',
      content: latestEpisode.description,
      podcastName: joeRoganPodcast.title,
      imageUrl: joeRoganPodcast.artwork,
      date: new Date(latestEpisode.datePublished * 1000).toISOString().split('T')[0],
    };

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json({ error: 'Failed to generate article' }, { status: 500 });
  }
}