import { LEAST_START_COUNT_FOR_REPO } from './constants.js';
import githubClient, { RateLimitError, EndOfSeachError } from './github-client.js';
import RepoCrawlTaskRun from './model/repo-crawl-task-run.js';
import Repo from './model/repo.js';
import sleep from './sleep.js';
import Language from './languages.js';
const SEARCH_REPO_TAKE = 100;

async function crawlReposTask() {
	while (true) {
		for (const language of Object.values(Language)) {
			try {
				const task_key = `crawl_repos_${language}_${LEAST_START_COUNT_FOR_REPO}`;

				let taskRun = await RepoCrawlTaskRun.getOrCreateByKey(task_key);

				let page = 1;
				let starCursor = taskRun.starCursor;
				while (!taskRun.isCompleted) {
					try {
						const response = await githubClient.searchReposByLanguage(language, SEARCH_REPO_TAKE, page, starCursor);
						page += 1;
						let maxStars = starCursor;
						for (const repo of response.items) {

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

						await taskRun.updateRun(maxStars, response.items.length < SEARCH_REPO_TAKE);
					} catch (error) {
						if (error instanceof EndOfSeachError) {
							page = 1;
							starCursor = taskRun.starCursor;
						} else if (error instanceof RateLimitError) {
							const rateLimitResetTime = error.rateLimit.rateLimitReset;
							const remainingTimeInMilliseconds = rateLimitResetTime.getTime() - Date.now();
							console.error(`${new Date()} - Rate limit exceeded. Waiting for ${remainingTimeInMilliseconds} ms.`);
							await sleep(remainingTimeInMilliseconds);
						} else {
							console.error(error);
							await sleep(1000 * 60 * 1); // sleep for 1 a minute if there is an error (in case of network or db error)
						}
					}
				}
			} catch (error) {
				console.error(error);
				await sleep(1000 * 60 * 1); // sleep for 1 a minute if there is an error (in case of network or db error)
			}
		}

		await sleep(1000 * 60 * 60 * 10); // sleep for 10 hours if crawling is completed
	}
}

export default crawlReposTask;
