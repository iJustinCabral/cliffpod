'use client';

import { useState, useEffect } from 'react';
import ArticleCard from './ArticleCard';
import Image from 'next/image';

interface Episode {
    title: string;
    description: string;
    pubDate: string;
    link: string;
    artwork: string; // Add this line
  }
  
  interface Article {
    title: string;
    content: string;
    episodes: Episode[];
  }

const ArticleList = () => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch('/api/latest-episodes');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.article) {
          throw new Error('No article data found');
        }
        setArticle(data.article);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!article) return <div>No article found.</div>;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">Latest Newsletter</h2>
        <div className="grid grid-cols-1 gap-6">
          <ArticleCard article={{
            id: 1,
            title: article.title,
            summary: article.content.substring(0, 200) + '...',
            podcastName: 'TLDL News',
            imageUrl: '',
            date: new Date().toISOString().split('T')[0],
          }} />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold mb-4">Newsletter generated from these episodes:</h3>
        {article.episodes.map((episode, index) => (
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
                <p className="text-sm text-gray-600">{episode.pubDate}</p>
                <a href={episode.link} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
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