// filepath: /Users/fatihaydemir/Desktop/CodeRead/repo-by-package/crawler/app/depdendency-parser/swift-dependency-parser.js
import githubClient from '../github-client.js';
import { Project, RepoDependency, RepoDependencyList, UnprocessableRepoError } from '../repo-dependency-list.js';

/**
 * Parse version specifications from Swift Package Manager format
 * @param {string} version - The version specification string from Package.swift
 * @returns {{version: string, minVersion: string, maxVersion: string}}
 */
export const parseVersionText = (version) => {
  if (!version || typeof version !== 'string') {
    return { version: undefined, minVersion: undefined, maxVersion: undefined };
  }

  // Remove whitespace and quotes
  version = version.trim().replace(/["']/g, '');

  // Handle exact version: .exact("1.2.3")
  if (version.includes('.exact(')) {
    const exactVersion = version.match(/\.exact\(["']?([^"')]+)["']?\)/)?.[1];
    if (exactVersion) {
      return {
        version: exactVersion,
        minVersion: exactVersion,
        maxVersion: exactVersion
      };
    }
  }

  // Handle from version: .from("1.2.3")
  if (version.includes('.from(')) {
    const fromVersion = version.match(/\.from\(["']?([^"')]+)["']?\)/)?.[1];
    if (fromVersion) {
      return {
        version: fromVersion,
        minVersion: fromVersion,
        maxVersion: undefined
      };
    }
  }

  // Handle up to next major: .upToNextMajor(from: "1.2.3")
  if (version.includes('.upToNextMajor(')) {
    const upToMajorVersion = version.match(/\.upToNextMajor\(from:\s*["']?([^"')]+)["']?\)/)?.[1];
    if (upToMajorVersion) {
      const parts = upToMajorVersion.split('.');
      if (parts.length >= 1) {
        const major = parseInt(parts[0], 10);
        return {
          version: upToMajorVersion,
          minVersion: upToMajorVersion,
          maxVersion: `${major + 1}.0.0`
        };
      }
    }
  }

  // Handle up to next minor: .upToNextMinor(from: "1.2.3")
  if (version.includes('.upToNextMinor(')) {
    const upToMinorVersion = version.match(/\.upToNextMinor\(from:\s*["']?([^"')]+)["']?\)/)?.[1];
    if (upToMinorVersion) {
      const parts = upToMinorVersion.split('.');
      if (parts.length >= 2) {
        const major = parseInt(parts[0], 10);
        const minor = parseInt(parts[1], 10);
        return {
          version: upToMinorVersion,
          minVersion: upToMinorVersion,
          maxVersion: `${major}.${minor + 1}.0`
        };
      }
    }
  }

  // Handle version range: "1.2.3"..<"2.0.0"
  if (version.includes('..<')) {
    const [minVersionStr, maxVersionStr] = version.split('..<').map(v => v.trim().replace(/["']/g, ''));
    if (minVersionStr && maxVersionStr) {
      return {
        version: minVersionStr,
        minVersion: minVersionStr,
        maxVersion: maxVersionStr
      };
    }
  }

  // Handle closed range: "1.2.3"..."2.0.0"
  if (version.includes('...')) {
    const [minVersionStr, maxVersionStr] = version.split('...').map(v => v.trim().replace(/["']/g, ''));
    if (minVersionStr && maxVersionStr) {
      return {
        version: minVersionStr,
        minVersion: minVersionStr,
        maxVersion: maxVersionStr
      };
    }
  }

  // Handle branch, revision or other formats as exact versions
  return {
    version: version,
    minVersion: version,
    maxVersion: version
  };
};

/**
 * Extract dependency information from Package.swift content
 * @param {Object} packageContent - The Package.swift file content
 * @returns {RepoDependency[]}
 */
export const parseDependenciesFromPackageSwift = (packageContent) => {
  if (!packageContent) {
    return [];
  }

  const content = typeof packageContent === 'string' ? packageContent : packageContent.toString();
  const dependencies = [];

  // Pattern to match dependencies in Package.swift
  const dependencyPattern = /\.package\(\s*(?:name\s*:\s*["']([^"']+)["']\s*,)?\s*url\s*:\s*["']([^"']+)["']\s*,\s*(?:from\s*:\s*["']([^"']+)["']|\.exact\(["']([^"']+)["']\)|\.upToNextMajor\(from\s*:\s*["']([^"']+)["']\)|\.upToNextMinor\(from\s*:\s*["']([^"']+)["']\)|\.branch\(["']([^"']+)["']\)|\.revision\(["']([^"']+)["']\)|["']([^"']+)["']\.\.\.["']([^"']+)["']|["']([^"']+)["']\.\.<["']([^"']+)["']|from:\s*["']([^"']+)["'])/g;

  let match;
  while ((match = dependencyPattern.exec(content)) !== null) {
    const [
      , name, url, fromVersion, exactVersion, upToNextMajorVersion, 
      upToNextMinorVersion, branchName, revisionHash, 
      minVersionClosed, maxVersionClosed, minVersionOpen, maxVersionOpen, from
    ] = match;
    
    let packageName = name;
    
    // If name not explicitly specified, extract from URL
    if (!packageName) {
      // Extract package name from URL (last part of path without .git extension)
      const urlPath = new URL(url).pathname;
      packageName = urlPath.split('/').pop().replace(/\.git$/, '');
    }
    
    let versionText;
    if (fromVersion) {
      versionText = `.from("${fromVersion}")`;
    } else if (exactVersion) {
      versionText = `.exact("${exactVersion}")`;
    } else if (upToNextMajorVersion) {
      versionText = `.upToNextMajor(from: "${upToNextMajorVersion}")`;
    } else if (upToNextMinorVersion) {
      versionText = `.upToNextMinor(from: "${upToNextMinorVersion}")`;
    } else if (branchName) {
      versionText = `.branch("${branchName}")`;
    } else if (revisionHash) {
      versionText = `.revision("${revisionHash}")`;
    } else if (minVersionClosed && maxVersionClosed) {
      versionText = `"${minVersionClosed}"..."${maxVersionClosed}"`;
    } else if (minVersionOpen && maxVersionOpen) {
      versionText = `"${minVersionOpen}"..<"${maxVersionOpen}"`;
    } else if (from) {
      versionText = `from: "${from}"`;
    } else {
      versionText = 'unknown';
    }
    
    // Determine which version string to parse
    const versionToParse = fromVersion || exactVersion || upToNextMajorVersion || 
                          upToNextMinorVersion || (minVersionClosed && `${minVersionClosed}...${maxVersionClosed}`) || 
                          (minVersionOpen && `${minVersionOpen}..<${maxVersionOpen}`) || from ||
                          branchName || revisionHash || versionText;
    
    const parsedVersion = parseVersionText(versionToParse);
    
    dependencies.push(new RepoDependency({
      name: packageName,
      provider: 'swift',
      versionText: versionText,
      version: parsedVersion.version,
      minVersion: parsedVersion.minVersion,
      maxVersion: parsedVersion.maxVersion,
    }));
  }

  return dependencies;
};

/**
 * Parse Swift dependencies for a repository
 * @param {*} repo - The repository to parse
 * @returns {Promise<RepoDependencyList>}
 */
export const parseSwiftDependencies = async (repo) => {
  // Find Package.swift files
  const packageSwiftFiles = await githubClient.searchFilesInRepo(repo.owner, repo.name, 'Package.swift');
  
  if (!packageSwiftFiles || packageSwiftFiles.length === 0) {
    throw new UnprocessableRepoError('No Package.swift found');
  }
  
  const dependencyList = new RepoDependencyList({
    id: repo.id,
  });
  
  for (const filePath of packageSwiftFiles) {
    // Skip test packages or examples
    if (filePath.match(/(Tests|Example|Sample)/i)) {
      continue;
    }
    
    // Get the content of Package.swift
    const packageContent = await githubClient.getFileContent(repo.owner, repo.name, filePath);
    
    if (!packageContent) {
      console.warn(`Could not retrieve content for ${filePath}`);
      continue;
    }
    
    const dependencies = parseDependenciesFromPackageSwift(packageContent.content);
    
    const project = new Project({
      commitId: packageContent.sha,
      path: filePath,
      packageProvider: 'swift',
      dependencies,
    });
    
    dependencyList.projects.push(project);
  }
  
  return dependencyList;
};