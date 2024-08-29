import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-black shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white-800">
          TLDL
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li><Link href="/advertise" className="text-white-600 hover:text-white-800">Advertise</Link></li>
            <li><Link href="/archive" className="text-white-600 hover:text-white-800">Archive</Link></li>
            <li><Link href="/faq" className="text-white-600 hover:text-white-800">FAQ</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;