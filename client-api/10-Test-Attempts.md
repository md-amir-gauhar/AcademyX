# 10 — Test Attempts

Routes in `src/routes/test-series/test-attempt.route.ts`, service in `src/services/test-series/test-attempt.service.ts`. Mounted at **`/api/attempts`**.

This is the most logic-heavy client area: it runs the full lifecycle of a student taking a test — start, answer, submit, evaluate, rank, review solutions, and dashboard-level stats.

All endpoints require student auth + `authenticatedRateLimiter`. None are cached — attempts are inherently per-user, per-request.

---

## Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/attempts/start/:testId` | Start a new attempt |
| GET | `/api/attempts/:attemptId` | Load attempt + full test + current answers |
| POST | `/api/attempts/:attemptId/answer` | Save / update one answer |
| POST | `/api/attempts/:attemptId/submit` | Finalize + auto-evaluate |
| GET | `/api/attempts/:attemptId/results` | Get scored results |
| GET | `/api/attempts/:attemptId/solutions` | Correct answers + explanations |
| GET | `/api/attempts/test/:testId/my-attempts` | Caller's attempt history on a test |
| GET | `/api/attempts/test/:testId/leaderboard` | Public leaderboard for a test |
| GET | `/api/attempts/recent-completed` | Dashboard feed across all tests |
| GET | `/api/attempts/stats` | Aggregated stats across all tests |

---

## 1. `POST /api/attempts/start/:testId`

Start a new attempt.

Path: `testId` (UUID).

Service (`startAttempt`):

1. Load the test with its `testSeries`.
2. Reject if `!isPublished`.
3. If paid-series test (`testSeries && !test.isFree`):
   - Require `user_test_series_mapping` row — else `"You must be enrolled in the test series to attempt this test"`.
   - Require `enrollment.endDate > now` — else `"Your access to this test series has expired"`.
4. Compute next `attemptNumber` = `COUNT(*) + 1` of the user's attempts on this test (allowing multiple attempts — quota is not enforced server-side beyond this counter).
5. Insert `test_attempts` row with `startedAt = now`, `isCompleted = false`.

Response (201):

```json
{
  "success": true,
  "message": "Test attempt started successfully",
  "data": {
    "id": "<attemptId>",
    "userId": "...",
    "testId": "...",
    "attemptNumber": 1,
    "startedAt": "...",
    "isCompleted": false
  }
}
```

Errors:

- 403: not enrolled / access expired.
- 404: test not found / not published.

---

## 2. `GET /api/attempts/:attemptId`

Load an attempt **and** its test (sections → questions → options) **and** the caller's saved answers so far. This is what drives the test runner screen.

Access check: the attempt must belong to `req.user.id`, else 404 `"Attempt not found"`.

Note: unlike `/api/tests/:testId/preview`, this endpoint **does not strip** `isCorrect` / `explanation` off the options. In practice the frontend should still not show correct markers until submit. The server, however, does not redact them here.

Response (abridged):

```json
{
  "success": true,
  "data": {
    "id": "<attemptId>",
    "testId": "...",
    "startedAt": "...",
    "isCompleted": false,
    "test": {
      "id": "...",
      "title": "Full Mock #1",
      "duration": 180,
      "sections": [
        {
          "id": "...", "displayOrder": 1,
          "questions": [
            { "id": "...", "text": "...", "options": [ { "...": "..." } ] }
          ]
        }
      ]
    },
    "answers": [
      { "id": "...", "questionId": "...", "selectedOptionId": "...", "isMarkedForReview": false, "isSkipped": false }
    ]
  }
}
```

---

## 3. `POST /api/attempts/:attemptId/answer`

Upsert an answer for one question. Call this on every radio-change / blur / etc.

Body (`submitAnswerSchema`, Zod):

```json
{
  "questionId": "uuid",
  "selectedOptionId": "uuid",          // optional — for MCQ/TRUE_FALSE
  "textAnswer": "string",              // optional — for FILL_BLANK/NUMERICAL
  "timeSpentSeconds": 37,              // optional, int >= 0
  "isMarkedForReview": false           // optional
}
```

Rules (Zod + service):

- Either `selectedOptionId` or `textAnswer` should be provided. **If both are missing**, the service sets `isSkipped = true` on the answer row (so "empty save" acts as an explicit skip).
- `selectedOptionId` and `questionId` must be UUIDs.
- 400 if the attempt is already completed (`"Cannot modify answers after test submission"`).
- 404 if the attempt is not found / doesn't belong to the caller.

If a row already exists in `test_attempt_answers` for `(attemptId, questionId)` it is updated; else it is inserted. Either way the updated/inserted row is returned.

