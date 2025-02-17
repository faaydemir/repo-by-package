'use client';

import { Package } from '@/client';
import { PackageTag } from '@/components/home/PackageTag';

interface SelectedPackagesProps {
  packages: Package[];
  onRemove: (pkg: Package) => void;
}

export function SelectedPackages({ packages, onRemove }: SelectedPackagesProps) {

  return (

        <div className="flex flex-wrap gap-2 flex-1 flex-row items-center">
        {packages?.map((pkg) => (
          <button key={pkg.name} className="group relative" onClick={() => onRemove(pkg)}>
            <PackageTag
              name={pkg.name}
              className="pr-8"
            />
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
            >
              ×
            </span>
          </button>
        ))}
        </div>
  );
}