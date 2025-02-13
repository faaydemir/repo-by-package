import dotenv from 'dotenv';
import crawlReposTask from './crawl-repos.js';
dotenv.config();

async function main() {
    Promise.all([
        await crawlReposTask()
    ]);
}

main();