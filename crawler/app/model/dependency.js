import prisma from '../prisma.js';

//TODO: limit the number items in dependencyCache
const dependencyCache = {};

class Dependency {
	constructor(data) {
		this.id = data.id;
		this.name = data.name;
		this.provider = data.provider;
		this.unique = data.unique;
	}

	static async getById(id) {
		const result = await prisma.dependency.findUnique({
			where: { id },
		});
		return result ? new Dependency(result) : null;
	}

	/**
	 * Creates a URL-safe unique identifier from a dependency name
	 * @param {string} name - The dependency name
	 * @returns {string} URL-safe unique identifier
	 */
	static createUniqueIdentifier(name) {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9\-_.]/g, '-') // Replace non-alphanumeric chars with hyphens
			.replace(/[-]+/g, '-') // Replace multiple consecutive hyphens with single hyphen
			.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
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
	 * Find dependency by unique identifier
	 * @param {string} unique - The unique identifier
	 * @returns {Promise<Dependency|null>}
	 */
	static async findByUnique(unique) {
		const result = await prisma.dependency.findUnique({
			where: { unique },
		});
		return result ? new Dependency(result) : null;
	}

	/**
	 *
	 * @param {Partial<Dependency>} data
	 * @returns
	 */
	static async create(data) {
		// Generate unique identifier if not provided
		if (!data.unique && data.name) {
			data.unique = Dependency.createUniqueIdentifier(data.name);
		}

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
