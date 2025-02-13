import axios from 'axios';

// Retrieve your GitHub token from the environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
    console.error('Please set the GITHUB_TOKEN environment variable.');
    process.exit(1);
}

// Create an Axios instance with GitHub API defaults
const github = axios.create({
    baseURL: 'https://api.github.com/',
    headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    }
});

class Repo {

}
class RateLimit {
    /**
     * 
     * @param {Date} rateLimitReset 
     * @param {Number} rateLimitRemaining 
     */
    constructor(rateLimitReset, rateLimitRemaining) {
        this.rateLimitReset = rateLimitReset;
        this.rateLimitRemaining = rateLimitRemaining;
    }
}
class SearchRepoResponse {
    /**
     * 
     * @param {Repo[]} items 
     * @param {RateLimit} rateLimitting 
     */
    constructor(items, rateLimitting) {
        this.items = items ?? [];
        this.rateLimitting = rateLimitting;
    }
}


/**
 * Custom error class for handling rate limit errors.
 */
class RateLimitError extends Error {
    /**
     * 
     * @param {RateLimit} rateLimitting 
     */
    constructor(message, rateLimitting) {
        super(message);
        this.rateLimitting = rateLimitting;
    }
}

class EndOfSeachError extends Error {
    constructor(message) {
        super(message);
    }

}

/**
 * Search repositories by a given language.
 * This version orders results by updated time and only includes repos with > 1000 stars.
 *
 * @param {string} language - The programming language (e.g., 'javascript' or 'typescript').
 * @param {number} perPage - Number of results per page (max 100).
 * @param {number} page - Page number for pagination.
 * @returns {Promise<SearchRepoResponse>} - An array of repository items.
 */
async function searchReposByLanguage(language, perPage = 100, page = 1, min_stars = 5000, beforeDate = null) {

    let dateQuery = '';
    if (beforeDate instanceof Date) {
        const dateStr = beforeDate.toISOString().split('T')[0];
        dateQuery = ` created:<${dateStr}`;
    }

    const query = `language:${language} stars:>${min_stars} ${dateQuery}`;

    try {
        const response = await github.get('/search/repositories', {
            params: {
                q: query,
                sort: 'updated', // Order by last created time
                order: 'desc',   // Most recent first
                per_page: perPage,
                page: page
            }
        });
        const rateLimitReset = new Date(response.headers['x-ratelimit-reset'] * 1000);
        const rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining']);
        const rateLimitting = new RateLimit(rateLimitReset, rateLimitRemaining);

        return new SearchRepoResponse(response.data.items, rateLimitting);
    } catch (error) {
        const response = error.response;
        if (response) {
            const mesasge = response?.data?.message ?? response.statusText;
            if (response.status === 403) {
                const rateLimitReset = new Date(response.headers['x-ratelimit-reset'] * 1000);
                const rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining']);
                const rateLimitting = new RateLimit(rateLimitReset, rateLimitRemaining);
                throw new RateLimitError(mesasge, rateLimitting);
            }
            else if (response.status === 422) {
                console.error('Error during repository search:', response.statusText);
                throw new EndOfSeachError(mesasge);
            }
        }

        throw error;
    }
}

/**
 * Fetch and parse the package.json file from a repository.
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @returns {Promise<Object|null>} - The parsed package.json object or null if not found.
 */
async function getPackageJson(owner, repo) {
    try {
        // First, fetch repository details to get the default branch (e.g., 'main' or 'master')
        const repoRes = await github.get(`/repos/${owner}/${repo}`);
        const defaultBranch = repoRes.data.default_branch || 'master';

        // Fetch the repository tree recursively
        const treeRes = await github.get(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
        const tree = treeRes.data.tree;

        // Filter the tree for package.json files (ensure we only consider blobs, i.e. actual files)
        const packageJsonPaths = tree.filter(item => item.type === 'blob' && item.path.toLowerCase().endsWith('package.json'));
        //tree.filter(item => item.path.toLowerCase().endsWith('package.json'))
        // For each package.json file found, fetch its content using the contents API
        const packageJsonFiles = await Promise.all(
            packageJsonPaths.map(async (file) => {
                try {
                    const fileRes = await github.get(`/repos/${owner}/${repo}/contents/${file.path}`);
                    const { content, encoding } = fileRes.data;
                    if (encoding === 'base64') {
                        const jsonStr = Buffer.from(content, 'base64').toString('utf8');
                        const jsonContent = JSON.parse(jsonStr);
                        return { path: file.path, content: jsonContent };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error fetching ${file.path} in ${owner}/${repo}: ${error.message}`);
                    return null;
                }
            })
        );

        // Remove any null results (in case fetching a file failed)
        return packageJsonFiles.filter(item => item !== null);
    } catch (error) {
        console.error(`Error retrieving package.json files for ${owner}/${repo}: ${error.message}`);
        return [];
    }
}


// async function searchPackageJsonFiles(owner, repo) {
//     try {
//         // Build the query for code search.
//         // This will search in the specified repository for files named package.json.
//         const query = `repo:${owner}/${repo} filename:package.json`;

//         // Use the Code Search API
//         const searchResponse = await github.get('/search/code', {
//             params: { q: query }
//         });
//         const items = searchResponse.data.items;

//         // For each found file, fetch its content using its API URL.
//         const packageJsonFiles = await Promise.all(
//             items.map(async (item) => {
//                 try {
//                     // item.url points to the API endpoint for the file's content.
//                     const fileRes = await github.get(item.url);
//                     const { content, encoding } = fileRes.data;
//                     if (encoding === 'base64') {
//                         const jsonStr = Buffer.from(content, 'base64').toString('utf8');
//                         const jsonContent = JSON.parse(jsonStr);
//                         return { path: item.path, content: jsonContent };
//                     }
//                     return null;
//                 } catch (error) {
//                     console.error(`Error fetching file at ${item.path}: ${error.message}`);
//                     return null;
//                 }
//             })
//         );

//         // Filter out any null results (if any files failed to fetch)
//         return packageJsonFiles.filter(file => file !== null);
//     } catch (error) {
//         console.error(`Error searching for package.json in ${owner}/${repo}: ${error.message}`);
//         return [];
//     }
// }


const githubClient = {
    searchReposByLanguage,
    getPackageJson
};
export { RateLimitError, EndOfSeachError }
export default githubClient
