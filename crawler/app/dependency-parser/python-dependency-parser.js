//TODO: version parsing not working correctly
import githubClient from '../github-client.js';
import { Project, RepoDependency, UnprocessableRepoError, RepoDependencyList } from '../repo-dependency-list.js';
import { getFolderPath } from '../utils.js';
import semver from 'semver';
import * as itoml from '@iarna/toml';

/**
 * @deprecated verison parsing not worked for all cases so not used in ui, so do not need to store in db
 * Parses Python requirements.txt version specifications into version constraints
 * @param {string} versionText Version specifier (e.g., ">=2.0,<3.0")
 * @returns {Object} Parsed version constraints
 */
const parseDependencyVersionTextRequirementTxt = (versionText) => {
	if (!versionText) return { version: '', minVersion: null, maxVersion: null };

	let minVersion = null;
	let maxVersion = null;
	const constraints = versionText.split(',').map((c) => c.trim());

	for (const constraint of constraints) {
		const match = constraint.match(/^(~=|==|!=|<=?|>=?|===?)?\s*([\w.-]+)/);
		if (!match) continue;

		const [, operator, version] = match;
		const normalizedVersion = version.replace(/(\.\d+)\.?$/g, '$1');

		// Handle different operators
		switch (operator) {
			case '==':
				minVersion = maxVersion = normalizedVersion;
				break; // Exact match overrides other constraints
			case '>=':
				minVersion = maxVersionCompare(minVersion, normalizedVersion, 'max');
				break;
			case '>':
				minVersion = maxVersionCompare(minVersion, bumpVersion(normalizedVersion), 'max');
				break;
			case '<=':
				maxVersion = maxVersionCompare(maxVersion, normalizedVersion, 'min');
				break;
			case '<':
				maxVersion = maxVersionCompare(maxVersion, normalizedVersion, 'min');
				break;
			case '~=': {
				const [baseVersion, upperVersion] = getCompatibleBounds(normalizedVersion);
				minVersion = maxVersionCompare(minVersion, baseVersion, 'max');
				maxVersion = maxVersionCompare(maxVersion, upperVersion, 'min');
				break;
			}
			default:
				if (!operator) minVersion = maxVersion = normalizedVersion;
		}
	}

	return {
		version: minVersion,
		minVersion,
		maxVersion,
	};
};

// Helper to compare version constraints
const maxVersionCompare = (current, candidate, mode) => {
	if (!current) return candidate;
	const comparison = compareVersions(candidate, current);
	return mode === 'max' ? (comparison > 0 ? candidate : current) : comparison < 0 ? candidate : current;
};

// Simple PEP 440 version comparison (simplified)
const compareVersions = (a, b) => {
	const parse = (v) =>
		v.split('.').map((part) => {
			const num = parseInt(part, 10);
			return isNaN(num) ? part : num;
		});

	const aParts = parse(a);
	const bParts = parse(b);

	for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
		const aVal = aParts[i] || 0;
		const bVal = bParts[i] || 0;
		if (aVal > bVal) return 1;
		if (aVal < bVal) return -1;
	}
	return 0;
};

// Handle ~= compatible releases
const getCompatibleBounds = (version) => {
	const parts = version.split('.').map((p) => parseInt(p, 10));
	if (parts.length < 2) return [version, `${Number(version) + 1}.0`];

	const base = parts.slice(0, -1).join('.');
	const upper = `${base}.${parts[parts.length - 1] + 1}`;
	return [version, upper];
};

// Simple version bumper for > operator
const bumpVersion = (version) => {
	const parts = version.split('.');
	const last = parts.length - 1;
	parts[last] = (parseInt(parts[last], 10) || 0) + 1;
	return parts.join('.');
};

// Updated requirements.txt parser
export const parseRequirementsContent = (content) => {
	const lines = content.split('\n');
	const dependencies = [];

	for (const line of lines) {
		const trimmedLine = line.split('#')[0].trim();

		if (
			!trimmedLine ||
			trimmedLine.startsWith('-r') ||
			trimmedLine.startsWith('--requirement') ||
			trimmedLine.startsWith('-e') ||
			trimmedLine.startsWith('--editable')
		) {
			continue;
		}

		const [pkgPart] = trimmedLine.split(';');
		const match = pkgPart.match(/^([a-zA-Z0-9_-]+(?:\[[^\]]+\])?)\s*([^\s]*)/);
		if (!match) continue;

		const [, name, versionSpec] = match;

		dependencies.push(
			new RepoDependency({
				name: name.trim(),
				provider: 'pypi',
			}),
		);
	}

	return dependencies;
};

/**
 * Parse full dependency string from various formats, such as:
 * "torch>=1.11.0", "torchvision>=0.16.2", "supervision==0.19.0", "mmyolo @ git+https://github.com/onuralpszr/mmyolo.git"
 * If parsing fails, returns { name: null, versionText: null, version: null, minVersion: null, maxVersion: null }.
 * @param {string} dependencyText
 * @returns {{ name: string | null, versionText: string | null, version: string | null, minVersion: string | null, maxVersion: string | null }}
 */
