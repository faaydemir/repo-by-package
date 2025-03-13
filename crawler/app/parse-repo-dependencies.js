import { RateLimitError } from './github-client.js';
import Dependency from './model/dependency.js';
import Repo from './model/repo.js';
import DependencyMapping from './model/dependency-mapping.js';
import RepoDependency from './model/repo-dependency.js';
import { UnprocessableRepoError } from './repo-dependency-list.js';
import supportedLanguages from './supported-languages.js';
import { parseTSJSDependencies } from './depdendency-parser/js-ts-dependency-parser.js';
import { parsePythonDependencies } from './depdendency-parser/python-dependency-parser.js';
import { parseCSharpDependencies } from './depdendency-parser/csharp-dependency-parser.js';
import { REPO_CRAWL_TASK_RUN_INTERVAL, REPO_REPROCESS_INTERVAL_DAYS } from './constants.js';
import sleep from './sleep.js';
import prisma from './prisma.js';
import DependencyParseTaskRun from './model/dependency-parse-task-run.js';

const REPO_TAKE_COUNT = 10;

const repoDependencyProcessorByLanguage = {};
/**
 *
 * @param {*} language
 * @param {(repo: Repo) => Promise<RepoDependencyMapping>} processor
 */

const setLanguageRepoProcessor = (language, processor) => {
	repoDependencyProcessorByLanguage[language] = processor;
};
const getLanguageRepoProcessor = (language) => {
	return repoDependencyProcessorByLanguage[language];
};

/**
 * parse repo dependencies for a given language
 * @param {Repository} repo
 * @param {string} language
 * @returns {Promise<RepoDependencyList>}
 */
const parseDependencies = async (repo, language) => {
	const processor = getLanguageRepoProcessor(language);
	console.log(`${new Date()} - Processing repo ${repo.fullName} - ${language}`);
	if (processor) {
		return await processor(repo);
	}
};

const clearRepoDependencies = async (repoId) => {
	if (!repoId) throw new Error('repoId is required');

	const repoDependencies = await RepoDependency.getAllByRepoId(repoId);
	if (!repoDependencies || repoDependencies.length === 0) {
		return;
	}

	await prisma.$transaction(
		async (tx) => {
			await tx.dependencyMapping.deleteMany({
				where: {
					repoDependencyId: {
						in: repoDependencies.map((rd) => rd.id),
					},
				},
			});
			await tx.repoDependency.deleteMany({
				where: {
					id: {
						in: repoDependencies.map((rd) => rd.id),
					},
				},
			});
		},
		{ maxWait: 60000, timeout: 60000 },
	);
};

/**
 * @param {RepoDependencyList} repoDependencyList
 */
const saveRepoDependencyList = async (repoDependencyList) => {
	if (!repoDependencyList || !repoDependencyList.projects || !Array.isArray(repoDependencyList.projects)) {
		return;
	}

	for (const project of repoDependencyList.projects) {
		const repoDependency = new RepoDependency({
			repoId: repoDependencyList.id,
			path: project.path,
			commitId: project.commitId,
			insertedAt: new Date(),
			packageProvider: project.packageProvider,
		});

		//filter duplicate dependencies
		const uniqueDependencies = project.dependencies.filter(
			(dep, index, self) => index === self.findIndex((t) => t.name === dep.name && t.provider === dep.provider),
		);

		const depdendencyMappings = await Promise.all(
			uniqueDependencies.map(async (dep) => {
				let dependency = await Dependency.getOrCreateCached(dep.name, dep.provider);

				return new DependencyMapping({
					repoId: repoDependencyList.id,
					dependencyId: dependency.id,
					version: dep.version,
					minVersion: dep.minVersion,
					maxVersion: dep.maxVersion,
					versionText: dep.versionText,
				});
			}),
		);

		await prisma.$transaction(
			async (tx) => {
				const { id } = await tx.repoDependency.create({
					data: repoDependency,
				});

				for (const dm of depdendencyMappings) {
					dm.repoDependencyId = id;
				}

				await tx.dependencyMapping.createMany({
					data: depdendencyMappings, // Insert all at once
					skipDuplicates: true, // Avoid conflicts
				});
			},
			{ maxWait: 60000, timeout: 60000 },
		);
	}
};

/**
 * @param {Repo} repo
 * @returns
 */
const parseAndSaveDependencies = async (repo) => {
	await clearRepoDependencies(repo.id);
	// replace typescript with javascript to avoid duplicate processing
	const allLanguages = [repo.language, ...repo.languages].map((lang) =>
		lang === supportedLanguages.TypeScript ? supportedLanguages.JavaScript : lang,
	);
	const repoLanguages = [...new Set(allLanguages)];
	const processState = {};
	for (const language of repoLanguages) {
		try {
			if (Object.values(supportedLanguages).indexOf(language) === -1) {
				console.log(`${new Date()} - Processing repo ${repo.fullName} - ${language} - Not Supported`);
				continue;
			}
			var repoDependencyList = await parseDependencies(repo, language);
			await saveRepoDependencyList(repoDependencyList);
			processState[language] = true;
		} catch (error) {
			console.error(`${new Date()} - Processing repo ${repo.fullName} - ${language} - Error: ${error.message}`);
			if (error instanceof UnprocessableRepoError) {
				// await Repo.update(repo.id, { processible: false });
				processState[language] = false;
			} else if (error instanceof RateLimitError) {
				const rateLimitResetTime = error.rateLimitting.rateLimitReset;
				const remainingTimeInMilliseconds = rateLimitResetTime.getTime() - Date.now();
				await sleep(remainingTimeInMilliseconds);
			}
		}
	}
	await Repo.update(repo.id, { packageProcessedAt: new Date() });
};

const processUnprocessedRepos = async () => {
	let taskRun = await DependencyParseTaskRun.getOrCreateByKey('parse-new-repo-dependencies');
	do {
		const repos = await Repo.getForProcessing({
			idCursor: taskRun.idCursor,
			count: REPO_TAKE_COUNT,
		});
		if (repos.length === 0) break;
		for (const repo of repos) {
			await parseAndSaveDependencies(repo);
		}
		await taskRun.updateRun(repos[repos.length - 1].id);
	} while (true);

	await taskRun.completed();
};

const reprocessRepos = async () => {
	let taskRun = await DependencyParseTaskRun.getOrCreateByKey('reprocess-repo-dependencies');
	do {
		const minDateToProcess = new Date(Date.now() - REPO_REPROCESS_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
		let repos = await Repo.getReposToReprocess({
			minDate: minDateToProcess,
			idCursor: taskRun.idCursor,
			count: REPO_TAKE_COUNT,
		});
		if (repos.length === 0) break;
		for (const repo of repos) {
			await parseAndSaveDependencies(repo);
		}
		await taskRun.updateRun(repos[repos.length - 1].id);
	} while (true);
	await taskRun.completed();
};

const parseDependenciesTask = async () => {
	setLanguageRepoProcessor(supportedLanguages.JavaScript, parseTSJSDependencies);
	setLanguageRepoProcessor(supportedLanguages.TypeScript, parseTSJSDependencies);
	setLanguageRepoProcessor(supportedLanguages.Python, parsePythonDependencies);
	setLanguageRepoProcessor(supportedLanguages.CSharp, parseCSharpDependencies);

	while (true) {
		try {
			await processUnprocessedRepos();
			await reprocessRepos();
			await sleep(REPO_CRAWL_TASK_RUN_INTERVAL);
		} catch (error) {
			console.error(error);
			await sleep(1000 * 60 * 1);
		}
	}
};

export { reprocessRepos, processUnprocessedRepos };
export default parseDependenciesTask;
