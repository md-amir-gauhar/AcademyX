# 13 — Uploads (S3)

Routes in `src/routes/upload.route.ts`, service in `src/services/upload.service.ts`. Mounted at **`/api/upload`** on the client router (it is also reachable at `/admin/upload` through the admin router — both are the same handler functions).

All endpoints require authentication (`authenticate`). Authorization varies per endpoint (see table). `authenticatedRateLimiter` is applied.

Files are organized in S3 under `org-<organizationId>/...`. Optional CloudFront CDN URLs are returned when the env is configured.

---

## Endpoint summary

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/api/upload` | ADMIN, TEACHER, STUDENT | Direct server-side upload (multer, memory, 100MB) |
| POST | `/api/upload/signed-url` | ADMIN, TEACHER | Single presigned URL for browser→S3 PUT |
| POST | `/api/upload/batch-signed-urls` | ADMIN, TEACHER | Many presigned URLs at once |
| POST | `/api/upload/multipart/initiate` | ADMIN, TEACHER | Start a multipart upload |
| POST | `/api/upload/multipart/signed-urls` | ADMIN, TEACHER | Presigned URLs for each part |
| POST | `/api/upload/multipart/complete` | ADMIN, TEACHER | Finalize parts into one object |
| POST | `/api/upload/multipart/abort` | ADMIN, TEACHER | Abort & cleanup |

Students can only use the simple direct `POST /api/upload` (e.g. to upload their profile image). All the signed-URL and multipart flows are admin/teacher-only — they are not typically exercised by a student-facing app.

Allowed MIME types (enforced by the presigned-URL helper):

- Images: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`
- `application/pdf`
- Videos: `video/mp4`, `video/webm`, `video/quicktime`

File size limit: **100 MB** per single upload. For anything larger, use the multipart endpoints.

Presigned URL validity: **5 minutes** (`expiresIn: 300`).

---

## 1. `POST /api/upload` — direct upload

The one endpoint a student actually uses from a client app — e.g. profile image upload after OTP signup.

Content-Type: `multipart/form-data`. Field name: `file`. Max size: 100 MB.

