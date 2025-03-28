'use client';

import { PackageWithDetails, Package } from '@/client';
import { PackageTag } from '@/components/home/PackageTag';

interface PackageListProps {
	title: string;
	packages: PackageWithDetails[];
	onPackageSelect?: (pkg: Package) => void;
}

export function PackageList({ title, packages, onPackageSelect }: PackageListProps) {
	return (
		<div>
			<h2 className="py-2 text-sm font-semibold text-gray-700">{title}</h2>
			<div className="space-y-2">
				{packages.map((pkg) => (
					<button
						key={`${pkg.name}_${pkg.provider}`}
						onClick={() => onPackageSelect?.(pkg)}
						className="block w-full text-left"
					>
						<PackageTag
							name={pkg.name}
							provider={pkg.provider}
							repoCount={pkg.repoCount}
							className="w-full justify-between"
						/>
					</button>
				))}
			</div>
		</div>
	);
}
