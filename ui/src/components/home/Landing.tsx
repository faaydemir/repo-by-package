import React from 'react';
import { TechIcon } from '../common/TechIcon';
import Link from 'next/link';

import { NextIcon } from '../common/Icon';
import { PackageLink } from './PackageTag';
import PageInfo from '@/types/pageInfo';
import { ProviderStats } from '@/client';

const Landing = ({ pageInfo, providerStats }: { pageInfo?: PageInfo; providerStats?: ProviderStats[] }) => {
	return (
		<>
			{pageInfo && (
				<div className="min-h-screen bg-gradient-to-br">
					<div className="container max-w-5xl px-4 pb-6 md:px-0 md:pb-16 md:pt-5">
						<div className="relative flex flex-col items-start">
							<div className="flex flex-col items-start justify-start gap-5">
								<div className="mt-4 flex flex-row items-center gap-3 md:mt-0">
									{pageInfo.image && (
										<img src={pageInfo.image} alt={pageInfo.title} className="h-10 w-10 object-cover md:h-16 md:w-16" />
									)}
									<h1 className="text-start text-2xl text-gray-900 md:text-2xl lg:text-4xl">{pageInfo.title}</h1>
								</div>
								<p className="text-md mt-2 max-w-2xl text-start font-light leading-relaxed text-gray-600 md:text-2xl">
									{pageInfo.description}
								</p>
							</div>
						</div>
					</div>

					<div className="container mx-auto max-w-7xl gap-6 md:px-0 md:pb-24">
						<div className="grid grid-cols-1 gap-2 md:gap-4 lg:grid-cols-3">
							{providerStats?.map((provider, index) => (
								<Link
									href={`/${provider.name}`}
									key={index}
									className="group flex h-full cursor-pointer flex-col rounded-md border border-gray-300 bg-white p-3 transition-all duration-300 hover:border-gray-500"
								>
									<div className="flex h-full flex-1 flex-col gap-3">
										<div className="flex items-center justify-between md:flex-col">
											<div className="flex items-center gap-3 border-gray-300 md:pb-2">
												<TechIcon tech={provider.name} size="md" />
												<h3 className="text-xl font-semibold text-gray-500 md:text-lg">{provider.name}</h3>
											</div>
											<div className="flex h-full w-full flex-1 flex-row items-center justify-between md:flex-row md:items-start md:border-t md:py-3">
												<div className="flex flex-1 flex-col flex-wrap items-end gap-0 md:items-center">
													<span className="text-xl font-semibold text-gray-600 md:text-2xl">
														{provider.repoCount.toLocaleString()}
													</span>
													<span className="text-xs font-medium text-gray-500 md:text-sm">repos</span>
												</div>
												<div className="flex flex-1 flex-col flex-wrap items-end gap-0 md:items-center">
													<span className="text-xl font-semibold text-gray-600 md:text-2xl">
														{provider.dependencyCount.toLocaleString()}
													</span>
													<span className="text-xs font-medium text-gray-500 md:text-sm">packages</span>
												</div>
											</div>
										</div>

										<div className="mt-auto">
											<span className="flex w-full items-center justify-center rounded-sm border border-transparent px-6 text-xs font-medium text-gray-400 transition-all group-hover:text-gray-600 md:py-3">
												Browse {provider.name} repositories
												<NextIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
											</span>
										</div>
									</div>
								</Link>
							))}
						</div>
						<div className="flex flex-col gap-6 pt-6 md:gap-6">
							{providerStats?.map((provider, index) => (
								<div key={index} className="flex flex-col rounded-md border border-gray-300 bg-white px-4 py-2">
									<div className="flex items-center gap-2 border-gray-300 p-2">
										<TechIcon tech={provider.name} size="sm" />
										<h3 className="text-xl text-gray-500 md:text-lg">
											Most used <span className="font-semibold text-gray-600">{provider.name}</span> packages
										</h3>
									</div>
									<div className="flex flex-wrap items-center gap-2 py-2 md:border-t">
										{provider.topDependencies
											.slice(0, 20)
											.map((dep: { name: string; unique: string; count: number }, index: number) => (
												<PackageLink
													key={index}
													name={dep.name}
													unique={dep.unique}
													provider={provider.name}
													repoCount={dep.count}
													showLink={true}
												/>
											))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Landing;
