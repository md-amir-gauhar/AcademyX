# 12 — Orders & Payments (Razorpay)

Service: `src/services/order.service.ts`. The endpoints are split across three routers, but they share one service:

- Batch checkout/verify/free-enroll — `src/routes/client/batch.route.ts` → `/api/batches/*`
- Test-series checkout/verify/free-enroll — `src/routes/client/test-series.route.ts` → `/api/test-series/*`
- Order history — `src/routes/client/order.route.ts` → `/api/orders/*`

All endpoints require student auth + `authenticatedRateLimiter`.

---

## Key design notes

### 1. Per-organization Razorpay credentials

Every tenant owns their own Razorpay `keyId` + `keySecret`. They are stored **encrypted** in `organization_config` and decrypted on each order. There is no global Razorpay account.

```21:55:src/services/order.service.ts
async function getRazorpayForOrg(organizationId: string): Promise<{
  instance: Razorpay;
  keyId: string;
  keySecret: string;
}> {
  const config = await db.query.organizationConfig.findFirst({
    where: eq(organizationConfig.organizationId, organizationId),
    columns: {
      razorpayKeyId: true,
      razorpayKeySecret: true,
    },
  });

  if (!config?.razorpayKeyId || !config?.razorpayKeySecret) {
    throw new Error(
      "Razorpay credentials not configured for this organization. Please contact administrator."
    );
  }

  const decryptedKeyId = decryptRazorpayKey(config.razorpayKeyId);
  const decryptedKeySecret = decryptRazorpayKey(config.razorpayKeySecret);

  const instance = new Razorpay({
    key_id: decryptedKeyId,
    key_secret: decryptedKeySecret,
  });

  return { instance, keyId: decryptedKeyId, keySecret: decryptedKeySecret };
}
```

The **decrypted `keyId` is returned to the frontend** in the checkout response so the Razorpay SDK can initialize with the correct tenant key. The secret is **never** returned — it is used server-side only for HMAC signature verification.

### 2. Entity types

The `orders` table covers both product kinds via a discriminator:

| `entityType` | `entityId` points at | Enrollment table |
|---|---|---|
| `BATCH` | `batches.id` | `user_batch_mapping` |
| `TEST_SERIES` | `test_series.id` | `user_test_series_mapping` |

### 3. Payment statuses

From `orders.paymentStatus`: `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `REFUNDED`.

### 4. Currency

Hardcoded to `"INR"` today. Razorpay amounts are in **paise** (the server multiplies by 100).

---

## Flow diagram (paid purchase)

```
POST /api/batches/:id/checkout           → creates orders row (PENDING) + Razorpay order
                                         ← { orderId, razorpayOrderId, amount, key, ... }

(frontend)  Razorpay SDK popup using `key` → user pays
                                         ← returns { razorpayPaymentId, razorpayOrderId, razorpaySignature }

POST /api/batches/verify-payment         → HMAC verify with org keySecret
                                           updates orders → SUCCESS, inserts user_batch_mapping
                                           invalidates cache
                                         ← { success: true, orderId, paymentId }
```

The test-series path is identical with `/api/test-series/...` substituted.

---

## Endpoint reference

### A. Checkout (paid)

`POST /api/batches/:id/checkout` and `POST /api/test-series/:testSeriesId/checkout`.

Empty body. Path param is the entity id (UUID). Auth required.

Service steps (`createBatchOrder` / `createTestSeriesOrder`):

1. Load the entity (batch or test series) scoped to org. 404 if missing.
2. Reject if `status !== ACTIVE`.
3. Reject if the user already has a row in the enrollment table (you can't buy it twice).
4. Compute pricing: `finalPrice = totalPrice - totalPrice * discountPercentage / 100`.
5. If `finalPrice === 0` (batch) or `finalPrice === 0 || isFree === true` (series), throw — use the `/enroll-free` endpoint instead.
6. INSERT into `orders` with:
   - `entityType: "BATCH" | "TEST_SERIES"`
   - `entityId`
   - `amount: finalPrice`
   - `paymentProvider: "RAZORPAY"`, `paymentStatus: "PENDING"`, `currency: "INR"`
7. Load `Razorpay` instance for this org.
8. `razorpay.orders.create({ amount: finalPrice * 100, currency: "INR", receipt: "B-xxxx-<ts>" | "T-xxxx-<ts>", notes: { orderId, userId, batchId|testSeriesId, entityType } })`.
9. UPDATE the `orders` row with `providerOrderId`, `receiptId`, and `transactionData` (full Razorpay response).

Response:

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "<our internal uuid>",
    "razorpayOrderId": "order_xxx",
    "amount": 20000,
    "currency": "INR",
    "key": "rzp_test_xxx",
    "batchName":   "JEE Advanced 2026 Full Course",
    "seriesName":  "JEE 2026 Mocks",
    "originalPrice": 25000,
    "discountAmount": 5000,
    "finalPrice": 20000
  }
}
```

