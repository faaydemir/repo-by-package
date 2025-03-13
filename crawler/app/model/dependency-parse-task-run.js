import prisma from '../prisma.js';

class DependencyParseTaskRun {
	constructor(data) {
		this.id = data.id;
		this.taskKey = data.taskKey;
		this.lastRunAt = data.lastRunAt;
		this.isCompleted = data.isCompleted;
		this.error = data.error;
		this.idCursor = data.idCursor;
		this.completedCount = data.completedCount ?? 0;
	}

	static async getByTaskKey(taskKey) {
		const result = await prisma.dependencyParseTaskRun.findFirst({
			where: { taskKey },
			orderBy: { id: 'desc' },
			take: 1,
		});
		return result ? new DependencyParseTaskRun(result) : null;
	}

	async updateRun(idCursor) {
		this.idCursor = idCursor;
		this.lastRunAt = new Date();
		return await DependencyParseTaskRun.update(this.id, { idCursor: this.idCursor, lastRunAt: this.lastRunAt });
	}

	async completed() {
		//TODO: isCompleted is not used
		this.isCompleted = true;
		this.lastRunAt = new Date();
		this.idCursor = 0;
		this.completedCount = this.completedCount + 1;
		return await DependencyParseTaskRun.update(this.id, {
			isCompleted: this.isCompleted,
			lastRunAt: this.lastRunAt,
			idCursor: this.idCursor,
			completedCount: this.completedCount,
		});
	}

	/**
	 *
	 * @param {string} id
	 * @param {Partial<DependencyParseTaskRun>} updates
	 */
	static async update(id, updates) {
		const response = await prisma.dependencyParseTaskRun.update({
			where: { id },
			data: updates,
		});
		return new DependencyParseTaskRun(response);
	}

	static async getOrCreateByKey(taskKey) {
		let taskRun = await DependencyParseTaskRun.getByTaskKey(taskKey);
		if (!taskRun) {
			taskRun = await DependencyParseTaskRun.new({ taskKey });
		}
		return taskRun;
	}

	static async new({ taskKey }) {
		const result = await prisma.dependencyParseTaskRun.create({
			data: {
				isCompleted: false,
				taskKey,
				idCursor: 0,
				lastRunAt: new Date(),
			},
		});

		return new DependencyParseTaskRun(result);
	}
}

export default DependencyParseTaskRun;
