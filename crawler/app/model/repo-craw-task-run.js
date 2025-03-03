import prisma from "../prisma.js";


class RepoCrawTaskRun {


    constructor(data) {
        this.id = data.id;
        this.taskKey = data.taskKey;
        this.maxStars = data.maxStars;
        this.lastRunAt = data.lastRunAt;
        this.isBackwardCompleted = data.isBackwardCompleted;
        this.error = data.error;
    }

    static async getByTaskKey(taskKey) {
        const result = await prisma.repoCrawTaskRun.findFirst({
            where: { taskKey },
            orderBy: { id: 'desc' },
            take: 1
        });
        return result ? new RepoCrawTaskRun(result) : null;
    }

    /**
     * 
     * @param {string} id 
     * @param {Partial<RepoCrawTaskRun>} updates 
     */
    static async update(id, updates) {

        const response = await prisma.repoCrawTaskRun.update({
            where: { id },
            data: updates
        });
        return new RepoCrawTaskRun(response);
    }

    static async create({
        taskKey,
        maxStars = null,
        lastRunAt = null,
        isBackwardCompleted = false
    }) {
        const result = await prisma.repoCrawTaskRun.create({
            data: {
                taskKey,
                maxStars,
                lastRunAt,
                isBackwardCompleted
            }
        });

        return new RepoCrawTaskRun(result);
    }
}

export default RepoCrawTaskRun;