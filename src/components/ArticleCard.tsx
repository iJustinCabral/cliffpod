import Link from 'next/link';
import Image from 'next/image';

interface Article {
  id: number;
  title: string;
  summary: string;
  podcastName: string;
  imageUrl: string;
  date: string;
}

const ArticleCard = ({ article }: { article: Article }) => {
  return (
    <Link href={`/article/${article.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48 w-full">
          <Image
            src={article.imageUrl}
            alt={article.podcastName}
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">{article.title}</h2>
          <p className="text-gray-600 mb-4">{article.summary}</p>
        </div>
        <div className="bg-orange-500 px-6 py-3 flex justify-between text-sm text-white-500">
          <span>{article.podcastName}</span>
          <span>{article.date}</span>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;