---

## 4. `POST /api/attempts/:attemptId/submit`

Finalize + auto-grade.

Service (`submitTest` → calls `evaluateAttempt` → then `calculateRank`):

1. Load the attempt + its test. 400 if already completed.
2. Compute `timeSpentSeconds = now - startedAt`.
3. `evaluateAttempt(attemptId)`:
   - Load all answers with their `question` + `options` + `selectedOption`.
   - For each answer:
     - If `isSkipped`: `skippedCount++`, no marks change.
     - Else if `type === "MCQ"`:
       - If `selectedOption.isCorrect`: `correctCount++`, `marksAwarded = question.marks`.
       - Else: `wrongCount++`, `marksAwarded = -negativeMarks`.
     - Else if `type === "NUMERICAL" | "FILL_BLANK"`:
       - Marked for manual review — counted as skipped in this pass (`marksAwarded = 0`).
     - Update the answer row with `isCorrect` and `marksAwarded`.
   - Sum into `totalScore`, `percentage = totalScore / test.totalMarks * 100`.
   - Update `test_attempts` with `totalScore`, `percentage`, `correctCount`, `wrongCount`, `skippedCount`.
4. `isPassed = (totalScore >= test.passingMarks)`.
5. Update the attempt: `isCompleted = true`, `submittedAt = now`, `timeSpentSeconds`, `isPassed`.
6. `calculateRank(attemptId, testId)`:
   - Pull all *completed* attempts on this test, ordered by `totalScore DESC, submittedAt ASC`.
   - Find the caller's row to get `rank` and `percentile = (total - rank) / total * 100`.
   - Persist those on the attempt.

Response (200):

```json
{
  "success": true,
  "message": "Test submitted successfully",
  "data": {
    "id": "<attemptId>",
    "isCompleted": true,
    "submittedAt": "...",
    "timeSpentSeconds": 6421,
    "totalScore": 218,
    "percentage": 72.67,
    "correctCount": 55,
    "wrongCount": 12,
    "skippedCount": 13,
    "isPassed": true,
    "rank": 27,
    "percentile": 88.5
  }
}
```

> **Important:** the `data.id` field comes from the underlying `test_attempts` row. The Swagger doc labels it `attemptId` but the actual JSON property is `id`.

---

## 5. `GET /api/attempts/:attemptId/results`

Return the full result bundle: the attempt (with all its scored answers, including correct options), joined test sections.

Rejects if `!isCompleted` (`"Test not yet submitted"`).

Response shape includes:

- Attempt summary fields (score, rank, percentile, isPassed, etc.)
- `test.sections[]` (ordered)
- `answers[]` — each with `question` (with all options including `isCorrect`) and `selectedOption`.

This is what the "result analysis" page should consume.

---

## 6. `GET /api/attempts/:attemptId/solutions`

Solutions + explanations view — **gated by the test's `showAnswersAfterSubmit` flag**. If that flag is false the endpoint throws `"Solutions not available for this test"`.

Rejects if `!isCompleted` (`"Solutions available only after test submission"`).

Response: `testAttemptAnswers[]` with `question` (including `options` with `isCorrect`) and `selectedOption`. This is usually sufficient to render a "see correct answer + explanation" walkthrough.

---

## 7. `GET /api/attempts/test/:testId/my-attempts`

Full list of the caller's attempts on one test, ordered by `attemptNumber DESC`. Useful for history tabs.

Response: `data: <testAttempt[]>`.

---

## 8. `GET /api/attempts/test/:testId/leaderboard`

Public leaderboard for one test.

Query (`paginationSchema`):

- `page` string, default `"1"`
- `limit` string, default `"10"` (max 100)

Service (`getLeaderboard`):

- Only completed attempts.
- Ordered by `totalScore DESC, submittedAt ASC`.
- Joins `user` with only `{ id, username }` selected — no emails/PII leaked.

Response:

```json
{
  "success": true,
  "pagination": { "page": 1, "limit": 10 },
  "data": [
    {
      "id": "<attemptId>",
      "totalScore": 289,
      "percentage": 96.3,
      "submittedAt": "...",
      "user": { "id": "...", "username": "topper" }
    }
  ]
}
```

> Current implementation returns `data` directly as the array — the Swagger comment mentions `leaderboard` and `userRank` but the actual JSON returns only the array. The `/stats` endpoint (below) exposes the caller's own rank/percentile across the full test set.

---

## 9. `GET /api/attempts/recent-completed`

Dashboard feed of the caller's recent completed tests.

Query (`recentTestsQuerySchema`):

