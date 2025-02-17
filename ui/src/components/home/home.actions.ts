import client, { RepositoryFilter, SearchPackageRequest } from "@/client";
import { State } from "./home.state";

export const searchPackages = async (searchParams: SearchPackageRequest, setState: React.Dispatch<React.SetStateAction<State>>) => {
  try {
    setState(prev => ({ ...prev, isPackagesLoading: true }))
    const { packages } = await client.searchPackages(searchParams);
    setState(prev => ({ ...prev, packages }))
  } catch (error) {
    setState(prev => ({ ...prev, error: (error as Error).message ?? error }))
  } finally {
    setState(prev => ({ ...prev, isPackagesLoading: false }))
  }
}

export const searchRepositories = async (searchParams: RepositoryFilter, setState: React.Dispatch<React.SetStateAction<State>>) => {
  try {
    setState(prev => ({ ...prev, isReposLoading: true }))

    const [repositories, totalRepoCount] = await Promise.all([
        client.searchRepositories(searchParams),
        //TODO: get total count only if selected packages have changed
        client.countRepositories(searchParams)
    ]);
    setState(prev => ({ ...prev, repositories, totalRepoCount }))
  } catch (error) {
    setState(prev => ({ ...prev, error: (error as Error).message ?? error }))
  } finally {
    setState(prev => ({ ...prev, isReposLoading: false }))
  }
}
