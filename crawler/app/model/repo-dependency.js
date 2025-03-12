import prisma from '../prisma.js';

class RepoDependency {
	constructor(data) {
		this.id = data.id;
		this.repoId = data.repoId;
		this.commitId = data.commitId;
		this.insertedAt = data.insertedAt;
		this.path = data.path;
		this.packageProvider = data.packageProvider;
	}

	static async getById(id) {
		const result = await prisma.repoDependency.findUnique({
			where: { id },
		});
		return result ? new RepoDependency(result) : null;
	}

	static async getAllByRepoId(repoId) {
		const result = await prisma.repoDependency.findMany({
			where: { repoId },
		});
		return result ? result.map((r) => new RepoDependency(r)) : null;
	}

	/**
	 *
	 * @param {Partial<RepoDependency>} data
	 * @returns
	 */
	static async create(data) {
		const result = await prisma.repoDependency.create({
			data,
		});
		return new RepoDependency(result);
	}

	static async update(id, updates) {
		return prisma.repoDependency.update({
			where: { id },
			data: updates,
		});
	}
}

export default RepoDependency;
