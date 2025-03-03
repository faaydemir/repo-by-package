import { Package, PackageWithDetails, Pagination, ProviderStats, Repository, Sort } from "@/client";


export interface AppInfo {
    name: string;
    description: string;
    icon: string;
    favicon: string;
    providerStats: ProviderStats[];
}
export interface State {
    packages: PackageWithDetails[];
    selectedPackages: Package[];
    selectedProvider?: string;
    repositories: Repository[];
    totalRepoCount?: number;
    repoSort: Sort;
    repoPagination: Pagination;
    isReposLoading: boolean;
    isPackagesLoading: boolean;
    error?: string;
    searchQuery?: string;
    appInfo?: AppInfo;
}

export const defaultState: State = {
    packages: [],
    selectedPackages: [],
    repositories: [],
    selectedProvider: undefined,
    repoSort: { field: 'stars', direction: 'desc' },
    repoPagination: { page: 1, perPage: 30 },
    isReposLoading: false,
    isPackagesLoading: false,
    searchQuery: undefined,
    error: undefined,
    appInfo: undefined
}