export interface Episode {
    title: string;
    pubDate: string;
    audioUrl: string;
    guid: string;
  }

  interface ProgressCallbacks {
    onDownloadProgress: (progress: number) => void;
    onSplitProgress: (progress: number) => void;
    onTranscribeProgress: (progress: number) => void;
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
  
  export async function transcribeEpisode(
    audioUrl: string,
    callbacks: ProgressCallbacks
  ): Promise<{ transcription: string }> {
    try {
      console.log('Calling transcribeEpisode with audioUrl:', audioUrl);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/transcribe`;
      console.log('Sending request to:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioUrl }),
      });

      console.log('Response status:', response.status);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let transcription = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += new TextDecoder().decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            // Try to parse the line as JSON
            const data = JSON.parse(line);
            if (data.transcription) {
              transcription += data.transcription + ' ';
            } else if (data.progress) {
              const { type, value } = data.progress;
              switch (type) {
                case 'downloadProgress':
                  callbacks.onDownloadProgress(value);
                  break;
                case 'splitProgress':
                  callbacks.onSplitProgress(value);
                  break;
                case 'transcribeProgress':
                  callbacks.onTranscribeProgress(value);
                  break;
              }
            }
          } catch (e) {
            // If parsing fails, check if the line contains any useful information
            if (line.includes('transcription:')) {
              const match = line.match(/transcription:\s*(.+)/);
              if (match) {
                transcription += match[1] + ' ';
              }
            } else if (line.includes('progress:')) {
              console.log('Progress update:', line);
            } else {
              console.warn('Unhandled data:', line);
            }
          }
        }
      }

      if (!transcription.trim()) {
        throw new Error('Transcription is empty');
      }

      return { transcription: transcription.trim() };
    } catch (error) {
      console.error('Error in transcribeEpisode:', error);
      throw error;
    }
  }
  
  export async function summarizeTranscription(transcription: string): Promise<{ newsletter: string }> {
    try {
      if (!transcription || transcription.trim() === '') {
        throw new Error('Transcription is empty or missing');
      }

      const chunkSize = 100000; // Adjust this value based on your needs
      const chunks = [];

      for (let i = 0; i < transcription.length; i += chunkSize) {
        chunks.push(transcription.slice(i, i + chunkSize));
      }

      let newsletter = '';

      for (let i = 0; i < chunks.length; i++) {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            transcription: chunks[i], 
            isPartial: chunks.length > 1,
            partNumber: i + 1,
            totalParts: chunks.length
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to summarize transcription');
        }

        const result = await response.json();
        newsletter += result.newsletter + ' ';
      }

      if (!newsletter.trim()) {
        throw new Error('Newsletter is empty');
      }

      return { newsletter: newsletter.trim() };
    } catch (error) {
      console.error('Error summarizing transcription:', error);
      throw error;
    }
  }