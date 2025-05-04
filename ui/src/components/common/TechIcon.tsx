import React from 'react';

const SUPPORTED_TECHNOLOGIES = [
	'javascript',
	'go',
	'rubygems',
	'maven',
	'typescript',
	'python',
	'c#',
	'nuget',
	'pypi',
	'npm',
	'github',
	'java',
	'kotlin',
	'ruby',
] as const;
type SupportedTechnology = (typeof SUPPORTED_TECHNOLOGIES)[number];

type IconSize = 'xs' | 'sm' | 'md' | 'lg';

interface TechIconProps {
	tech: string;
	size?: IconSize;
	showText?: boolean;
}

const getSizeClass = (size: IconSize): string => {
	switch (size) {
		case 'xs':
			return 'w-5';
		case 'sm':
			return 'w-7';
		case 'lg':
			return 'w-16';
		default:
			return 'w-11';
	}
};

const getIconPath = (tech: string): string => {
	let normalizedLang = tech.toLowerCase();
	if (SUPPORTED_TECHNOLOGIES.includes(normalizedLang as SupportedTechnology)) {
		if (normalizedLang == 'c#') normalizedLang = 'csharp';
		return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${normalizedLang}.svg`;
	}
	return '';
};

export const TechIcon: React.FC<TechIconProps> = ({ tech, size = 'md', showText = false }) => {
	const iconPath = getIconPath(tech);
	const sizeClass = getSizeClass(size);

	if (!iconPath) {
		return <span>❓</span>;
	}

	return (
		<div className="inline-flex items-center gap-2 rounded-sm">
			<img src={iconPath} alt={`${tech} icon`} className={`inline-block object-cover ${sizeClass}`} />
			{showText && <span className="display-none hidden text-sm font-medium md:inline">{tech}</span>}
		</div>
	);
};