| Name | Default | Notes |
|---|---|---|
| `page` | `"1"` | |
| `limit` | `"20"` | **no hard max in Zod but Swagger says 50** |
| `testSeriesId` | — | Filters by series; empty string accepted as "no filter" |
| `isPassed` | — | `"true"` / `"false"` to filter; otherwise ignored |

Service (`getRecentCompletedTests` → also calls `getTestAttemptStats`):

- Returns completed attempts (`isCompleted = true`), newest first.
- Adds `stats` block across the same filter (same as `/stats`).

Response:

```json
{
  "success": true,
  "message": "Recent completed tests retrieved successfully",
  "data": [
    {
      "id": "<attemptId>",
      "attemptNumber": 2,
      "totalScore": 218,
      "percentage": 72.67,
      "rank": 27, "percentile": 88.5,
      "isPassed": true,
      "correctCount": 55, "wrongCount": 12, "skippedCount": 13,
      "timeSpentSeconds": 6421,
      "startedAt": "...", "submittedAt": "...",
      "test": {
        "id": "...", "title": "Full Mock #1", "slug": "mock-01",
        "totalMarks": 300, "duration": 180,
        "testSeries": { "id": "...", "title": "JEE Mocks", "exam": "JEE" }
      }
    }
  ],
  "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false },
  "stats": { /* see /stats below */ }
}
```

Note: the server returns attempts with all their native fields — the response is the full attempt record, not the nested `{ performance, test, ... }` shape described in the Swagger docstring. If your frontend is already using the Swagger types you may want to normalize client-side.

---

## 10. `GET /api/attempts/stats`

Aggregated performance stats, optionally scoped to one series.

Query (`statsQuerySchema`):

- `testSeriesId` — UUID, optional (empty string accepted as "no filter").

Service (`getTestAttemptStats`) computes:

- `totalTestsAttempted`, `totalTestsCompleted`, `totalTestsPassed`
- `averageScore`, `averagePercentage`
- `passRate` (%)
- `totalTimeSpentSeconds`, `totalTimeSpentHours`
- `bestScore`, `bestPercentage`
- `recentTrend` — `"improving" | "stable" | "declining"` based on comparing the first half vs second half of the last 5 completed tests.

Response:

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalTestsAttempted": 22,
    "totalTestsCompleted": 18,
    "totalTestsPassed": 11,
    "averageScore": 183.4,
    "averagePercentage": 61.13,
    "passRate": 61.11,
    "totalTimeSpentSeconds": 112344,
    "totalTimeSpentHours": 31.21,
    "bestScore": 289,
    "bestPercentage": 96.33,
    "recentTrend": "improving"
  }
}
```

---

## Question types reminder

`question.type` values seen in the code:

- `MCQ` — auto-graded via `option.isCorrect`.
- `TRUE_FALSE` — auto-graded the same way as MCQ (single correct option).
- `NUMERICAL` / `FILL_BLANK` — currently **not auto-graded**. `evaluateAttempt` leaves `marksAwarded = 0` and increments `skippedCount`. A manual review pipeline (admin) is expected to award marks separately.

---

## Timing & concurrency

- `startedAt` is server-set on `POST /start/...`.
- `timeSpentSeconds` is computed server-side on `POST /submit` as `(now - startedAt)`. Client-side clocks don't matter.
- The client can send `timeSpentSeconds` per answer (used for analytics and optional visualization; it does not affect scoring).
- There is no server-side soft limit on `test.duration` — you can submit late and still get scored. If you need a hard timeout the frontend should enforce it.

---

## cURL

```bash
H="Authorization: Bearer $TOKEN"

# Start
curl -X POST -H "$H" "$BASE/api/attempts/start/<testId>"

# Load
curl -H "$H" "$BASE/api/attempts/<attemptId>"

# Save one answer
curl -X POST -H "$H" -H 'Content-Type: application/json' \
  -d '{"questionId":"<q>","selectedOptionId":"<o>","timeSpentSeconds":37}' \
  "$BASE/api/attempts/<attemptId>/answer"

# Submit
curl -X POST -H "$H" "$BASE/api/attempts/<attemptId>/submit"

# Results, solutions, history
curl -H "$H" "$BASE/api/attempts/<attemptId>/results"
curl -H "$H" "$BASE/api/attempts/<attemptId>/solutions"
curl -H "$H" "$BASE/api/attempts/test/<testId>/my-attempts"

# Leaderboard
curl -H "$H" "$BASE/api/attempts/test/<testId>/leaderboard?page=1&limit=10"

# Dashboard
curl -H "$H" "$BASE/api/attempts/recent-completed?page=1&limit=20"
curl -H "$H" "$BASE/api/attempts/stats?testSeriesId=<seriesId>"
```
