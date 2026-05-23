import { redis } from "./redis";

export class TaskTracker {
    private static PREFIX = "academic_task:";

    /**
     * Starts a new task and sets its initial progress.
     */
    static async startTask(taskId: string, totalSteps: number, description: string) {
        const key = `${this.PREFIX}${taskId}`;
        await redis.hmset(key, {
            status: "running",
            current: 0,
            total: totalSteps,
            description,
            startTime: Date.now()
        });
        // Expire after 1 hour to keep Redis clean
        await redis.expire(key, 3600);
    }

    /**
     * Updates the progress of a running task.
     */
    static async updateProgress(taskId: string, current: number) {
        const key = `${this.PREFIX}${taskId}`;
        await redis.hset(key, "current", current);
    }

    /**
     * Marks a task as complete.
     */
    static async completeTask(taskId: string) {
        const key = `${this.PREFIX}${taskId}`;
        await redis.hmset(key, {
            status: "completed",
            endTime: Date.now()
        });
    }

    /**
     * Marks a task as failed.
     */
    static async failTask(taskId: string, error: string) {
        const key = `${this.PREFIX}${taskId}`;
        await redis.hmset(key, {
            status: "failed",
            error,
            endTime: Date.now()
        });
    }

    /**
     * Gets the current status of a task.
     */
    static async getTaskStatus(taskId: string) {
        const key = `${this.PREFIX}${taskId}`;
        const data = await redis.hgetall(key);
        if (!data || Object.keys(data).length === 0) return null;
        return {
            status: data.status,
            current: parseInt(data.current || "0"),
            total: parseInt(data.total || "0"),
            description: data.description,
            error: data.error,
            startTime: parseInt(data.startTime || "0"),
            endTime: data.endTime ? parseInt(data.endTime) : null
        };
    }
}
