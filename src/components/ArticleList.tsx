'use client';

import { useState, useEffect } from 'react';
import ArticleCard from './ArticleCard';
import Image from 'next/image';

interface Episode {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  artwork: string;
}

interface Article {
  title: string;
  content: string;
  episodes: Episode[];
  newsletter?: string;
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

        // Fetch the newsletter
        const newsletterResponse = await fetch('/api/summarize', { method: 'POST' });
        if (!newsletterResponse.ok) {
          throw new Error(`HTTP error! status: ${newsletterResponse.status}`);
        }
        const newsletterData = await newsletterResponse.json();

        setArticle({
          ...data.article,
          newsletter: newsletterData.newsletter
        });
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
      </div>
      {article.newsletter && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl text-black font-bold mb-4">This Week's Newsletter</h3>
          <div className="prose text-black max-w-none" dangerouslySetInnerHTML={{ __html: article.newsletter.replace(/\n/g, '<br>') }} />
        </div>
      )}
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
}

export default ArticleList;