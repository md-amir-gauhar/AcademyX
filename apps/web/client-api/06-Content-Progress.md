# 06 — Content Progress (Video Watch Tracking)

Routes in `src/routes/client/content-progress.route.ts`, service in `src/services/client/content-progress.service.ts`. Mounted at **`/api/content`** (singular) — note this is different from `/api/contents` (which lists content catalog items).

These endpoints implement the "keep watching" / progress bar feature on the dashboard. Progress is stored in `user_content_progress` with unique `(userId, contentId)`.

Auto-completion threshold: **`watchPercentage >= 95%`** — see `src/services/client/content-progress.service.ts`:

```72:75:src/services/client/content-progress.service.ts
  const watchPercentage =
    totalDuration > 0 ? (watchedSeconds / totalDuration) * 100 : 0;
  const isCompleted = watchPercentage >= 95;
```

All routes require auth (`authenticate`) and are under `authorize("STUDENT")` + `authenticatedRateLimiter`.

---

## Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/content/recently-watched` | Paginated feed for "continue learning" |
| POST | `/api/content/:contentId/progress` | Heartbeat — update watch position |
| GET | `/api/content/:contentId/progress` | Fetch progress for a single video |
| GET | `/api/content/watch-stats` | Aggregate stats (optionally per-batch) |
| POST | `/api/content/:contentId/complete` | Manually mark completed (100%) |
| GET | `/api/content/batch-progress` | Batch completion overview |

---

## 1. `GET /api/content/recently-watched`

Returns the user's most-recently-watched videos, newest first, with pagination and a summary stats block.

Query (`recentlyWatchedQuerySchema`):

| Name | Type | Default | Notes |
|---|---|---|---|
| `page` | int string | `1` | — |
| `limit` | int string | `20` | **Max 50** |
| `batchId` | UUID | — | Optional filter. Requires the user to have purchased this batch; else `403`. |
| `completedOnly` | `"true"` or absent | `false` | Filter to completed videos |

Each item includes the full `content` relation (content → topic → chapter → subject → batch) plus the `progress` block:

```json
{
  "videos": [
    {
      "content": { "...full content object with nested relations..." },
      "progress": {
        "id": "uuid",
        "watchedSeconds": 1234,
        "totalDuration": 1800,
        "watchPercentage": 68.5,
        "isCompleted": false,
        "completedAt": null,
        "watchCount": 3,
        "lastWatchedAt": "2025-01-01T00:00:00Z"
      }
    }
  ],
  "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false },
  "stats": {
    "totalVideosWatched": 42,
    "completedVideosCount": 9,
    "totalWatchTimeSeconds": 14200,
    "totalWatchTimeFormatted": "3h 56m",
    "averageCompletionRate": 57.8
  }
}
```

### Cache

Key: `recently-watched:<orgId>:<userId>:<page>:<limit>:<batchId|all>:<completedOnly>` — TTL `SHORT` (5 min). Invalidated automatically when the user POSTs a progress or completion update (the service calls `CacheManager.invalidate("recently-watched:<orgId>:<userId>")`).

---

## 2. `POST /api/content/:contentId/progress`

The heartbeat — the frontend should POST this every N seconds or on pause/seek/close.

Path: `contentId` (UUID, validated by `contentIdParamSchema`).

Body (`trackProgressSchema`):

```json
{
  "watchedSeconds": 120,
  "totalDuration": 1800
}
```

Rules (Zod):

- `watchedSeconds` int ≥ 0
- `totalDuration` int ≥ 1

Service (`trackVideoProgress`):

1. `verifyContentAccess(contentId)` loads content with `topic → chapter → subject → batch`. If the content doesn't exist → 404.
2. Compute `watchPercentage = watchedSeconds / totalDuration * 100`.
3. **Auto-complete** when `watchPercentage >= 95`.
4. Upsert `user_content_progress`:
   - If row exists: update `watchedSeconds`, `totalDuration`, `watchPercentage`, `lastWatchedAt`, `updatedAt`, `watchCount++`. If newly crossing the 95% mark, set `isCompleted = true` + `completedAt = now`.
   - If row doesn't exist: insert a fresh row with all fields, plus `batchId` (derived from the content's hierarchy).
5. Invalidate the user's `recently-watched:<org>:<user>` cache.

Response (200): the updated/new progress row is echoed back under `data`.

Errors:

