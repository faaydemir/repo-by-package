
import React from 'react';
import appInfo from '../../constant/appInfo';

const Landing = () => {
    return (
        <div className="flex flex-col items-start justify-start space-y-12 px-12 py-12 ">
            <div className="flex items-center space-x-4">
                <img src={appInfo.favicon} alt={appInfo.name} className="w-16 h-16" />
                <div className="space-y-4 max-w-3xl mx-auto">
                    <h1 className="text-3xl text-gray-900">
                        {appInfo.name}
                    </h1>
                    <p className="text-xl text-gray-600">
                        {appInfo.description}
                    </p>
                </div>
            </div>

            {/* Supported Providers */}
            {/* <div className="flex flex-col items-start justify-start ml-4">
                {appInfo.supportedProviders.map((provider, index) => (
                    <div key={index} className="flex flex-row items-center justify-center gap-4">
                        <img src={provider.provider.icon} alt={provider.provider.name} className="h-8 mr-4" />
                        {
                            provider.languages.map((lang, index) => (
                                <img key={index} src={lang.icon} alt={lang.name} className="w-8 h-8" />
                            ))
                        }
                    </div>
                ))}
            </div> */}
        </div>
    );
};

export default Landing;