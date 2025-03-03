import { Package, Repository } from '@/client';
import { PackageTag } from '@/components/home/PackageTag';
import Link from 'next/link';
import { useState } from 'react';

interface RepositoryCardProps {
  repository: Repository;
  onPackageClick?: (pkg: Package) => void;
}

function formatDate(date:Date): string {

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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

export function RepositoryCard({ repository, onPackageClick }: RepositoryCardProps) {
  const { name, topics, description, language, url, stars, updatedAt, projects } = repository;

  const [showAllProjects, setShowAllProjects] = useState<boolean>(false);
  const [extenedPackages, setExtendedPackages] = useState<Record<number, boolean>>({});

  const showHideAllPackages = (projectId: number) => {
    setExtendedPackages((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  }
  return (
    <div className="flex flex-col bg-white rounded-sm border border-gray-300 px-4 py-2 gap-1">
      <div className="flex items-center justify-between pb-0.5">
        <div className="flex items-center gap-2">
          <Link
            href={url}
            target="_blank"
            className="text-md font-semibold text-gray-900 hover:gray-blue-600"
          >
            {name}
          </Link>
          {language && (
            <span className="inline-flex items-center rounded-sm bg-gray-100 px-2 py-1 text-xs font-medium">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-gray-600">
          <span className="text-xs text-gray-500">Updated {formatDate(updatedAt)}</span>
          <div className="flex items-center">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .25a.75.75 0 0 1 .673.418l3.058 6.197 6.839.994a.75.75 0 0 1 .415 1.279l-4.948 4.823 1.168 6.811a.75.75 0 0 1-1.088.791L12 18.347l-6.117 3.216a.75.75 0 0 1-1.088-.79l1.168-6.812-4.948-4.823a.75.75 0 0 1 .416-1.28l6.838-.993L11.327.668A.75.75 0 0 1 12 .25Z" />
            </svg>
            <span className="ml-1 text-xs font-medium">{stars.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600 line-clamp-2 break-words">{description}</p>

      {topics && (
        <div className="flex flex-wrap gap-2">
          {topics?.split(",").map((topic) => (
            <span
              key={topic}
              className="text-xs text-gray-600"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
      {projects.length > 0 && projects.slice(0, showAllProjects ? projects.length : 3).map((project) => (
        <div key={project.id} className="flex flex-col items-start gap-0 mt-2">
          <Link
            href={project.url ?? url}
            target="_blank"
            className="text-xs font-semibold text-gray-700 hover:gray-blue-800"
          >
            {project.path}
          </Link>
          <div className="flex gap-1 w-100 flex-wrap justify-start items-center">
            {project.packages.slice(0, extenedPackages[project.id] ? project.packages.length : 10).map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => onPackageClick?.(pkg)}
              >
                <PackageTag key={pkg.id} name={pkg.name} provider={pkg.provider} size='sm' />
              </button>
            ))}
            {project.packages.length > 10 && (
              <button
                onClick={() => showHideAllPackages(project.id)}
                className="text-xs text-gray-600 font-semibold hover:underline">
                {extenedPackages[project.id] ? 'Show less' : `+ ${project.packages.length - 7} more`}
              </button>
            )}
          </div>
        </div>
      ))}
      {projects.length > 3 && (
        <button
          onClick={() => setShowAllProjects(!showAllProjects)}
          className="text-xs font-semibold hover:underline text-gray-600 self-start mt-1"
        >
          {showAllProjects ? `Show less` : `+ ${projects.length - 3} project more.`}
        </button>
      )}

    </div>
  );
}
