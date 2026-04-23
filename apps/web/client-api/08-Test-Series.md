# 08 — Test Series

Routes in `src/routes/client/test-series.route.ts`, service in `src/services/client/test-series.service.ts` (+ payment flows in `src/services/order.service.ts`). Mounted at **`/api/test-series`**.

A **test series** bundles many `tests` together under one price (e.g. "JEE 2026 Mock Tests — 50 full-length tests"). Students purchase the series, then attempt the individual tests inside it.

Clients only see **ACTIVE** series. All endpoints require student auth.

> Individual **test** endpoints (read test structure / preview) are in [`09-Tests.md`](./09-Tests.md). Attempt lifecycle is in [`10-Test-Attempts.md`](./10-Test-Attempts.md). Payment details are in [`12-Orders-And-Payments.md`](./12-Orders-And-Payments.md).

---

## Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/test-series` | Paginated list of **unpurchased** ACTIVE series |
| GET | `/api/test-series/my-test-series` | Paginated list of enrolled series |
| GET | `/api/test-series/:identifier` | Single series by `id` or `slug` |
| GET | `/api/test-series/:id/tests` | All tests inside a series |
| POST | `/api/test-series/:testSeriesId/checkout` | Razorpay order for a paid series |
| POST | `/api/test-series/:testSeriesId/enroll-free` | Free enrollment |
| POST | `/api/test-series/verify-payment` | Verify Razorpay signature + finalize |

---

## 1. `GET /api/test-series`

Paginated list of ACTIVE series the user **has not enrolled in**.

Query (local `paginationSchema`):

- `page` int ≥ 1 (default 1)
- `limit` int ≥ 1 ≤ 100 (default 10)

Service (`getAllTestSeries`):

- Filters by `organizationId` + `status = ACTIVE`.
- Computes `discountedPrice` per series.
- Looks up enrollments for the user; **removes enrolled series** from the result.
- Returns each row with `isPurchased: false`.

> Note: because enrolled series are post-filtered after pagination, the `totalCount` returned is the unpurchased count within the page, not the org-wide catalogue count. For a simple "browse" list this is fine, but don't use `totalCount` for a strict progress bar.

Cache:

- Key: `testSeries:list:<orgId>:<userId>:<page>:<limit>`
- TTL: `MEDIUM` (15 min)

---

## 2. `GET /api/test-series/my-test-series`

Paginated list of series the user is enrolled in (via `user_test_series_mapping`), newest enrollment first.

Each item is the series row plus:

- `discountedPrice`
- `isPurchased: true`
- `enrollmentDetails`: `{ enrolledAt, startDate, endDate, isActive }`

Cache:

- Key: `testSeries:enrolled:<orgId>:<userId>:<page>:<limit>`
- TTL: `SHORT` (5 min)

---

## 3. `GET /api/test-series/:identifier`

Single series by UUID or slug. The regex check is identical to batches — see [`04-Batches.md`](./04-Batches.md).

Service (`getTestSeries`):

- Filters to org + `status = ACTIVE` → 404 if missing.
- Adds `discountedPrice`.
- Adds `isEnrolled` and, if enrolled, `enrollmentDetails: { enrolledAt, startDate, endDate, isActive }`.

Cache:

- Key: `testSeries:<uuid>:user:<userId>` or `testSeries:slug:<slug>:user:<userId>`
- TTL: `MEDIUM` (15 min)

Errors: `404` if not found / wrong org / not ACTIVE.

---

## 4. `GET /api/test-series/:id/tests`

All tests inside one series. `:id` must be a UUID (Zod).

Service (`getTestsInSeries`):

- 404 if the series is not found / not in caller's org / not ACTIVE.
- Pulls all tests with `testSeriesId = :id`, ordered by `createdAt DESC`.
- Enriches each test with two user-specific flags:
  - `attemptCount` — how many times the caller has attempted this test.
  - `hasAttempted` — boolean shortcut.

Response:

