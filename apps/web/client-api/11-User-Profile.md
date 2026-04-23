# 11 — User Profile

Routes in `src/routes/client/user-profile.route.ts`, service in `src/services/client/user-profile.service.ts`. Mounted at **`/api/profile`**. Two endpoints — one read, one update. Both require student auth.

`user.password` is never returned. Address is stored in a separate `address` table keyed by `userId`.

---

## Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/profile` | Get the caller's profile + address |
| PUT | `/api/profile` | Partial update of profile + address |

---

## 1. `GET /api/profile`

Returns the authenticated user's full profile (sans password) with the joined `address` row.

No query / body parameters.

Response (abridged):

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "organizationId": "uuid",
    "email": "student@example.com",
    "countryCode": "+91",
    "phoneNumber": "9876543210",
    "username": "johndoe",
    "role": "STUDENT",
    "isVerified": true,
    "profileImg": "https://cdn.../avatar.png",
    "gender": "Male",
    "createdAt": "...",
    "updatedAt": "...",
    "address": {
      "id": "...",
      "userId": "...",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560001",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

404 if the user row is missing (shouldn't happen post-auth, but defensively handled).

---

## 2. `PUT /api/profile`

Partial update. Every field is optional — only the keys you send are written.

Body (`updateUserProfileSchema`, Zod):

```json
{
  "username": "newname",
  "profileImg": "https://cdn.../avatar.png",
  "gender": "Female",
  "phoneNumber": "9876500000",
  "address": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

Validation rules:

| Field | Rule |
|---|---|
| `username` | 1–255 chars |
| `profileImg` | valid URL or `null` |
| `gender` | enum: `"Male" | "Female" | "Other" | "Prefer not to say"` (nullable) |
| `phoneNumber` | max 20 chars (nullable) |
| `address.city` | max 255 (nullable) |
| `address.state` | max 255 (nullable) |
| `address.pincode` | max 10 (nullable) |

Service (`updateUserProfile`):

1. Build an `updateData` dict for the `user` table (only fields that are not `undefined`). Always sets `updatedAt = now`.
2. If at least one non-`updatedAt` field is present, UPDATE the user row.
3. If `address` is present:
   - If an `address` row already exists for the user → UPDATE.
   - Else → INSERT a new row with `{ userId, ...addressData }`.
4. Returns the fresh profile by calling `getUserProfile(userId)` again.

Response: same shape as `GET /api/profile`.

Errors:

- 400: Zod validation failure (e.g. invalid `profileImg` URL, `gender` not in enum).
- 404: user row deleted (rare).

---

## What the client should typically do after OTP signup

The OTP flow (see [`02-Authentication-OTP.md`](./02-Authentication-OTP.md)) inserts a new user with `username: null`. Right after the first successful `verify-otp`, the UX should route to the profile-completion screen and do:

```http
PUT /api/profile
{ "username": "...", "gender": "...", "address": { "city": "...", "state": "...", "pincode": "..." } }
```

---

## Caching

Neither endpoint is cached — profile reads and writes are fast and are expected to be fresh. If you need to show profile widgets on many pages, cache client-side (memory / React Query).

---

## cURL

```bash
H="Authorization: Bearer $TOKEN"

# Read
curl -H "$H" "$BASE/api/profile"

# Update (partial)
curl -X PUT -H "$H" -H 'Content-Type: application/json' \
  -d '{"username":"johndoe","gender":"Male","address":{"city":"Bengaluru","state":"Karnataka","pincode":"560001"}}' \
  "$BASE/api/profile"
```
