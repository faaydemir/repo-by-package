import crawlReposTask from './crawl-repos.js';
import parseDependenciesTask from './parse-repo-dependencies.js';

async function app() {
	await Promise.all([crawlReposTask(), parseDependenciesTask()]);
}

export default app;
