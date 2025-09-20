import Home from '@/components/home/Home.page';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import client from '@/client';
import { appInfo } from '@/constant/appInfo';

export const dynamic = 'force-static';
// Revalidate every 24 hours
export const revalidate = 86400;

export const metadata: Metadata = {
	title: appInfo.name,
	description: appInfo.description,
	keywords: [
		'GitHub repositories',
		'package dependencies',
		'real-world applications',
		'npm',
		'pypi',
		'maven',
		'nuget',
		'cargo',
		'ruby gems',
		'go modules',
	],
	authors: [{ name: 'Repo By Package' }],
	creator: 'Repo By Package',
	publisher: 'Repo By Package',
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: process.env.NEXT_PUBLIC_BASE_URL,
		title: appInfo.name,
		description: appInfo.description,
		siteName: 'Repo By Package',
		images: [
			{
				url: '/favicon.png',
				width: 512,
				height: 512,
				alt: 'Repo By Package - Browse GitHub repositories by packages',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: appInfo.name,
		description: appInfo.description,
		creator: '@repo_by_package',
		images: ['/favicon.png'],
	},
	alternates: {
		canonical: process.env.NEXT_PUBLIC_BASE_URL,
	},
	category: 'technology',
};

export default async function Page() {
	const providerStats = await client.getProviderStats();
	const { packages } = await client.searchPackages({});
	const staticProps = {
		pageInfo: {
			title: appInfo.name,
			description: appInfo.description,
		},
		packages,
		providerStats: providerStats,
	};

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Home staticProps={staticProps} />
		</Suspense>
	);
}
