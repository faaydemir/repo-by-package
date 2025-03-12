import { LEAST_START_COUNT_FOR_REPO } from './constants.js';
import githubClient, { RateLimitError, EndOfSeachError } from './github-client.js';
import RepoCrawTaskRun from './model/repo-craw-task-run.js';
import Repo from './model/repo.js';
import sleep from './sleep.js';
import supportedLanguages from './supported-languages.js';
const SEARCH_REPO_TAKE = 100;

async function crawlReposTask() {
	while (true) {
		for (const language of Object.values(supportedLanguages)) {
			try {
				const task_key = `crawl_repos_${language}_${LEAST_START_COUNT_FOR_REPO}`;

				let taskRun = await RepoCrawTaskRun.getByTaskKey(task_key);

				let starCursor = LEAST_START_COUNT_FOR_REPO - 1;
				let isCompleted = false;

				if (taskRun) {
					starCursor = taskRun.maxStars - 1;
					isCompleted = taskRun.isCompleted;
					const isADayPassedUntilLastRun = new Date() - taskRun.lastRunAt > 1000 * 60 * 60 * 24;
					if (isADayPassedUntilLastRun) {
						isCompleted = false;
						taskRun.maxStars = LEAST_START_COUNT_FOR_REPO - 1;
					}
				} else {
					taskRun = await RepoCrawTaskRun.create({
						taskKey: task_key,
						maxStars: starCursor,
					});
				}
				let page = 1;
				while (!isCompleted) {
					try {
						let maxStars = taskRun.maxStars;
						const response = await githubClient.searchReposByLanguage(language, SEARCH_REPO_TAKE, page, starCursor);
						page += 1;
						isCompleted = response.items.length < SEARCH_REPO_TAKE;

						for (const repo of response.items) {
							console.log(`${new Date()} - Saving repo ${repo.full_name} - ${repo.stargazers_count}`);
							if (repo.stargazers_count > maxStars) {
								maxStars = repo.stargazers_count;
							}

							const languageDetails = await githubClient.getRepoLanguages(repo.owner.login, repo.name);

							const repoProps = {
								githubId: repo.id,
								owner: repo.owner.login,
								name: repo.name,
								fullName: repo.full_name,
								url: repo.url,
								htmlUrl: repo.html_url,
								description: repo.description,
								createdAt: new Date(repo.created_at),
								updatedAt: new Date(repo.updated_at),
								pushedAt: new Date(repo.pushed_at),
								defaultBranch: repo.default_branch,
								stargazersCount: repo.stargazers_count,
								watchersCount: repo.watchers_count,
								forksCount: repo.forks_count,
								openIssuesCount: repo.open_issues_count,
								topics: repo.topics?.join(',') ?? '',
								license: repo.license,
								insertedAt: new Date(),
								language: repo.language,
								private: repo.private,
								languages: languageDetails.map((d) => d.language),
								languageDetails: languageDetails,
							};

							const existingRepo = await Repo.firstByGithubId(repo.id);
							if (existingRepo) {
								await Repo.update(existingRepo.id, repoProps);
							} else {
								await Repo.create(repoProps);
							}
						}

						taskRun = await RepoCrawTaskRun.update(taskRun.id, {
							maxStars: maxStars,
							lastRunAt: new Date(),
							isCompleted: isCompleted,
						});
					} catch (error) {
						if (error instanceof EndOfSeachError) {
							starCursor = taskRun.maxStars - 1;
							page = 1;
						} else if (error instanceof RateLimitError) {
							const rateLimitResetTime = error.rateLimitting.rateLimitReset;
							const remainingTimeInMilliseconds = rateLimitResetTime.getTime() - Date.now();
							console.error(`${new Date()} - Rate limit exceeded. Waiting for ${remainingTimeInMilliseconds} ms.`);
							await sleep(remainingTimeInMilliseconds);
						} else {
							console.error(error);
							sleep(1000 * 60 * 1); // sleep for 1 a minute if there is an error (in case of network or db error)
						}
					}
				}
			} catch (error) {
				console.error(error);
				sleep(1000 * 60 * 1); // sleep for 1 a minute if there is an error (in case of network or db error)
			}
		}

		await sleep(1000 * 60 * 60 * 4); // sleep for 4 hours if crawling is completed
	}
}

export default crawlReposTask;
