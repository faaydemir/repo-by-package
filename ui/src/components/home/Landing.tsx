import React from 'react';
import { TechIcon } from '../common/TechIcon';
import Link from 'next/link';

import { AppInfo } from './home.state';


const Landing = ({ appInfo }: { appInfo?: AppInfo }) => {

    return (<>
        {appInfo && <div className="min-h-screen bg-gradient-to-br ">
            {/* Hero Section with improved visual elements */}
            <div className="container mx-auto md:px-6 md:pt-10 md:pb-32 pb-6 px-4  max-w-5xl ">
                <div className="flex flex-col items-start text-center relative">

                    <div className="flex flex-col md:flex-row items-center justify-center gap-5">
                        {/* <div className="rounded-2xl p-3 border ">
                            <img
                                src={appInfo.favicon}
                                alt={appInfo.name}
                                className="w-16 h-16 md:w-24 md:h-24 object-contain"
                            />
                        </div> */}
                        <div>
                            <h1 className="text-2xl md:text-2xl lg:text-5xl font-semibold text-gray-900 mt-4 md:mt-0  text-start">
                                {appInfo.name}
                            </h1>
                            <p className="text-md text-start md:text-2xl text-gray-600 max-w-2xl mt-2  leading-relaxed font-light ">
                                {appInfo.description}
                            </p>
                        </div>
                    </div>

                    {/* Description with better typography */}

                </div>
            </div>

            {/* Providers Section with improved cards */}
            <div className="container mx-auto md:px-6 md:pb-24 max-w-7xl ">
                <div className="grid grid-cols-1 lg:grid-cols-3 md:gap-4 gap-2">
                    {appInfo.providerStats.map((provider, index) => (
                        <Link href={`/${provider.name}`}
                            key={index}
                            className="rounded-md md:p-6 p-4 border border-gray-300 hover:border-gray-500 cursor-pointer transition-all duration-300 group flex flex-col h-full">
                            <div className="flex flex-col gap-3 flex-1 h-full">
                                {/* Provider Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 border-b border-gray-300 w-full pb-3">
                                        <TechIcon tech={provider.name} size='md' />

                                        <div className='flex flex-row h-full flex-1 justify-between items-center md:flex-col md:items-start'>
                                            <h3 className="md:text-2xl text-xl font-bold text-gray-700 mb-1">{provider.name}</h3>
                                            <div className="flex flex-col flex-wrap md:items-baseline items-end">
                                                <span className="md:text-2xl text-xl font-bold text-gray-600">
                                                    {provider.dependencyCount.toLocaleString()}
                                                </span>
                                                <span className="text-gray-500 font-medium text-xs md:text-sm">packages</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="flex flex-col md:gap-4 gap-1">
                                    {provider.languageStats.map((languageStat, langIndex) => (
                                        <div
                                            key={langIndex}
                                            className="px-0 py-1.5 w-full rounded-sm text-gray-600 transition-all text-sm font-medium flex md:items-start items-center gap-2 ">


                                            <TechIcon tech={languageStat.language} size="sm" />
                                            <div className='flex flex-row h-full flex-1 justify-between items-center md:flex-col md:items-start'>
                                                <h5 className="font-semibold text-gray-600 text-md  transition-colors">{languageStat.language}</h5>
                                                <div className="flex md:items-baseline items-end flex-col">
                                                    <span className="font-bold mr-1">
                                                        {languageStat.projectCount.toLocaleString()}
                                                    </span>
                                                    <span className="text-gray-500 text-xs md:text-sm">projects</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    {/* Improved Explore Button - border only shows on parent hover */}
                                    <span className="px-6 md:py-3 border   group-hover:text-gray-600 border-transparent w-full rounded-sm text-gray-400 transition-all text-xs font-medium flex justify-center items-center">
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