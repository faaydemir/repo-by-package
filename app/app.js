import dotenv from 'dotenv';
import crawlReposTask from './crawl-repos.js';
import { parseDependenciesTask } from './fetch-javascript-dependencies.js';
dotenv.config();

async function app() {
    await Promise.all([
        crawlReposTask(),
        parseDependenciesTask()
    ]);
}

export default app;