import githubClient from "./github-client.js";
import Dependency from "./model/dependency.js";
import Repo from "./model/repo.js";
import DependencyMapping from "./model/dependency-mapping.js"; // Added import statement
import RepoDependency from "./model/repo-dependency.js"; // Added import statement
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PackageJsonDependency {
    constructor({
        name,
        version,
        provider,
        versionText,
        versionOperator,
    }) {

        this.name = name;
        this.provider = provider;
        this.version = version;
        this.versionText = versionText;
        this.versionOperator = versionOperator;
    }
}
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
 * @returns {PackageJsonDependency[]}
 */
const parseDependenciesFromPackageJson = (packageJson) => {



    const dependencies = packageJson.dependencies ?? {};
    const devDependencies = packageJson.devDependencies ?? {};
    const peerDependencies = packageJson.peerDependencies ?? {};

    const allDependencies = {
        ...dependencies,
        ...devDependencies,
        ...peerDependencies
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
 * @param {number?} count 
 * @returns {Promise<Repo[]>}
 */
const getDependenciesToProcess = async (count = 10) => {
    const repos = await Repo.getForProcessing({
        languages: ['JavaScript', 'TypeScript'],
        count
    });

    return repos;
}
/**
 * 
 * @param {Repo} repo 
 */
const processRepoDependencies = async (repo) => {
    const packageJsons = await githubClient.getPackageJson(repo.owner, repo.name);
    if (!packageJsons || packageJsons.length === 0) {
        await Repo.update(repo.id, { processible: false });
        return;
    }
    for (const packageJson of packageJsons) {
        // do not process package json if path contains sample, test, example
        if (packageJson.path.match(/(sample|test|example)/i)) {
            continue;
        }
        const dependencies = parseDependenciesFromPackageJson(packageJson.content);

        const repoDependency = new RepoDependency({
            id: uuidv4(),
            repoId: repo.id,
            path: packageJson.path,
            commitId: undefined,
            insertedAt: new Date(),
        });
        const depdendencyMappings = [];

        for (const dep of dependencies) {
            // Check if dependency already exists
            let dependency = await Dependency.firstByNameAndProvider(dep.name, dep.provider);
            if (!dependency) {
                dependency = await Dependency.create({
                    name: dep.name,
                    provider: dep.provider
                });
            }
            depdendencyMappings.push(new DependencyMapping({
                repoId: repo.id,
                repoDependencyId: repoDependency.id,
                dependencyId: dependency.id,
                versionOperator: dep.versionOperator,
                version: dep.version,
                versionText: dep.versionText
            }));

        }

        await prisma.$transaction(async (tx) => {
            await tx.repoDependency.create({
                data: repoDependency
            });
            await Promise.all(depdendencyMappings.map(dm => tx.dependencyMapping.create({
                data: dm
            })));
            await Repo.update(repo.id, {
                packageProcessedAt: new Date()
            });
        });
    }
}

const parseJavaScriptDependenciesTask = async () => {
    while (true) {
        const repos = await getDependenciesToProcess(50);
        if (repos.length === 0) {
            break;
        }
        for (const repo of repos) {
            try {
                await processRepoDependencies(repo);
            }
            catch (e) {
                if (error instanceof RateLimitError) {
                    const rateLimitResetTime = error.rateLimitting.rateLimitReset;
                    const remainingTimeInMilliseconds = rateLimitResetTime.getTime() - Date.now();
                    await sleep(remainingTimeInMilliseconds);
                }
                else {
                    console.error(e);
                }
            }
        }
    }
}


export {
    RepoDependency,
    getDependenciesToProcess,
    parseDependenciesFromPackageJson,
    processRepoDependencies,
    parseJavaScriptDependenciesTask,

}