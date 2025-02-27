export class RepoPackages {
    constructor({
        id,
    }) {
        this.id = id;
        /**  @type {Project[]} */
        this.projects = [];
    }
}
export class Package {
    constructor({
        name,
        version,
        minVersion,
        maxVersion,
        versionOperator,
        versionText,
    }) {
        this.provider = provider;
        this.name = name;
        this.version = version;
        this.minVersion = minVersion;
        this.maxVersion = maxVersion;
        this.versionOperator = versionOperator;
        this.versionText = versionText;
    }
}

export class Project {
    constructor({
        path,
        commitId,
        packageProvider,
    }) {
        this.path = path;
        this.commitId = commitId;
        this.packageProvider = packageProvider
        /**@type {Package[]} */
        this.packages = [];
    }
}