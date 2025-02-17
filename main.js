import dotenv from 'dotenv';
import crawlReposTask from './crawl-repos.js';
import { parseDependenciesTask } from './fetch-javascript-dependencies.js';
dotenv.config();

async function main() {
    await Promise.all([
        crawlReposTask(),
        parseDependenciesTask()
    ]);
}

main();