'use client'

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PODCAST_FEEDS } from '@/utils/PodcastFeeds';

interface PodcastInfo {
  url: string;
  artwork: string | null; // Allow for null artwork
  title: string;
}

const PodcastSlider = () => {
  const [podcasts, setPodcasts] = useState<PodcastInfo[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPodcastInfo = async () => {
      const podcastInfoPromises = PODCAST_FEEDS.map(async (feedUrl) => {
        const cacheKey = `podcastInfo_${feedUrl}`;
        const cachedInfo = localStorage.getItem(cacheKey);

        if (cachedInfo) {
          return JSON.parse(cachedInfo);
        }

        try {
          const response = await fetch(`/api/fetchPodcast?url=${encodeURIComponent(feedUrl)}`);
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          const podcastInfo = {
            url: feedUrl,
            artwork: data.artwork || null, // Allow for null artwork
            title: data.title,
          };

          localStorage.setItem(cacheKey, JSON.stringify(podcastInfo));
          return podcastInfo;
        } catch (error) {
          console.error(`Failed to fetch podcast info for ${feedUrl}:`, error);
          return { url: feedUrl, artwork: null, title: 'Unknown' };
        }
      });

      const podcastInfo = await Promise.all(podcastInfoPromises);
      setPodcasts(podcastInfo);
    };

    fetchPodcastInfo();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const slider = sliderRef.current;
      if (!slider) return;

      if (slider.scrollLeft + slider.offsetWidth >= slider.scrollWidth) {
        slider.scrollLeft = 0;
      } else if (slider.scrollLeft === 0) {
        slider.scrollLeft = slider.scrollWidth - slider.offsetWidth;
      }
    };

    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', handleScroll);
      // Start scrolling
      const scrollInterval = setInterval(() => {
        slider.scrollLeft += 1;
      }, 10); // Adjust speed with this number

      return () => {
        slider.removeEventListener('scroll', handleScroll);
        clearInterval(scrollInterval);
      };
    }
  }, [podcasts]);

  return (
    <div className="w-full overflow-hidden py-8">
      <div ref={sliderRef} className="flex animate-scroll">
        {[...podcasts, ...podcasts].map((podcast, index) => (
          podcast.artwork && (
            <div key={index} className="flex-shrink-0 mx-2">
              <Image
                src={podcast.artwork}
                alt={podcast.title}
                width={150}
                height={150}
                className="rounded-lg shadow-md"
                loading="lazy"
                onError={() => console.log(`Failed to load image for ${podcast.title}`)}
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default PodcastSlider;
