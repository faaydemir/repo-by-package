import githubClient from "../github-client.js";
import Repo from "../model/repo.js";
import { Project, RepoDependencyList, RepoDependency, UnprocessableRepoError } from "../repo-dependency-list.js";

const GO_PROVIDER = 'go';

/**
 * @param {String} goFileContent 
 * @returns {RepoDependency[]} 
 */
const parseGoModFileContent = (goFileContent) => {
    if (!goFileContent) {
        return [];
    }
    throw new Error('Not implemented');
}

/**
 * @param {Repo} repo 
 * @returns {RepoDependencyList}
 */
export const parseGoDependencies = async (repo) => {
    const dependencyList = new RepoDependencyList({ id: repo.id });

    const dependencyFiles = await githubClient.getFileContents(repo.owner, repo.name, [
        'go.mod'
    ]);

    const allFiles = dependencyFiles.filter((file) => !file.path.match(/(sample|test|example)/i));

    if (allFiles.length === 0) {
        throw new UnprocessableRepoError('No supported Go dependency files found');
    }

    for (const file of allFiles) {

        const fileFolder = file.path.split('/').slice(0, -1).join('/');
        const dependencies = parseGoModFileContent(file.content);
        dependencyList.projects.push(
            new Project({
                path: fileFolder,
                packageProvider: GO_PROVIDER,
                dependencies: dependencies,
            })
        );
    }

    return dependencyList;
};