//TODO: make this dynamic
const appInfo = {
	name: 'Repo By Package',
	description: 'Browse github repositories by packages',
	icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.svg`,
	favicon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.png`,
};
const supportedProviders = ['npm', 'pypi', 'go', 'nuget', 'RubyGems', 'Maven', 'cargo'];

export { appInfo, supportedProviders };