(`batchName` for batch checkout, `seriesName` for series.)

Errors:

- 404 — entity not found.
- 400 — entity not ACTIVE / already purchased / item is free.

### B. Verify payment

Two identical endpoints differ only in the URL prefix — the service is shared:

- `POST /api/batches/verify-payment`
- `POST /api/test-series/verify-payment`

Body:

```json
{
  "orderId": "<our internal uuid>",
  "razorpayPaymentId": "pay_xxx",
  "razorpayOrderId": "order_xxx",
  "razorpaySignature": "<hex signature from Razorpay>"
}
```

Service (`verifyPayment`):

1. Load `orders` row by `(id, userId)`. 404 if not found. 400 if `paymentStatus === SUCCESS` already.
2. Resolve this org's Razorpay `keySecret`.
3. Compute HMAC:
   ```
   expected = HMAC_SHA256(keySecret, `${razorpayOrderId}|${razorpayPaymentId}`)
   ```
   If `expected !== razorpaySignature`, UPDATE `orders` to `FAILED` with `failureReason: "Invalid signature"` and throw `"Invalid payment signature"`.
4. Otherwise UPDATE `orders` to `SUCCESS` with `providerPaymentId`, `providerSignature`, `completedAt = now`.
5. Branch on `entityType`:
   - `BATCH` → `enrollUserInBatch(order)` then `CacheManager.invalidateBatch(entityId, organizationId)`.
   - `TEST_SERIES` → `enrollUserInTestSeries(order)` then `CacheManager.invalidateTestSeries(...)`.

`enrollUserInBatch`:

- `finalPrice = order.amount`
- `expiresAt = batch.endDate`
- INSERT `user_batch_mapping` with `startDate = now`, `isActive = true`.

`enrollUserInTestSeries`:

- `startDate = now`, `endDate = now + (series.durationDays || 365)` days.
- INSERT `user_test_series_mapping` with `isActive = true`.

Response:

```json
{
  "success": true,
  "message": "Payment verified and enrollment completed successfully",
  "data": { "success": true, "orderId": "...", "paymentId": "pay_xxx" }
}
```

### C. Free enrollment

- `POST /api/batches/:batchId/enroll-free` (`enrollInFreeBatch`)
- `POST /api/test-series/:testSeriesId/enroll-free` (`enrollInFreeTestSeries`)

No body. Service:

1. Load entity (404 if not found / not ACTIVE).
2. Reject if user already enrolled (`"You have already enrolled..."`).
3. Reject if `finalPrice > 0` (batch) or `(!isFree && finalPrice > 0)` (series).
4. INSERT the enrollment mapping with `originalPrice = 0, discountAmount = 0, finalPrice = 0, orderId = null`.
5. Invalidate the relevant cache.

Response (batch):

```json
{
  "success": true,
  "message": "Enrolled in free batch successfully",
  "data": { "success": true, "enrollmentId": "uuid", "expiresAt": "<batch endDate>" }
}
```

Response (test series):

```json
{
  "success": true,
  "message": "Enrolled in free test series successfully",
  "data": { "success": true, "enrollmentId": "uuid", "startDate": "...", "endDate": "..." }
}
```

### D. Order history

`GET /api/orders/history`

Paginated order history — includes PENDING / SUCCESS / FAILED / REFUNDED rows. Useful for an "order history" tab in the user account.

Query (`orderHistoryQuerySchema`):