Response:

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "key": "org-<orgId>/images/1735689600000-photo.jpg",
    "location": "https://<bucket>.s3.<region>.amazonaws.com/...",
    "cdnUrl": "https://cdn.example.com/...",
    "bucket": "<bucket>",
    "originalName": "photo.jpg",
    "size": 123456,
    "mimeType": "image/jpeg"
  }
}
```

After receiving this, the frontend typically writes `cdnUrl` (or `location` if CDN is not set) into `PUT /api/profile { profileImg: ... }` — see [`11-User-Profile.md`](./11-User-Profile.md).

Errors:

- 400 if no `file` or no `organizationId` on the token.

---

## 2. `POST /api/upload/signed-url` (ADMIN / TEACHER)

Generate a 5-minute presigned PUT URL so the browser can upload directly to S3 without streaming through this service.

Body:

```json
{
  "fileName": "lecture-notes.pdf",
  "fileType": "application/pdf",
  "fileSize": 1048576,
  "folder": "course-materials"   // optional, defaults to "uploads"
}
```

Response `data`:

```json
{
  "uploadUrl": "<presigned PUT url>",
  "publicUrl": "https://<bucket>.s3.../<key>",
  "cdnUrl":    "https://cdn.example.com/<key>",
  "key":       "<org>/<folder>/<timestamp>-<fileName>",
  "expiresIn": 300,
  "bucket":    "<bucket>"
}
```

Front-end uploads by: `PUT uploadUrl` with the file bytes and `Content-Type` header set to `fileType`.

Errors:

- 400 if any of `fileName`, `fileType`, `fileSize` is missing; or the size/type fail whatever checks `generateUploadUrl` performs server-side.

---

## 3. `POST /api/upload/batch-signed-urls` (ADMIN / TEACHER)

Get N presigned URLs in one round trip.

Body:

```json
{
  "files": [
    { "fileName": "v1.mp4", "fileType": "video/mp4", "fileSize": 10485760 },
    { "fileName": "v2.mp4", "fileType": "video/mp4", "fileSize": 20485760, "folder": "course-videos" }
  ]
}
```

Response `data[]` has one entry per file, each identical to the single signed-url response plus `fileName`.

---

## 4. Multipart upload (ADMIN / TEACHER)

For files larger than 100 MB (typically long videos). Flow:

### 4a. `POST /api/upload/multipart/initiate`

Body:

```json
{
  "fileName": "lecture-video.mp4",
  "fileType": "video/mp4",
  "fileSize": 524288000,
  "folder": "course-videos"
}
```

Response `data`: `{ uploadId, key, bucket }`. Keep these three values on the frontend for the rest of the flow.

### 4b. `POST /api/upload/multipart/signed-urls`

Body:

```json
{
  "uploadId": "<from initiate>",
  "key": "<from initiate>",
  "totalParts": 100
}
```

`totalParts` ∈ [1, 10000].

Response:

```json
{
  "urls": [
    { "partNumber": 1, "uploadUrl": "<presigned>" },
    { "partNumber": 2, "uploadUrl": "<presigned>" }
  ],
  "expiresIn": 300
}
```

Front-end uploads each chunk via `PUT uploadUrl` with the binary slice; S3 returns an `ETag` header per part.

### 4c. `POST /api/upload/multipart/complete`

Body:

```json
{
  "uploadId": "<from initiate>",
  "key": "<from initiate>",
  "parts": [
    { "partNumber": 1, "ETag": "\"abc...\"" },
    { "partNumber": 2, "ETag": "\"def...\"" }
  ]
}
```

Response `data`: `{ key, publicUrl, cdnUrl, bucket }` — same shape as the single signed-url response minus `uploadUrl`/`expiresIn`.

### 4d. `POST /api/upload/multipart/abort`

Body: `{ uploadId, key }`. Cleans up any uploaded parts server-side.

---

## Folder layout / naming

Default path pattern (controlled by `uploadService`):

```
org-<organizationId>/<folder|"images"|"videos"|"uploads">/<timestamp>-<original filename>
```

The timestamp prefix avoids filename collisions. The frontend doesn't need to worry about path details — always use `key`, `publicUrl`, or `cdnUrl` from the response as-is.

---

## Notes for client engineers

- **Students**: use `POST /api/upload` only. No presigned URL needed.
- **Admin/Teacher tools**: prefer the single-file `signed-url` path for up to 100 MB and the `multipart/*` flow for anything larger. This keeps large uploads off the API server.
- Videos ingested this way are referenced by `contents.videoUrl` (admin endpoints not covered here) and delivered to students via their watch URLs.

---

## cURL

```bash
H="Authorization: Bearer $TOKEN"

# Student direct upload
curl -X POST -H "$H" -F "file=@./avatar.png" "$BASE/api/upload"

# Single signed URL
curl -X POST -H "$H" -H 'Content-Type: application/json' \
  -d '{"fileName":"lecture.pdf","fileType":"application/pdf","fileSize":1048576}' \
  "$BASE/api/upload/signed-url"

# Multipart (abridged)
curl -X POST -H "$H" -H 'Content-Type: application/json' \
  -d '{"fileName":"big.mp4","fileType":"video/mp4","fileSize":524288000}' \
  "$BASE/api/upload/multipart/initiate"

curl -X POST -H "$H" -H 'Content-Type: application/json' \
  -d '{"uploadId":"...","key":"...","totalParts":100}' \
  "$BASE/api/upload/multipart/signed-urls"

curl -X POST -H "$H" -H 'Content-Type: application/json' \
  -d '{"uploadId":"...","key":"...","parts":[{"partNumber":1,"ETag":"\"abc\""}]}' \
  "$BASE/api/upload/multipart/complete"
```
