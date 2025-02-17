import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-md font-semibold text-gray-900">Package Browser</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