| Name | Rule |
|---|---|
| `page` | int ≥ 1 (default 1) |
| `limit` | int ≥ 1 ≤ 100 (default 10) |
| `status` | enum `SUCCESS`, `FAILED`, `PENDING`, `PROCESSING`, `REFUNDED` (optional) |

Cache:

- Key: `order:history:<orgId>:<userId>:<page>:<limit>:<status|all>`
- TTL: `SHORT` (5 min). Safe to cache because it is user-scoped, but still short-lived because refunds / retries land here.

Service (`getOrderHistory`):

- Joins `orders` with `batches` or `test_series` depending on `entityType`.
- Orders by `createdAt DESC`.
- Returns each row with an `entityDetails` block (batch or series basic info).

Response (abridged):

```json
{
  "success": true,
  "message": "Order history retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "entityType": "BATCH",
      "entityId": "uuid",
      "amount": 20000,
      "currency": "INR",
      "paymentProvider": "RAZORPAY",
      "paymentStatus": "SUCCESS",
      "providerOrderId": "order_xxx",
      "providerPaymentId": "pay_xxx",
      "receiptId": "B-12345678-1735689600000",
      "failureReason": null,
      "refundId": null, "refundAmount": null, "refundedAt": null,
      "initiatedAt": "...", "completedAt": "...", "failedAt": null,
      "createdAt": "...",
      "entityDetails": {
        "name": "JEE Advanced 2026 Full Course",
        "description": "...",
        "startDate": "...",
        "endDate": "..."
      }
    }
  ],
  "pagination": {
    "currentPage": 1, "totalPages": 3,
    "totalCount": 25, "limit": 10,
    "hasNextPage": true, "hasPreviousPage": false
  }
}
```

For `entityType: "TEST_SERIES"` rows `entityDetails` has `{ title, description, durationDays }` instead.

---

## Pricing math, for reference

```
discountAmount = totalPrice * discountPercentage / 100
finalPrice     = totalPrice - discountAmount
razorpayAmount = Math.round(finalPrice * 100)   // paise
```

All money columns in the DB are `number` (not strings) and are in the org's display currency unit (currently INR, full rupees).

---

## HMAC signature reference

To verify a Razorpay payment, the server concatenates `${razorpayOrderId}|${razorpayPaymentId}`, HMACs with the org's `keySecret` using SHA-256, and compares hex. Frontend does **not** need to implement this.

---

## Idempotency

- Verifying the same order twice → second call throws `"Payment already verified"`.
- Creating two simultaneous orders for the same entity is allowed at DB level but the second will fail at verify time if you've already purchased (enrollment check in the checkout step). In practice the UX should disable the button once `/checkout` succeeds.

---

## Cache invalidation on writes

| Action | Keys invalidated (via `CacheManager`) |
|---|---|
| `verifyPayment` (batch success) | Everything matching batch id + user-scoped batch lists |
| `verifyPayment` (series success) | Test series caches for that series + user |
| `enrollInFreeBatch` | Same as batch verify |
| `enrollInFreeTestSeries` | Same as series verify |

Exactly which keys are wiped is controlled by `CacheManager.invalidateBatch/invalidateTestSeries/invalidateOrganizationConfig` inside `src/services/cache.service.ts`.

---

## cURL

```bash
H="Authorization: Bearer $TOKEN"

# Paid batch checkout
curl -X POST -H "$H" "$BASE/api/batches/<batchId>/checkout"

# Verify (batch)
curl -X POST -H "$H" -H 'Content-Type: application/json' \
  -d '{"orderId":"...","razorpayPaymentId":"...","razorpayOrderId":"...","razorpaySignature":"..."}' \
  "$BASE/api/batches/verify-payment"

# Free enrollment
curl -X POST -H "$H" "$BASE/api/batches/<batchId>/enroll-free"

# Paid series checkout + verify (mirror of above)
curl -X POST -H "$H" "$BASE/api/test-series/<seriesId>/checkout"
curl -X POST -H "$H" -H 'Content-Type: application/json' -d '{...}' \
  "$BASE/api/test-series/verify-payment"

# Order history
curl -H "$H" "$BASE/api/orders/history?status=SUCCESS&page=1&limit=10"
```
