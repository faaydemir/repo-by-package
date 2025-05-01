// filepath: /Users/fatihaydemir/Desktop/CodeRead/repo-by-package/crawler/app/dependency-parser/java-dependency-parser.js
import githubClient from '../github-client.js';
import { Project, RepoDependency, UnprocessableRepoError, RepoDependencyList } from '../repo-dependency-list.js';
import { XMLParser } from 'fast-xml-parser'; // This dependency needs to be added to package.json
import fs from 'fs';
import path from 'path';
import peggy from 'peggy';

const JAVA_PROVIDER = 'maven';

const GRADLE_DEPENDENCY_GRAMMAR = `
GradleFile = (CommentLine / DependenciesBlock /OtherDecl)*

DependenciesBlock = "dependencies" SpaceOptional? "{" BlockContent "}"

BlockContent = ((CommentLine / DependencyLine) BreakOptional)*

DependencyLine = BreakOptional config:ConfigName Space+ dep:DependencySpec Newline {
      return { type: "Dependency", config, spec: dep };
    }

ConfigName = [a-zA-Z]+

DependencySpec = QuotedDependencySpec / MavenCoordinates

QuotedDependencySpec
  = "'" (!"'" .)* "'" { return text(); }
  / '"' (!'"' .)* '"' { return text(); }

MavenCoordinates = (![\\s{}'"] .)+ { return text(); }

OtherDecl     = [^\\n]* Newline

ModulePath    = AnyText
Version       = AnyText
CommentLine   = SpaceOptional Comment End
Comment       = "//" [^\\n]*
AnyText       = TextChar+ / StringLiteral
StringLiteral      = DoubleQuoteString / SingleQuoteString
DoubleQuoteString  = '"' TextChar* '"'
SingleQuoteString  = "'" TextChar* "'"
TextChar           = [a-zA-Z0-9./\\\-_~!@#$%^&*()+=:;'"?,<>[\\]{}|]
Break              = [ \\t\\r\\n]+
BreakOptional      = [ \\t\\r\\n]*
Space              = [ \\t]+
SpaceOptional      = [ \\t]*
Newline       = "\\n"
End       = Eof / Newline
Eof           = !.
`
const writeTestFile = (folder, fileName, content) => {

  const testFilesDir = path.join(process.cwd(), 'test_files', folder);
  if (!fs.existsSync(testFilesDir)) {
    fs.mkdirSync(testFilesDir, { recursive: true });
  }
  const filePath = path.join(testFilesDir, fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

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
            }
        });
        
        // Parse the XML content
        const pomObj = parser.parse(content);
        
        // Extract dependencies from the parsed object
        // Handle the different possible structures of the parsed POM
        const projectDependencies = 
            pomObj?.project?.dependencies?.dependency || 
            pomObj?.dependencies?.dependency || 
            [];
            
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
 * @returns {RepoDependency[]} - List of dependencies
 */
export const parseGradleBuildContent = (content) => {
    const dependencies = [];

    if (!content) {
        return dependencies;
    }

    try {
        console.log(GRADLE_DEPENDENCY_GRAMMAR);

        // Generate the parser from the PEG grammar
        const parser = peggy.generate(GRADLE_DEPENDENCY_GRAMMAR);

        // Parse the content using the generated parser
        const parsed = parser.parse(content);

        // Extract dependencies from the parsed result
        const extractDependencies = (node) => {
            if (Array.isArray(node)) {
                node.forEach(extractDependencies);
            } else if (node && node.type === 'Dependency') {
                const [groupId, artifactId] = node.spec.split(':');
                if (groupId && artifactId) {
                    dependencies.push(
                        new RepoDependency({
                            name: `${groupId}:${artifactId}`,
                            provider: JAVA_PROVIDER,
                        })
                    );
                }
            }
        };

        extractDependencies(parsed);
    } catch (error) {
        console.error(`Failed to parse build.gradle content: ${error.message}`);
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
        'build.gradle',
        'build.gradle.kts',
    ]);
    
    const allFiles = dependencyFiles.filter((file) => !file.path.match(/(sample|test|example)/i));
    
    if (allFiles.length === 0) {
        throw new UnprocessableRepoError('No supported Java dependency files found');
    }
    
    for (const file of allFiles) {
        const safeFileName = file.path.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filePath = writeTestFile('java', safeFileName, file.content);
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
            if (file.path.endsWith('pom.xml')) {
                dependencies = [...dependencies, ...parsePomXmlContent(file.content)];
            } else if (file.path.endsWith('build.gradle') || file.path.endsWith('build.gradle.kts')) {
                dependencies = [...dependencies, ...parseGradleBuildContent(file.content)];
            }
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
