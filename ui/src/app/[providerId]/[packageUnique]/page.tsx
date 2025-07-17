import Home from '@/components/home/Home.page';
import client from '@/client';
import React from 'react';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { getIconPath } from '@/components/common/TechIcon';

export const revalidate = 86400;

export const generateStaticParams = async () => {
	const params: { providerId: string; packageUnique: string }[] = [];

	const providerStats = await client.getProviderStats();
	for (const provider of providerStats) {
		for (const dependency of provider.topDependencies) {
			if (!dependency.unique) continue;
			params.push({ providerId: provider.name, packageUnique: dependency.unique });
		}
	}

	return params;
};

type Props = {
	params: Promise<{ providerId: string; packageUnique: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { providerId, packageUnique } = await params;
	const imageUrl = getIconPath(packageUnique);
	const pkg = await client.getPackageByUnique(packageUnique, providerId);
	const packageName = pkg ? pkg.name : packageUnique;

	const title = `${packageName} | ${providerId} | Repo By Package`;
	const description = `Browse ${packageName} open source project, real-world applications.`;
	const url = `https://repo-by-package.com/${providerId}/${packageUnique}`;

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
	const { providerId, packageUnique } = await params;

	const pkg = await client.getPackageByUnique(packageUnique, providerId);
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
