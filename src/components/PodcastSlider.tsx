'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PODCAST_FEEDS } from '@/utils/PodcastFeeds';

interface PodcastInfo {
  url: string;
  artwork: string;
  title: string;
}

const PodcastSlider = () => {
  const [podcasts, setPodcasts] = useState<PodcastInfo[]>([]);

  useEffect(() => {
    const fetchPodcastInfo = async () => {
      const podcastInfoPromises = PODCAST_FEEDS.map(async (feedUrl) => {
        const cacheKey = `podcastInfo_${feedUrl}`;
        const cachedInfo = localStorage.getItem(cacheKey);

        if (cachedInfo) {
          return JSON.parse(cachedInfo);
        }

        const response = await fetch(`/api/fetchPodcast?url=${encodeURIComponent(feedUrl)}`);
        const data = await response.json();
        const podcastInfo = {
          url: feedUrl,
          artwork: data.artwork,
          title: data.title,
        };

        localStorage.setItem(cacheKey, JSON.stringify(podcastInfo));
        return podcastInfo;
      });

      const podcastInfo = await Promise.all(podcastInfoPromises);
      setPodcasts(podcastInfo);
    };

    fetchPodcastInfo();
  }, []);

  return (
    <div className="w-full overflow-hidden py-8">
      <div className="flex animate-scroll">
        {[...podcasts, ...podcasts].map((podcast, index) => (
          <div key={index} className="flex-shrink-0 mx-2">
            <Image
              src={podcast.artwork}
              alt={podcast.title}
              width={150}
              height={150}
              className="rounded-lg shadow-md"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PodcastSlider;