- 400 — Zod validation failure.
- 403 — (not explicitly thrown here, but `batchId` filter in `recently-watched` does this check elsewhere.)
- 404 — content not found.

---

## 3. `GET /api/content/:contentId/progress`

Returns the caller's progress for a single content id, or `null` if there is no progress row yet.

Cache key: `content-progress:<userId>:<contentId>` — TTL `SHORT`.

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "watchedSeconds": 120,
    "totalDuration": 1800,
    "watchPercentage": 6.67,
    "isCompleted": false,
    "completedAt": null,
    "watchCount": 1,
    "lastWatchedAt": "..."
  },
  "message": "Progress retrieved successfully"
}
```

If no row:

```json
{ "success": true, "data": null, "message": "No progress found for this content" }
```

---

## 4. `GET /api/content/watch-stats`

Aggregate stats for the user, optionally scoped to one batch.

Query:

- `batchId` (UUID, optional)

Cache key: `watch-stats:<orgId>:<userId>:<batchId|all>` — TTL `MEDIUM`.

Response shape is the same `stats` block described in `/recently-watched` above:

```json
{
  "totalVideosWatched": 42,
  "completedVideosCount": 9,
  "totalWatchTimeSeconds": 14200,
  "totalWatchTimeFormatted": "3h 56m",
  "averageCompletionRate": 57.8
}
```

Formatting rules:

- If `hours > 0`: `"{h}h {m}m"` (e.g. `"3h 56m"`).
- Otherwise just `"{m}m"`.

---

## 5. `POST /api/content/:contentId/complete`

Mark a video as completed manually (e.g. user clicks "Mark as complete" button).

No body required. Path: `contentId` UUID.

Service (`markAsCompleted`):

- If a progress row exists and `isCompleted === true` → returned as-is (idempotent no-op).
- If a progress row exists and not completed → sets `isCompleted = true`, `completedAt = now`, `watchPercentage = 100`, `watchedSeconds = content.videoDuration || existingProgress.totalDuration`.
- If no progress row → creates one directly at 100% with `totalDuration` = `content.videoDuration || 0`.

Cache invalidated: `recently-watched:<orgId>:<userId>`.

---

## 6. `GET /api/content/batch-progress`

Summary: "how many of the lecture videos in this batch have I finished?"

Query (`batchProgressQuerySchema`):

- `batchId` (UUID, required).

Service (`getBatchProgressOverview`):

1. Verify `user_batch_mapping` exists AND `isActive = true`, else `403`.
2. Count all `contents` in that batch where `contents.type = 'Lecture'` (via joins: subjects → chapters → topics → contents).
3. Count `user_content_progress` where `userId`, `batchId`, and `isCompleted = true`.
4. Compute `progressPercentage = completed / total * 100`, rounded to 2 dp.

Response:

```json
{
  "success": true,
  "message": "Batch progress retrieved successfully",
  "data": {
    "totalVideos": 120,
    "completedVideos": 57,
    "progressPercentage": 47.5,
    "totalWatchTimeSeconds": 28740
  }
}
```

Cache key: `batch-progress:<userId>:<batchId>` — TTL `MEDIUM`.

Errors:

- 400 if `batchId` missing or not UUID.
- 403 if the user hasn't purchased this batch.

---

## Suggested frontend cadence

- Heartbeat POST `/progress` every 10–20 seconds **only while playing** and on `pause` / `ended` / route-change.
- After `ended` (or if `watchPercentage >= 95%`), the backend will have already flipped `isCompleted`; the frontend can optionally POST `/complete` as a UX safety net.
- Dashboard "Continue learning" card → `GET /recently-watched?limit=10`.
- Batch detail screen → `GET /batch-progress?batchId=...` alongside the content tree.

---

## cURL

```bash
H="Authorization: Bearer $TOKEN"

curl -H "$H" "$BASE/api/content/recently-watched?page=1&limit=10"

curl -X POST -H "$H" -H 'Content-Type: application/json' \
  -d '{"watchedSeconds":120,"totalDuration":1800}' \
  "$BASE/api/content/<contentId>/progress"

curl -H "$H" "$BASE/api/content/<contentId>/progress"

curl -H "$H" "$BASE/api/content/watch-stats?batchId=<batchId>"

curl -X POST -H "$H" "$BASE/api/content/<contentId>/complete"

curl -H "$H" "$BASE/api/content/batch-progress?batchId=<batchId>"
```
