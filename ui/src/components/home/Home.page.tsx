'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/home/SearchBar';
import { PackageList } from '@/components/home/PackageList';
import { SelectedPackages } from '@/components/home/SelectedPackages';
import { RepositoryCard } from '@/components/home/RepositoryCard';
import { SortButton } from '@/components/common/SortButton';
import { Pagination as PaginationView } from '@/components/common/Pagination';
import client, { Package, Pagination, Sort } from '@/client';
import { useSearchParams } from 'next/navigation';
import { defaultState, State } from './home.state';
import { loadAppInfo, searchPackages, searchRepositories } from './home.actions';
import useUpdateEffect from '@/utils/hooks/useUpdatedEfect';
import Landing from './Landing';
import { useRouter } from 'next/navigation';

type Props = { providerId?: string }

export default function Home({ providerId }: Props) {
  const [state, setState] = useState<State>({ ...defaultState, selectedProvider: providerId });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const handleSearch = (query: string) => {
    if (!(query.trim().length > 1)) return;
    setState(prev => ({ ...prev, searchQuery: query }));
    loadPackages();
    // On mobile, close the sidebar after search
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const updateQueryParams = () => {
    const params = new URLSearchParams();
    if (state.selectedPackages.length > 0) {
      params.set('packageIds', state.selectedPackages.map(p => p.id).join(','));
    }
    if (state.repoSort.field && state.repoSort.field !== defaultState.repoSort.field) {
      params.set('sort', state.repoSort.field);
    }
    if (state.repoSort.direction && state.repoSort.direction !== defaultState.repoSort.direction) {
      params.set('direction', state.repoSort.direction);
    }
    if (state.repoPagination.page && state.repoPagination.page !== defaultState.repoPagination.page) {
      params.set('page', state.repoPagination.page.toString());
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }


  const loadInitialState = async (): Promise<void> => {
    const packageIds = searchParams.get('packageIds')?.split(',').map(Number) || [];
    const sortField = searchParams.get('sort') || defaultState.repoSort.field;
    const sortDirection = searchParams.get('direction') || defaultState.repoSort.direction;
    const page = Number(searchParams.get('page')) || defaultState.repoPagination.page;
    let selectedPackages: Package[] = [];
    if (packageIds.length > 0) {
      selectedPackages = await client.searchPackagesById(packageIds);
    }

    setState(prev => ({
      ...prev,
      selectedPackages,
      repoSort: { field: sortField as Sort['field'], direction: sortDirection as Sort['direction'] },
      repoPagination: { page, perPage: defaultState.repoPagination.perPage }
    }));
  };


  //TODO: add debounce and result checking
  const loadRepositories = async () => {
    if (state.selectedPackages.length === 0) return;
    await searchRepositories({ packageIds: state.selectedPackages.map(p => p.id), sort: state.repoSort, pagination: state.repoPagination }, setState);
  };
  //TODO: add debounce and result checking
  const loadPackages = async () => {
    await searchPackages(
      {
        query: state.searchQuery,
        usedWithPackages: state.selectedPackages.map(p => p.id),
        provider: state.selectedProvider
      },
      setState
    );
  };

  const handlePackageSelect = (pkg: Package) => {
    if (state.selectedPackages.some(p => p.id === pkg.id)) return;
    setState(prev => ({ ...prev, repoPagination: defaultState.repoPagination, selectedPackages: [...prev.selectedPackages, pkg], searchQuery: undefined }));
    
    // On mobile, close the sidebar after selecting a package
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handlePackageRemove = (pkg: Package) => {
    setState(prev => ({ ...prev, repoPagination: defaultState.repoPagination, selectedPackages: prev.selectedPackages.filter(p => p.id !== pkg.id) }));
  };

  const handleSort = (sort: Sort) => {
    setState(prev => ({ ...prev, repoSort: sort, repoPagination: defaultState.repoPagination }));
  };

  const handlePagination = (pagination: Pagination) => {
    setState(prev => ({ ...prev, repoPagination: pagination }));
  };

  const getPackageListTitle = () => {
    if (state.searchQuery) return `Search Results for "${state.searchQuery}"`;
    if (state.selectedPackages.length > 0) return "Related Packages";
    return "Most Used Packages";
  }

  const handleProviderRemove = () => {
    router.push('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  useUpdateEffect(() => {
    updateQueryParams();
    loadRepositories();
  }, [state.selectedPackages, state.repoSort, state.repoPagination]);

  useUpdateEffect(() => {
    loadPackages();
  }, [state.searchQuery, state.selectedPackages]);

  useEffect(() => {
    loadInitialState();
    loadAppInfo(setState);
    
    // Set sidebar closed by default on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    
    // Handle window resize to adapt sidebar state
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showSidebar = (state.selectedProvider && state.selectedPackages.length==0) || sidebarOpen;

  return (
    <div className="md:m-8 m-0">
      {/* Mobile sidebar toggle - now an icon button with absolute positioning */}
      <div className="md:hidden absolute right-0 top-0 z-10 w-12 h-12 flex items-center p-2">
        <button 
          onClick={toggleSidebar} 
          className=" text-black flex items-center justify-center  h-full w-full border rounded-sm"
          aria-label={sidebarOpen ? "Hide packages sidebar" : "Show packages sidebar"}
        >
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row relative">
        {/* Left Side - Package search sidebar */}
        <div className={`${(showSidebar ) ? 'block' : 'hidden md:block'}  md:w-80 w-full md:border border-gray-300 
            md:min-h-[calc(100vh-8rem)] mb-4 md:mb-0`}>
          <div className="absolute bg-white w-full z-50 flex flex-col md:sticky top-2 px-4 py-2 border-gray-300 md:h-[calc(100vh-4rem)] max-h-[100vh] md:max-h-none">
            <div className="flex items-center justify-center h-14 bg-white -mx-4 px-4 -mt-2 py-2 border-b border-gray-300">
              <SearchBar onSearch={handleSearch} />
            </div>
            <div className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-gray-100
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <PackageList
                title={getPackageListTitle()}
                packages={state.packages}
                onPackageSelect={handlePackageSelect}
              />
            </div>
          </div>
        </div>

        {/* Right Side - Main content */}
        <div className="flex-1 space-y-4 min-h-[calc(100vh-12rem)] md:min-h-[calc(100vh-8rem)] border border-gray-300 md:ml-4 ">
          <div className="space-y-2 px-2 md:px-4 py-2 md:pt-2">
            {/* Content header - now with better spacing for the floating button */}
            <div className={`${state.selectedPackages.length>0 ? 'flex' : 'hidden'} md:flex items-center flex-wrap justify-center min-h-14 bg-white border-b border-gray-300 -mx-2 md:-mx-4 px-2 md:px-4 -mt-2 py-2`}>
              <SelectedPackages
                selectedProvider={state.selectedProvider}
                packages={state.selectedPackages}
                onRemove={handlePackageRemove}
                onProviderRemove={() => handleProviderRemove()}
              />
            </div>

            {/* Selected packages count indicator when sidebar is closed */}


            {state.selectedPackages?.length > 0
              ? <>
                <div className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="text-xs text-gray-600 font-semibold">
                    {state.totalRepoCount ?? 0} project{(state.totalRepoCount !== 1) ? 's' : ''} found
                  </div>
                  <div className="flex gap-2">
                    <SortButton
                      label="Stars"
                      type="stars"
                      activeSort={state.repoSort}
                      onClick={handleSort}
                    />
                    <SortButton
                      label="Updated"
                      type="updatedAt"
                      activeSort={state.repoSort}
                      onClick={handleSort}
                    />
                  </div>
                </div>

                <div className="space-y-4 md:space-y-5">
                  {state.repositories.map((repo, i) => (
                    <RepositoryCard key={i} repository={repo} onPackageClick={handlePackageSelect} />
                  ))}
                </div>

                <div className="py-4 overflow-x-auto">
                  <PaginationView
                    pagination={state.repoPagination}
                    total={state.totalRepoCount ?? 0}
                    onPaginationChange={handlePagination}
                  />
                </div>
              </>
              : <>
                {!providerId && <Landing appInfo={state.appInfo} />}
              </>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
