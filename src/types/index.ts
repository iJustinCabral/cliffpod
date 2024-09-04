export interface PodcastEpisode {
  id?: string;
  title: string;
  description: string;
  pubDate: string;
  link: string;
  artwork: string;
  audioUrl: string;
  transcription?: string;
  summary?: string
}

export interface Newsletter {
  content: string;
  date: string;
  episodes: PodcastEpisode[];
}