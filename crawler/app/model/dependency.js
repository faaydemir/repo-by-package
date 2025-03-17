import prisma from '../prisma.js';

//TODO: limit the number items in dependencyCache
const dependencyCache = {};

class Dependency {
	constructor(data) {
		this.id = data.id;
		this.name = data.name;
		this.provider = data.provider;
	}

	static async getById(id) {
		const result = await prisma.dependency.findUnique({
			where: { id },
		});
		return result ? new Dependency(result) : null;
	}

	/**@returns {Promise<Dependency>} */
	static async getOrCreateCached(name, provider) {
		const key = `${name}__${provider}`;
		if (!dependencyCache[key]) {
			let dependency = await Dependency.firstByNameAndProvider(name, provider);
			if (!dependency) {
				dependency = await Dependency.create({
					name,
					provider,
				});
			}
			dependencyCache[key] = dependency;
		}
		return dependencyCache[key];
	}

	static async firstByNameAndProvider(name, provider) {
		const result = await prisma.dependency.findFirst({
			where: { name, provider },
		});
		return result ? new Dependency(result) : null;
	}

	/**
	 *
	 * @param {Partial<Dependency>} data
	 * @returns
	 */
	static async create(data) {
		const result = await prisma.dependency.create({
			data,
		});
		return new Dependency(result);
	}

	static async update(id, updates) {
		return prisma.dependency.update({
			where: { id },
			data: updates,
		});
	}
}

export default Dependency;
