import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class Dependency {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.provider = data.provider;
    }

    static async getById(id) {
        const result = await prisma.dependency.findUnique({
            where: { id }
        });
        return result ? new Dependency(result) : null;
    }

    static async firstByNameAndProvider(name, provider) {
        const result = await prisma.dependency.findFirst({
            where: { name, provider }
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
            data
        });
        return new Dependency(result);
    }

    static async update(id, updates) {
        return prisma.dependency.update({
            where: { id },
            data: updates
        });
    }

    static async delete(id) {
        return prisma.dependency.delete({
            where: { id }
        });
    }
}

export default Dependency;
