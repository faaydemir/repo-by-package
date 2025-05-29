import { Package, Repository } from '@/client';
import { PackageTag } from '@/components/home/PackageTag';
import Link from 'next/link';
import { useState } from 'react';
import { TechIcon } from '../common/TechIcon';
import { OpenPageIcon, SearchIcon, StarIcon } from '../common/Icon';

interface RepositoryCardProps {
	repository: Repository;
	selectedPackages: Package[];
	onPackageClick?: (pkg: Package) => void;
}

function getGithubSearchUrl(pkg: Package, repo: string, folder: string): string | undefined {
	const notSupportedProviders = new Set(['Maven', 'nuget', 'go']);
	if (notSupportedProviders.has(pkg.provider)) return;

	//TODO: fix for npm package path delete when project path is correctly setted on parsing
	if (folder && folder.endsWith('package.json')) {
		folder = folder.replace('package.json', '');
	}

	const providerFileMapping: Record<string, string[]> = {
		npm: ['js', 'ts', 'jsx', 'tsx', 'vue', 'svelte'],
		pypi: ['py'],
		nuget: ['cs'],
		RubyGems: ['rb'],
		cargo: ['rs'],
		Maven: ['java', 'kt'],
	};

	const extensionQuery = providerFileMapping[pkg.provider]
		? providerFileMapping[pkg.provider].map((ext) => `+path%3A*.${ext}`).join('+OR+')
		: undefined;
	const searchByProviderNameQuery = `q=${pkg.name}`;

	let searchUrl = `https://github.com/search?${searchByProviderNameQuery}`;
	if (repo) {
		searchUrl += `+repo%3A${encodeURIComponent(repo)}`;
	}
	if (folder) {
		searchUrl += `+path%3A${encodeURIComponent(folder)}`;
	}
	if (extensionQuery) {
		searchUrl += extensionQuery;
	}
	searchUrl += '&type=Code';
	return searchUrl;
}

function formatDate(date: Date): string {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
	if (diffInSeconds < 60) {
		return 'just now';
	} else if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		return `${minutes}m ago`;
	} else if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		return `${hours}h ago`;
	} else if (diffInSeconds < 604800) {
		const days = Math.floor(diffInSeconds / 86400);
		return `${days}d ago`;
	} else {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
		});
	}
}

export function RepositoryCard({ repository, selectedPackages, onPackageClick }: RepositoryCardProps) {
	const { name, topics, description, language, url, stars, updatedAt, projects } = repository;

	const [showAllProjects, setShowAllProjects] = useState<boolean>(true);
	const [extenedPackages, setExtendedPackages] = useState<Record<number, boolean>>({});

	const showHideAllPackages = (projectId: number) => {
		setExtendedPackages((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
	};

	const getPackageSearchUrls = (pkg: Package[], repo: string, folder: string): { url: string; name: string }[] => {
		pkg = pkg ?? [];
		return pkg
			.map((p) => ({ url: getGithubSearchUrl(p, repo, folder), name: p.name }))
			.filter((p): p is { url: string; name: string } => p.url !== undefined);
	};

	return (
		<div className="flex flex-col gap-1 rounded-sm border border-gray-300 bg-white px-4 py-2">
			<div className="flex items-center justify-between pb-0.5">
				<div className="flex items-center gap-2">
					<Link href={url} target="_blank" className="text-md hover:gray-blue-600 font-semibold text-gray-900">
						{name}
					</Link>
					{<TechIcon tech={language} size="xs" />}
				</div>
				<div className="flex items-center gap-4 text-gray-600">
					<span className="text-xs text-gray-500">Updated {formatDate(updatedAt)}</span>
					<div className="flex items-center">
						<StarIcon />
						<span className="ml-1 text-xs font-medium">{stars.toLocaleString()}</span>
					</div>
				</div>
			</div>

			<p className="line-clamp-2 break-words text-xs text-gray-600">{description}</p>

			{topics && (
				<div className="flex flex-wrap gap-2">
					{topics?.split(',').map((topic) => (
						<span key={topic} className="text-xs text-gray-600">
							{topic}
						</span>
					))}
				</div>
			)}
			{projects.length > 0 &&
				projects.slice(0, showAllProjects ? projects.length : 3).map((project) => (
					<div key={project.id} className="mt-2 flex flex-col items-start gap-0">
						<div className="flex flex-wrap items-center gap-3 py-0.5">
							<Link
								href={project.url ?? url}
								target="_blank"
								className="border-b border-transparent text-xs font-semibold text-gray-700 hover:border-gray-500 md:mr-5"
							>
								{project?.path || '/'}
								<OpenPageIcon className="ml-1 inline-block h-4 w-4" />
							</Link>
							{getPackageSearchUrls(selectedPackages, repository.fullName, project.path).map((s) => (
								<Link
									key={s.url}
									href={s.url}
									target="_blank"
									className="border-b border-transparent text-xs font-semibold text-gray-600 hover:border-gray-500"
								>
									{s.name}
									<SearchIcon className="inline-block h-4 w-4" />
								</Link>
							))}
						</div>
						<div className="w-100 flex flex-wrap items-center justify-start gap-1">
							{project.packages.slice(0, extenedPackages[project.id] ? project.packages.length : 10).map((pkg) => (
								<button key={pkg.id} onClick={() => onPackageClick?.(pkg)}>
									<PackageTag key={pkg.id} name={pkg.name} provider={pkg.provider} size="sm" />
								</button>
							))}
							{project.packages.length > 10 && (
								<button
									onClick={() => showHideAllPackages(project.id)}
									className="text-xs font-semibold text-gray-600 hover:underline"
								>
									{extenedPackages[project.id] ? 'Show less' : `+ ${project.packages.length - 7} more`}
								</button>
							)}
						</div>
					</div>
				))}
			{projects.length > 3 && (
				<button
					onClick={() => setShowAllProjects(!showAllProjects)}
					className="mt-1 self-start text-xs font-semibold text-gray-600 hover:underline"
				>
					{showAllProjects ? `Show less` : `+ ${projects.length - 3} project more.`}
				</button>
			)}
		</div>
	);
}
