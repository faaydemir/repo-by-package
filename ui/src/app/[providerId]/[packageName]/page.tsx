import Home from '@/components/home/Home.page';
import client from '@/client';
import React from 'react';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { getIconPath } from '@/components/common/TechIcon';

export const generateStaticParams = async () => {
	const params: { providerId: string; packageName: string }[] = [];

	const providerStats = await client.getProviderStats();
	for (const provider of providerStats) {
		for (const dependency of provider.topDependencies) {
			params.push({ providerId: provider.name, packageName: dependency.name });
		}
	}

	return params;
};

type Props = {
	params: Promise<{ providerId: string; packageName: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { providerId, packageName } = await params;
	const imageUrl = getIconPath(packageName);

	const title = `${packageName} | ${providerId} | Repo By Package`;
	const description = `Browse ${packageName} open source project, real-world applications.`;
	const url = `https://repo-by-package.com/${providerId}/${packageName}`;

	return {
		title,
		description,
		keywords: [
			`${packageName}`,
			`${packageName} open source repositories`,
			`${packageName} real-world applications`,
			`${providerId}`,
		],
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
					url: imageUrl,
					width: 512,
					height: 512,
					alt: `${packageName} package repositories`,
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			creator: '@repo_by_package',
			images: [imageUrl],
		},
		alternates: {
			canonical: url,
		},
	};
}

export default async function ProviderPackagePage({ params }: Props) {
	const { providerId, packageName } = await params;

	let pkg = null;

	//TODO: create db function to get package by name
	const searchResponse = await client.searchPackages({
		query: packageName,
		provider: providerId,
		take: 1,
	});

	if (searchResponse.packages.length > 0) {
		const p = searchResponse.packages[0];
		if (p.name.toLowerCase() === packageName.toLowerCase()) {
			pkg = p;
		}
	}
	if (!pkg) {
		return {
			notFound: true,
		};
	}
	const repositories = await client.searchRepositories({
		packageIds: pkg ? [pkg.id] : [],
		pagination: {
			page: 1,
			perPage: 30,
		},
	});
	const staticProps = {
		provider: providerId,
		package: pkg,
		repositories: repositories,
	};

	return (
		<Suspense>
			<Home staticProps={staticProps} />
		</Suspense>
	);
}
