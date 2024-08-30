import { summarizeTranscription } from '@/services/PodcastService';
import { supabase } from '@/lib/supabase';

interface Episode {
  id: string; // Assuming each episode has a unique ID
  transcription: string;
}

export async function summarizeEpisodes(episodes: Episode[]) {
  for (const episode of episodes) {
    try {
      const summary = await summarizeTranscription(episode.transcription);
      const { data, error } = await supabase
        .from('podcast_episodes')
        .update({
          transcription: episode.transcription,
          summary: summary.newsletter
        })
        .match({ id: episode.id });

      if (error) throw error;
      console.log(`Updated episode with summary: ${episode.id}`);
    } catch (error) {
      console.error(`Error summarizing episode ${episode.id}:`, error);
    }
  }
}