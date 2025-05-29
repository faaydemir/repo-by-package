import githubClient from '../github-client.js';
import { Project, RepoDependency, UnprocessableRepoError, RepoDependencyList } from '../repo-dependency-list.js';
import { XMLParser } from 'fast-xml-parser'; // This dependency needs to be added to package.json
import * as gparser from 'gradle-to-js';
import { getFolderPath } from '../utils.js';

const JAVA_PROVIDER = 'Maven';

/**
 * Parses dependencies from pom.xml file content using proper XML parsing
 * @param {string} content - Content of pom.xml file
 * @returns {RepoDependency[]} - List of dependencies
 */
export const parsePomXmlContent = (content) => {
	const dependencies = [];

	try {
		// Create XML parser with appropriate options
		const parser = new XMLParser({
			ignoreAttributes: false,
			isArray: (name, jpath) => {
				// Always treat dependencies as an array even if there's only one
				return name === 'dependency' || jpath === 'project.dependencies.dependency';
			},
		});

		// Parse the XML content
		const pomObj = parser.parse(content);

		// Extract dependencies from the parsed object
		// Handle the different possible structures of the parsed POM
		const projectDependencies = pomObj?.project?.dependencies?.dependency || pomObj?.dependencies?.dependency || [];

		// Ensure we have an array to work with
		const dependencyArray = Array.isArray(projectDependencies) ? projectDependencies : [projectDependencies];

		for (const dependency of dependencyArray) {
			// Skip if essential fields are missing
			if (!dependency.groupId || !dependency.artifactId) {
				continue;
			}

			const groupId = dependency.groupId;
			const artifactId = dependency.artifactId;

			// Maven dependencies are identified by groupId:artifactId format
			const name = `${groupId}:${artifactId}`;
			dependencies.push(
				new RepoDependency({
					name,
					provider: JAVA_PROVIDER,
				}),
			);
		}
	} catch (error) {
		console.error(`Failed to parse pom.xml: ${error.message}`);
	}

	return dependencies;
};

/**
 * Parses dependencies from build.gradle file content using PEG grammar
 * @param {string} content - Content of build.gradle file
 * @returns {Promise<RepoDependency[]>} - List of dependencies
 */
export const parseGradleBuildContent = async (content) => {
	function findKey(obj, targetKey) {
		if (typeof obj !== 'object' || obj === null) return undefined;

		if (obj.hasOwnProperty(targetKey)) {
			return obj[targetKey]; // Or return the key itself if you want just the key
		}

		for (const key in obj) {
			const value = obj[key];
			const result = findKey(value, targetKey);
			if (result !== undefined) {
				return result;
			}
		}

		return undefined;
	}

	if (!content) {
		return [];
	}

	// Remove local catch to allow errors to propagate to outer try-catch
	let parsed;
	try {
		parsed = await gparser.parseText(content);
	} catch (err) {
		console.error('Error parsing Gradle file:', err.message);
		// Re-throw to allow outer try-catch to handle, or return empty array
		return [];
	}

	if (!parsed) return [];

	const parsedDependencies = findKey(parsed, 'dependencies');
	if (!parsedDependencies) return [];

	const dependencies = [];
	for (const d of parsedDependencies) {
		if (
			!d.group ||
			!d.name ||
			d.group.startsWith(':') || // Fixed typo: startWith → startsWith
			d.name.startsWith(':') || // Fixed typo: startWith → startsWith
			d.group.includes('$') ||
			d.name.includes('$')
		) {
			console.log(`Gradle 🚫 : ${d.group} - ${d.name}`);
			continue;
		}
		console.log(`Gradle ✅ : ${d.group}:${d.name}`);
		dependencies.push(
			new RepoDependency({
				name: `${d.group}:${d.name}`,
				provider: JAVA_PROVIDER,
			}),
		);
	}

	return dependencies;
};

/**
 * Parse Java dependencies from a repository
 * @param {*} repo - Repository object with owner and name properties
 * @returns {Promise<RepoDependencyList>} - List of dependencies organized by project
 */
export const parseJavaDependencies = async (repo) => {
	const dependencyList = new RepoDependencyList({ id: repo.id });

	// Get Java dependency files from GitHub
	const dependencyFiles = await githubClient.getFileContents(repo.owner, repo.name, [
		'pom.xml',
		// 'build.gradle',
		// 'build.gradle.kts',
	]);

	const allFiles = dependencyFiles.filter((file) => !file.path.match(/(sample|test|example)/i));

	if (allFiles.length === 0) {
		throw new UnprocessableRepoError('No supported Java dependency files found');
	}

	// Group dependency files by folder
	const folderToFiles = allFiles.reduce((acc, file) => {
		const folder = getFolderPath(file.path);
		if (!acc[folder]) acc[folder] = [];
		acc[folder].push(file);
		return acc;
	}, {});

	for (const folder in folderToFiles) {
		const files = folderToFiles[folder];
		let dependencies = [];

		for (const file of files) {
			if (file.path.endsWith('pom.xml')) {
				dependencies = [...dependencies, ...parsePomXmlContent(file.content)];
			}
			// else if (file.path.endsWith('build.gradle') || file.path.endsWith('build.gradle.kts')) {
			// 	const fileDependencies = await parseGradleBuildContent(file.content);
			// 	dependencies = [...dependencies, ...fileDependencies];
			// }
		}

		// Add project with its dependencies to dependency list
		dependencyList.projects.push(
			new Project({
				path: folder,
				packageProvider: JAVA_PROVIDER,
				dependencies: dependencies,
			}),
		);
	}

	return dependencyList;
};
