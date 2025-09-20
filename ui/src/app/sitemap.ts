import { MetadataRoute } from 'next';
import { supportedProviders } from '@/constant/appInfo';
import client from '@/client';

export const dynamic = 'force-static';
export const revalidate = 604800; // Revalidate every 7 days

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

	const routes: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1,
		},
		{
			url: `${baseUrl}/sitemap`,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.3,
		},
	];

	// Add provider pages
	supportedProviders.forEach((provider) => {
		routes.push({
			url: `${baseUrl}/${provider}`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.8,
		});
	});

	// Add top package pages from provider stats
	try {
		const providerStats = await client.getProviderStats();

		providerStats.forEach((provider) => {
			// Add top 10 packages for each provider to sitemap
			provider.topDependencies.slice(0, 10).forEach((dependency) => {
				routes.push({
					url: `${baseUrl}/${provider.name}/${encodeURIComponent(dependency.unique)}`,
					lastModified: new Date(),
					changeFrequency: 'weekly',
					priority: 0.6,
				});
			});
		});
	} catch (error) {
		console.error('Error fetching provider stats for sitemap:', error);
	}

	return routes;
}
