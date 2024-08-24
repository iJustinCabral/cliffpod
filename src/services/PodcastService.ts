export interface Episode {
    title: string;
    pubDate: string;
    audioUrl: string;
    guid: string;
  }
  
  export async function fetchPodcastFeed(url: string): Promise<Episode[]> {
    try {
      console.log('Fetching podcast feed from API:', url);
      const response = await fetch(`/api/fetchPodcast?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch podcast feed: ${response.statusText}`);
      }
      const data = await response.json();
      
      console.log('API response:', data);
  
      if (!data.episodes || !Array.isArray(data.episodes)) {
        throw new Error('Invalid podcast feed data: episodes not found or not an array');
      }
  
      return data.episodes.map((episode: any) => {
        const audioUrl = episode.audioUrl || episode.enclosure?.url || episode.media?.url || episode.link;
        console.log(`Episode "${episode.title}" audio URL:`, audioUrl);
        return {
          title: episode.title || 'Untitled Episode',
          pubDate: episode.pubDate || 'Unknown Date',
          audioUrl: audioUrl || '',
          guid: episode.guid || episode.id || episode.title || `episode-${Math.random()}`,
        };
      }).filter((episode: Episode) => episode.audioUrl);
    } catch (error) {
      console.error('Error fetching podcast feed:', error);
      throw error;
    }
  }

  export async function transcribeEpisode(audioUrl: string): Promise<{ transcription: string }> {
    console.log('Transcribing episode with URL:', audioUrl);
    
    try {
      if (!audioUrl) {
        throw new Error('Audio URL is missing');
      }
  
      // Validate URL
      new URL(audioUrl);
  
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
  
      return await response.json();
    } catch (error) {
      console.error('Error transcribing episode:', error);
      throw error;
    }
  }