const parseTomlDependencyText = (dependencyText) => {
	let name;
	try {
		// Handle dependencies with URLs (e.g., "mmyolo @ git+...")
		if (dependencyText.includes('@')) {
			const [name, source] = dependencyText.split('@').map((s) => s.trim());
			return new RepoDependency({
				name,
				provider: 'pypi',
			});
		}

		[name] = dependencyText.includes('=')
			? dependencyText.split(/([<>=!@^]+)/, 2).map((s) => s.trim())
			: [dependencyText.trim(), null];
		if (!name) return null;

		return new RepoDependency({
			name,
			provider: 'pypi',
		});
	} catch (error) {
		console.error(`Failed to parse dependency text: ${dependencyText}`, error);
		return new RepoDependency({ name, provider: 'pypi' });
	}
};
/**
 * @deprecated verison parsing not worked for all cases so not used in ui, so do not need to store in db
 * Parse dependency version text and return version, minVersion, maxVersion.
 * Supports formats like: ">=1.26.0,<3.0.0", "^1.62.3", "!=1.65.0", "^13.5.0", "^2.31.0", ">=3.9,<3.13".
 * If parsing fails, returns { version: null, minVersion: null, maxVersion: null }.
 * @param {string} dependencyText
 * @returns {{ version: string | null, minVersion: string | null, maxVersion: string | null }}
 */
const parseDependencyVersionText = (dependencyText) => {
	try {
		const range = semver.validRange(dependencyText);
		let version = null;
		let minVersion = null;
		let maxVersion = null;

		if (range) {
			// Determine the minimum version from the entire range
			const minVersionObj = semver.minVersion(range);
			minVersion = minVersionObj ? minVersionObj.toString() : null;

			// Attempt to coerce a version from the dependency text (e.g., ^1.2.3 -> 1.2.3)
			const coerced = semver.coerce(dependencyText);
			version = coerced ? coerced.toString() : null;

			// Fallback to minVersion if version is not coerced
			if (!version) {
				version = minVersion;
			}

			// Calculate maxVersion by analyzing the range's comparators
			const comparators = semver.toComparators(range);
			let maxVersionStr = null;
			for (const comparatorSet of comparators) {
				for (const comp of comparatorSet) {
					if (comp.startsWith('<')) {
						// Handle upper bound comparators (e.g., <3.0.0)
						const versionPart = comp.replace(/^</, '').trim();
						const cleanedVersion = versionPart.replace(/-0$/, ''); // Remove trailing -0 for prerelease versions
						const validVersion = semver.valid(cleanedVersion);
						if (validVersion) {
							if (!maxVersionStr || semver.gt(validVersion, maxVersionStr)) {
								maxVersionStr = validVersion;
							}
						}
					} else {
						// Handle exact versions (e.g., 1.2.3)
						const exactVersion = semver.valid(comp);
						if (exactVersion) {
							if (!maxVersionStr || semver.gte(exactVersion, maxVersionStr)) {
								maxVersionStr = exactVersion;
							}
						}
					}
				}
			}
			maxVersion = maxVersionStr;
		}

		return {
			version: version || null,
			minVersion,
			maxVersion,
		};
	} catch (error) {
		console.error(`Failed to parse dependency version text for ${dependencyText}:`, error);
		return { version: null, minVersion: null, maxVersion: null };
	}
};

export const parsePyprojectContent = (content) => {
	try {
		const data = itoml.parse(content);
		let dependencies = [];
		//find 'dependencies' key in data object then add values to dependencies array
		const findDependencies = (obj) => {
			for (const key in obj) {
				if (key === 'dependencies') {
					if (Array.isArray(obj[key])) {
						dependencies = [...dependencies, ...obj[key].map(parseTomlDependencyText)];
					} else if (typeof obj[key] === 'object') {
						for (const name in obj[key]) {
							if (name === 'python') continue;
							if (name === 'file') continue;
							if (name === 'path') continue;

							dependencies.push(
								new RepoDependency({
									name,
									provider: 'pypi',
								}),
							);
						}
					}
				} else if (typeof obj[key] === 'object') {
					findDependencies(obj[key]);
				}
			}
		};
		findDependencies(data);
		return dependencies;
	} catch (error) {
		console.error('Failed to parse pyproject.toml:', error);
		return [];
	}
};

export const parsePythonDependencies = async (repo) => {
	const dependencyList = new RepoDependencyList({ id: repo.id });

	// Get Python dependency files from GitHub
	const dependencyFiles = await githubClient.getFilesContents(
		repo.owner,
		repo.name,
		[/requirements\.txt$/i, /pyproject\.toml$/i],
		[/(sample|example|test)/i], // Exclude test/sample folders
	);

	if (dependencyFiles.length === 0) {
		throw new UnprocessableRepoError('No supported Python dependency files found');
	}

	// group dependency files by folder
	const folderToFiles = dependencyFiles.reduce((acc, file) => {
		const folder = getFolderPath(file.path);
		if (!acc[folder]) acc[folder] = [];
		acc[folder].push(file);
		return acc;
	}, {});

	for (const folder in folderToFiles) {
		const files = folderToFiles[folder];
		let dependencies = [];
		const provider = 'pypi';
		for (const file of files) {
			if (file.path.endsWith('pyproject.toml')) {
				dependencies = [...dependencies, ...parsePyprojectContent(file.content)];
			} else if (file.path.endsWith('requirements.txt')) {
				dependencies = [...dependencies, ...parseRequirementsContent(file.content)];
			}
		}

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
