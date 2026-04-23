# QueztLearn Client API — Overview

This documentation set covers every HTTP endpoint exposed to the **client (student) applications** by the QueztLearn backend service (`queztlearn-svc`). Each section is broken into its own file so a frontend engineer can pick exactly the module they need.

> For admin/teacher endpoints (mounted under `/admin`) see the separate admin docs (not covered here).

---

## 1. Where client routes live

Everything the frontend talks to is mounted under `/api` in `src/index.ts`:

```82:84:src/index.ts
app.use("/health-check", healthRoutes);
app.use("/admin", adminRoutes);
app.use("/api", clientRoutes);
```

The client route tree is assembled in `src/routes/client.route.ts`:

```23:47:src/routes/client.route.ts
// Public routes (no authentication required)
router.use("/auth", clientAuthRoute);
router.use("/auth", otpAuthRoute); // OTP-based authentication
router.use("/organization-config", clientOrgConfigRoute);

const studentAuth = [
  authenticate,
  authorize("STUDENT"),
  authenticatedRateLimiter,
];

router.use("/batches", ...studentAuth, batchRouter);
router.use("/subjects", ...studentAuth, subjectRouter);
router.use("/chapters", ...studentAuth, chapterRouter);
router.use("/topics", ...studentAuth, topicRouter);
router.use("/contents", ...studentAuth, contentRouter);
router.use("/content", ...studentAuth, contentProgressRouter);
router.use("/schedules", ...studentAuth, scheduleRouter);
router.use("/test-series", ...studentAuth, testSeriesRouter);
router.use("/tests", ...studentAuth, testRouter);
router.use("/attempts", ...studentAuth, testAttemptRouter);
router.use("/profile", ...studentAuth, userProfileRouter);
router.use("/orders", ...studentAuth, orderRouter);
router.use("/upload", authenticatedRateLimiter, uploadRoute);
```

---

## 2. Route groups (index)

| Group | Base path | Doc |
|---|---|---|
| Authentication (Email/Password) | `/api/auth/*` | [`01-Authentication-Email-Password.md`](./01-Authentication-Email-Password.md) |
| Authentication (OTP) | `/api/auth/*` | [`02-Authentication-OTP.md`](./02-Authentication-OTP.md) |
| Organization Config (public) | `/api/organization-config/:slug` | [`03-Organization-Config.md`](./03-Organization-Config.md) |
| Batches | `/api/batches/*` | [`04-Batches.md`](./04-Batches.md) |
| Course hierarchy (subjects / chapters / topics / contents) | `/api/subjects/*`, `/api/chapters/*`, `/api/topics/*`, `/api/contents/*` | [`05-Course-Hierarchy.md`](./05-Course-Hierarchy.md) |
| Content Progress (video tracking) | `/api/content/*` | [`06-Content-Progress.md`](./06-Content-Progress.md) |
| Schedules (live classes) | `/api/schedules/*` | [`07-Schedules.md`](./07-Schedules.md) |
| Test Series | `/api/test-series/*` | [`08-Test-Series.md`](./08-Test-Series.md) |
| Tests (preview) | `/api/tests/*` | [`09-Tests.md`](./09-Tests.md) |
| Test Attempts | `/api/attempts/*` | [`10-Test-Attempts.md`](./10-Test-Attempts.md) |
| User Profile | `/api/profile` | [`11-User-Profile.md`](./11-User-Profile.md) |
| Orders & Payments | `/api/orders/*` + checkout under batches/test-series | [`12-Orders-And-Payments.md`](./12-Orders-And-Payments.md) |
| Uploads | `/api/upload/*` | [`13-Upload.md`](./13-Upload.md) |
| Cross-cutting middleware (auth, rate-limit, cache, validation) | n/a | [`14-Middleware-And-Cross-Cutting.md`](./14-Middleware-And-Cross-Cutting.md) |

---

## 3. Auth model in one paragraph

- Students can register via **email/password** or **mobile OTP**. Both flows end with a JWT (`type: "session"`).
- Every non-auth client route requires **`Authorization: Bearer <accessToken>`** AND the user must have `role === "STUDENT"` AND `isVerified === true`.
- The OTP flow additionally returns a **refresh token** (`type: "refresh"`) which can be exchanged for a fresh access token at `POST /api/auth/refresh-token`.

See `src/middlewares/auth.middleware.ts` for the enforcement:

```62:86:src/middlewares/auth.middleware.ts
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

---

## 4. Standard response envelope

All client endpoints return JSON in one of these shapes.

Success:

```json
{
  "success": true,
  "data": { /* resource or object */ },
  "message": "Human readable success message"
}
```

Paginated success:

```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1, "limit": 10,
    "totalCount": 42, "totalPages": 5,
    "hasNextPage": true, "hasPrevPage": false
  },
  "message": "..."
}
```

Error (any 4xx/5xx):

```json
{
  "success": false,
  "message": "Reason",
  "errors": [ { "field": "email", "message": "Invalid email" } ]
}
```

Validation errors (Zod) always use the `errors[]` array form. The Express global error handler in `src/index.ts` catches thrown `ApiError` and plain `Error` objects.

---

## 5. Multi-tenancy (organization scoping)

Every meaningful row in the DB carries an `organizationId`. The server reads it from:

1. The JWT payload (for authenticated requests — attached to `req.user.organizationId`), or
2. The public `:slug` parameter on `/organization-config/:slug`.

Students **cannot** see entities that don't match their organization — all client services filter by `organizationId` as well as by `status === "ACTIVE"`.

Razorpay keys are also **per organization** — see [`12-Orders-And-Payments.md`](./12-Orders-And-Payments.md).

---

## 6. Rate limiting

Two rate limiters are applied to client routes (Redis-backed, sliding window via `INCR`+`EXPIRE`):

| Limiter | Used on | Limit |
|---|---|---|
| `publicRateLimiter` | `/api/auth/*`, `/api/organization-config/:slug` | 100 req / min |
| `authenticatedRateLimiter` | everything behind auth, including `/api/upload/*` | 500 req / min |

If Redis is down in production the request is **rejected with 503**; in development it is allowed through. See `src/middlewares/rate-limiter.middleware.ts`.

---

## 7. Caching

Most `GET` responses are Redis-cached via the `cache(ttl, keyGen)` middleware (`src/middlewares/cache.middleware.ts`). Key generators always include `userId` when the response contains **user-specific fields** (e.g. `isPurchased`, `isEnrolled`), otherwise caching would leak user data across accounts.

TTL constants live in `src/services/cache.service.ts`:

| Name | Seconds | Usage |
|---|---|---|
| `SHORT` | 300 (5 min) | purchased/enrolled lists, progress, recently-watched |
| `MEDIUM` | 900 (15 min) | catalog listings and detail pages |
| `LONG` | 3600 (1 h) | organization config |

---

## 8. OpenAPI / Swagger

Swagger UI is served from `/api-docs` (see `src/index.ts`). Every client route has `@openapi` JSDoc blocks, which is the live source of truth for request/response schemas. These Markdown files summarize those blocks.

---

## 9. Conventions used in the per-endpoint docs

Each endpoint doc page will list:

- **Method + path**
- **Auth requirement**
- **Path / query / body parameters** (with Zod validators where applicable)
- **Success response shape**
- **Common error codes**
- **Backing service function** (for the curious — it points into `src/services/...`)
- **Caching behavior** (key pattern and TTL) where applicable
