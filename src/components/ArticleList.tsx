'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(today);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch('/api/latest-episodes');
        if (!response.ok) {
          if (response.status === 404) {
            setError('No episodes found for yesterday. Check back later!');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
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
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, []);

  const markdownStyles = {
    h1: 'text-3xl font-bold mt-6 mb-4',
    h2: 'text-2xl font-bold mt-5 mb-3',
    h3: 'text-xl font-bold mt-4 mb-2',
    h4: 'text-lg font-bold mt-3 mb-2',
    p: 'mb-4',
    ul: 'list-disc pl-5 mb-4',
    ol: 'list-decimal pl-5 mb-4',
    li: 'mb-2',
    blockquote: 'border-l-4 border-gray-300 pl-4 italic my-4',
    a: 'text-blue-600 hover:underline',
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!article) return <div>No article found.</div>;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">Latest Newsletter: {formattedDate}</h2>
      </div>
      {article.newsletter && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <ReactMarkdown 
            className="prose text-black max-w-none"
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className={markdownStyles.h1} {...props} />,
              h2: ({node, ...props}) => <h2 className={markdownStyles.h2} {...props} />,
              h3: ({node, ...props}) => <h3 className={markdownStyles.h3} {...props} />,
              h4: ({node, ...props}) => <h4 className={markdownStyles.h4} {...props} />,
              p: ({node, ...props}) => <p className={markdownStyles.p} {...props} />,
              ul: ({node, ...props}) => <ul className={markdownStyles.ul} {...props} />,
              ol: ({node, ...props}) => <ol className={markdownStyles.ol} {...props} />,
              li: ({node, ...props}) => <li className={markdownStyles.li} {...props} />,
              blockquote: ({node, ...props}) => <blockquote className={markdownStyles.blockquote} {...props} />,
              a: ({node, ...props}) => <a className={markdownStyles.a} {...props} />,
            }}
          >
            {article.newsletter}
          </ReactMarkdown>
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