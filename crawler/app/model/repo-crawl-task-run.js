import { LEAST_START_COUNT_FOR_REPO } from '../constants.js';
import prisma from '../prisma.js';

class RepoCrawlTaskRun {
	constructor(data) {
		this.id = data.id;
		this.taskKey = data.taskKey;
		this.starCursor = data.starCursor;
		this.lastRunAt = data.lastRunAt;
		this.isCompleted = data.isCompleted;
		this.error = data.error;
		this.completedCount = data.completedCount ?? 0;
	}

	checkAndResetRun() {
		if (!this.lastRunAt) return;
		const isADayPassedUntilLastRun = new Date() - this.lastRunAt > 1000 * 60 * 60 * 24;
		if (isADayPassedUntilLastRun && this.isCompleted) {
			this.isCompleted = false;
			this.starCursor = LEAST_START_COUNT_FOR_REPO - 1;
		}
	}

	async updateRun(starCursor, isCompleted) {
		this.starCursor = starCursor;
		this.lastRunAt = new Date();
		this.isCompleted = isCompleted;
		if (isCompleted) {
			this.completedCount = this.completedCount + 1;
		}
		return await RepoCrawlTaskRun.update(this.id, {
			starCursor: this.starCursor,
			lastRunAt: this.lastRunAt,
			isCompleted: this.isCompleted,
			completedCount: this.completedCount,
		});
	}

	static async getOrCreateByKey(taskKey) {
		let taskRun = await RepoCrawlTaskRun.getByTaskKey(taskKey);
		if (!taskRun) {
			taskRun = await RepoCrawlTaskRun.new({ taskKey });
		}
		taskRun.checkAndResetRun();
		return taskRun;
	}

	static async getByTaskKey(taskKey) {
		const result = await prisma.repoCrawlTaskRun.findFirst({
			where: { taskKey },
			orderBy: { id: 'desc' },
			take: 1,
		});
		return result ? new RepoCrawlTaskRun(result) : null;
	}

	/**
	 *
	 * @param {string} id
	 * @param {Partial<RepoCrawlTaskRun>} updates
	 */
	static async update(id, updates) {
		const response = await prisma.repoCrawlTaskRun.update({
			where: { id },
			data: updates,
		});
		return new RepoCrawlTaskRun(response);
	}

	static async new({ taskKey }) {
		const result = await prisma.repoCrawlTaskRun.create({
			data: {
				taskKey,
				starCursor: LEAST_START_COUNT_FOR_REPO - 1,
				lastRunAt: new Date(),
				isCompleted: false,
			},
		});

		return new RepoCrawlTaskRun(result);
	}
}

export default RepoCrawlTaskRun;
