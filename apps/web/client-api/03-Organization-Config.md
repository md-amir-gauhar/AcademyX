# 03 — Organization Config (Public)

Route in `src/routes/client-organization-config.route.ts`, service in `src/services/organization-config.service.ts`. The client only has **one** endpoint here, and it is **public** (no auth) but rate-limited (`publicRateLimiter`) and heavily cached.

This is typically the **first call your frontend makes** — it returns the branding, theme, and feature flags used to bootstrap the app for a given tenant.

---

## `GET /api/organization-config/:slug`

Fetch public-facing config for a tenant by its slug (e.g. `acme`).

Path params:

- `slug` — the organization's slug string (e.g. reached from `acme.queztlearn.com` or `/?org=acme`).

No request body, no auth required.

### Caching

```109:127:src/routes/client-organization-config.route.ts
router.get(
  "/:slug",
  publicRateLimiter,
  cache(CacheTTL.LONG, (req) => {
    const { slug } = req.params;
    return `org-config:slug:${slug}`;
  }),
```

- Key: `org-config:slug:<slug>`
- TTL: **1 hour** (`CacheTTL.LONG`)

Admin-side mutations invalidate this key via `CacheManager.invalidateOrganizationConfig(...)`.

### What is returned

The service (`getOrganizationConfigBySlug`) explicitly **strips** sensitive fields (SMTP creds, Razorpay keys, and admin-only settings). The public payload contains things like:

- `id`, `organizationId`, `name`, `slug`, `domain`
- Contact info: `contactEmail`, `contactPhone`, `supportEmail`, `currency`
- Visual branding: `logoUrl`, `faviconUrl`, `bannerUrls[]`, `theme` (object)
- Marketing content: `motto`, `description`, `heroTitle`, `heroSubtitle`, `ctaText`, `ctaUrl`
- Sections: `features[]`, `testimonials[]`, `faq[]`
- Social: `socialLinks` (object)
- SEO: `metaTitle`, `metaDescription`, `ogImage`
- Feature flags: `featuresEnabled` (object — tells the frontend which modules to show)
- `maintenanceMode` (boolean)
- `customCSS`, `customJS` (strings to inject for white-labeling)

Success (200):

```json
{
  "success": true,
  "message": "Organization configuration retrieved successfully",
  "data": {
    "id": "uuid",
    "organizationId": "uuid",
    "name": "Acme Academy",
    "slug": "acme",
    "logoUrl": "https://...",
    "theme": { "primary": "#ff6600", "mode": "light" },
    "featuresEnabled": { "testSeries": true, "liveClasses": true },
    "maintenanceMode": false,
    "...": "..."
  }
}
```

Errors:

| Code | Meaning |
|---|---|
| 404 | No `organization_config` row with that slug |
| 429 | Public rate limit |

---

## When to call this

- On cold-start of the SPA / mobile app, before showing any UI.
- When the user changes tenant (multi-brand setups).

Since it's cached for 1 hour, frontend should **not** aggressively retry — a soft cache on the client side for ~15 minutes is a good companion policy.

---

## Related — the full org config is writable from admin

Admin users can update the same record via `PUT /admin/organization-config/...` (see admin routes — not covered in this client doc). Any admin update invalidates the public cache automatically.

---

## cURL

```bash
curl $BASE/api/organization-config/acme
```
