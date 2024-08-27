import Header from '../components/Header';
import Hero from '../components/Hero';
import ArticleList from '../components/ArticleList';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-100">
      <Header />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <ArticleList />
      </div>
      <Footer />
    </main>
  );
}