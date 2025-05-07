//TODO: make this dynamic
const appInfo = {
	name: 'Repo By Package',
	description: 'Browse github repositories by packages',
	icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.svg`,
	favicon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.png`,
	supportedProviders: ['npm', 'pypi', 'nuget', 'RubyGems', 'Maven', 'go','cargo'],
};

export default appInfo;
