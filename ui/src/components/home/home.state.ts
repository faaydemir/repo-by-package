import { Package, PackageWithDetails, Pagination, Repository, Sort } from "@/client";

export interface State {
    packages: PackageWithDetails[];
    selectedPackages: Package[];
    repositories: Repository[];
    totalRepoCount?: number;
    repoSort: Sort;
    repoPagination: Pagination;
    isReposLoading: boolean;
    isPackagesLoading: boolean;
    error?: string;
    searchQuery?: string;
}

export const defaultState: State = {
    packages: [],
    selectedPackages: [],
    repositories: [],
    repoSort: { field: 'stars', direction: 'desc' },
    repoPagination: { page: 1, perPage: 30 },
    isReposLoading: false,
    isPackagesLoading: false,
    searchQuery: undefined,
    error: undefined
}