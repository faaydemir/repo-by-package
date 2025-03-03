import React from 'react';
import { TechIcon } from '../common/TechIcon';
import Link from 'next/link';

import { AppInfo } from './home.state';


const Landing = ({ appInfo }: { appInfo?: AppInfo }) => {

    return (<>
        {appInfo && <div className="min-h-screen bg-gradient-to-br ">
            {/* Hero Section with improved visual elements */}
            <div className="container mx-auto px-4 md:px-6 pt-10 pb-10 max-w-5xl ">
                <div className="flex flex-col items-start text-center mb-16 relative">

                    <div className="flex flex-col md:flex-row items-center justify-center gap-5 mb-8">
                        {/* <div className="rounded-2xl p-3 border ">
                            <img
                                src={appInfo.favicon}
                                alt={appInfo.name}
                                className="w-16 h-16 md:w-24 md:h-24 object-contain"
                            />
                        </div> */}
                        <div>
                            <h1 className="text-3xl md:text-3xl lg:text-5xl font-semibold text-gray-900 mt-4 md:mt-0  text-start">
                                {appInfo.name}
                            </h1>
                            <p className="text-xl text-start md:text-2xl text-gray-600 max-w-2xl mt-2  leading-relaxed font-light ">
                                {appInfo.description}
                            </p>
                        </div>
                    </div>

                    {/* Description with better typography */}


                </div>
            </div>

            {/* Providers Section with improved cards */}
            <div className="container mx-auto px-4 md:px-6 pb-24 max-w-7xl ">


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {appInfo.providerStats.map((provider, index) => (
                        <Link href={`/${provider.name}`}
                            key={index}
                            className="rounded-md p-6 border border-gray-300 hover:border-gray-500 cursor-pointer transition-all duration-300 group flex flex-col h-full">
                            <div className="flex flex-col gap-6 flex-1 h-full">
                                {/* Provider Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-br p-4 rounded-md shadow-sm transition-transform duration-300 ring-2 ring-indigo-100/50">
                                            <TechIcon tech={provider.name} size='lg' />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-800 mb-1">{provider.name}</h3>
                                            <div className="flex items-baseline">
                                                <span className="text-2xl font-bold text-gray-600 mr-2">
                                                    {provider.dependencyCount.toLocaleString()}
                                                </span>
                                                <span className="text-gray-500 font-medium text-sm">packages</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="flex flex-col gap-4">
                                    {provider.languageStats.map((languageStat, langIndex) => (
                                        <div
                                            key={langIndex}
                                            className="px-0 py-1.5 w-full rounded-sm text-gray-600 transition-all text-sm font-medium flex items-center gap-2 ">


                                            <TechIcon tech={languageStat.language} size="md" />
                                            <div>
                                                <h5 className="font-semibold text-gray-600 text-lg  transition-colors">{languageStat.language}</h5>
                                                <div className="flex items-baseline">
                                                    <span className="font-bold mr-1">
                                                        {languageStat.projectCount.toLocaleString()}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">projects</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto pt-4">
                                    {/* Improved Explore Button - border only shows on parent hover */}
                                    <span className="px-6 py-3 border   group-hover:text-gray-600 border-transparent w-full rounded-sm text-gray-400 transition-all text-sm font-medium flex justify-center items-center">
                                        Browse {provider.name} packages
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </div>
        }
    </>
    );
};

export default Landing;