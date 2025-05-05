import { RateLimitError } from './github-client.js';
import Dependency from './model/dependency.js';
import Repo from './model/repo.js';
import DependencyMapping from './model/dependency-mapping.js';
import RepoDependency from './model/repo-dependency.js';
import { UnprocessableRepoError } from './repo-dependency-list.js';
import Language from './languages.js';
import { parseTSJSDependencies } from './dependency-parser/js-ts-dependency-parser.js';
import { parsePythonDependencies } from './dependency-parser/python-dependency-parser.js';
import { parseCSharpDependencies } from './dependency-parser/csharp-dependency-parser.js';
import { REPO_CRAWL_TASK_RUN_INTERVAL, REPO_REPROCESS_INTERVAL_DAYS } from './constants.js';
import sleep from './sleep.js';
import prisma from './prisma.js';
import DependencyParseTaskRun from './model/dependency-parse-task-run.js';
import { parseGoDependencies } from './dependency-parser/go-dependency-parser.js';
import { parseJavaDependencies as parseJavaKotlinDependencies } from './dependency-parser/java-kotlin-dependency-parser.js';
import { parseRubyDependencies } from './dependency-parser/ruby-dependency-parser.js';
import { parseRustDependencies } from './dependency-parser/rust-dependency-parser.js';

const REPO_TAKE_COUNT = 5;

class DepedendencyParser {
	static parsers = [];

	/**
	 * @param {string | string[]} language
	 * @param {(repo: Repo) => Promise<RepoDependencyMapping>} parser
	 */
	constructor(languages, parser) {
		if (!languages) throw new Error('language is required');
		if (!parser) throw new Error('parser is required');
		if (typeof languages === 'string') {
			languages = [languages];
		}
		this.languages = new Set(languages);
		this.parser = parser;
	}

	/**
	 * @param {Repo} repo
	 * @returns {bool}
	 */
	canParseRepo(repo) {
		const allLanguages = [repo.language, ...repo.languages];
		for (const lang of allLanguages) {
			if (this.languages.has(lang)) {
				return true;
			}
		}
		return false;
	}
	/**
	 *
	 * @param {Repo} repo
	 * @returns {Promise<RepoDependencyList>}
	 */
	async parseDependencies(repo) {
		if (!this.canParseRepo(repo)) {
			return null;
		}
		return await this.parser(repo);
	}

	static addParser(languages, parser) {
		if (!languages) throw new Error('language is required');
		if (!parser) throw new Error('parser is required');
		const languageParser = new DepedendencyParser(languages, parser);
		this.parsers.push(languageParser);
	}
	/**
	 * @param {Repo} repo
	 * @returns {DepedendencyParser[]}
	 */
	static getParsersForRepo(repo) {
		return this.parsers.filter((p) => p.canParseRepo(repo));
	}
}

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
		if (project.dependencies.length === 0) continue;

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
	const dependencies = [];
	const parsers = DepedendencyParser.getParsersForRepo(repo);
	for (const parser of parsers) {
		const languages = [...parser.languages].join(', ');
		try {
			console.log(`${new Date()} - Processing repo ${repo.fullName} - ${languages} `);
			const repoDependencyList = await parser.parseDependencies(repo);
			dependencies.push(repoDependencyList);
		} catch (error) {
			console.error(`${new Date()} - Processing repo ${repo.fullName} - ${languages} - Error: ${error.message}`);
			if (error instanceof UnprocessableRepoError) {
				//TODO: do not try parse dep for language
			} else if (error instanceof RateLimitError) {
				const rateLimitResetTime = error.rateLimit.rateLimitReset;
				const remainingTimeInMilliseconds = rateLimitResetTime.getTime() - Date.now();
				await sleep(remainingTimeInMilliseconds);
			}
		}
	}

	await clearRepoDependencies(repo.id);

	if (dependencies.length > 0) {
		for (const repoDependencyList of dependencies) {
			await saveRepoDependencyList(repoDependencyList);
		}
	}
	await Repo.update(repo.id, { packageProcessedAt: new Date() });
};

const processNewRepos = async () => {
	let taskRun = await DependencyParseTaskRun.getOrCreateByKey('process-new-repo-dependencies');
	do {
		const repos = await Repo.getForProcessing({
			idCursor: taskRun.idCursor,
			count: REPO_TAKE_COUNT,
		});
		if (repos.length === 0) break;
		for (const repo of repos) {
			try {
				await parseAndSaveDependencies(repo);
			} catch {}
		}
		await taskRun.updateRun(repos[repos.length - 1].id);
	} while (true);

	await taskRun.completed();
};

const reprocessOldRepos = async () => {
	let taskRun = await DependencyParseTaskRun.getOrCreateByKey('reprocess-repo-dependencies');
	do {
		const maxDateToProcess = new Date(Date.now() - REPO_REPROCESS_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
		const repos = await Repo.getReposToReprocess({
			maxDate: maxDateToProcess,
			idCursor: taskRun.idCursor,
			count: REPO_TAKE_COUNT,
		});
		if (repos.length === 0) break;
		for (const repo of repos) {
			try {
				await parseAndSaveDependencies(repo);
			} catch {}
		}
		await taskRun.updateRun(repos[repos.length - 1].id);
	} while (true);
	await taskRun.completed();
};

const parseDependenciesTask = async () => {
	DepedendencyParser.addParser(Language.Rust, parseRustDependencies);
	DepedendencyParser.addParser([Language.Kotlin, Language.Java], parseJavaKotlinDependencies);
	DepedendencyParser.addParser(Language.Ruby, parseRubyDependencies);
	DepedendencyParser.addParser(Language.Go, parseGoDependencies);
	DepedendencyParser.addParser([Language.Vue, Language.JavaScript, Language.TypeScript], parseTSJSDependencies);
	DepedendencyParser.addParser(Language.Python, parsePythonDependencies);
	DepedendencyParser.addParser(Language.CSharp, parseCSharpDependencies);

	while (true) {
		try {
			await processNewRepos();
			await reprocessOldRepos();
			await sleep(REPO_CRAWL_TASK_RUN_INTERVAL);
		} catch (error) {
			console.error(error);
			await sleep(1000 * 60 * 1);
		}
	}
};

export { reprocessOldRepos as reprocessRepos, processNewRepos as processUnprocessedRepos };
export default parseDependenciesTask;
