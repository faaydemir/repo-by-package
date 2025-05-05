import githubClient from '../github-client.js';
import { Project, RepoDependency, UnprocessableRepoError, RepoDependencyList } from '../repo-dependency-list.js';
import * as itoml from '@iarna/toml';
const RUST_PROVUDER = 'cargo';
/**
 * Parse dependency information from Cargo.toml dependency entry
 * @param {string} name - The name of the dependency
 * @param {string|object} spec - The version specification or dependency object
 * @returns {RepoDependency} - A RepoDependency object
 */
const parseCargoDependency = (name, spec) => {
	if (!name) {
		return null;
	}

	if (typeof spec === 'object') {
		if (spec.path) {
			return;
		}
		// Handle git dependencies
		if (spec.git) {
			return new RepoDependency({
				name: spec.package || name,
				provider: RUST_PROVUDER,
			});
		}
	}

	// Fallback
	return new RepoDependency({
		name,
		provider: RUST_PROVUDER,
	});
};

/**
 * Parse Cargo.toml content and extract dependencies
 * @param {string} content - The content of Cargo.toml file
 * @returns {Array<RepoDependency>} - Array of dependencies
 */
export const parseCargoTomlContent = (content) => {
	try {
		const data = itoml.parse(content);
		const dependencies = [];

		// Process main dependencies
		if (data.dependencies) {
			for (const [name, spec] of Object.entries(data.dependencies)) {
				const dependency = parseCargoDependency(name, spec);
				if (dependency) {
					dependencies.push(dependency);
				}
			}
		}

		// Process dev-dependencies
		if (data['dev-dependencies']) {
			for (const [name, spec] of Object.entries(data['dev-dependencies'])) {
				const dependency = parseCargoDependency(name, spec);
				if (dependency) {
					dependencies.push(dependency);
				}
			}
		}

		// Process build-dependencies
		if (data['build-dependencies']) {
			for (const [name, spec] of Object.entries(data['build-dependencies'])) {
				const dependency = parseCargoDependency(name, spec);
				if (dependency) {
					dependencies.push(dependency);
				}
			}
		}

		// Process target-specific dependencies (like windows-specific, unix-specific)
		if (data.target) {
			for (const targetConfig of Object.values(data.target)) {
				// Process each dependency type for this target
				for (const depType of ['dependencies', 'dev-dependencies', 'build-dependencies']) {
					if (targetConfig[depType]) {
						for (const [name, spec] of Object.entries(targetConfig[depType])) {
							const dependency = parseCargoDependency(name, spec);
							if (dependency) {
								dependencies.push(dependency);
							}
						}
					}
				}
			}
		}

		// Process workspace dependencies (if present)
		if (data.workspace && data.workspace.dependencies) {
			for (const [name, spec] of Object.entries(data.workspace.dependencies)) {
				const dependency = parseCargoDependency(name, spec);
				if (dependency) {
					dependencies.push(dependency);
				}
			}
		}

		return dependencies;
	} catch (error) {
		console.error('Failed to parse Cargo.toml:', error);
		return [];
	}
};

/**
 * Parse Rust dependencies for a repository
 * @param {Object} repo - Repository object with owner and name properties
 * @returns {Promise<RepoDependencyList>} - A list of dependencies
 */
export const parseRustDependencies = async (repo) => {
	const dependencyList = new RepoDependencyList({ id: repo.id });

	// Get Rust dependency files from GitHub - looking for Cargo.toml files
	const dependencyFiles = await githubClient.getFileContents(repo.owner, repo.name, ['Cargo.toml']);

	const allFiles = dependencyFiles.filter((file) => !file.path.match(/(sample|test|example|target)/i));

	if (allFiles.length === 0) {
		throw new UnprocessableRepoError('No supported Rust dependency files (Cargo.toml) found');
	}

	// Group dependency files by folder
	const folderToFiles = allFiles.reduce((acc, file) => {
		const folder = file.path.split('/').slice(0, -1).join('/');
		if (!acc[folder]) acc[folder] = [];
		acc[folder].push(file);
		return acc;
	}, {});

	for (const folder in folderToFiles) {
		const files = folderToFiles[folder];
		let dependencies = [];
		for (const file of files) {
			if (file.path.endsWith('Cargo.toml')) {
				dependencies = [...dependencies, ...parseCargoTomlContent(file.content)];
			}
		}

		dependencyList.projects.push(
			new Project({
				path: folder,
				packageProvider: RUST_PROVUDER,
				dependencies: dependencies,
			}),
		);
	}

	return dependencyList;
};
