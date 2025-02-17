import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DependencyMapping {
    constructor(data) {
        this.id = data.id;
        this.repoDependencyId = data.repoDependencyId;
        this.dependencyId = data.dependencyId;
        this.versionOperator = data.versionOperator;
        this.version = data.version;
        this.versionText = data.versionText;
        this.dependencyType = data.dependencyType;
        this.insertedAt = data.insertedAt;
    }

    static async getById(id) {
        const result = await prisma.dependencyMapping.findUnique({
            where: { id }
        });
        return result ? new DependencyMapping(result) : null;
    }

    static async getByRepoDependencyAndDependency(repoDependencyId, dependencyId) {
        const result = await prisma.dependencyMapping.findUnique({
            where: {
                repoDependencyId_dependencyId: {
                    repoDependencyId,
                    dependencyId
                }
            }
        });
        return result ? new DependencyMapping(result) : null;
    }

    /**
     * 
     * @param {Partial<DependencyMapping>} data 
     * @returns 
     */
    static async create(data) {
        const result = await prisma.dependencyMapping.create({
            data
        });
        return new DependencyMapping(result);
    }

    static async update(id, updates) {
        return prisma.dependencyMapping.update({
            where: { id },
            data: updates
        });
    }

}

export default DependencyMapping;
