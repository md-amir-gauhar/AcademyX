import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { HTTP_STATUS } from "../common/constants";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

/**
 * Redis-based rate limiter using INCR + EXPIRE
 * Uses sliding window approach with Redis atomic operations
 */
export const createRateLimiter = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Fail closed in production - reject if Redis unavailable
    // Only bypass in development for convenience
    if (!redis) {
      const isDevelopment = process.env.NODE_ENV === "development";

      if (isDevelopment) {
        console.warn(
          "⚠️  Rate limiting disabled - Redis not available (development mode)"
        );
        return next();
      } else {
        console.error(
          "❌ Rate limiting failed - Redis not available (production mode)"
        );
        return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          success: false,
          message: "Service temporarily unavailable. Please try again later.",
        });
      }
    }

    try {
      // Generate rate limit key based on IP and user (if authenticated)
      const identifier = req.user?.id || req.ip || "unknown";
      const key = `ratelimit:${config.keyPrefix}:${identifier}`;

      // Increment the counter atomically
      const requests = await redis.incr(key);

      // Set expiration on first request
      if (requests === 1) {
        await redis.expire(key, Math.ceil(config.windowMs / 1000));
      }

      // Get TTL for rate limit reset time
      const ttl = await redis.ttl(key);
      const resetTime = Date.now() + ttl * 1000;

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, config.maxRequests - requests).toString()
      );
      res.setHeader("X-RateLimit-Reset", resetTime.toString());

      // Check if rate limit exceeded
      if (requests > config.maxRequests) {
        const retryAfter = Math.ceil(ttl);
        res.setHeader("Retry-After", retryAfter.toString());

        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          success: false,
          message: "Too many requests. Please try again later.",
          error: {
            limit: config.maxRequests,
            windowMs: config.windowMs,
            retryAfter: `${retryAfter} seconds`,
            resetAt: new Date(resetTime).toISOString(),
          },
        });
      }

      next();
    } catch (error) {
      // On Redis error, log and allow request (fail open)
      console.error("Rate limiter error:", error);
      next();
    }
  };
};

/**
 * Rate limiter for authenticated API routes
 * Limit: 500 requests per minute
 */
export const authenticatedRateLimiter = createRateLimiter({
  maxRequests: 500,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: "auth",
});

/**
 * Rate limiter for public routes (register, verify, login, etc.)
 * Limit: 100 requests per minute
 */
export const publicRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: "public",
});

/**
 * Strict rate limiter for sensitive operations (password reset, etc.)
 * Limit: 10 requests per 15 minutes
 */
export const strictRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyPrefix: "strict",
});

/**
 * Rate limiter for health check and monitoring endpoints
 * Limit: 60 requests per minute
 */
export const healthCheckRateLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: "health",
});
