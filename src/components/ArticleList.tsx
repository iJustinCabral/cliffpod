'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getEpisodes, Episode } from '@/utils/cache';

const ArticleList = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const data = await getEpisodes();
        setEpisodes(data);
      } catch (err) {
        console.error('Error fetching episodes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load episodes');
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (episodes.length === 0) return <div>No episodes found.</div>;

  const mockNewsletter = `
# Latest Podcast Highlights

Here's a summary of the top podcasts:

${episodes.map(episode => `
## ${episode.title}

${episode.description}

[Listen to episode](${episode.link})
`).join('\n\n')}
  `;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">Latest Newsletter: </h2>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <ReactMarkdown 
          className="prose max-w-none"
          remarkPlugins={[remarkGfm]}
        >
          {mockNewsletter}
        </ReactMarkdown>
      </div>
      <div>
        <h3 className="text-xl font-bold mb-4">The Featured Episodes:</h3>
        {episodes.map((episode, index) => (
          <div key={index} className="mb-4 flex items-center">
            <Image
              src={episode.artwork}
              alt={`${episode.title} artwork`}
              width={60}
              height={60}
              className="rounded-md mr-4"
            />
            <div>
              <h4 className="font-semibold">{episode.title}</h4>
              <p className="text-sm text-gray-600">{episode.pub_date}</p>
              <a href={episode.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                Listen to episode
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleList;