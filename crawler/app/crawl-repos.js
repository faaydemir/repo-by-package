
import githubClient, { RateLimitError, EndOfSeachError } from './github-client.js';
import RepoCrawTaskRun from './model/repo-craw-task-run.js';
import Repo from './model/repo.js';
import sleep from './sleep.js';
const languages = ['javascript', 'typescript'];
const leastStars = 5000;



async function crawlReposTask() {

    while (true) {
        try {
            for (const language of languages) {
                const task_key = `crawl_repos_${language}_${leastStars}`;

                let taskRun = await RepoCrawTaskRun.getByTaskKey(task_key);

                let starCursor = leastStars - 1;
                let isCompleted = false;

                if (taskRun) {
                    starCursor = taskRun.maxStars - 1;
                    isCompleted = taskRun.isBackwardCompleted;
                    const isADayPassedUntilLastRun = (new Date() - taskRun.lastRunAt) > 1000 * 60 * 60 * 24;
                    if(isADayPassedUntilLastRun){
                        isCompleted = false;
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
                        const response = await githubClient.searchReposByLanguage(language, 100, page, starCursor);
                        page++;
                        isCompleted = response.items.length < 100;
                        if (response.items?.length > 0) {
                            for (const repo of response.items) {
                                const stars = repo.stargazers_count;
                                console.log(`${new Date()} - Saving repo ${repo.full_name} - ${stars}`);
                                if (stars > maxStars) {
                                    maxStars = stars;
                                }

                                //TODO: update if exists
                                if (!(await Repo.firstByGithubId(repo.id))) {
                                    await Repo.create({
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
                                        private: repo.private
                                    });
                                }
                            }

                            taskRun = await RepoCrawTaskRun.update(taskRun.id, {
                                maxStars: maxStars,
                                lastRunAt: new Date(),
                                isBackwardCompleted: isCompleted
                            });
                        }
                    } catch (error) {
                        if (error instanceof EndOfSeachError) {
                            starCursor = taskRun.maxStars - 1
                            page = 1;
                        }
                        else if (error instanceof RateLimitError) {
                            const rateLimitResetTime = error.rateLimitting.rateLimitReset;
                            const remainingTimeInMilliseconds = rateLimitResetTime.getTime() - Date.now();
                            await sleep(remainingTimeInMilliseconds);
                        } else {
                            console.error(error);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof RateLimitError) {
                const rateLimitResetTime = error.rateLimitting.rateLimitReset;
                const remainingTimeInMilliseconds = rateLimitResetTime.getTime() - Date.now();
                console.log(`${new Date()} - Rate limit exceeded. Waiting for ${remainingTimeInMilliseconds} ms.`);
                await sleep(remainingTimeInMilliseconds);
            } else {
                console.error(error);
                break;
            }
        }

        await sleep(1000 * 60 * 60); // 1 hour
    }
}

export default crawlReposTask;