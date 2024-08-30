import { supabase } from '@/lib/supabase';
import { PodcastEpisode } from '@/types';

export async function storeEpisodes(episodes: PodcastEpisode[]) {
  for (const episode of episodes) {
    const { data: existingEpisode, error: checkError } = await supabase
      .from('podcast_episodes')
      .select('id')
      .eq('title', episode.title)
      .eq('pub_date', episode.pubDate)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`Error checking for existing episode ${episode.title}:`, checkError);
      continue;
    }

    if (existingEpisode) {
      console.log(`Episode ${episode.title} already exists, skipping...`);
      continue;
    }

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