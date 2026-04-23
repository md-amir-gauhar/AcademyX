import { Request, Response, NextFunction } from "express";
import { CacheManager } from "../services/cache.service";

/**
 * Middleware to cache GET request responses
 *
 * Usage:
 * router.get('/endpoint', cache(300), handler)
 *
 * @param ttl - Time to live in seconds
 * @param keyGenerator - Optional custom key generator function
 */
export const cache = (ttl: number, keyGenerator?: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Generate cache key
    const cacheKey =
      keyGenerator?.(req) ||
      `route:${req.baseUrl}${req.path}:${JSON.stringify(req.query)}:${
        req.user?.organizationId || "public"
      }`;

    try {
      // Try to get cached response
      const cachedData = await CacheManager.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (data: any) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheManager.set(cacheKey, data, ttl).catch((err) =>
            console.error("Cache set error:", err)
          );
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

/**
 * Middleware to cache GET requests with custom key based on entity ID
 */
export const cacheById = (
  entityType: string,
  ttl: number,
  idParam: string = "id"
) => {
  return cache(ttl, (req) => {
    const id = req.params[idParam];
    const orgId = req.user?.organizationId || "public";
    return `${entityType}:${id}:${orgId}`;
  });
};

/**
 * Middleware to cache list endpoints with pagination
 */
export const cacheList = (
  entityType: string,
  ttl: number,
  additionalParams?: string[]
) => {
  return cache(ttl, (req) => {
    const orgId = req.user?.organizationId || "public";
    const page = req.query.page || "1";
    const limit = req.query.limit || "10";

    const additional = additionalParams
      ?.map((param) => req.params[param] || req.query[param])
      .filter(Boolean)
      .join(":");

    return additional
      ? `${entityType}:list:${additional}:${orgId}:${page}:${limit}`
      : `${entityType}:list:${orgId}:${page}:${limit}`;
  });
};
