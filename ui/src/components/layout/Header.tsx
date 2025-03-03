"use client";
import appInfo from '@/constant/appInfo';
import Link from 'next/link';
import { TechIcon } from '../common/TechIcon';
import { usePathname } from 'next/navigation';

const Header = () => {
  // Get current pathname to determine active provider
  const pathname = usePathname();
  const currentProvider = pathname?.split('/')[1];
  
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          <div className="flex items-center w-full flex-row justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={appInfo.favicon}
                alt={appInfo.name}
                className="w-7 h-7 md:w-7 md:h-7 object-contain"
              />
              <span className="text-md font-semibold text-gray-900">{appInfo.name}</span>
            </Link>
            <div className="flex items-center gap-4 ml-4 px-2">
              {
                appInfo.supportedProviders.map((provider) => {
                  const isActive = currentProvider === provider;
                  return (
                    <Link 
                      href={`/${provider}`} 
                      key={provider} 
                      className={`flex items-center px-1 pb-0.5 gap-2 ml-4 border-b-2 transition-colors ${
                        isActive 
                        ? 'border-gray-500 text-gray-800' 
                        : 'border-transparent text-gray-600 hover:border-gray-400 hover:text-gray-800'
                      }`}
                    >
                      <TechIcon tech={provider} showText={true} size='sm' />
                    </Link>
                  );
                })
              }
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
