import { supabase } from '@/lib/supabase';
import { PodcastEpisode } from '@/types';

export async function storeEpisodes(episodes: PodcastEpisode[]) {
  for (const episode of episodes) {
    const { error: insertError } = await supabase
      .from('podcast_episodes')
      .insert({
        title: episode.title,
        description: episode.description,
        pub_date: episode.pubDate,
        link: episode.link,
        artwork: episode.artwork,
        audio_url: episode.audioUrl
      });

    if (insertError) {
      console.error(`Error storing episode ${episode.title}:`, insertError);
    } else {
      console.log(`Stored episode: ${episode.title}`);
    }
  }
}