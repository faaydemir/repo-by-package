import { RateLimitError } from "./github-client.js";
import Dependency from "./model/dependency.js";
import Repo from "./model/repo.js";
import DependencyMapping from "./model/dependency-mapping.js";
import RepoDependency from "./model/repo-dependency.js";
import { PrismaClient } from '@prisma/client';
import { RepoDependencyList } from "./repo-parse.js";
import supportedLanguages from "./supported-languages.js";
import { processTSJSDependencies } from "./js-ts-dependency-parser.js";
import { REPO_REPROCESS_INTERVAL_DAYS } from "./constants.js";

const prisma = new PrismaClient();

const repoDependencyProcessorByLanguage = {}
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
 * @returns {Promise<RepoDependencyList>}
 */
const parseDependencies = async (repo) => {
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
        { maxWait: 60000, timeout: 60000 }
    );
}

/**
 * @param {RepoDependencyList} repoDependencyList 
 */
const saveRepoDependencyList = async (repoDependencyList) => {
    for (const project of repoDependencyList.projects) {
        const repoDependency = new RepoDependency({
            repoId: repoDependencyList.id,
            path: project.path,
            commitId: project.commitId,
            insertedAt: new Date(),
            packageProvider: project.packageProvider
        });

        const depdendencyMappings = await Promise.all(
            project.dependencies.map(async dep => {
                let dependency = await Dependency.getOrCreateCached(dep.name, dep.provider);

                return new DependencyMapping({
                    repoId: repoDependencyList.id,
                    dependencyId: dependency.id,
                    versionOperator: dep.versionOperator,
                    version: dep.version,
                    versionText: dep.versionText
                });
            })
        );

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
            await Repo.update(repoDependencyList.id, {
                packageProcessedAt: new Date()
            });
        },
            { maxWait: 60000, timeout: 60000 }
        );
    }
}

/**
 * @param {Repo} repo 
 * @returns 
 */
const parseAndSaveDependencies = async (repo) => {
    try {
        var repoDependencyList = await parseDependencies(repo);

        await clearRepoDependencies(repo.id);

        if (!repoDependencyList) {
            await Repo.update(repoDependencyList.id, { processible: false });
        }
        else {
            await saveRepoDependencyList(repoDependencyList);
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

const processUnprocessedRepos = async () => {
    let idCursor = 0;
    do {
        const repos = await Repo.getForProcessing({ count, idCursor });
        if (repos.length === 0) return;
        for (const repo of repos) {
            await parseAndSaveDependencies(repo);
        }
        idCursor = repos[repos.length - 1].id;
    }
    while (true);
}


const reprocessRepos = async () => {
    let idCursor = 0;
    do {
        const minDateToProcess = new Date(Date.now() - REPO_REPROCESS_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
        let repos = await Repo.getReposToReProcess(idCursor, minDateToProcess, 50);
        if (repos.length === 0) return;
        for (const repo of repos) {
            await parseAndSaveDependencies(repo);
        }
        idCursor = repos[repos.length - 1].id;
    }
    while (true);
}

const parseDependenciesTask = async () => {
    setLanguageRepoProcessor(supportedLanguages.JavaScript, processTSJSDependencies);
    setLanguageRepoProcessor(supportedLanguages.TypeScript, processTSJSDependencies);

    while (true) {
        try {
            await processUnprocessedRepos();
            await reprocessRepos();
            await sleep(REPO_CRAWL_TASK_RUN_INTERVAL);
        }
        catch (error) {
            console.error(error);
        }
    }
}


export {
    parseDependenciesTask,
    processUnprocessedRepos
}