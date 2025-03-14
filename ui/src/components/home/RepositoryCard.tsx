import { Package, Repository } from '@/client';
import { PackageTag } from '@/components/home/PackageTag';
import Link from 'next/link';
import { useState } from 'react';
import { TechIcon } from '../common/TechIcon';
import { OpenPageIcon, StarIcon } from '../common/Icon';

interface RepositoryCardProps {
	repository: Repository;
	onPackageClick?: (pkg: Package) => void;
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

export function RepositoryCard({ repository, onPackageClick }: RepositoryCardProps) {
	const { name, topics, description, language, url, stars, updatedAt, projects } = repository;

	const [showAllProjects, setShowAllProjects] = useState<boolean>(false);
	const [extenedPackages, setExtendedPackages] = useState<Record<number, boolean>>({});

	const showHideAllPackages = (projectId: number) => {
		setExtendedPackages((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
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
						<Link
							href={project.url ?? url}
							target="_blank"
							className="mt-1 text-xs font-semibold text-gray-700 hover:underline"
						>
							{project.path}
							<OpenPageIcon size={4} className="ml-1 inline-block" />
						</Link>
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
