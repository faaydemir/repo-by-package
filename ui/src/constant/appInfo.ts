

const appInfo = {
    name: "Repo By Package",
    description: "Browse github repositories by packages",
    icon: "/repo-by-package/favicon.svg",
    favicon: "/repo-by-package/favicon.svg",
    supportedProviders: [
        {
            languages: [
                {
                    name: 'TypeScript',
                    icon: '/repo-by-package/typescript.svg'
                },
                {
                    name: 'JavaScript',
                    icon: '/repo-by-package/javascript.svg'
                }
            ],
            provider: {
                name: 'npm',
                icon: '/repo-by-package/npm.svg'
            }
        }
    ]
}

export default appInfo;