# 02 — Authentication (Mobile OTP)

Routes in `src/routes/otp-auth.route.ts`, service in `src/services/otp-auth.service.ts` and `src/services/otp.service.ts`. Mounted at `/api/auth` (same prefix as the email flow) and gated by `publicRateLimiter` (100 req/min).

This is the **preferred path for consumer mobile apps** — it auto-registers a new student on first successful OTP, and returns both an access token and a refresh token.

---

## Flow at a glance

```
1. POST /api/auth/get-otp            → sends SMS OTP
2. POST /api/auth/verify-otp         → logs in OR auto-registers (STUDENT)
                                       returns { accessToken, refreshToken, user }
3. POST /api/auth/refresh-token      → exchange refreshToken for fresh accessToken
```

Token expiries (hard-coded in `src/services/otp-auth.service.ts`):

| Token | Expiry |
|---|---|
| Access (`type: "session"`) | 7 days |
| Refresh (`type: "refresh"`) | 30 days |

---

## 1. `POST /api/auth/get-otp`

Generates and sends a 6-digit OTP via SMS to the given mobile number.

Body (validated by Zod in `getOTPSchema`):

```json
{
  "countryCode": "+91",
  "phoneNumber": "9876543210",
  "organizationId": "uuid"
}
```

Validation rules:

- `countryCode`: 1–5 chars, matches `^\+?\d+$`.
- `phoneNumber`: 10–15 digits, digits only.
- `organizationId`: must be a UUID.

### Important nuance — the response status depends on the user

The service checks if a row exists in `user` for `(phoneNumber, organizationId)`:

```138:151:src/routes/otp-auth.route.ts
    const statusCode = result.isExistingUser
      ? HTTP_STATUS.OK
      : HTTP_STATUS.BAD_REQUEST;

    res.status(statusCode).json({
      success: result.isExistingUser,
      data: {
        isExistingUser: result.isExistingUser,
      },
      message: result.message,
    });
```

| User status | HTTP | `success` | `message` |
|---|---|---|---|
| Existing | 200 | true | `"OTP sent successfully to your registered mobile number"` |
| New (first-time) | 400 | false | `"OTP sent successfully. You will be registered as a new user"` |

Both cases **still send the OTP**. The 400 with `isExistingUser: false` is an intentional signal to the frontend to show a "new account" UI before posting `/verify-otp`.

---

## 2. `POST /api/auth/verify-otp`

Verifies the OTP and either logs in the existing user or creates a new STUDENT row, then returns JWTs.

Body (`verifyOTPSchema`):

```json
{
  "countryCode": "+91",
  "phoneNumber": "9876543210",
  "otp": "123456",
  "organizationId": "uuid"
}
```

Validation:

- `otp`: must be exactly 6 characters.
- Other fields same as `get-otp`.

Service logic (`verifyOTPAndLogin`):

1. `verifyOTP(countryCode, phoneNumber, otp)` — throws on mismatch/expiry.
2. Look up user by `(phoneNumber, organizationId)`.
3. If not found → `INSERT` new user with `role: "STUDENT"`, `isVerified: true`.
4. If found and `!isVerified` → `UPDATE user SET isVerified = true`.
5. Sign **access token** (`type: "session"`, 7d) with claims `{ userId, phoneNumber, organizationId }`.
6. Sign **refresh token** (`type: "refresh"`, 30d) with `{ userId }`.

Success (200):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "id": "uuid",
      "phoneNumber": "9876543210",
      "countryCode": "+91",
      "username": null,
      "role": "STUDENT",
      "organizationId": "uuid",
      "isVerified": true,
      "profileImg": null,
      "gender": null
    }
  }
}
```

The user probably has no `username` on first sign-up — the client should send the user to the profile screen (see [`11-User-Profile.md`](./11-User-Profile.md)) to fill it in.

Errors:

| Code | Reason |
|---|---|
| 400 | OTP invalid/expired, payload fails Zod |
| 404 | User lookup failed after OTP verified (rare — usually handled by auto-register) |
| 429 | Public rate limit |
| 503 | OTP provider unavailable |

---

## 3. `POST /api/auth/refresh-token`

Exchange a still-valid refresh token for a fresh 7-day access token. The refresh token itself is **not** rotated by this endpoint.

Body (`refreshTokenSchema`):

```json
{ "refreshToken": "<jwt>" }
```

Service (`refreshAccessToken`):

1. `jwt.verify(refreshToken)` — 401 if invalid / expired.
2. Require `type === "refresh"` — 401 otherwise.
3. Load the user row (404 if gone).
4. Re-sign a fresh `{ userId, phoneNumber, organizationId, type: "session" }` access JWT (7d).

Success (200):

```json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "accessToken": "<new jwt>",
    "user": {
      "id": "uuid",
      "phoneNumber": "...",
      "countryCode": "+91",
      "username": "...",
      "role": "STUDENT",
      "organizationId": "uuid"
    }
  }
}
```

Errors:

| Code | Meaning |
|---|---|
| 401 | Invalid / expired refresh token / wrong `type` |
| 404 | User deleted |

---

## JWT shapes summary

| Token | Claims | Signed lifetime |
|---|---|---|
| Access | `{ userId, phoneNumber, organizationId, type: "session" }` | 7 days |
| Refresh | `{ userId, type: "refresh" }` | 30 days |

`authenticate` in `auth.middleware.ts` only accepts `type === "session"` tokens — refresh tokens cannot be used as access tokens.

---

## Rate limiting

All three endpoints share `publicRateLimiter` (100 req/min per IP). See the Overview doc for the headers and error payload returned on 429s.

---

## Quick cURL cheatsheet

```bash
# 1) Ask for OTP
curl -X POST $BASE/api/auth/get-otp \
  -H 'Content-Type: application/json' \
  -d '{"countryCode":"+91","phoneNumber":"9876543210","organizationId":"<uuid>"}'

# 2) Verify + login/register
curl -X POST $BASE/api/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -d '{"countryCode":"+91","phoneNumber":"9876543210","otp":"123456","organizationId":"<uuid>"}'

# 3) Refresh access token
curl -X POST $BASE/api/auth/refresh-token \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<jwt>"}'
```
