'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Image from 'next/image';

interface Article {
  title: string;
  content: string;
  podcastName: string;
  imageUrl: string;
  date: string;
}

const mockArticles: Record<number, Article> = {
  1: {
    title: "The Joe Rogan Experience",
    content: "Joe Rogan's podcast covers a wide range of topics, from comedy to politics. In recent episodes, Joe has interviewed prominent figures in science, entertainment, and sports. The podcast's popularity stems from its long-form conversations and Rogan's ability to engage with guests from various backgrounds.",
    podcastName: "The Joe Rogan Experience",
    imageUrl: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/9c/3d/8e/9c3d8e48-4f86-a7b8-6c2f-d6d4b6867d8a/mza_12366899971551454970.jpg/600x600bb.jpg",
    date: "2024-03-15",
  },
  // Add more mock articles here, matching the IDs from ArticleList.tsx
};

export default function ArticlePage() {
  const params = useParams();
  const articleId = Number(params.id);
  const article = mockArticles[articleId];

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <Image
              src={article.imageUrl}
              alt={article.podcastName}
              width={300}
              height={300}
              className="rounded-lg mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-800">{article.title}</h1>
          <div className="flex justify-between text-sm text-gray-500 mb-6">
            <span>{article.podcastName}</span>
            <span>{article.date}</span>
          </div>
          <div className="prose max-w-none">
            <p>{article.content}</p>
          </div>
        </article>
      </main>
    </div>
  );
}