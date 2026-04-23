# 07 — Schedules (Live Classes)

Routes in `src/routes/client/schedule.route.ts`, service in `src/services/client/schedule.service.ts`. Mounted at **`/api/schedules`**.

A `schedule` is a planned live class (typically YouTube Live) tied to a specific `batch`, `subject`, `topic`, and optionally a `teacher` and `content`. Clients can only see schedules belonging to batches they have purchased.

All endpoints require student auth + `authenticatedRateLimiter`. None of them are cached — they are intentionally live.

Schedule lifecycle status: `SCHEDULED → LIVE → COMPLETED` (or `CANCELLED`).

---

## Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/schedules` | Paginated feed across all of the user's purchased batches (with filters) |
| GET | `/api/schedules/:id` | Single schedule by id |
| GET | `/api/schedules/topic/:topicId` | All schedules on a topic |
| GET | `/api/schedules/batch/:batchId` | All schedules on a batch (also mirrored at `/api/batches/:batchId/schedules`) |

---

## 1. `GET /api/schedules` — user feed

Paginated list of schedules across all batches the user owns (`user_batch_mapping` rows with `isActive = true`).

Query (`scheduleQuerySchema`):

| Name | Type | Notes |
|---|---|---|
| `page` | int string (default 1) | |
| `limit` | int string (default 10, max 100) | |
| `status` | `SCHEDULED` \| `LIVE` \| `COMPLETED` \| `CANCELLED` | Optional filter |
| `batchId` | UUID | Optional. If set, must be a purchased batch or → **403** |
| `teacherId` | UUID | Optional |
| `date` | `YYYY-MM-DD` | Optional |
| `upcoming` | `"true"` | If true, server enforces `scheduledAt >= now` AND `status = SCHEDULED` |

Service (`getAllSchedules`):

1. Look up purchased batch ids for the user.
2. If none → return empty page.
3. Build `WHERE schedules.batchId = ANY(purchasedBatchIds)` + any additional filters.
4. Ordered by `scheduledAt ASC`.
5. Relations populated: `topic → chapter → subject → batch`, plus `batch`, `subject`, `teacher`, `content`.

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Integration by parts — live session",
      "description": "...",
      "scheduledAt": "2025-05-10T14:00:00Z",
      "duration": 60,
      "status": "SCHEDULED",
      "notifyBeforeMinutes": 30,
      "youtubeLink": "https://www.youtube.com/embed/abc123",
      "thumbnailUrl": "...",
      "tags": ["maths","calculus"],
      "batch": { "id": "...", "name": "..." },
      "subject": { "id": "...", "name": "Mathematics" },
      "topic": { "id": "...", "name": "Integration", "chapter": { "subject": { "batch": { "id": "..." } } } },
      "teacher": { "id": "...", "name": "..." },
      "content": null
    }
  ],
  "pagination": { "total": 12, "page": 1, "limit": 10, "totalPages": 2, "hasNextPage": true, "hasPrevPage": false }
}
```

Errors: `400` if `userId`/`organizationId` missing; `403` if a `batchId` filter is passed but the user doesn't own that batch; `400` on Zod query validation.

---

## 2. `GET /api/schedules/:id`

Returns a single schedule, validated across 3 gates:

1. Schedule exists — else `404`.
2. Belongs to the caller's org AND owning batch is `ACTIVE` — else `404` (same error to avoid leaking tenancy info).
3. User has purchased the owning batch — else `403`.

Path: `:id` UUID (Zod `scheduleIdParamSchema`).

Response: `{ success, data: <schedule> }` where `<schedule>` includes `topic → chapter → subject → batch` + `teacher` + `content`.

---

## 3. `GET /api/schedules/topic/:topicId`

All schedules scoped to one topic. Access model is the same as the single schedule route — 404 if topic missing/off-org/non-active, 403 if batch not purchased.

Response: `data: <schedule[]>` ordered by `scheduledAt ASC`, each with `teacher` + `content` relations.

---

## 4. `GET /api/schedules/batch/:batchId`

All schedules for a batch.

Access model:

- `404` if the batch doesn't exist / is inactive / not in caller's org.
- If the user has **not** purchased the batch → returns **`data: []`** (not 403). This is intentional so the UI can render "Purchase to access live classes" smoothly.

Service (`getSchedulesByBatchId`) has a unique behavior: **it re-computes `status` on the fly**:

```277:301:src/services/client/schedule.service.ts
  const now = new Date();
  const schedulesWithStatus = schedulesList.map((schedule) => {
    let computedStatus = schedule.status;

    if (schedule.status !== "CANCELLED") {
      const scheduledTime = new Date(schedule.scheduledAt);
      const endTime = new Date(
        scheduledTime.getTime() + schedule.duration * 60 * 1000
      );

      if (now < scheduledTime) {
        computedStatus = "SCHEDULED";
      } else if (now >= scheduledTime && now < endTime) {
        computedStatus = "LIVE";
      } else {
        computedStatus = "COMPLETED";
      }
    }

    return {
      ...schedule,
      status: computedStatus,
    };
  });
```

So the `status` field returned is **always up-to-date** for `SCHEDULED / LIVE / COMPLETED`. `CANCELLED` is respected as-is.

> The same endpoint is also exposed as `GET /api/batches/:batchId/schedules` (see [`04-Batches.md`](./04-Batches.md)). Both reach the same service function.

---

## Field reference (what to render)

| Field | Use |
|---|---|
| `title`, `description`, `subjectName`, `tags[]` | headline / metadata |
| `scheduledAt` | UTC ISO — format in user's local TZ |
| `duration` | minutes |
| `status` (computed) | drive live/upcoming/ended states |
| `youtubeLink` | Pre-validated `https://www.youtube.com/embed/VIDEO_ID` — embed directly in an `<iframe>` |
| `thumbnailUrl` | optional preview |
| `notifyBeforeMinutes` | configurable client-side reminder (server does not push notifications in this codebase) |
| `teacher` | joined teacher object |

---

## Errors (shared across all four)

| Code | Case |
|---|---|
| 400 | Missing user/org context, Zod validation failure |
| 403 | Batch filter / schedule belongs to batch user hasn't purchased (only `/`, `/:id`, `/topic/:topicId`) |
| 404 | Resource missing / wrong org / inactive batch |

---

## cURL

```bash
H="Authorization: Bearer $TOKEN"

# Feed
curl -H "$H" "$BASE/api/schedules?page=1&limit=10&upcoming=true"

# Detail
curl -H "$H" "$BASE/api/schedules/<id>"

# By topic
curl -H "$H" "$BASE/api/schedules/topic/<topicId>"

# By batch
curl -H "$H" "$BASE/api/schedules/batch/<batchId>"
```
