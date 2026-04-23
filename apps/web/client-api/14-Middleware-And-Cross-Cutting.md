# 14 — Middleware & Cross-Cutting Concerns

This page collects behaviour that applies to every client endpoint: authentication, authorization, rate limiting, caching, validation, error handling. Files live in `src/middlewares/` and `src/common/`.

---

## 1. Authentication (`src/middlewares/auth.middleware.ts`)

Three exports used by client routes:

| Middleware | What it does |
|---|---|
| `authenticate` | Requires `Authorization: Bearer <jwt>`. Rejects if missing / invalid / expired / type != "session" / user not found / `!isVerified`. Attaches `req.user = { id, email, role, organizationId }`. |
| `authorize(...roles)` | Must be called after `authenticate`. Rejects if `req.user.role` not in `roles`. Client router hardcodes `authorize("STUDENT")` for all protected routes. |
| `checkOrganization` | Confirms `req.user.organizationId === req.params.organizationId || req.body.organizationId`. Rarely used on client routes. |
| `optionalAuth` | Attaches `req.user` if a valid session token is present; otherwise continues without error. Not currently used by client routes. |

Key enforcement excerpt (session-token only, must be verified):

```60:86:src/middlewares/auth.middleware.ts
    if (decoded.type !== "session") {
      throw new ApiError(
        "Invalid token type. Please use a session token.",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    ...

    if (!userData.isVerified) {
      throw new ApiError(
        ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
        HTTP_STATUS.FORBIDDEN
      );
    }
```

Error codes:

| Code | When |
|---|---|
| 401 | Missing / malformed `Authorization` header, invalid / expired JWT, wrong `type`. |
| 403 | User exists but `!isVerified`, or role fails `authorize(...)`. |
| 404 | `userId` in the token no longer exists in DB (user deleted). |

---

## 2. Rate limiting (`src/middlewares/rate-limiter.middleware.ts`)

Redis-backed via `INCR` + `EXPIRE`. Response headers are always set:

```
X-RateLimit-Limit: <n>
X-RateLimit-Remaining: <n>
X-RateLimit-Reset: <epoch ms>
Retry-After: <seconds>   ← only on 429
```

Pre-configured instances:

| Name | Limit | Used on |
|---|---|---|
| `publicRateLimiter` | 100 / min | `/api/auth/*`, `/api/organization-config/:slug` |
| `authenticatedRateLimiter` | 500 / min | every `/api/*` route behind auth (including `/api/upload/*`) |
| `strictRateLimiter` | 10 / 15 min | reserved for sensitive ops (not currently wired to client routes) |
| `healthCheckRateLimiter` | 60 / min | `/health-check` |

### Failure mode when Redis is down

```19:36:src/middlewares/rate-limiter.middleware.ts
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
```

- **Production + Redis down → 503.**
- **Development + Redis down → allowed through (with a console warning).**
- Other Redis errors (e.g. transient) during a request → **fail open** (request allowed through).

429 response body:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error": {
    "limit": 500,
    "windowMs": 60000,
    "retryAfter": "42 seconds",
    "resetAt": "2025-01-01T00:00:42.000Z"
  }
}
```

---

## 3. Caching (`src/middlewares/cache.middleware.ts` + `src/services/cache.service.ts`)

Small wrapper around `CacheManager` (Redis-backed). Only used on `GET` requests — it's a no-op for anything else.

Signature:

```ts
cache(ttl: number, keyGenerator?: (req: Request) => string)
```

Default key (if no generator passed):

```
route:<baseUrl><path>:<JSON query>:<orgId|"public">
```

On cache hit → returns the cached JSON directly.
On cache miss → proxies `res.json` and writes the body only if `statusCode < 300`.

TTL presets (`CacheTTL`):

| Name | Seconds | Typical use |
|---|---|---|
| `SHORT` | 300 (5 min) | Enrolled/purchased lists, personal progress, order history, recently-watched |
| `MEDIUM` | 900 (15 min) | Catalog listings, entity detail |
| `LONG` | 3600 (1 hr) | Public organization config |

### Key-design rule the code follows

Any cached response that includes user-specific flags (`isPurchased`, `isEnrolled`, `hasAttempted`, personal progress, etc.) embeds `userId` in the cache key. For example:

```62:68:src/routes/client/batch.route.ts
  cache(CacheTTL.MEDIUM, (req) => {
    const userId = req.user?.id;
    const orgId = req.user?.organizationId;
    const page = req.query.page || "1";
    const limit = req.query.limit || "10";
    // CRITICAL: Must include userId because response contains user-specific isPurchased field
    return `batch:list:${orgId}:${userId}:${page}:${limit}`;
  }),
