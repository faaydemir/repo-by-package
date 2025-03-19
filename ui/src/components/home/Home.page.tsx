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
import { BackIcon, SeachMenuIcon } from '../common/Icon';
import { debounce } from '@/utils/debounce';
import Spinner from '../common/Spinner';

type Props = { providerId?: string };

export default function Home({ providerId }: Props) {
	const [state, setState] = useState<State>({
		...defaultState,
		selectedProvider: providerId,
	});
	const [packageBarOpen, setSidebarOpen] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();
	const isMobile = typeof window !== 'undefined' && window.innerWidth < 768; //TODO use hook
	const toggleSidebar = () => setSidebarOpen((prev) => !prev);

	const handleSearch = debounce((query: string) => setState((prev) => ({ ...prev, searchQuery: query })), 200);

	const updateQueryParams = () => {
		const params = new URLSearchParams();
		if (state.selectedPackages.length > 0) {
			params.set('packageIds', state.selectedPackages.map((p) => p.id).join(','));
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
	};

	const loadInitialState = async (): Promise<void> => {
		const packageIds = searchParams.get('packageIds')?.split(',').map(Number) || [];
		const sortField = searchParams.get('sort') || defaultState.repoSort.field;
		const sortDirection = searchParams.get('direction') || defaultState.repoSort.direction;
		const page = Number(searchParams.get('page')) || defaultState.repoPagination.page;
		let selectedPackages: Package[] = [];
		if (packageIds.length > 0) {
			selectedPackages = await client.searchPackagesById(packageIds);
		}

		setState((prev) => ({
			...prev,
			selectedPackages,
			repoSort: {
				field: sortField as Sort['field'],
				direction: sortDirection as Sort['direction'],
			},
			repoPagination: { page, perPage: defaultState.repoPagination.perPage },
		}));
	};

	const handlePackageSelect = (pkg: Package) => {
		if (state.selectedPackages.some((p) => p.id === pkg.id)) return;
		setState((prev) => ({
			...prev,
			repoPagination: defaultState.repoPagination,
			selectedPackages: [...prev.selectedPackages, pkg],
			searchQuery: undefined,
		}));

		if (isMobile) setSidebarOpen(false);
	};

	const handlePackageRemove = (pkg: Package) => {
		setState((prev) => ({
			...prev,
			repoPagination: defaultState.repoPagination,
			selectedPackages: prev.selectedPackages.filter((p) => p.id !== pkg.id),
		}));
	};

	const handleSort = (sort: Sort) => {
		setState((prev) => ({
			...prev,
			repoSort: sort,
			repoPagination: defaultState.repoPagination,
		}));
	};

	const handlePagination = (pagination: Pagination) => {
		setState((prev) => ({ ...prev, repoPagination: pagination }));
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const loadRepositories = async () => {
		await searchRepositories(
			{
				packageIds: state.selectedPackages.map((p) => p.id),
				sort: state.repoSort,
				pagination: state.repoPagination,
			},
			setState,
		);
	};

	const loadPackages = async () => {
		await searchPackages(
			{
				query: state.searchQuery,
				usedWithPackages: state.selectedPackages.map((p) => p.id),
				provider: state.selectedProvider ?? state?.selectedPackages?.[0]?.provider,
			},
			setState,
		);
	};

	const getPackageListTitle = () => {
		if (state.searchQuery) return `Search Results for "${state.searchQuery}"`;
		if (state.selectedPackages.length > 0) return 'Related Packages';
		return 'Most Used Packages';
	};

	const showPackageBar =
		packageBarOpen || state.searchQuery || (state.selectedPackages.length == 0 && state.selectedProvider);

	const handleProviderRemove = () => {
		router.push('/');
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
	}, []);

	return (
		<div className="m-0 md:mx-6 md:mb-0 md:mt-6">
			<div className="absolute right-0 top-0 z-10 flex h-12 w-12 items-center p-2 md:hidden">
				<button
					onClick={toggleSidebar}
					className="flex h-full w-full items-center justify-center rounded-sm border text-black"
				>
					{packageBarOpen ? <BackIcon /> : <SeachMenuIcon />}
				</button>
			</div>

			<div className="flex flex-col md:flex-row">
				<div
					className={`${showPackageBar ? 'block' : 'hidden md:block'} relative mb-4 w-full border-gray-300 bg-white pl-[1px] md:mb-0 md:min-h-[calc(100vh-8rem)] md:w-80 md:border`}
				>
					<div className="absolute z-50 flex max-h-[100vh] w-full flex-col border-gray-300 bg-white px-4 py-2 md:sticky md:top-0 md:h-[calc(100vh-4rem)] md:max-h-none">
						<div className="-mx-4 -mt-2 flex h-14 items-center justify-center border-b border-gray-300 px-4 py-2">
							<SearchBar onSearch={handleSearch} />
						</div>
						{state.isPackagesLoading && <Spinner />}
						<div className="-mx-4 flex-1 overflow-y-auto pl-4 pr-3 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar]:w-1">
							<PackageList
								title={getPackageListTitle()}
								packages={state.packages}
								onPackageSelect={handlePackageSelect}
							/>
						</div>
					</div>
				</div>

				<div className="min-h-[calc(100vh-12rem)] flex-1 space-y-4 border-gray-300 md:min-h-[calc(100vh-8rem)] md:border-b md:border-r md:border-t">
					<div className="px-2 py-2 md:px-4 md:pt-2">
						<div
							className={`${state.selectedPackages.length > 0 ? 'flex' : 'hidden'} -mx-2 -mt-2 min-h-14 flex-wrap items-center justify-center border-b border-gray-300 bg-white px-2 py-2 md:-mx-4 md:flex md:px-4`}
						>
							<SelectedPackages
								selectedProvider={state.selectedProvider}
								packages={state.selectedPackages}
								onRemove={handlePackageRemove}
								onProviderRemove={() => handleProviderRemove()}
							/>
						</div>
						{state.isReposLoading && <Spinner />}
						{state.selectedPackages?.length > 0 ? (
							<>
								<div className="flex flex-wrap items-center justify-between gap-2 py-2">
									<div className="flex flex-row gap-3 text-xs font-semibold text-gray-600">
										<span>{state.repoAndProjectCount?.repoCount ?? 0} Repo</span>
										<span> {state.repoAndProjectCount?.projectCount} Project</span>
									</div>

									<div className="flex gap-2">
										<SortButton label="Stars" type="stars" activeSort={state.repoSort} onClick={handleSort} />
										<SortButton label="Updated" type="updatedAt" activeSort={state.repoSort} onClick={handleSort} />
									</div>
								</div>

								<div className="relative space-y-4 md:space-y-5">
									{state.repositories.map((repo, i) => (
										<RepositoryCard
											key={i}
											repository={repo}
											selectedPackages={state.selectedPackages}
											onPackageClick={handlePackageSelect}
										/>
									))}
								</div>

								<div className="overflow-x-auto py-4">
									<PaginationView
										pagination={state.repoPagination}
										total={state.repoAndProjectCount?.projectCount ?? 0}
										onPaginationChange={handlePagination}
									/>
								</div>
							</>
						) : (
							<>{!providerId && <Landing appInfo={state.appInfo} />}</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
