import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RepoDependency {
    constructor(data) {
        this.id = data.id;
        this.repoId = data.repoId;
        this.commitId = data.commitId;
        this.insertedAt = data.insertedAt;
        this.path = data.path;
    }

    static async getById(id) {
        const result = await prisma.repoDependency.findUnique({
            where: { id }
        });
        return result ? new RepoDependency(result) : null;
    }

    static async getByRepoId(repoId) {
        const result = await prisma.repoDependency.findFirst({
            where: { repoId }
        });
        return result ? new RepoDependency(result) : null;
    }

    /**
     * 
     * @param {Partial<RepoDependency>} data 
     * @returns 
     */
    static async create(data) {
        const result = await prisma.repoDependency.create({
            data
        });
        return new RepoDependency(result);
    }

    static async update(id, updates) {
        return prisma.repoDependency.update({
            where: { id },
            data: updates
        });
    }

    static async delete(id) {
        return prisma.repoDependency.delete({
            where: { id }
        });
    }
}

export default RepoDependency;