import { TranscriptionService } from '@/services/TranscriptionService';
import { DownloadService } from '@/services/DownloadService';
import { AudioSplitService } from '@/services/AudioSplitService';

export async function transcribeEpisodes(episodes) {
  const transcribedEpisodes = [];
  for (const episode of episodes) {
    try {
      const audioBuffer = await DownloadService.downloadAudio(episode.audioUrl);
      const chunks = await AudioSplitService.splitAudio(audioBuffer);
      const transcription = await TranscriptionService.transcribeChunks(chunks);
      transcribedEpisodes.push({
        ...episode,
        transcription
      });
      await AudioSplitService.cleanup(chunks);
    } catch (error) {
      console.error(`Error transcribing episode ${episode.title}:`, error);
    }
  }
  return transcribedEpisodes;
}