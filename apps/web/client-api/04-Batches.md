# 04 — Batches

Routes in `src/routes/client/batch.route.ts`, service in `src/services/client/batch.service.ts` (plus `src/services/order.service.ts` for checkout/enroll flows). Mounted at **`/api/batches`** and guarded by `authenticate → authorize("STUDENT") → authenticatedRateLimiter`.

A **batch** is a purchasable course package that owns a hierarchy of Subjects → Chapters → Topics → Contents, plus Schedules (live classes). Clients only ever see **`status === "ACTIVE"`** batches.

---

## Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/batches` | Paginated list of active **unpurchased** batches |
| GET | `/api/batches/my-batches` | Paginated list of batches the user has purchased |
| GET | `/api/batches/:identifier` | Single batch by `id` or `slug` (includes `isPurchased`) |
| GET | `/api/batches/:batchId/schedules` | All live-class schedules for a batch the user owns |
| POST | `/api/batches/:id/checkout` | Create a Razorpay order for a paid batch |
| POST | `/api/batches/:batchId/enroll-free` | Enroll in a free batch without payment |
| POST | `/api/batches/verify-payment` | Verify Razorpay signature, finalize enrollment |

> The last three (checkout / free enroll / verify-payment) are documented in depth in [`12-Orders-And-Payments.md`](./12-Orders-And-Payments.md). They're listed here because they are mounted under `/api/batches`, but the request/response details live with the payment docs.

---

## 1. `GET /api/batches` — list active batches

Paginated list of ACTIVE batches that the user **has not yet purchased**.

Query params (Zod `paginationSchema`):

- `page` (default `1`, min `1`)
- `limit` (default `10`, min `1`, max `100`)

Service (`getAllBatches`):

1. Fetch all ACTIVE batches for `organizationId`, ordered by `createdAt DESC`.
2. Pull teacher mappings and attach `teachers[]`.
3. Look up `user_batch_mapping` rows for the user to figure out which batch IDs are already purchased.
4. **Filter out** purchased batches (so this endpoint is a "browse catalog" list, not "all").
5. Attach `validity` (derived from `startDate`/`endDate`) and `discountedPrice`.

Success response:

```json
{
  "success": true,
  "message": "Batches retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "JEE Advanced 2026 Full Course",
      "slug": "jee-adv-2026",
      "class": "12",
      "exam": "JEE",
      "startDate": "...",
      "endDate": "...",
      "totalPrice": 25000,
      "discountPercentage": 20,
      "discountedPrice": 20000,
      "validity": { "days": 365, "expiresAt": "..." },
      "teachers": [ { "id": "...", "name": "..." } ],
      "isPurchased": false
    }
  ],
  "pagination": {
    "page": 1, "limit": 10,
    "totalCount": 17, "totalPages": 2,
    "hasNextPage": true, "hasPrevPage": false
  }
}
```

### Caching

- Key: `batch:list:${orgId}:${userId}:${page}:${limit}`
- TTL: `MEDIUM` (15 minutes)
- `userId` is in the key because `isPurchased` is user-specific.

---

## 2. `GET /api/batches/my-batches` — purchased batches

Paginated list of the user's **purchased** batches (via `user_batch_mapping`).

Query: same `page` / `limit` as above.

Each entry includes all batch fields plus:

- `isPurchased: true`
- `purchasedAt` (the `startDate` of the mapping)
- `expiresAt` (the mapping's `expiresAt`, typically the batch's `endDate`)

### Caching

- Key: `batch:purchased:${orgId}:${userId}:${page}:${limit}`
- TTL: `SHORT` (5 minutes) — enrollment changes should reflect quickly.

---

## 3. `GET /api/batches/:identifier` — batch detail

`:identifier` can be either a **UUID** or a **slug**. The route uses a regex to detect which:

```167:174:src/routes/client/batch.route.ts
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier
      );
    ...
    return isUUID
      ? `batch:${identifier}:user:${userId}`
      : `batch:slug:${identifier}:user:${userId}`;
```

Service (`getBatch`):

- Only finds batches where `organizationId` matches the caller AND `status === "ACTIVE"`. Otherwise 404.
- Returns the batch + `validity`, `discountedPrice`, `teachers[]`, `isPurchased`, `purchasedAt`.

### Caching

