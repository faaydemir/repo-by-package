import githubClient from '../github-client.js';
import { Project, RepoDependency, RepoDependencyList, UnprocessableRepoError } from '../repo-dependency-list.js';
import semver from 'semver';
import { getFolderPath } from '../utils.js';

/**
 * @deprecated verison parsing not worked for all cases so not used in ui, so do not need to store in db
 * Parses version text and returns version info including min and max versions
 * @param {string} version
 * @returns {{version: string, minVersion: string, maxVersion: string}}
 */
export const parseVersionText = (version) => {
	//FIXME: fix parsing, check test
	if (!version || typeof version !== 'string') {
		return { version: undefined, minVersion: undefined, maxVersion: undefined };
	}

	// Handle URL, file, and latest cases
	if (version.startsWith('http') || version.startsWith('file:') || version === 'latest') {
		return { version, minVersion: version, maxVersion: version };
	}

	try {
		// Clean the version string
		const cleanVersion = version.replace(/[~^]/g, '');

		if (version.startsWith('~')) {
			// ~1.2.3 = >=1.2.3 <1.3.0
			const parsed = semver.parse(cleanVersion);
			if (!parsed)
				return {
					version: cleanVersion,
					minVersion: cleanVersion,
					maxVersion: cleanVersion,
				};

			return {
				version: cleanVersion,
				minVersion: cleanVersion,
				maxVersion: `${parsed.major}.${parsed.minor + 1}.0`,
			};
		} else if (version.startsWith('^')) {
			// ^1.2.3 = >=1.2.3 <2.0.0
			const parsed = semver.parse(cleanVersion);
			if (!parsed)
				return {
					version: cleanVersion,
					minVersion: cleanVersion,
					maxVersion: cleanVersion,
				};

			return {
				version: cleanVersion,
				minVersion: cleanVersion,
				maxVersion: `${parsed.major + 1}.0.0`,
			};
		} else if (version.includes('>=') || version.includes('<=') || version.includes('>') || version.includes('<')) {
			const range = new semver.Range(version);
			// Get the first comparator for min version and last for max version
			const minComparator = range.set[0][0];
			const maxComparator = range.set[0][range.set[0].length - 1];

			return {
				version: minComparator.semver.version,
				minVersion: minComparator.semver.version,
				maxVersion: maxComparator.semver.version,
			};
		} else if (version.includes('||')) {
			const versions = version.split('||');
			let maxVersion = undefined;
			let minVersion = undefined;
			for (const v of versions) {
				const parsed = semver.parse(v);
				if (!parsed) continue;
				if (!maxVersion || semver.gt(parsed.version, maxVersion)) {
					maxVersion = parsed.version;
				}
				if (!minVersion || semver.lt(parsed.version, minVersion)) {
					minVersion = parsed.version;
				}
			}

			const version = minVersion;

			return {
				version: version,
				minVersion: minVersion,
				maxVersion: maxVersion,
			};
		} else {
			// Exact version or x-ranges
			return {
				version: cleanVersion,
				minVersion: cleanVersion,
				maxVersion: cleanVersion,
			};
		}
	} catch (error) {
		// If semver parsing fails, return the original version for all fields
		return {
			version: version,
			minVersion: version,
			maxVersion: version,
		};
	}
};

/**
 *
 * @param {string} packageJsonContent
 * @returns {RepoDependency[]}
 */
export const parseDependenciesFromPackageJson = (packageJsonContent) => {
	let packageJson;
	try {
		packageJson = JSON.parse(packageJsonContent);
	} catch (error) {
		throw new UnprocessableRepoError('Invalid package.json content' + error.message);
	}

	const dependencies = packageJson.dependencies ?? {};
	// const devDependencies = packageJson.devDependencies ?? {};

	const allDependencies = {
		...dependencies,
		// ...devDependencies,
	};

	return Object.entries(allDependencies).map(([name, version]) => {
		const provider = 'npm';
		return new RepoDependency({
			name,
			provider,
		});
	});
};

/**
 *
 * @param {*} repo
 * @returns {Promise<RepoDependencyList>}
 */
export const parseTSJSDependencies = async (repo) => {
	const matchPatterns = [/package\.json$/i];
	const excludePatterns = [/(sample|test|example|node_modules)/i];

	const dependencyFiles = await githubClient.getFilesContents(repo.owner, repo.name, matchPatterns, excludePatterns);

	if (dependencyFiles.length === 0) {
		throw new UnprocessableRepoError('No package.json found');
	}

	const dependencyList = new RepoDependencyList({
		id: repo.id,
	});

	for (const packageJson of dependencyFiles) {
		const dependencies = parseDependenciesFromPackageJson(packageJson.content);
		const folderPath = getFolderPath(packageJson.path);
		const project = new Project({
			commitId: undefined,
			path: folderPath,
			packageProvider: 'npm',
			dependencies,
		});

		dependencyList.projects.push(project);
	}
	return dependencyList;
};
