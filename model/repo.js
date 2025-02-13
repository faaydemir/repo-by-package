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
     * 
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

    static async delete(id) {
        return prisma.repo.delete({
            where: { id }
        });
    }
}

export default Repo;