import client, { RepositoryFilter, SearchPackageRequest } from '@/client';
import { State } from './home.state';
import appInfo from '@/constant/appInfo';

let lastSearchPackagesIndex = 0;
export const searchPackages = async (
	searchParams: SearchPackageRequest,
	setState: React.Dispatch<React.SetStateAction<State>>,
) => {
	try {
		setState((prev) => ({ ...prev, isPackagesLoading: true }));

		const currentOperationIndex: number = ++lastSearchPackagesIndex;
		const { packages } = await client.searchPackages(searchParams);

		if (currentOperationIndex !== lastSearchPackagesIndex) return;

		setState((prev) => ({ ...prev, packages }));
	} catch (error) {
		setState((prev) => ({ ...prev, error: (error as Error).message ?? error }));
	} finally {
		setState((prev) => ({ ...prev, isPackagesLoading: false }));
	}
};

let lastSearchRepositoriesIndex = 0;
export const searchRepositories = async (
	searchParams: RepositoryFilter,
	setState: React.Dispatch<React.SetStateAction<State>>,
) => {
	try {
		setState((prev) => ({ ...prev, isReposLoading: true }));
		const currentOperationIndex: number = ++lastSearchRepositoriesIndex;

		const [repositories, totalRepoCount] = await Promise.all([
			client.searchRepositories(searchParams),
			client.countRepositories(searchParams), //TODO: get total count only if selected packages have changed
		]);

		if (currentOperationIndex !== lastSearchRepositoriesIndex) return;

		setState((prev) => ({ ...prev, repositories, totalRepoCount }));
	} catch (error) {
		setState((prev) => ({ ...prev, error: (error as Error).message ?? error }));
	} finally {
		setState((prev) => ({ ...prev, isReposLoading: false }));
	}
};

export const loadAppInfo = async (setState: React.Dispatch<React.SetStateAction<State>>) => {
	try {
		let providerStats = await client.getProviderStats();
		providerStats = providerStats.filter((stat) => appInfo.supportedProviders.includes(stat.name));
		const info = {
			...appInfo,
			providerStats: providerStats,
		};
		setState((prev) => ({ ...prev, appInfo: info }));
	} catch (error) {
		setState((prev) => ({ ...prev, error: (error as Error).message ?? error }));
	}
};
