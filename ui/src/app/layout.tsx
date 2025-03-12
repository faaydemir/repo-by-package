import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import appInfo from '@/constant/appInfo';

const inter = Inter({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-inter',
});

export const metadata: Metadata = {
	title: appInfo.name,
	description: appInfo.description,
	icons: appInfo.favicon,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={inter.variable}>
			<body className="min-h-screen bg-gray-50 font-sans antialiased">
				<Header />
				<main className="mx-auto max-w-7xl">{children}</main>
			</body>
		</html>
	);
}
