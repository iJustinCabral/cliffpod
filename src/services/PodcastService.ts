export interface Episode {
    title: string;
    pubDate: string;
    audioUrl: string;
    guid: string;
  }
  
  export async function fetchPodcastFeed(url: string): Promise<Episode[]> {
    try {
      const response = await fetch(`/api/fetchPodcast?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch podcast feed: ${response.statusText}`);
      }
      const data = await response.json();
  
      if (!data.episodes || !Array.isArray(data.episodes)) {
        throw new Error('Invalid podcast feed data: episodes not found or not an array');
      }
  
      return data.episodes.map((episode: any) => ({
        title: episode.title || 'Untitled Episode',
        pubDate: episode.pubDate || 'Unknown Date',
        audioUrl: episode.audioUrl || episode.enclosure?.url || episode.media?.url || episode.link || '',
        guid: episode.guid || episode.id || episode.title || `episode-${Math.random()}`,
      })).filter((episode: Episode) => episode.audioUrl);
    } catch (error) {
      console.error('Error fetching podcast feed:', error);
      throw error;
    }
  }
  
  interface ProgressCallbacks {
    onDownloadProgress: (progress: number) => void;
    onSplitProgress: (progress: number) => void;
    onTranscribeProgress: (progress: number) => void;
  }
  
  export async function transcribeEpisode(
    audioUrl: string,
    callbacks: ProgressCallbacks
  ): Promise<{ transcription: string }> {
    try {
      if (!audioUrl) {
        throw new Error('Audio URL is missing');
      }
  
      new URL(audioUrl); // Validate URL
  
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioUrl }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe episode');
      }
  
      const reader = response.body?.getReader();
      let transcription = '';
      let fullTranscription = '';
  
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
  
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.downloadProgress !== undefined) {
                callbacks.onDownloadProgress(data.downloadProgress);
              }
              if (data.splitProgress !== undefined) {
                callbacks.onSplitProgress(data.splitProgress);
              }
              if (data.transcribeProgress !== undefined) {
                callbacks.onTranscribeProgress(data.transcribeProgress);
              }
              if (data.transcription) {
                transcription = data.transcription;
                fullTranscription += transcription + ' ';
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing JSON:', parseError);
              console.error('Problematic line:', line);
            }
          }
        }
      }
  
      if (!fullTranscription.trim()) {
        throw new Error('Transcription is empty');
      }
  
      return { transcription: fullTranscription.trim() };
    } catch (error) {
      console.error('Error transcribing episode:', error);
      throw error;
    }
  }
  
  export async function summarizeTranscription(transcription: string): Promise<{ summary: string }> {
    try {
      if (!transcription || transcription.trim() === '') {
        throw new Error('Transcription is empty or missing');
      }
  
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize transcription');
      }
  
      const result = await response.json();
      if (!result.summary) {
        throw new Error('Summary is empty');
      }
  
      return { summary: result.summary };
    } catch (error) {
      console.error('Error summarizing transcription:', error);
      throw error;
    }
  }