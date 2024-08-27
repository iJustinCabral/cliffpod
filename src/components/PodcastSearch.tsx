'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Episode {
  id: number;
  title: string;
  description: string;
  image: string;
  datePublished: number;
  podcastTitle: string;
}

const EpisodeSearch = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const response = await fetch('/api/search-episodes?person=Joe Rogan');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const results = await response.json();

        if (results && results.length > 0) {
          setEpisodes(results.map((episode: any) => ({
            id: episode.id,
            title: episode.title,
            description: episode.description,
            image: episode.image,
            datePublished: episode.datePublished,
            podcastTitle: episode.feedTitle,
          })));
        } else {
          setError('No episodes found');
        }
      } catch (err) {
        console.error('Error fetching episodes:', err);
        if (err instanceof Error) {
          setError(`Failed to fetch episode data: ${err.message}`);
        } else {
          setError('Failed to fetch episode data: An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (episodes.length === 0) return <div>No episodes found</div>;

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Latest Episodes</h2>
      {episodes.map((episode) => (
        <div key={episode.id} className="mb-6 border-b pb-4">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 mb-4 md:mb-0">
              <Image
                src={episode.image}
                alt={episode.title}
                width={200}
                height={200}
                className="rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '../../public/next.svg'; // Replace with path to a default image
                }}
              />
            </div>
            <div className="md:w-2/3 md:pl-6">
              <h3 className="text-xl font-semibold mb-2">{episode.title}</h3>
              <p className="text-gray-600 mb-2">{episode.podcastTitle}</p>
              <p className="text-sm text-gray-500 mb-2">
                {new Date(episode.datePublished * 1000).toLocaleDateString()}
              </p>
              <p className="text-gray-700">{episode.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EpisodeSearch;