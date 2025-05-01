import appInfo from './constant/appInfo';
import { supabase } from './lib/supabase';
import cache from './utils/cache';

export interface Sort {
	field: string;
	direction: 'asc' | 'desc';
}

export interface Pagination {
	page: number;
	perPage: number;
	total?: number;
}

export interface RepositoryCountFilter {
	packageIds?: number[];
}

export interface RepositoryFilter {
	sort?: Sort;
	packageIds?: number[];
	pagination?: Pagination;
}
export interface RepositoryProject {
	id: number;
	path: string;
	packages: Package[];
	packageProvider: string;
	url?: string;
}

export interface Repository {
	id: number;
	icon?: string;
	fullName: string;
	name: string;
	description?: string;
	topics: string;
	language: string;
	url: string;
	stars: number;
	updatedAt: Date;
	projects: RepositoryProject[];
}

export interface RepositorySearchResponse {
	repositories: Repository[];
	total: number;
	sort: Sort;
	pagination: Pagination;
}

export interface Package {
	id: number;
	name: string;
	provider: string;
}

export interface PackageWithDetails extends Package {
	tags: string[];
	repoCount: number;
}

export interface SearchPackageResponse {
	packages: PackageWithDetails[];
}

export interface SearchPackageRequest {
	query?: string;
	usedWithPackages?: number[];
	provider?: string;
	take?: number;
}
export interface RepoAndProjectCount {
	repoCount: number;
	projectCount: number;
}
export interface LanguageStat {
	language: string;
	projectCount: number;
}

export interface DependencyCount {
	name: string;
	count: number;
}
export interface ProviderStats {
	name: string;
	dependencyCount: number;
	repoCount: number;
	topDependencies: DependencyCount[];
}

interface RepositoryResponseItems {
	id: number;
	repositoryDependencyId: number;
	path: string;
	packageProvider: string;
	fullName: string;
	defaultBranch: string;
	description: string;
	language: string;
	topics: string;
	stars: number;
	updatedAt: string;
	packages: Package[];
}

const getRepoUrl = (repo: RepositoryResponseItems): string => {
	return `https://github.com/${repo.fullName}`;
};

const getFolderUrlFromPath = (repo: RepositoryResponseItems): string => {
	const url = getRepoUrl(repo);
	return `${url}/blob/${repo.defaultBranch}/${repo.path}`;
};

const mergeRepositoriesByProject = (repositoryResponses: RepositoryResponseItems[]): Repository[] => {
	const id_to_repository: Record<number, Repository> = {};
	const repositories: Repository[] = [];
	repositoryResponses.forEach((repo) => {
		const [, repoName] = repo.fullName.split('/');
		if (!id_to_repository[repo.id]) {
			id_to_repository[repo.id] = {
				id: repo.id,
				fullName: repo.fullName,
				name: repoName,
				description: repo.description,
				topics: repo.topics,
				language: repo.language,
				url: getRepoUrl(repo),
				stars: repo.stars,
				updatedAt: new Date(repo.updatedAt),
				projects: [],
			};

			repositories.push(id_to_repository[repo.id]);
		}

		id_to_repository[repo.id].projects.push({
			id: repo.repositoryDependencyId,
			path: repo.path,
			packages: repo.packages,
			packageProvider: repo.packageProvider,
			url: getFolderUrlFromPath(repo),
		});
	});

	return repositories;
};

const searchRepositories = async (request: RepositoryFilter): Promise<Repository[]> => {
	const { data, error } = await supabase.rpc('search_repositories_v2', {
		p_packageids: request.packageIds ?? [],
		p_page: request.pagination?.page ?? 1,
		p_per_page: request.pagination?.perPage ?? 100,
		p_sortdirection: request.sort?.direction ?? 'desc',
		p_sortfield: request.sort?.field ?? 'stars',
	});
	if (error) {
		console.error(error);

		throw new Error(error.message);
	}

	// @ts-expect-error: supabase types are incorrect
	return mergeRepositoriesByProject(data ?? []);
};

const countRepositories = async (request: RepositoryCountFilter): Promise<RepoAndProjectCount> => {
	const { data, error } = await supabase.rpc('count_repositories', {
		p_packageids: request.packageIds ?? [],
	});
	if (error) {
		console.error(error);
		throw new Error(error.message);
	}

	return data?.[0] as RepoAndProjectCount;
};

const searchPackagesById = async (packageIds: number[]): Promise<PackageWithDetails[]> => {
	const { data, error } = await supabase.rpc('get_packages_by_id', {
		p_packageids: packageIds,
	});

	if (error) {
		console.error(error);
		throw new Error(error.message);
	}

	return data as PackageWithDetails[];
};

const searchPackages = async (request: SearchPackageRequest): Promise<SearchPackageResponse> => {
	if (!request?.query && !request?.usedWithPackages && !request?.provider) {
		throw new Error('Missing required fields');
	}

	const perPage = request?.usedWithPackages?.length ? 40 : 100;

	const { data, error } = await supabase.rpc('search_packages', {
		p_name: request.query?.trim() ?? '',
		p_packageids: request.usedWithPackages ?? [],
		p_page: 1,
		p_per_page: perPage,
		p_provider: request.provider ?? '',
	});

	if (error) {
		console.error(error);
		throw new Error(error.message);
	}

	return {
		packages:
			data?.map((pkg) => ({
				id: pkg.id,
				name: pkg.name,
				provider: pkg.provider,
				repoCount: pkg.repocount,
				tags: pkg.tags,
			})) ?? [],
	};
};

const getProviderStats = async (): Promise<ProviderStats[]> => {
	const { data, error } = await supabase.rpc('get_all_provider_stats', {});

	if (error) {
		console.error(error);
		throw new Error(error.message);
	}
	data.sort((a, b) => b.repoCount - a.repoCount);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-expect-error
	return data.filter((stat) => appInfo.supportedProviders.includes(stat.name)) as ProviderStats[];
};

const generateSearchRepositoriesCacheKey = (request: RepositoryFilter): string => {
	const packageIds = [...(request.packageIds ?? [])];
	packageIds.sort();
	return `${packageIds?.join(',')}-${request.sort?.field}-${request.sort?.direction}-${request.pagination?.page}-${request.pagination?.perPage}`;
};

const generateCountRepositoriesCacheKey = (request: RepositoryCountFilter): string => {
	const packageIds = [...(request.packageIds ?? [])];
	packageIds.sort();
	return `${packageIds?.join(',')}`;
};

const generateSearchPackagesCacheKey = (request: SearchPackageRequest): string => {
	const usedWithPackages = [...(request.usedWithPackages ?? [])];
	usedWithPackages.sort();
	return `${request.query}-${usedWithPackages?.join(',')}-${request.provider}`;
};

const client = {
	getProviderStats: cache({
		keyGenerator: () => 'providerStats',
		getter: getProviderStats,
		count: 1,
	}),

	searchRepositories: cache({
		keyGenerator: generateSearchRepositoriesCacheKey,
		getter: searchRepositories,
		count: 20,
	}),
	countRepositories: cache({
		keyGenerator: generateCountRepositoriesCacheKey,
		getter: countRepositories,
		count: 20,
	}),
	searchPackages: cache({
		keyGenerator: generateSearchPackagesCacheKey,
		getter: searchPackages,
		count: 20,
	}),

	searchPackagesById,
};

export default client;
