import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("⚠️  REDIS_URL not found. Caching will be disabled.");
}

// Create Redis client
export const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          // Reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
    })
  : null;

// Redis event handlers
if (redis) {
  redis.on("connect", () => {
    console.log("✅ Redis connected successfully");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis error:", err);
  });

  redis.on("reconnecting", () => {
    console.log("🔄 Redis reconnecting...");
  });
}

// Export connection status
export const isRedisAvailable = (): boolean => {
  return redis !== null && redis.status === "ready";
};
