# AcademyX

A premium, enterprise-grade learning platform frontend for the QueztLearn API, built with Next.js App Router, TypeScript, Tailwind, Framer Motion, Zustand and TanStack Query.

> **Status: Phase 1 + Phase 2 auth & dashboard shell.** Landing page, phone/OTP auth, complete-profile, and a wired student dashboard are live. Course marketplace, video player, quizzes, live classes, billing and admin ship in subsequent phases.

---

## Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v3 + CSS variables design system (`app/globals.css`) + `tailwind-merge`
- **UI primitives:** shadcn-style components (Radix under the hood) in `components/ui/*`
- **Animation:** Framer Motion
- **State:** Zustand (persisted auth, org config, UI)
- **Server state:** TanStack Query v5 with a typed axios layer
- **Forms:** React Hook Form + Zod
- **Icons:** lucide-react
- **Theming:** next-themes (light / dark / system)
- **Toasts:** Sonner
- **Charts:** Recharts (installed, used from Phase 3 onwards)

---

## Getting started

```bash
# 1. Copy env template
cp .env.example .env.local

# 2. Install deps (already done if you ran npm install)
npm install

# 3. Dev server
npm run dev
```

Open `http://localhost:3000`.

### Environment

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the QueztLearn backend | `https://api.queztlearn.com` |
| `NEXT_PUBLIC_ORG_SLUG` | Tenant slug, resolved into `organizationId` at boot | `acme-academy` |
| `NEXT_PUBLIC_APP_NAME` | Display name fallback (the org config `name` overrides) | `AcademyX` |

---

## File structure

```
app/
  (auth)/                        # Auth route group with split-screen layout
    sign-in/          - phone entry
    verify-otp/       - 6-digit OTP verification
    complete-profile/ - post-signup username + city
  (student)/                     # Protected student area (AuthGuard)
    dashboard/        - Home with live stats, recently watched, upcoming
  layout.tsx          - Root layout (fonts, providers, metadata)
  page.tsx            - Landing page
  globals.css         - Design tokens + theme + utility layers
  not-found.tsx

components/
  ui/        - Reusable primitives (Button, Card, Input, Dialog, OTPInput, …)
  brand/     - Logo, gradient orb, animated counter, section heading
  landing/   - Hero, Features, HowItWorks, Testimonials, Pricing, FAQ, CTA, Nav, Footer
  dashboard/ - Sidebar, Topbar, Mobile nav, StatCard
  providers.tsx, theme-provider.tsx, theme-toggle.tsx, org-bootstrap.tsx

features/
  auth/       - sign-in-form, verify-otp-form, complete-profile-form, auth-guard
  dashboard/  - overview (wired to real API)

hooks/
  useAuth, useOrgConfig, useOtp, useProfile, useHasMounted

lib/
  utils.ts    - cn, formatters
  env.ts      - validated env
  api/
    client.ts    - axios instance + request/response interceptors (JWT + refresh flow)
    endpoints.ts - single source of truth for every route
    errors.ts    - typed ApiRequestError

services/     - One per resource: authService, orgService, profileService,
                batchService, courseService, contentProgressService, scheduleService

store/
  authStore.ts   - user + tokens + pendingLogin (persisted)
  orgStore.ts    - resolved org config (loaded once on cold start)
  uiStore.ts     - palette / mobile nav / sidebar

types/        - Fully-typed envelopes + DTOs mirroring the /api contracts

client-api/   - Source-of-truth Markdown docs for every endpoint (do not edit here)
```

---

## How auth works

The QueztLearn API is multi-tenant. Every auth call needs an `organizationId`, which is **not** known client-side. The flow:

1. On cold start, `OrgBootstrap` calls `GET /api/organization-config/:slug` (slug from env) and caches the resolved `organizationId` in `orgStore`.
2. User enters `countryCode + phoneNumber` on `/sign-in` → `POST /api/auth/get-otp` (sends OTP regardless of whether account exists; response tells us `isExistingUser`).
3. User enters the 6-digit code on `/verify-otp` → `POST /api/auth/verify-otp` → backend auto-registers new users and returns `{ accessToken, refreshToken, user }`.
4. If `user.username` is null (brand-new account) → redirect to `/complete-profile` for `PUT /api/profile`.
5. Else → `/dashboard`.

Access + refresh tokens are persisted by Zustand to `localStorage` and wired to axios via a single bridge configured in `components/providers.tsx`. The response interceptor transparently refreshes 401s via `/api/auth/refresh-token` (30-day refresh).

Route protection is **client-side only** (via `features/auth/auth-guard.tsx`) because the tokens live in `localStorage`, which Edge middleware cannot read.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start the built app |
| `npm run lint` | ESLint (Next preset) |
| `npm run typecheck` | `tsc --noEmit` |

---

## Design system cheat sheet

- **Primary:** indigo `#6366F1` → violet `#8B5CF6` (brand gradient)
- **Secondary:** emerald `#10B981`, sky `#0EA5E9`
- **Radius:** `rounded-2xl` default (`--radius: 1rem`)
- **Typography:** Inter with `ss01` contextual alternates
- Glass: `.glass` / `.glass-strong`
- Gradient text: `.gradient-text`
- Soft shadow: `shadow-soft`, `shadow-glow`, `shadow-glow-violet`
- Animations: `animate-fade-up`, `animate-float`, `animate-shimmer`, `animate-pulse-ring`

---

## Roadmap

- **Phase 3:** Course marketplace, batch detail, course hierarchy (subjects → chapters → topics → contents), wishlist.
- **Phase 4:** Video learning interface (player + notes + transcript + quiz tabs), watch-time heartbeat, schedules page.
- **Phase 5:** Test series, tests, attempts UI, results analytics, practice zone, community.
- **Phase 6:** Orders + Razorpay checkout, subscription/billing flows, profile settings, certificates.
- **Phase 7:** AI study assistant widget, achievements, streaks, multi-language, admin panel scaffold.
