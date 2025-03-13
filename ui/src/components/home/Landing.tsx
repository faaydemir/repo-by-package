import React from 'react';
import { TechIcon } from '../common/TechIcon';
import Link from 'next/link';

import { AppInfo } from './home.state';
import { NextIcon } from '../common/Icon';

const Landing = ({ appInfo }: { appInfo?: AppInfo }) => {
	return (
		<>
			{appInfo && (
				<div className="min-h-screen bg-gradient-to-br">
					<div className="container max-w-5xl px-4 pb-6 md:px-0 md:pb-32 md:pt-10">
						<div className="relative flex flex-col items-start">
							<div className="flex flex-col items-center justify-center gap-5 md:flex-row">
								<div>
									<h1 className="mt-4 text-start text-2xl text-gray-900 md:mt-0 md:text-2xl lg:text-5xl">
										{appInfo.name}
									</h1>
									<p className="text-md mt-2 max-w-2xl text-start font-light leading-relaxed text-gray-600 md:text-2xl">
										{appInfo.description}
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="container mx-auto max-w-7xl md:px-0 md:pb-24">
						<div className="grid grid-cols-1 gap-2 md:gap-4 lg:grid-cols-3">
							{appInfo.providerStats.map((provider, index) => (
								<Link
									href={`/${provider.name}`}
									key={index}
									className="group flex h-full cursor-pointer flex-col rounded-xl border border-gray-300 bg-white p-3 transition-all duration-300 hover:border-gray-500"
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
												Browse {provider.name} packages
												<NextIcon size={4} className="transition-transform group-hover:translate-x-1" />
											</span>
										</div>
									</div>
								</Link>
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Landing;
