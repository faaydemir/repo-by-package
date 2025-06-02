import { RateLimitError } from './github-client.js';
import Dependency from './model/dependency.js';
import Repo from './model/repo.js';
import RepoDependency from './model/repo-dependency.js';
import Language from './languages.js';
import { parseTSJSDependencies } from './dependency-parser/js-ts-dependency-parser.js';
import { parsePythonDependencies } from './dependency-parser/python-dependency-parser.js';
import { REPO_CRAWL_TASK_RUN_INTERVAL, REPO_REPROCESS_INTERVAL_DAYS } from './constants.js';
import sleep from './sleep.js';
import prisma from './prisma.js';
import DependencyParseTaskRun from './model/dependency-parse-task-run.js';
import { parseGoDependencies } from './dependency-parser/go-dependency-parser.js';
import { parseJavaDependencies as parseJavaKotlinDependencies } from './dependency-parser/java-kotlin-dependency-parser.js';
import { parseRubyDependencies } from './dependency-parser/ruby-dependency-parser.js';
import { parseCSharpDependencies } from './dependency-parser/csharp-dependency-parser.js';
import { parseRustDependencies } from './dependency-parser/rust-dependency-parser.js';
import { RepoDependencyList } from './repo-dependency-list.js';
import DependencyMapping from './model/dependency-mapping.js';
const REPO_TAKE_COUNT = 10;
const PARSER_WORKER_COUNT = 5;
class ParserMapping {
	/**
	 * @param {string | string[]} language
	 * @param {(repo: Repo) => Promise<RepoDependencyList>} parserFunction
	 */
	constructor(languages, parserFunction) {
		if (!languages || (Array.isArray(languages) && languages.length === 0)) {
			throw new Error('languages are required');
		}
		if (!parserFunction) throw new Error('parserFunction is required');
		this.languages = Array.isArray(languages) ? languages : [languages];
		this.parser = parserFunction;
	}
}

class DependencyParser {
	/**
	 * @param {ParserMapping[]} parserMappings
	 * @param {number} [workerCount=10]
	 * @param {number} [queueLimit=5]
	 */
	constructor(parserMappings, workerCount = 10, queueLimit = 5) {
		if (!parserMappings || !Array.isArray(parserMappings)) {
			throw new Error('parserMappings is required and should be an array');
		}
		this.parserMappings = parserMappings;
		this.workerCount = workerCount;
		this.queueLimit = queueLimit;
		this.queue = [];
		this.isRunning = false;
	}

	async start() {
		this._initWorkers();
		await this._startWorkers();
	}

	async getCapacity() {
		return this.queueLimit - this.queue.length;
	}

	stop() {
		this.isRunning = false;
	}
	_initWorkers() {
		if (this.isRunning) return;
		this.workers = Array.from({ length: this.workerCount }).map((_, i) => this._createWorker(i));
	}
	_createWorker(workerId) {
		const workerMethod = async () => {
			console.log(`${new Date()} - Worker ${workerId} started`);
			while (this.isRunning) {
				try {
					const repo = this.queue.shift(); // Atomic operation

					if (!repo) {
						await sleep(1000);
						continue;
					}
					await this._parseAndSaveDependencies(repo);
				} catch (error) {
					console.error(error);
				}
			}
		};
		return workerMethod;
	}

	async _startWorkers() {
		if (this.isRunning) return;
		this.isRunning = true;
		await Promise.all(this.workers.map((worker) => worker()));
	}
	/**
	 * @param {Repo} repo
	 * @returns
	 */
	tryEnqueue(repo) {
		if (this.queue.length >= this.queueLimit || !this.isRunning) return false;
		this.queue.push(repo);
		return true;
	}
	/**
	 * @param {Repo} repo
	 * @returns {ParserMapping[]}
	 */
	_getParsersForRepo(repo) {
		const applicableParsers = [];
		const repoLanguages = new Set([repo.language, ...(repo.languages || [])].filter(Boolean));
		for (const mapping of this.parserMappings) {
			for (const lang of mapping.languages) {
				if (repoLanguages.has(lang)) {
					applicableParsers.push(mapping);
					break;
				}
			}
		}
		return applicableParsers;
	}

