export interface PodcastEpisode {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  artwork: string;
  audioUrl: string;
}

export interface PodcastSummary {
  podcastName: string;
  episodeTitle: string;
  publishDate: string;
  audioUrl: string;
  transcription: string;
  summary: string;
}