```

### Invalidation hooks

- Paid enrollment / free enrollment / payment verification invalidates the appropriate batch/series caches.
- Video progress heartbeat invalidates `recently-watched:<orgId>:<userId>`.
- Admin mutations (outside this doc scope) invalidate catalog entries.

---

## 4. Validation (`src/middlewares/validate.middleware.ts`)

Three Zod-based helpers used across client routes:

| Helper | Parses |
|---|---|
| `validate(schema)` | `req.body` |
| `validateQuery(schema)` | `req.query` |
| `validateParams(schema)` | `req.params` |

On Zod failure, the response is always:

```json
{
  "success": false,
  "message": "Validation failed" | "Query validation failed" | "Params validation failed",
  "errors": [
    { "field": "countryCode", "message": "Invalid country code" }
  ]
}
```

Status code: **400**.

Schemas live under `src/validators/`. Inline ad-hoc schemas (e.g. `z.object({ batchId: z.string().uuid() })`) are also common inside the route files for simple UUID param checks.

---

## 5. Async error handler (`src/middlewares/async-handler.ts`)

Thin wrapper that catches `Promise` rejections inside Express handlers and forwards them to `next(err)`. Every route handler you see is wrapped with `asyncHandler(...)`.

---

## 6. Global error handler

Registered at the bottom of `src/index.ts`:

```85:96:src/index.ts
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  console.error("Error:", err);

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err.error : undefined,
  });
});
```

Best practice when writing new services: throw `ApiError(message, status)` from `src/common/response.ts` so the status code maps correctly. Plain `throw new Error(...)` falls through to **500**.

---

## 7. HTTP status & message constants (`src/common/constants.ts`)

Single source of truth for numeric codes and common user-facing strings:

```ts
HTTP_STATUS.OK          // 200
HTTP_STATUS.CREATED     // 201
HTTP_STATUS.BAD_REQUEST // 400
HTTP_STATUS.UNAUTHORIZED// 401
HTTP_STATUS.FORBIDDEN   // 403
HTTP_STATUS.NOT_FOUND   // 404
HTTP_STATUS.CONFLICT    // 409
HTTP_STATUS.TOO_MANY_REQUESTS   // 429
HTTP_STATUS.INTERNAL_SERVER_ERROR // 500
HTTP_STATUS.SERVICE_UNAVAILABLE   // 503
```

Also exports `ERROR_MESSAGES` (strings) and `TOKEN_CONFIG`:

```58:61:src/common/constants.ts
export const TOKEN_CONFIG = {
  VERIFICATION_EXPIRY_HOURS: 24,
  SESSION_EXPIRY_DAYS: 7,
} as const;
```

And `VALIDATION_RULES.PASSWORD_MIN_LENGTH = 8`.

---

## 8. Security headers / CORS (`src/index.ts`)

CORS is configured with a dynamic origin allowlist:

- `process.env.FRONTEND_URL`
- `https://www.queztlearn.com`
- `https://queztlearn.com`
- Any `https://*.queztlearn.com` (subdomain tenants)
- `http://localhost:*` and `http://*.localhost:*` (local dev)
- `http://127.0.0.1:*`

`credentials: true`, exposes `Content-Range` and `X-Content-Range`.

Allowed headers: `Content-Type`, `Authorization`, `X-Requested-With`, `Accept`.

`helmet` adds standard security headers (HSTS 1 year + preload, CSP locked to `self` with inline styles allowed).

Payload limits: `express.json({ limit: "10mb" })` and `express.urlencoded({ limit: "10mb" })`.

---

## 9. Where to start reading if you need to dig deeper

- Global entrypoint & middleware stack: `src/index.ts`
- Client router tree: `src/routes/client.route.ts`
- Auth & RBAC: `src/middlewares/auth.middleware.ts`
- Rate limiter: `src/middlewares/rate-limiter.middleware.ts`
- Caching middleware + keys + invalidation: `src/middlewares/cache.middleware.ts` and `src/services/cache.service.ts`
- Zod validation: `src/middlewares/validate.middleware.ts` + `src/validators/*`
- Error class: `src/common/response.ts`
- Constants: `src/common/constants.ts`
- OpenAPI served at `/api-docs` — every route has `@openapi` JSDoc blocks which are the authoritative schemas.

---

## 10. Request/response lifecycle at a glance

```
 client
   │  Authorization: Bearer ...
   ▼
[helmet] → [cors] → [json/urlencoded] → /api → [authenticate] → [authorize("STUDENT")] → [authenticatedRateLimiter]
                                              ↑ (skipped for /api/auth/* and /api/organization-config/:slug)
   ▼
 [validate | validateQuery | validateParams] → [cache (GET)] → asyncHandler(route logic) → service(DB/Redis/3rd party)
   ▼
 (success or error) → res.json(...) → if 2xx-and-cacheable, stored in Redis → respond
                                    ↓
                                 errors → global error handler → JSON envelope
```