	async _parseAndSaveDependencies(repo) {
		try {
			const dependencies = [];
			const parsers = this._getParsersForRepo(repo);
			const maxRetries = 3;
			let hasParsableDependencies = false;

			for (const parserMapping of parsers) {
				let tryCount = 0;
				let retry = false;
				const languages = [...parserMapping.languages].join(', ');
				while (tryCount < maxRetries) {
					tryCount++;

					try {
						const repoDependencyList = await parserMapping.parser(repo);
						if (repoDependencyList?.projects?.length > 0) hasParsableDependencies = true;
						dependencies.push(repoDependencyList);
						console.log(
							`${new Date()} - Processing ${repo.fullName} | ${languages} completed (${tryCount}). Found ${
								repoDependencyList?.projects?.length || 0
							} projects`,
						);
					} catch (error) {
						console.error(
							`${new Date()} - Processing ${repo.fullName} | ${languages} failed (${tryCount}). Error: ${
								error.message
							}`,
						);
						if (error instanceof RateLimitError) {
							retry = true;
							await sleep(error.rateLimit.getRamaningTimeAsMs());
						}
					}

					if (!retry) break; // retry only for ratelimit error
				}
			}

			await this._clearRepoDependencies(repo.id);

			for (const repoDependencyList of dependencies) {
				for (const project of repoDependencyList.projects) {
					console.log(`${new Date()} - Saving ${repoDependencyList.id} | ${project.packageProvider} | ${project.path}`);
				}
			}

			for (const repoDependencyList of dependencies) {
				await this._saveRepoDependencyList(repoDependencyList);
			}

			await Repo.update(repo.id, { packageProcessedAt: new Date(), hasParsableDependencies });
		} catch (error) {
			console.error(`${new Date()} - Error processing repo ${repo.id} | ${repo.fullName}: ${error.message}`);
		}
	}
	async _clearRepoDependencies(repoId) {
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
	}

	/**
	 * @param {RepoDependencyList} repoDependencyList
	 */
	async _saveRepoDependencyList(repoDependencyList) {
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
	}
}

/**
 * @param {DependencyParser} dependencyParser
 */
const processRepos = async (dependencyParser, fetchRepo, taskRun) => {
	do {
		const repos = await fetchRepo(taskRun.idCursor);
		if (repos.length === 0) break;

		for (const repo of repos) {
			while (!dependencyParser.tryEnqueue(repo)) {
				await sleep(2000); // Wait for a second before trying again
			}
		}
		await taskRun.updateRun(repos[repos.length - 1].id);
	} while (true);
	await taskRun.completed();
};

const parseDependenciesTask = async () => {
	const parser = new DependencyParser(
		[
			new ParserMapping(Language.Rust, parseRustDependencies),
			new ParserMapping([Language.Kotlin, Language.Java], parseJavaKotlinDependencies),
			new ParserMapping(Language.Ruby, parseRubyDependencies),
			new ParserMapping(Language.Go, parseGoDependencies),
			new ParserMapping([Language.Vue, Language.JavaScript, Language.TypeScript], parseTSJSDependencies),
			new ParserMapping(Language.Python, parsePythonDependencies),
			new ParserMapping(Language.CSharp, parseCSharpDependencies),
		],
		PARSER_WORKER_COUNT,
	);
	parser.start();
	while (true) {
		try {
			await processRepos(
				parser,
				async (idCursor) => await Repo.getForProcessing({ idCursor, count: REPO_TAKE_COUNT }),
				await DependencyParseTaskRun.getOrCreateByKey('process-new-repo-dependencies'),
			);
			const maxDate = new Date(Date.now() - REPO_REPROCESS_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
			await processRepos(
				parser,
				async (idCursor) => await Repo.getReposToReprocess({ idCursor, count: REPO_TAKE_COUNT, maxDate }),
				await DependencyParseTaskRun.getOrCreateByKey('reprocess-repo-dependencies'),
			);
			await sleep(REPO_CRAWL_TASK_RUN_INTERVAL);
		} catch (error) {
			console.error(error);
			await sleep(1000 * 60 * 1);
		}
	}
};

export default parseDependenciesTask;
