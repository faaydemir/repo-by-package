import Home from '@/components/home/Home.page';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import appInfo from '@/constant/appInfo';

export const metadata: Metadata = {
	title: appInfo.name,
	description: appInfo.description,
};

export default function Page() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Home />
		</Suspense>
	);
}
