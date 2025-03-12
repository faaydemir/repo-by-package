'use client';

import { Package } from '@/client';
import { SelectedPackageTag } from '@/components/home/PackageTag';
import { TechIcon } from '../common/TechIcon';

interface SelectedPackagesProps {
	packages: Package[];
	selectedProvider?: string;
	onRemove: (pkg: Package) => void;
	onProviderRemove: () => void;
}

export function SelectedPackages({ selectedProvider, packages, onRemove, onProviderRemove }: SelectedPackagesProps) {
	const packageTagSize = packages.length > 8 ? 'sm' : 'md';

	return (
		<div className="flex flex-1 flex-row flex-wrap items-center gap-1">
			{selectedProvider && (
				<button className="group relative flex items-center gap-1 py-0 pl-2 pr-6" onClick={() => onProviderRemove()}>
					<TechIcon tech={selectedProvider} size="sm" showText={false} />
					<span className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 hover:text-gray-600 group-hover:opacity-100">
						×
					</span>
				</button>
			)}
			{packages?.map((pkg) => (
				<SelectedPackageTag
					key={pkg.name}
					name={pkg.name}
					provider={pkg.provider}
					onRemove={() => onRemove(pkg)}
					size={packageTagSize}
				/>
			))}
		</div>
	);
}
