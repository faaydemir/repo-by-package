export class UnprocessableRepoError extends Error {
	constructor(message) {
		super(message);
	}
}

export class RepoDependencyList {
	constructor({ id }) {
		this.id = id;
		/**  @type {Project[]} */
		this.projects = [];
	}
}
export class RepoDependency {
	constructor({ name, provider }) {
		this.provider = provider;
		this.name = name;
	}
}

export class Project {
	constructor({ path, commitId, packageProvider, dependencies }) {
		this.path = path;
		this.commitId = commitId;
		this.packageProvider = packageProvider;
		/**@type {RepoDependency[]} */
		this.dependencies = dependencies;
	}
}