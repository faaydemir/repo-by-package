export class UnprocessableRepoError extends Error {
    constructor(message) {
        super(message);
    }
}

export class RepoDependencyList {
    constructor({
        id,
    }) {
        this.id = id;
        /**  @type {Project[]} */
        this.projects = [];
    }
}
export class RepoDependency {
    constructor({
        name,
        provider,
        version,
        minVersion,
        maxVersion,
        versionText,
    }) {
        this.provider = provider;
        this.name = name;
        this.version = version;
        this.minVersion = minVersion;
        this.maxVersion = maxVersion;
        this.versionText = versionText;
    }
}

export class Project {
    constructor({
        path,
        commitId,
        packageProvider,
        dependencies
    }) {
        this.path = path;
        this.commitId = commitId;
        this.packageProvider = packageProvider
        /**@type {RepoDependency[]} */
        this.dependencies = dependencies;
    }
}