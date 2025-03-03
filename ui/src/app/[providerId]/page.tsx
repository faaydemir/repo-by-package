
import Home from '@/components/home/Home.page';
import appInfo from '@/constant/appInfo';
import React from 'react';
import { Suspense } from 'react';

export const generateStaticParams = async () => {
    return appInfo.supportedProviders.map(providerId => ({ providerId }));
}

type Props = {
    params: Promise<{ providerId: string }>
}

export default async function ProviderId({
    params,
}: Props) {
    const { providerId } = await params;
    return (
        <Suspense>
            <Home providerId={providerId} />
        </Suspense>
    );
}