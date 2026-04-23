---
name: vercel-react-best-practices
description: React and Next.js performance optimization guide with 70+ prioritized rules across 8 categories.
---

React and Next.js performance optimization. 70 rules across 8 categories.

## When to Apply

- Writing React/Next.js components
- Code review
- Refactoring
- Performance audits

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

## Priority 1: Eliminating Waterfalls (CRITICAL)

- Fetch data in parallel, not sequentially
- Use `Promise.all()` for independent fetches
- In Next.js App Router: fetch at the layout level, not deep in components
- Avoid fetch-on-render patterns; prefer render-on-fetch
- Use `<Suspense>` boundaries to prevent parent waterfalls from blocking children

## Priority 2: Bundle Size (CRITICAL)

- Dynamic imports (`next/dynamic`) for heavy components not needed on first load
- Tree-shake: import named exports, not entire packages (`import { X } from 'pkg'`)
- Analyze with `@next/bundle-analyzer`
- Avoid importing large libraries for small utilities (use native or micro-packages)
- `next/image` for automatic image optimization

## Priority 3: Server-Side Performance (HIGH)

- Use React Server Components (RSC) for data fetching by default
- Keep client components (`'use client'`) at the leaf level
- Cache aggressively: `unstable_cache`, `fetch` cache options
- Avoid blocking the server: no synchronous DB calls in the render path

## Priority 4: Client-Side Data Fetching (MEDIUM-HIGH)

- Use SWR or React Query for client-side fetching (caching, deduplication)
- Avoid `useEffect` + `fetch` patterns — they don't cache
- Prefetch data on hover/focus for perceived performance

## Priority 5: Re-render Optimization (MEDIUM)

- `useMemo` for expensive computations
- `useCallback` for stable function references passed to children
- `React.memo` for pure components receiving stable props
- Split context: separate frequently-changing from rarely-changing state
- Avoid creating objects/arrays inline in JSX props

## Priority 6: Rendering Performance (MEDIUM)

- Virtualize long lists (`react-virtual`, `@tanstack/virtual`)
- `key` prop must be stable and unique — never use array index for dynamic lists
- Avoid anonymous functions in render that break memoization
- Use CSS for show/hide instead of conditional rendering for frequent toggles

## Priority 7: JavaScript Performance (LOW-MEDIUM)

- Debounce/throttle event handlers (resize, scroll, input)
- Web Workers for CPU-intensive tasks
- `requestAnimationFrame` for animations
- Avoid `JSON.parse`/`JSON.stringify` in hot paths

## Priority 8: Advanced Patterns (LOW)

- Streaming with `<Suspense>` and `loading.tsx` in App Router
- Partial Prerendering (PPR) for hybrid static/dynamic pages
- ISR (Incremental Static Regeneration) for frequently-updated static content
- Edge runtime for latency-sensitive routes
