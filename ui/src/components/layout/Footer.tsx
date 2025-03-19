'use client';

import Link from 'next/link';
import { TechIcon } from '../common/TechIcon';

const Footer = () => {
	return (
		<footer className="mx-auto flex flex-row items-center justify-center py-2 md:max-w-7xl  md:px-6 md:justify-end">
			<Link
				href={'https://github.com/faaydemir/repo-by-package'}
				className="h-full1items-center ml-0 flex gap-1 px-2 text-sm font-semibold text-gray-600 md:px-1"
				target="_blank"
			>
				<TechIcon tech="github" size="xs" showText={false} />
				Source
			</Link>
		</footer>
	);
};

export default Footer;
