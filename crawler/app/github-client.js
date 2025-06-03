import axios from 'axios';
import { GITHUB_TOKEN, LEAST_START_COUNT_FOR_REPO } from './constants.js';

// Create an Axios instance with GitHub API defaults
const github = axios.create({
	baseURL: 'https://api.github.com/',
	headers: {
		Authorization: `Bearer ${GITHUB_TOKEN}`,
		Accept: 'application/vnd.github.v3+json',
	},
});

//TODO: add repo properties

class RateLimit {
	/**
	 * @param {Date} rateLimitReset
	 * @param {Number} rateLimitRemaining
	 */
	constructor(rateLimitReset, rateLimitRemaining) {
		this.rateLimitReset = rateLimitReset;
		this.rateLimitRemaining = rateLimitRemaining;
	}
	/*
	 * Returns the time remaining until the rate limit resets in milliseconds.
	 * @returns {number} Time remaining in milliseconds
	 */
	getRamaningTimeAsMs() {
		const remainingTimeInMilliseconds = this.rateLimitReset.getTime() - Date.now();
		return remainingTimeInMilliseconds > 0 ? remainingTimeInMilliseconds : 0;
	}

	static fromResponse(response) {
		const rateLimitReset = new Date(response.headers['x-ratelimit-reset'] * 1000);
		const rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining']);
		return new RateLimit(rateLimitReset, rateLimitRemaining);
	}
}
class SearchRepoResponse {
	/**
	 *
	 * @param {Repo[]} items
	 * @param {RateLimit} rateLimit
	 */
	constructor(items, rateLimit) {
		this.items = items ?? [];
		this.rateLimit = rateLimit;
	}
}

class RepoLanguages {
	/**
	 *
	 * @param {string} language
	 * @param {number} bytes
	 * @param {number} percentage
	 */
	constructor(language, bytes, percentage) {
		this.language = language;
		this.bytes = bytes;
		this.percentage = percentage;
	}

	/**
	 * @param {Object} response
	 * @returns {RepoLanguages[]}
	 * */
	static fromResponse(response) {
		const languages = [];
		const totalBytes = Object.values(response).reduce((acc, bytes) => acc + bytes, 0);
		for (const [language, bytes] of Object.entries(response)) {
			languages.push(new RepoLanguages(language, bytes, (bytes / totalBytes) * 100));
		}
		return languages;
	}
}

/**
 * Custom error class for handling rate limit errors.
 */
class RateLimitError extends Error {
	/**
	 * @param {string} message
	 * @param {RateLimit} rateLimit
	 */
	constructor(message, rateLimit) {
		super(message);
		this.rateLimit = rateLimit;
	}

	static checkAndThrow(response) {
		if (!(response && response.status === 403 && response.headers['x-ratelimit-remaining'] === '0')) return;

		const rateLimit = RateLimit.fromResponse(response);
		const message = response?.data?.message ?? response.statusText;
		throw new RateLimitError(message, rateLimit);
	}
}

class EndOfSeachError extends Error {
	constructor(message) {
		super(message);
	}
	static checkAndThrow(response) {
		if (!(response && response.status === 422)) return;

		const message = response?.data?.message ?? response.statusText;
		throw new EndOfSeachError(message);
	}
}

/**
 * @template TFunction
 * @param {TFunction} func
 * @returns {TFunction}
 * */
function errorHandlerDecorator(func) {
	async function wrapper(...args) {
		try {
			const result = await func.apply(this, args);
			return result;
		} catch (error) {
			const response = error.response;
			if (response) {
				RateLimitError.checkAndThrow(response);
				EndOfSeachError.checkAndThrow(response);
			}

			throw error;
		}
	}
	return wrapper;
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
async function searchReposByLanguage(language, perPage = 100, page = 1, minStars = LEAST_START_COUNT_FOR_REPO) {
	const languageQuery = language ? `language:${language}` : '';
	const minStartQuery = minStars ? `stars:>${minStars}` : undefined;

	const query = [languageQuery, minStartQuery].filter(Boolean).join(' ');

	const response = await github.get('/search/repositories', {
		params: {
			q: query,
			sort: 'stars', // Order by last created time
			order: 'asc', // Most recent first
			per_page: perPage,
			page: page,
		},
	});
	return new SearchRepoResponse(response.data.items, RateLimit.fromResponse(response));
}

/**
 * TODO: create test check if matchRegexList is working correctly for parsers
 * Checks if a file path matches any of the specified regex patterns
 * @param {string} filePath - Path of the file to check
 * @param {RegExp[]} matchRegexList - List of regex patterns to match (must match at least one)
 * @param {RegExp[]|null} excludeRegexList - Optional list of regex patterns to exclude
 * @returns {boolean} - True if the file matches required patterns and doesn't match exclusion patterns
 */
function isPatternMatching(filePath, matchRegexList, excludeRegexList = null) {
	if (!matchRegexList || matchRegexList.length === 0) {
		throw Error('Match regex patterns cannot be empty');
	}

	// Check if file matches any of the required patterns
	const isMatching = matchRegexList.some((regex) => regex.test(filePath));

	// If the file doesn't match any required patterns, return false
	if (!isMatching) {
		return false;
	}

	// If there are exclusion patterns, check if the file matches any of them
	if (excludeRegexList && excludeRegexList.length > 0) {
		const isExcluded = excludeRegexList.some((regex) => regex.test(filePath));
		// Return false if the file matches any exclusion pattern
		return !isExcluded;
	}

	// The file matched required patterns and didn't match any exclusion patterns
	return true;
}

/**
 * Fetch files from a repository matching regex patterns
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {RegExp[]} matchRegexList - List of regex patterns to match file paths
 * @param {RegExp[]|null} excludeRegexList - Optional list of regex patterns to exclude file paths
 * @returns {Promise<{path: string, content: string}[]>} - An array of files and their content
 */
async function getFilesContents(owner, repo, matchRegexList, excludeRegexList = null) {
	const repoRes = await github.get(`/repos/${owner}/${repo}`);
	const defaultBranch = repoRes.data.default_branch || 'master';

	// Fetch the repository tree recursively
	const treeRes = await github.get(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
	const tree = treeRes.data.tree;

	const matchingFiles = [];

	for (const item of tree) {
		if (item.type !== 'blob') continue;

		// Use the pattern matching utility function
		if (isPatternMatching(item.path, matchRegexList, excludeRegexList)) {
			matchingFiles.push(item);
		}
	}

	const files = await Promise.all(
		matchingFiles.map(async (file) => {
			const fileRes = await github.get(`/repos/${owner}/${repo}/contents/${file.path}`);
			const { content, encoding } = fileRes.data;
			if (encoding === 'base64') {
				const fileContent = Buffer.from(content, 'base64').toString('utf8');
				return { path: file.path, content: fileContent };
			}
			return null;
		}),
	);

	// Remove any null results (in case fetching a file failed)
	return files.filter((item) => item !== null);
}

/**
 * Fetch the languages used in a repository
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @returns {Promise<RepoLanguages}
 */
async function getRepoLanguages(owner, repo) {
	const response = await github.get(`/repos/${owner}/${repo}/languages`);
	return RepoLanguages.fromResponse(response.data);
}

const githubClient = {
	searchReposByLanguage: errorHandlerDecorator(searchReposByLanguage),
	getRepoLanguages: errorHandlerDecorator(getRepoLanguages),
	getFilesContents: errorHandlerDecorator(getFilesContents),
};
export { RateLimitError, EndOfSeachError };
export default githubClient;
