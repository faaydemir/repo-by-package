"use client";
import appInfo from "@/constant/appInfo";
import Link from "next/link";
import { TechIcon } from "../common/TechIcon";
import { usePathname } from "next/navigation";

const Header = () => {
  // Get current pathname to determine active provider
  const pathname = usePathname();
  const currentProvider = pathname?.split("/")[1];

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto max-w-7xl px-3 sm:px-6 md:px-5 lg:px-8">
        <div className="flex h-12 justify-between">
          <div className="flex w-full flex-row items-center gap-6 md:justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={appInfo.favicon}
                alt={appInfo.name}
                className="h-7 w-7 object-contain md:h-7 md:w-7"
              />
              <span className="text-md hidden font-semibold text-gray-900 md:inline">
                {appInfo.name}
              </span>
            </Link>
            <div className="ml-0 flex h-full flex-row items-center gap-2 px-0 py-0 md:ml-4 md:gap-4 md:px-2">
              {appInfo.supportedProviders.map((provider) => {
                const isActive = currentProvider === provider;
                return (
                  <Link
                    href={`/${provider}`}
                    key={provider}
                    className={`ml-0 flex h-full items-center border-b-2 px-2 md:ml-4 md:px-1 ${
                      isActive
                        ? "border-gray-500 text-gray-800"
                        : "border-transparent text-gray-600 hover:border-gray-400 hover:text-gray-800"
                    }`}
                  >
                    <TechIcon tech={provider} showText={true} size="sm" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