- Keys: `batch:<uuid>:user:<userId>` or `batch:slug:<slug>:user:<userId>`
- TTL: `MEDIUM` (15 minutes)

Errors: `404` if not found / not ACTIVE / not in user's org.

---

## 4. `GET /api/batches/:batchId/schedules`

Live-class schedules for a single batch **the user owns**. See [`07-Schedules.md`](./07-Schedules.md) for schedule shape details. If the user hasn't purchased the batch, the service returns **`[]`** (not a 403) — the frontend can render an "enroll to see schedule" state.

Path param validation: `batchId` is a UUID (Zod).

Response:

```json
{
  "success": true,
  "message": "Schedules retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Live class #1",
      "scheduledAt": "...",
      "duration": 60,
      "status": "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED",
      "subject": { "...": "..." },
      "topic": { "...": "..." },
      "teacher": { "...": "..." },
      "content": { "...": "..." },
      "batch": { "...": "..." }
    }
  ]
}
```

`status` is **re-computed server-side** based on `scheduledAt + duration` vs now, so `SCHEDULED / LIVE / COMPLETED` reflect reality even if the DB row hasn't been updated (except for `CANCELLED`, which is respected as-is).

---

## 5. `POST /api/batches/:id/checkout` — create order

Creates a Razorpay order for a paid batch. Full details in [`12-Orders-And-Payments.md`](./12-Orders-And-Payments.md). Short version:

- `:id` is a UUID (validated).
- Body: empty.
- Response:

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "<internal uuid>",
    "razorpayOrderId": "<rp_xxx>",
    "amount": 20000,
    "currency": "INR",
    "key": "<razorpay key id — organization-specific>",
    "batchName": "...",
    "originalPrice": 25000,
    "discountAmount": 5000,
    "finalPrice": 20000
  }
}
```

Errors:

- 404 if the batch doesn't exist.
- 400 if the batch is not `ACTIVE`, is free (use `enroll-free` instead), or the user has already purchased it.

---

## 6. `POST /api/batches/:batchId/enroll-free`

Free-enrollment path. No Razorpay call, directly inserts the `user_batch_mapping`. Details in the payment doc. Returns:

```json
{
  "success": true,
  "message": "Enrolled in free batch successfully",
  "data": {
    "success": true,
    "enrollmentId": "uuid",
    "expiresAt": "<batch endDate>"
  }
}
```

---

## 7. `POST /api/batches/verify-payment`

After the Razorpay popup closes successfully, the frontend POSTs the three IDs + signature here to:

- Validate the HMAC signature using **this org's** Razorpay secret.
- Flip the order to `SUCCESS`.
- Create the `user_batch_mapping` row.
- Invalidate all user/batch caches.

See [`12-Orders-And-Payments.md`](./12-Orders-And-Payments.md#verify-payment) for the body shape.

---

## Cache invalidation

All of the above caches are keyed with `userId` where user-specific fields are exposed, so they are safe to reuse across users. On successful paid enrollment or free enrollment the backend calls:

```340:347:src/services/order.service.ts
  if (order.entityType === "BATCH") {
    await enrollUserInBatch(order);
    // Invalidate batch-related caches for this user
    await CacheManager.invalidateBatch(order.entityId, order.organizationId);
```

So fresh GETs right after payment will show the updated `isPurchased` state.

---

## Authorization details

Every route in this file requires:

- Valid JWT (`type: "session"`).
- `role === "STUDENT"` (enforced once at the router mount in `client.route.ts`).
- Rate limit: `authenticatedRateLimiter` (500 req/min).

---

## cURL quick reference

```bash
# List
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/batches?page=1&limit=10"

# Detail by slug
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/batches/jee-adv-2026"

# Purchased
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/batches/my-batches"

# Schedules
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/batches/<batchId>/schedules"

# Checkout
curl -X POST -H "Authorization: Bearer $TOKEN" "$BASE/api/batches/<batchId>/checkout"

# Free enroll
curl -X POST -H "Authorization: Bearer $TOKEN" "$BASE/api/batches/<batchId>/enroll-free"

# Verify payment
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"orderId":"...","razorpayPaymentId":"...","razorpayOrderId":"...","razorpaySignature":"..."}' \
  "$BASE/api/batches/verify-payment"
```
