import githubClient, { RateLimitError } from "./github-client.js";
import Dependency from "./model/dependency.js";
import Repo from "./model/repo.js";
import DependencyMapping from "./model/dependency-mapping.js";
import RepoDependency from "./model/repo-dependency.js";
import { PrismaClient } from '@prisma/client';
import { RepoPackages } from "./repo-parse.js";
import supportedLanguages from "./supported-languages.js";
import { processTSJSDependencies } from "./js-ts-dependency-parser.js";

const prisma = new PrismaClient();


/**
 * @param {number?} idCursor
 * @param {number?} count 
 * @returns {Promise<Repo[]>}
 */
const getDependenciesToProcess = async (idCursor = 0, count = 10) => {
    const repos = await Repo.getForProcessing({
        // languages: ['JavaScript', 'TypeScript'],
        count,
        idCursor
    });

    return repos;
}

//TODO: limit the number items in dependencyCache mode do dependency model
const dependencyCache = {};

/**@returns {Promise<Dependency>} */
const getOrCreateDependency = async (name, provider) => {
    const key = `${name}__${provider}`;
    if (!dependencyCache[key]) {
        let dependency = await Dependency.firstByNameAndProvider(name, provider);
        if (!dependency) {
            dependency = await Dependency.create({
                name,
                provider
            });
        }
        dependencyCache[key] = dependency;
    }
    return dependencyCache[key];
}


const repoDependencyProcessorByLanguage = {
    'JavaScript': processTSJSDependencies,
    'TypeScript': processTSJSDependencies
}
/**
 * 
 * @param {*} language 
 * @param {(repo: Repo) => Promise<RepoDependencyMapping>} processor
 */

const setLanguageRepoProcessor = (language, processor) => {
    repoDependencyProcessorByLanguage[language] = processor;
}
const getLanguageRepoProcessor = (language) => {
    return repoDependencyProcessorByLanguage[language];
}

/**
 * 
 * @param {Repository} repo 
 * @returns {Promise<RepoPackages>}
 */
const processDependencies = async (repo) => {
    const processor = getLanguageRepoProcessor(repo.language);
    console.log(`${new Date()} - Processing repo ${repo.fullName} - ${repo.language}`);
    if (processor) {
        await processor(repo);
    }
}

const clearRepoDependencies = async (repoId) => {

    const repoDependencies = await RepoDependency.getAllByRepoId(repoId);
    if (!repoDependencies || repoDependencies.length === 0) {
        return;
    }

    await prisma.$transaction(async (tx) => {
        await tx.dependencyMapping.deleteMany({
            where: {
                repoDependencyId: {
                    in: repoDependencies.map(rd => rd.id)
                }
            }
        });
        await tx.repoDependency.deleteMany({
            where: {
                id: {
                    in: repoDependencies.map(rd => rd.id)
                }
            }
        });
    },
        {
            maxWait: 60000, // 5 seconds max wait to connect to prisma
            timeout: 60000, // 20 seconds
        }
    );
}

const parseDependenciesTask = async () => {
    setLanguageRepoProcessor(supportedLanguages.JavaScript, processTSJSDependencies);
    setLanguageRepoProcessor(supportedLanguages.TypeScript, processTSJSDependencies);

    /* TODO:
    - check repo last processed time if it is less than 7 days, skip
    - if repo has has dependency mapping skip or delete
    - create a generic dependency map response
    */
    //TODO: Save cursor
    let idCursor = 0;
    while (true) {
        const repos = await getDependenciesToProcess(idCursor, 50);
        if (repos.length === 0) {
            await sleep(REPO_CRAWL_TASK_RUN_INTERVAL);
            idCursor = 0;
            continue;
        }
        idCursor = repos[repos.length - 1].id;
        for (const repo of repos) {
            try {
                var repoPakages = await processDependencies(repo);

                // clear RepoDependency and DependencyMapping 
                await clearRepoDependencies(repo.id);

                if (!repoPakages) {
                    await Repo.update(repoPakages.id, { processible: false });
                    continue;
                }

                for (const project of repoPakages.projects) {
                    const repoDependency = new RepoDependency({
                        repoId: repoPakages.id,
                        path: project.path,
                        commitId: project.commitId,
                        insertedAt: new Date(),
                        packageProvider: project.packageProvider
                    });

                    const depdendencyMappings = await project.packages.map(async dep => {
                        let dependency = await getOrCreateDependency(dep.name, dep.provider);

                        return new DependencyMapping({
                            repoId: repoPakages.id,
                            dependencyId: dependency.id,
                            versionOperator: dep.versionOperator,
                            version: dep.version,
                            versionText: dep.versionText
                        });
                    });

                    await prisma.$transaction(async (tx) => {
                        const { id } = await tx.repoDependency.create({
                            data: repoDependency
                        });

                        await Promise.all(depdendencyMappings.map(dm => tx.dependencyMapping.create({
                            data: {
                                ...dm,
                                repoDependencyId: id
                            }
                        })));
                        await Repo.update(repo.id, {
                            packageProcessedAt: new Date()
                        });
                    },
                        {
                            maxWait: 60000, // 5 seconds max wait to connect to prisma
                            timeout: 60000, // 20 seconds
                        }
                    );
                }
            }
            catch (error) {
                if (error instanceof RateLimitError) {
                    const rateLimitResetTime = error.rateLimitting.rateLimitReset;
                    const remainingTimeInMilliseconds = rateLimitResetTime.getTime() - Date.now();
                    await sleep(remainingTimeInMilliseconds);
                }
                else {
                    console.error(error);
                }
            }
        }
    }
}


export {
    getDependenciesToProcess,
    parseDependenciesTask,
}