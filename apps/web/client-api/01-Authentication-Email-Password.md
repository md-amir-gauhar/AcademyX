# 01 — Authentication (Email / Password)

Routes implemented in `src/routes/client-auth.route.ts`, backed by `src/services/auth.service.ts`. All endpoints in this doc are mounted under `/api/auth` and are **public** (no auth header required), but they **are** rate-limited by `publicRateLimiter` (100 req/min).

> For mobile-OTP login, see [`02-Authentication-OTP.md`](./02-Authentication-OTP.md).

---

## Flow at a glance

```
1. POST /register               → creates user (isVerified: false), emails verification link
2. POST /verify-email           → marks user verified (via JWT token from email)
3. POST /set-password           → user chooses a password
4. POST /login                  → returns JWT access token (type: "session", 7d)
   — or —
   POST /resend-verification    → re-sends verification email if the first one was lost
```

Once `/login` returns a token, every subsequent client call goes out with
`Authorization: Bearer <token>`.

Session/verification config comes from `src/common/constants.ts`:

```58:61:src/common/constants.ts
export const TOKEN_CONFIG = {
  VERIFICATION_EXPIRY_HOURS: 24,
  SESSION_EXPIRY_DAYS: 7,
} as const;
```

---

## 1. `POST /api/auth/register`

Creates a new **STUDENT** account (role is forced to `STUDENT`; clients cannot self-register as admin/teacher).

Body:

```json
{
  "organizationId": "uuid",
  "email": "student@example.com",
  "username": "johndoe"
}
```

- All three fields required (checked manually before DB).
- If the email already exists → `409 CONFLICT` (`"Email already registered"`).

Side effects:

1. Row inserted in `user` with `role: "STUDENT"`, `isVerified: false`.
2. A JWT `{ userId, email, type: "email_verification" }` is signed with `TOKEN_CONFIG.VERIFICATION_EXPIRY_HOURS` (24h) expiry.
3. A row is inserted in `verification_token` with the same token + expiry.
4. `sendVerificationEmail(email, token, username)` is called (SMTP configured per org).

Success (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "...",
    "username": "...",
    "role": "STUDENT",
    "message": "Verification email sent. Please check your inbox."
  },
  "message": "User registered successfully. Please verify your email."
}
```

Errors:

| Code | Meaning |
|---|---|
| 400 | Missing `organizationId` / `email` / `username` |
| 409 | Email already registered |
| 429 | Rate limit exceeded (public limiter) |

---

## 2. `POST /api/auth/verify-email`

Verifies a user's email. Called from a link delivered by email; the link carries the token as a query param — your frontend lifts it out and POSTs it here.

Body:

```json
{ "token": "<jwt from email>" }
```

Service logic (`verifyEmail` in `src/services/auth.service.ts`):

1. Verify the JWT (rejected with 400 if expired/invalid).
2. Require `type === "email_verification"` — any other type → 400 `"Invalid token type"`.
3. Look up the matching row in `verification_token` where `isUsed = false`.
4. Check that `expiresAt > now` — else 400 `"Token has expired"`.
5. Set `user.isVerified = true`.
6. Mark `verification_token.isUsed = true`.

Success (200):

```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "userId": "uuid"
  }
}
```

Errors: `400` for missing token / invalid / expired / already used.

---

## 3. `POST /api/auth/set-password`

After verification, the frontend asks the user to set a password. This endpoint is idempotent — it can be used to re-set the password at any point as long as the account is verified.

Body:

```json
{ "userId": "uuid", "password": "at-least-8-chars" }
```

Validation (`setPassword`):

- `password.length >= 8` (VALIDATION_RULES.PASSWORD_MIN_LENGTH). Else 400.
- User must exist and `isVerified === true`. Else 404 / 403.

Storage: password is hashed with `bcrypt` (cost 10) and written to `user.password`.

Success (200):

```json
{ "success": true, "data": { "message": "Password set successfully. You can now login." } }
```

---

## 4. `POST /api/auth/login`

Email + password → session JWT.

Body:

```json
{ "email": "student@example.com", "password": "secret" }
```

Service (`loginUser`):

1. Look up user by email → 401 if not found.
2. 403 if `!isVerified` (`"Please verify your email before logging in"`).
3. 403 if `!password` (user registered but never set a password → `"Please set your password first"`).
4. `bcrypt.compare` the provided password → 401 if no match.
5. Sign JWT: `{ userId, email, organizationId, type: "session" }` with `SESSION_EXPIRY_DAYS` (7d).

Success (200):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "...",
      "username": "...",
      "role": "STUDENT",
      "organizationId": "uuid"
    }
  }
}
```

The `token` is what the frontend must send as `Authorization: Bearer <token>` on every authenticated call.

---

## 5. `POST /api/auth/resend-verification`

Re-sends the verification email for an un-verified account (e.g. the token expired).

Body:

```json
{ "email": "student@example.com" }
```

Rules:

- 404 if user not found.
- 400 if `isVerified === true` (`"Email already verified"`).
- Otherwise a fresh JWT + verification_token row are created and a new email is sent.

Success:

```json
{ "success": true, "data": { "message": "Verification email resent. Please check your inbox." } }
```

---

## JWT structures (email/password flow)

| Purpose | Claims | Expiry |
|---|---|---|
| Email verification | `{ userId, email, type: "email_verification" }` | 24h |
| Session (access) | `{ userId, email, organizationId, type: "session" }` | 7d |

Only `type === "session"` is accepted by the `authenticate` middleware — see `src/middlewares/auth.middleware.ts`.

---

## Rate limiting

All 5 endpoints use `publicRateLimiter` (100 req/min per IP, Redis-backed). Exceeding it returns:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error": {
    "limit": 100,
    "windowMs": 60000,
    "retryAfter": "42 seconds",
    "resetAt": "2025-01-01T00:00:42.000Z"
  }
}
```

with headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735689642000
Retry-After: 42
```

---

## Quick cURL cheatsheet

```bash
# Register
curl -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"organizationId":"<uuid>","email":"a@b.com","username":"a"}'

# Verify
curl -X POST $BASE/api/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"token":"<jwt>"}'

# Set password
curl -X POST $BASE/api/auth/set-password \
  -H 'Content-Type: application/json' \
  -d '{"userId":"<uuid>","password":"MySecret123"}'

# Login
curl -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"MySecret123"}'

# Resend verification
curl -X POST $BASE/api/auth/resend-verification \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com"}'
```
