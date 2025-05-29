import githubClient from '../github-client.js';
import { Project, RepoDependency, UnprocessableRepoError, RepoDependencyList } from '../repo-dependency-list.js';
import { Parser } from '@faissaloux/gemfile';
import { getFolderPath } from '../utils.js';

const RUBY_PROVIDER = 'RubyGems';

/**
 * Parses dependencies from gem file content
 * @param {string} content - Content of pom.xml file
 * @returns {RepoDependency[]} - List of dependencies
 */
/**
 * Parses dependencies from Gemfile content
 * @param {string} content - Content of Gemfile
 * @returns {RepoDependency[]} - List of dependencies
 */
export const parseGemFileContent = (content) => {
	const dependencies = [];
	try {
		const parser = new Parser();
		const parsedString = parser.text(content).parse();
		const parsed = JSON.parse(parsedString);
		const dependenciesList = parsed.dependencies || [];
		for (const dependency of dependenciesList) {
			// Skip if essential fields are missing
			if (!dependency.name) continue;
			const name = dependency.name.replace(/'/g, '');
			dependencies.push(
				new RepoDependency({
					name,
					provider: RUBY_PROVIDER,
				}),
			);
		}
	} catch (error) {
		console.error('Failed to parse Gemfile:', error);
	}
	return dependencies;
};

/**
 * Parse Ruby dependencies from a repository
 * @param {import('../model/repo.js').default} repo - Repository object
 * @returns {Promise<RepoDependencyList>} - List of dependencies organized by project
 */
export const parseRubyDependencies = async (repo) => {
	const dependencyList = new RepoDependencyList({ id: repo.id });

	// Get Ruby dependency files from GitHub
	const dependencyFiles = await githubClient.getFilesContents(
		repo.owner,
		repo.name,
		[/Gemfile$/i],
		[/(sample|example|test)/i], // Exclude test/sample folders
	);

	if (dependencyFiles.length === 0) {
		throw new UnprocessableRepoError('No supported Ruby dependency files found');
	}

	for (const file of dependencyFiles) {
		const fileFolder = getFolderPath(file.path);
		const dependencies = parseGemFileContent(file.content);
		dependencyList.projects.push(
			new Project({
				path: fileFolder,
				packageProvider: RUBY_PROVIDER,
				dependencies: dependencies,
			}),
		);
	}

	return dependencyList;
};
