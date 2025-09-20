import client from '@/client';
import { getIconPath } from '@/components/common/TechIcon';
import Home from '@/components/home/Home.page';
import { supportedProviders } from '@/constant/appInfo';
import { Metadata } from 'next';
import React from 'react';
import { Suspense } from 'react';

export const generateStaticParams = async () => {
	return supportedProviders.map((providerId) => ({ providerId }));
};

type Props = {
	params: Promise<{ providerId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { providerId } = await params;

	const title = `${providerId} | Repo By Package`;
	const description = `Browse open source repositories that use packages from ${providerId}. Discover projects, dependencies, and usage patterns.`;
	const url = `https://repo-by-package.com/${providerId}`;

	return {
		title,
		description,
		keywords: [`${providerId}`, 'GitHub repositories', 'package dependencies', 'open source', 'code search'],
		authors: [{ name: 'Repo By Package' }],
		creator: 'Repo By Package',
		publisher: 'Repo By Package',
		openGraph: {
			type: 'website',
			locale: 'en_US',
			url,
			title,
			description,
			siteName: 'Repo By Package',
			images: [
				{
					url: getIconPath(providerId),
					alt: `${providerId} package repositories`,
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			creator: '@repo_by_package',
			images: [getIconPath(providerId)],
		},
		alternates: {
			canonical: url,
		},
	};
}

export default async function ProviderId({ params }: Props) {
	const { providerId } = await params;
	const { packages } = await client.searchPackages({
		provider: providerId,
	});
	const staticProps = {
		provider: providerId,
		packages,
		pageInfo: {
			title: `Browse ${providerId} Repositories`,
			description: `Browse GitHub repositories that use packages from ${providerId}`,
			image: getIconPath(providerId),
		},
	};
	return (
		<Suspense>
			<Home staticProps={staticProps} />
		</Suspense>
	);
}
