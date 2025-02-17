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
import { searchPackages, searchRepositories } from './home.actions';


export default function Home() {
  const [state, setState] = useState<State>(defaultState);
  const searchParams = useSearchParams();

  const handleSearch = (query: string) => {
    if (!(query.trim().length > 1)) return;
    setState(prev => ({ ...prev, searchQuery: query }));
    loadPackages();
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
    await searchPackages({ query: state.searchQuery, usedWithPackages: state.selectedPackages.map(p => p.id) }, setState);
  };

  const handlePackageSelect = (pkg: Package) => {
    if (state.selectedPackages.some(p => p.id === pkg.id)) return;
    setState(prev => ({ ...prev, repoPagination: defaultState.repoPagination, selectedPackages: [...prev.selectedPackages, pkg], searchQuery: undefined }));
  };

  const handlePackageRemove = (pkg: Package) => {

    setState(prev => ({ ...prev, repoPagination: defaultState.repoPagination, selectedPackages: prev.selectedPackages.filter(p => p.id !== pkg.id) }));
  };

  const handleSort = (sort: Sort) => {
    setState(prev => ({ ...prev, repoSort: sort }));
  };

  const handlePagination = (pagination: Pagination) => {
    setState(prev => ({ ...prev, repoPagination: pagination }));
  };

  const getPackageListTitle = () => {
    if (state.searchQuery) return `Search Results for "${state.searchQuery}"`;
    if (state.selectedPackages.length > 0) return "Related Packages";
    return "Most Used Packages";
  }


  useEffect(() => {
    updateQueryParams();
    loadRepositories();
  }, [state.selectedPackages, state.repoSort, state.repoPagination]);

  useEffect(() => {
    loadPackages();
  }, [state.searchQuery, state.selectedPackages]);


  useEffect(() => {
    loadInitialState();
    loadPackages();
  }, []);


  return (
    <div className="m-8">
      <div className="flex ">
        {/* Left Side */}
        <div className="w-80 border border-gray-300 min-h-[calc(100vh-8rem)]">
          <div className="flex flex-col sticky top-2 px-4 py-2 border-gray-300 h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-center h-14 bg-white -mx-4 px-4 -mt-2 py-2 border-b border-gray-300">
              <SearchBar onSearch={handleSearch} />
            </div>
            <div className="flex-1 overflow-y-auto py-2  [&::-webkit-scrollbar]:w-2
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

        <div className="flex-1 space-y-4 min-h-[calc(100vh-8rem)] border-r  border-t border-b border-gray-300">
          <div className="space-y-2 px-4 py-2">
            <div className="flex items-center justify-center h-14 bg-white border-b border-gray-300 -mx-4 px-4 -mt-2 py-2">
              <SelectedPackages
                packages={state.selectedPackages}
                onRemove={handlePackageRemove}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 font-semibold">
                {state.totalRepoCount ?? 0} project found.
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

            <div className="space-y-5">
              {state.repositories.map((repo, i) => (
                <RepositoryCard key={i} repository={repo} onPackageClick={handlePackageSelect} />
              ))}
            </div>

            <PaginationView
              pagination={state.repoPagination}
              total={state.totalRepoCount ?? 0}
              onPaginationChange={handlePagination}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
