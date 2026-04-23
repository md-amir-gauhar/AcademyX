# 09 — Tests (preview endpoints)

Routes in `src/routes/client/test.route.ts`. Mounted at **`/api/tests`**. This file has only two endpoints — both are **read-only preview** endpoints. The actual attempting lifecycle lives under `/api/attempts` (see [`10-Test-Attempts.md`](./10-Test-Attempts.md)).

All routes require student auth + `authenticatedRateLimiter`. Both are cached with `CacheTTL.MEDIUM`.

---

## Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/tests/:identifier` | Top-level test info (no questions) |
| GET | `/api/tests/:testId/preview` | Full test structure **without answers** (enrolled users only) |

---

## 1. `GET /api/tests/:identifier`

Returns the marketing-level info about a test. `:identifier` may be a UUID or slug (same regex pattern as batches and series).

Service logic (inlined in the route):

1. Look up `tests` joined with `testSeries`, scoped to the caller's `organizationId`.
2. 404 if not found.
3. **`isPublished` required** — else throws `"Test is not published yet"` (returns 500 via the error handler unless you treat thrown `Error` as 4xx; in practice most frontends will see a generic error envelope).
4. If the test belongs to a paid series (`testSeriesId && !isFree`):
   - Look up the caller's row in `user_test_series_mapping`.
   - If **not enrolled**, the endpoint still returns the test but with `isEnrolled: false` and an inline `message` telling the user to enroll. **No questions are included** (this endpoint never returns questions anyway).
5. If enrolled (or the test is free) → `isEnrolled: true`.

Response (unenrolled paid test):

```json
{
  "success": true,
  "message": "Test details retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "Full Mock #1",
    "slug": "mock-01",
    "duration": 180,
    "totalMarks": 300,
    "passingMarks": 120,
    "isPublished": true,
    "isFree": false,
    "testSeries": { "id": "...", "title": "JEE Mocks", "slug": "jee-mocks" },
    "isEnrolled": false,
    "message": "You must be enrolled in the test series to access this test"
  }
}
```

Response (enrolled or free):

```json
{
  "success": true,
  "data": {
    "id": "uuid", "title": "...", "slug": "...", "duration": 180,
    "totalMarks": 300, "passingMarks": 120,
    "isPublished": true, "isFree": true,
    "testSeries": { "...": "..." },
    "isEnrolled": true
  }
}
```

Cache:

- Keys:
  - UUID: `test:client:<uuid>:user:<userId>`
  - Slug: `test:client:slug:<slug>:user:<userId>`
- TTL: `MEDIUM` (15 min). User id is included because `isEnrolled` is user-specific.

---

## 2. `GET /api/tests/:testId/preview`

Returns the **full structure** of the test (sections → questions → options) **with answers stripped**, suitable for a "review before starting" screen.

Path: `testId` (UUID).

Service logic:

1. Load the test with:
   - `testSeries` (for enrollment checks)
   - `sections` ordered by `display_order`
     - each with `questions` ordered by `display_order`
       - each with `options` ordered by `display_order`
2. 404-equivalent throws if test missing or not published.
3. Enrollment check: for paid tests (`testSeriesId && !isFree`), the caller must have a `user_test_series_mapping` row; else the endpoint throws `"You must be enrolled in the test series to preview this test"`.
4. **Sanitization pass** — the route hand-strips every answer-revealing field:

```211:230:src/routes/client/test.route.ts
    // Remove correct answers from options
    const sanitizedTest = {
      ...test,
      sections: test.sections.map((section: any) => ({
        ...section,
        questions: section.questions.map((question: any) => ({
          ...question,
          // Remove explanation and correct answer info
          explanation: undefined,
          explanationImageUrl: undefined,
          options: question.options?.map((option: any) => ({
            id: option.id,
            text: option.text,
            imageUrl: option.imageUrl,
            displayOrder: option.displayOrder,
            // Hide isCorrect for preview
          })),
        })),
      })),
    };
```

So what you **will not** see here:

- `question.explanation`
- `question.explanationImageUrl`
- `option.isCorrect`

Everything else on questions (text, image, `marks`, `negativeMarks`, `type`, `displayOrder`) is included.

Response (abridged):

```json
{
  "success": true,
  "message": "Test preview retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "Full Mock #1",
    "duration": 180,
    "sections": [
      {
        "id": "...", "name": "Physics", "displayOrder": 1,
        "questions": [
          {
            "id": "...",
            "type": "MCQ",
            "text": "Which of the following...",
            "marks": 4,
            "negativeMarks": 1,
            "displayOrder": 1,
            "options": [
              { "id": "...", "text": "A", "displayOrder": 1 },
              { "id": "...", "text": "B", "displayOrder": 2 }
            ]
          }
        ]
      }
    ]
  }
}
```

Cache:

- Key: `test:preview:<testId>:user:<userId>`
- TTL: `MEDIUM` (15 min). User id in the key because the endpoint 403s based on enrollment.

---

## Notes on `isFree` vs `testSeries` pricing

A test is accessible without enrollment when any of the following is true:

- `test.isFree === true`
- `test.testSeriesId == null` (standalone free test)
- The caller has a row in `user_test_series_mapping` for `test.testSeriesId`

Any other case gates both `/api/tests/:identifier` (no questions shown anyway) and `/api/tests/:testId/preview` (throws).

---

## Error shapes (non-standard)

Unlike many other routes, this file uses `throw new Error(...)` rather than `ApiError`, so the response `statusCode` falls through to `500` in the global error handler. This is a minor inconsistency — the frontend should treat 500 responses on these endpoints as "test unavailable" (e.g. show a friendly message) and rely on `GET /api/test-series/:id/tests` to know whether a test should be reachable.

---

## cURL

```bash
H="Authorization: Bearer $TOKEN"

# Basic info
curl -H "$H" "$BASE/api/tests/<slug-or-id>"

# Preview (structure without answers)
curl -H "$H" "$BASE/api/tests/<testId>/preview"
```
