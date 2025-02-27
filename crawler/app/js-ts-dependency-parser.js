import githubClient from "./github-client.js";
import { RepoPackages } from "./repo-parse.js";


const parseVersionText = (version) => {
    if (!version || typeof version !== 'string') {
        return { version: undefined, operator: undefined };
    }

    // Handle URL, file, and latest cases
    if (version.startsWith('http') || version.startsWith('file:') || version === 'latest') {
        return { version, operator: undefined };
    }

    // Regex for capturing version patterns and operators
    const regex = /([<>]=?|~|\^|x)?\s*([0-9]+(?:\.[0-9]+(?:\.[0-9]+)?)?|x)/g;

    let match;
    let maxVersion = null;
    let operator = undefined;

    while ((match = regex.exec(version)) !== null) {
        const [_, op, ver] = match;

        if (!maxVersion || compareVersions(ver, maxVersion) > 0) {
            maxVersion = ver;
            operator = op || undefined;
        }
    }

    return { version: maxVersion || undefined, operator };
};

const compareVersions = (v1, v2) => {
    if (v1 === 'x' || v2 === 'x') return 0; // Ignore wildcard comparisons

    const parts1 = v1.split('.').map(n => parseInt(n) || 0);
    const parts2 = v2.split('.').map(n => parseInt(n) || 0);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 !== num2) return num1 - num2;
    }
    return 0;
};


/**
 * 
 * @param {*} packageJson 
 * @returns {Package[]}
 */
const parseDependenciesFromPackageJson = (packageJson) => {

    const dependencies = packageJson.dependencies ?? {};
    const devDependencies = packageJson.devDependencies ?? {};

    const allDependencies = {
        ...dependencies,
        // ...devDependencies,
    };

    return Object.entries(allDependencies).map(([name, version]) => {
        const provider = 'npm';
        const parsedVersion = parseVersionText(version);
        return new PackageJsonDependency({
            name,
            provider,
            versionText: version,
            version: parsedVersion.version,
            versionOperator: parsedVersion.operator
        });
    });
}

/**
 * 
 * @param {*} repo 
 * @returns {Promise<RepoPackages>}
 */
export const processTSJSDependencies = async (repo) => {
    const packageJsons = await githubClient.getPackageJson(repo.owner, repo.name);
    if (!packageJsons || packageJsons.length === 0) {
        return undefined;
    }
    const repoPackages = new RepoPackages({
        id: repo.id
    });

    for (const packageJson of packageJsons) {
        // do not process package json if path contains sample, test, example
        if (packageJson.path.match(/(sample|test|example)/i)) {
            continue;
        }
        const dependencies = parseDependenciesFromPackageJson(packageJson.content);

        const project = new Project({
            commitId: undefined,
            path: packageJson.path,
            packageProvider: 'npm'
        });

        for (const dep of dependencies) {

            project.packages.push(new
                Package({
                    name: dep.name,
                    version: dep.version,
                    versionOperator: dep.versionOperator,
                    versionText: dep.versionText,
                    minVersion: dep.minVersion,
                    maxVersion: dep.maxVersion
                }));

        }
    }
    return repoPackages;
}