import Redis from "ioredis";

// Ensure a singleton instance in development to avoid connection leaks
const globalForRedis = global as unknown as {
    redis: Redis | undefined;
};

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis =
    globalForRedis.redis ??
    new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            if (times > 3) {
                console.error("Redis connection failed. Max retries exceeded.");
                return null; // Stop retrying
            }
            return Math.min(times * 50, 2000);
        },
    });

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
}
