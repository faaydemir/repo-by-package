import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class Repo {
    constructor(data) {
        this.id = data.id;
        this.githubId = data.githubId;
        this.owner = data.owner;
        this.name = data.name;
        this.fullName = data.fullName;
        this.url = data.url;
        this.htmlUrl = data.htmlUrl;
        this.description = data.description;
        this.language = data.language;
        this.topics = data.topics;
        this.defaultBranch = data.defaultBranch;
        this.stargazersCount = data.stargazersCount;
        this.watchersCount = data.watchersCount;
        this.forksCount = data.forksCount;
        this.openIssuesCount = data.openIssuesCount;
        this.license = data.license;
        this.private = data.private;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.pushedAt = data.pushedAt;
        this.insertedAt = data.insertedAt;
        this.packageProcessedAt = data.packageProcessedAt;
        this.processible = data.processible;
    }

    /**
     * Fetch repositories for processing based on languages and count.
     * @param {Object} params
     * @param {number} params.count - Number of repositories to fetch.
     * @param {number} params.idCursor - Cursor to fetch repositories after this id.
     * @returns {Promise<Repo[]>}
     */
    static async getForProcessing({ count = 50, idCursor = 0 }) {
        if (typeof count !== 'number' || count <= 0) {
            throw new Error('Count must be a positive number.');
        }
        const results = await prisma.repo.findMany({
            where: {
                packageProcessedAt: null,
                processible: true,
                id: {
                    gt: idCursor
                }
                // Add additional conditions if needed, e.g., not processed yet
            },
            take: count,
            orderBy: {
                id: 'asc'
            }
        });

        return results.map(result => new Repo(result));
    }

    /**
     * Fetch repositories for reprocessing based on last processed date
     * @param {number} idCursor - Cursor to fetch repositories after this id
     * @param {Date} minDate - Minimum date threshold for reprocessing
     * @param {number} count - Number of repositories to fetch
     * @returns {Promise<Repo[]>}
     */
    static async getReposToReProcess({ minDate, idCursor = 0, count = 50 }) {
        if (!minDate || !(minDate instanceof Date)) {
            throw new Error('minDate must be a valid Date object');
        }

        const results = await prisma.repo.findMany({
            where: {
                id: {
                    gt: idCursor
                },
                processible: true,
                packageProcessedAt: {
                    lt: minDate
                }
            },
            take: count,
            orderBy: {
                id: 'asc'
            }
        });

        return results.map(result => new Repo(result));
    }

    static async getById(id) {
        const result = await prisma.repo.findUnique({
            where: { id }
        });
        return result ? new Repo(result) : null;
    }

    static async firstByGithubId(githubId) {
        const result = await prisma.repo.findFirst({
            where: { githubId }
        });
        return result ? new Repo(result) : null;
    }

    /**
     * @param {Partial<Repo>} data 
     * @returns 
     */
    static async create(data) {
        const result = await prisma.repo.create({
            data
        });
        return new Repo(result);
    }

    static async update(id, updates) {
        return prisma.repo.update({
            where: { id },
            data: updates
        });
    }
}

export default Repo;