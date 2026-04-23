# 05 — Course Hierarchy (Subjects / Chapters / Topics / Contents)

Four routers that together expose the read-only tree a student navigates inside a purchased batch:

```
Batch → Subject → Chapter → Topic → Content
```

| Level | Base path | Route file | Service file |
|---|---|---|---|
| Subject | `/api/subjects` | `src/routes/client/subject.route.ts` | `src/services/client/subject.service.ts` |
| Chapter | `/api/chapters` | `src/routes/client/chapter.route.ts` | `src/services/client/chapter.service.ts` |
| Topic | `/api/topics` | `src/routes/client/topic.route.ts` | `src/services/client/topic.service.ts` |
| Content | `/api/contents` | `src/routes/client/content.route.ts` | `src/services/client/content.service.ts` |

All eight endpoints below require:

- `Authorization: Bearer <access_token>`
- `role === "STUDENT"`
- `authenticatedRateLimiter` (500 req/min)

They are also Redis-cached with `CacheTTL.MEDIUM` (15 minutes). The cache keys embed `userId` where responses could be user-scoped — see each section.

> **Important access rule:** even though these endpoints are under student auth, the services do **not** hard-block non-purchasers; they simply throw a `NOT_FOUND` if the owning batch is not `ACTIVE` or not in the user's org. The frontend is expected to only show these endpoints inside a batch the user owns. Access to **files/URLs inside content** should be gated client-side using `/api/batches/my-batches`.

---

## Subjects

### `GET /api/subjects/batch/:batchId`

List all subjects for a given batch. Each subject is returned with its `teachers` array (joined via `batchTeacherMapping`).

Path validation: `batchId` is UUID.

Cache key: `subject:batch:<batchId>:user:<userId>` — TTL `MEDIUM`.

Errors:

- `404` if the batch does not exist, is not ACTIVE, or is in another organization.

Example response (abridged):

```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "batchId": "uuid",
      "name": "Physics",
      "displayOrder": 1,
      "teachers": [ { "id": "...", "name": "Dr. X" } ]
    }
  ]
}
```

### `GET /api/subjects/:id`

Fetch a single subject. Service joins `batch` and verifies `organizationId` + `status === "ACTIVE"`; otherwise `404`.

Cache key: `subject:<id>` — TTL `MEDIUM`.

---

## Chapters

### `GET /api/chapters/subject/:subjectId`

All chapters belonging to a subject, ordered by `createdAt ASC`.

Cache key: `chapter:subject:<subjectId>:user:<userId>` — TTL `MEDIUM`.

Errors: `404` if the subject is not found / not in user org / the owning batch is not ACTIVE.

### `GET /api/chapters/:id`

Single chapter. Service walks `chapter → subject → batch` and validates `organizationId` + `status === "ACTIVE"`.

Cache key: `chapter:<id>` — TTL `MEDIUM`.

---

## Topics

### `GET /api/topics/chapter/:chapterId`

All topics in a chapter. Cache key: `topic:chapter:<chapterId>:user:<userId>` — TTL `MEDIUM`.

### `GET /api/topics/:id`

Single topic, scoped to user's org via the chapter → subject → batch walk.

Cache key: `topic:<id>` — TTL `MEDIUM`.

---

## Contents

`content` is the leaf of the tree — each row is a single lecture video, document, or other asset.

### `GET /api/contents/topic/:topicId`

All contents for a topic, ordered by `createdAt ASC`. Cache key: `content:topic:<topicId>:user:<userId>` — TTL `MEDIUM`.

### `GET /api/contents/:id`

Single content — service walks `content → topic → chapter → subject → batch` and requires the batch to be `ACTIVE` and in the user's org.

Cache key: `content:<id>` — TTL `MEDIUM`.

Each `content` record typically contains (depends on DB schema — refer to `src/db/schema.ts`):

- `id`, `topicId`, `organizationId`
- `title`, `description`, `displayOrder`
- `type` (e.g. `"Lecture"`, `"PDF"`, `"Quiz"`)
- `videoUrl`, `videoDuration`, `thumbnailUrl`, `pdfUrl`, etc.
- timestamps

The frontend should treat `videoUrl`/`pdfUrl` as short-lived signed URLs when the batch is gated — generation of those URLs is typically handled by the admin upload pipeline (see [`13-Upload.md`](./13-Upload.md)) and stored at create time.

---

## Error patterns

All four sub-resources share the same NotFound-by-scope pattern:

```tsx
if (!resource) throw new ApiError("X not found", 404);
if (resource.batch.organizationId !== orgId) throw ApiError(..., 404);
if (resource.batch.status !== "ACTIVE")    throw ApiError(..., 404);
```

This means **`404` can mean "not your org"** — deliberately opaque to avoid leaking the existence of other tenants' resources.

---

## cURL

```bash
H="Authorization: Bearer $TOKEN"

curl -H "$H" "$BASE/api/subjects/batch/<batchId>"
curl -H "$H" "$BASE/api/chapters/subject/<subjectId>"
curl -H "$H" "$BASE/api/topics/chapter/<chapterId>"
curl -H "$H" "$BASE/api/contents/topic/<topicId>"

curl -H "$H" "$BASE/api/subjects/<id>"
curl -H "$H" "$BASE/api/chapters/<id>"
curl -H "$H" "$BASE/api/topics/<id>"
curl -H "$H" "$BASE/api/contents/<id>"
```
