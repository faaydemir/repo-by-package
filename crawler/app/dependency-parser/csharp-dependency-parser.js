import githubClient from '../github-client.js';
import { Project, RepoDependency, UnprocessableRepoError, RepoDependencyList } from '../repo-dependency-list.js';
import { getFolderPath } from '../utils.js';
import semver from 'semver';

/**
 * @deprecated verison parsing not worked for all cases so not used in ui, so do not need to store in db
 * Parses version text from NuGet package references and returns version info including min and max versions
 * @param {string} version
 * @returns {{version: string, minVersion: string, maxVersion: string}}
 */
export const parseNuGetVersionText = (version) => {
	if (!version || typeof version !== 'string') {
		return { version: undefined, minVersion: undefined, maxVersion: undefined };
	}

	try {
		// Handle exact versions (common in .csproj files)
		if (!version.includes('[') && !version.includes('(') && !version.includes(',')) {
			return {
				version,
				minVersion: version,
				maxVersion: version,
			};
		}

		// Handle NuGet version ranges
		// Examples: [1.0.0, 2.0.0), (1.0.0, 2.0.0], [1.0.0, ), (, 2.0.0]
		const rangeMatch = version.match(/^[\[\(](.*?),(.*?)[\]\)]$/);
		if (rangeMatch) {
			const [, minVersionText, maxVersionText] = rangeMatch;
			const minVersion = minVersionText.trim() || undefined;
			const maxVersion = maxVersionText.trim() || undefined;

			return {
				version: minVersion || maxVersion,
				minVersion,
				maxVersion,
			};
		}

		// Fallback to semver parsing if possible
		const parsed = semver.valid(version);
		if (parsed) {
			return {
				version: parsed,
				minVersion: parsed,
				maxVersion: parsed,
			};
		}

		// If we can't parse it, return the original version
		return {
			version,
			minVersion: version,
			maxVersion: version,
		};
	} catch {
		// If parsing fails, return the original version for all fields
		return {
			version,
			minVersion: version,
			maxVersion: version,
		};
	}
};

/**
 * Parse dependencies from a csproj file content
 * @param {string} content - XML content of the csproj file
 * @returns {RepoDependency[]}
 */
export const parseDependenciesFromCsproj = (content) => {
	const dependencies = [];
	const packageRefPattern = /<PackageReference\s+(?:Include|Update)="([^"]+)"\s+Version="([^"]+)"/g;
	const packageMetaPattern = /<PackageReference\s+(?:Include|Update)="([^"]+)"[^>]*>\s*<Version>([^<]+)<\/Version>/g;

	// Match inline package references
	let match;
	while ((match = packageRefPattern.exec(content)) !== null) {
		const [, name] = match;
		const provider = 'nuget';
		// const parsedVersion = parseNuGetVersionText(version);

		dependencies.push(
			new RepoDependency({
				name,
				provider,
			}),
		);
	}

	// Match metadata-style package references
	while ((match = packageMetaPattern.exec(content)) !== null) {
		const [, name] = match;
		const provider = 'nuget';
		// const parsedVersion = parseNuGetVersionText(version);

		dependencies.push(
			new RepoDependency({
				name,
				provider,
			}),
		);
	}

	return dependencies;
};

/**
 * Parse dependencies from a packages.config file content
 * @param {string} content - XML content of the packages.config file
 * @returns {RepoDependency[]}
 */
export const parseDependenciesFromPackagesConfig = (content) => {
	const dependencies = [];
	const packagePattern = /<package\s+id="([^"]+)"\s+version="([^"]+)"/g;

	let match;
	while ((match = packagePattern.exec(content)) !== null) {
		const [, name] = match;
		const provider = 'nuget';
		// const parsedVersion = parseNuGetVersionText(version);

		dependencies.push(
			new RepoDependency({
				name,
				provider,
			}),
		);
	}

	return dependencies;
};

/**
 * Process C# project dependencies
 * @param {*} repo
 * @returns {Promise<RepoDependencyList>}
 */
export const parseCSharpDependencies = async (repo) => {
	const dependencyFiles = await githubClient.getFileContents(
		repo.owner,
		repo.name,
		['*.csproj'], //['*.csproj', 'packages.config']
	);

	if (!dependencyFiles || dependencyFiles.length === 0) {
		throw new UnprocessableRepoError('No supported C# dependency files found');
	}

	const dependencyList = new RepoDependencyList({
		id: repo.id,
	});

	// Filter out sample/test/example files
	const filteredFiles = dependencyFiles.filter((file) => !file.path.match(/(sample|test|example)/i));

	if (filteredFiles.length === 0) {
		throw new UnprocessableRepoError('No supported C# dependency files found (excluding tests/samples)');
	}

	// Group dependency files by folder
	const folderToFiles = filteredFiles.reduce((acc, file) => {
		const folder = getFolderPath(file.path);
		acc[folder] = acc[folder] || [];
		acc[folder].push(file);
		return acc;
	}, {});

	for (const folder in folderToFiles) {
		const files = folderToFiles[folder];
		let dependencies = [];
		const provider = 'nuget';

		for (const file of files) {
			if (file.path.endsWith('.csproj')) {
				dependencies = [...dependencies, ...parseDependenciesFromCsproj(file.content)];
			}
			// else if (file.path.endsWith('packages.config')) {
			//     dependencies = [...dependencies, ...parseDependenciesFromPackagesConfig(file.content)];
			// }
		}

		// Create a project for this folder with its dependencies
		dependencyList.projects.push(
			new Project({
				path: folder,
				packageProvider: provider,
				dependencies: dependencies,
			}),
		);
	}

	return dependencyList;
};