```json
{
  "success": true,
  "message": "Tests retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Full Mock #1",
      "slug": "mock-01",
      "duration": 180,
      "totalMarks": 300,
      "passingMarks": 120,
      "isPublished": true,
      "isFree": false,
      "attemptCount": 2,
      "hasAttempted": true
    }
  ]
}
```

Not cached at the router level — this is intentionally fresh because `attemptCount` changes as the user attempts.

---

## 5. `POST /api/test-series/:testSeriesId/checkout`

Create a Razorpay order for a paid series. See [`12-Orders-And-Payments.md`](./12-Orders-And-Payments.md) for full details.

Service (`createTestSeriesOrder`):

- 404 if series not found / not ACTIVE.
- 400 if already enrolled.
- 400 if price is 0 or `isFree` — use `/enroll-free` instead.
- Inserts a row into `orders` (`entityType: "TEST_SERIES"`, status PENDING), then calls Razorpay `orders.create` with an org-specific key.
- Response payload mirrors the batch checkout shape, with `seriesName` instead of `batchName`:

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "<internal uuid>",
    "razorpayOrderId": "order_xxx",
    "amount": 1499,
    "currency": "INR",
    "key": "<razorpay key id>",
    "seriesName": "JEE Advanced 2026 Mocks",
    "originalPrice": 1999,
    "discountAmount": 500,
    "finalPrice": 1499
  }
}
```

---

## 6. `POST /api/test-series/:testSeriesId/enroll-free`

Free enrollment path. Details in the payment doc. Inserts `user_test_series_mapping` with 0 pricing and an `endDate = now + (series.durationDays || 365)`.

Errors: 400 if already enrolled, 400 if the series is not free, 404 if missing/non-active.

Response:

```json
{
  "success": true,
  "message": "Enrolled in free test series successfully",
  "data": {
    "success": true,
    "enrollmentId": "uuid",
    "startDate": "...",
    "endDate": "..."
  }
}
```

---

## 7. `POST /api/test-series/verify-payment`

Identical contract to the batch verify-payment, but it resolves `entityType === "TEST_SERIES"` and creates a `user_test_series_mapping`. Full body shape in [`12-Orders-And-Payments.md`](./12-Orders-And-Payments.md#verify-payment).

Cache invalidation on success: `CacheManager.invalidateTestSeries(seriesId, orgId)`.

---

## Enrollment & validity semantics

- `user_test_series_mapping` carries `startDate` (now) and `endDate` (`now + series.durationDays || 365`).
- `startAttempt` in test-attempt service rejects if `endDate < now` with `"Your access to this test series has expired"` — see [`10-Test-Attempts.md`](./10-Test-Attempts.md).

---

## Typical frontend flow

```
1. List:                   GET /api/test-series
2. Detail:                 GET /api/test-series/<slug>
3. Check tests inside:     GET /api/test-series/<id>/tests
4. If paid + not enrolled: POST /api/test-series/<id>/checkout   → Razorpay popup
                           POST /api/test-series/verify-payment  → enrolled
   If free + not enrolled: POST /api/test-series/<id>/enroll-free
5. Attempt a test:         (see 10-Test-Attempts.md)
6. My purchased list:      GET /api/test-series/my-test-series
```

---

## cURL

```bash
H="Authorization: Bearer $TOKEN"

curl -H "$H" "$BASE/api/test-series?page=1&limit=10"
curl -H "$H" "$BASE/api/test-series/my-test-series"
curl -H "$H" "$BASE/api/test-series/<slug-or-id>"
curl -H "$H" "$BASE/api/test-series/<seriesId>/tests"

curl -X POST -H "$H" "$BASE/api/test-series/<seriesId>/checkout"
curl -X POST -H "$H" "$BASE/api/test-series/<seriesId>/enroll-free"
curl -X POST -H "$H" -H 'Content-Type: application/json' \
  -d '{"orderId":"...","razorpayPaymentId":"...","razorpayOrderId":"...","razorpaySignature":"..."}' \
  "$BASE/api/test-series/verify-payment"
```
