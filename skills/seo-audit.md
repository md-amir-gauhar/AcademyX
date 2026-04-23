---
name: seo-audit
description: Comprehensive SEO auditing framework — crawlability, indexation, speed, on-page optimization, and content quality with prioritized action plans.
---

Comprehensive SEO audit framework.

## Initial Assessment

Check for `.agents/product-marketing-context.md` or `.claude/product-marketing-context.md` before auditing. Understand site context and scope first.

## Priority Order

1. Crawlability & Indexation
2. Technical Foundations
3. On-Page Optimization
4. Content Quality
5. Authority & Links

## Technical Audit

### Crawlability
- robots.txt: no accidental blocks on important pages
- XML sitemap: exists, submitted to GSC, all important pages included
- Site architecture: important pages ≤3 clicks from home
- No crawl budget waste on pagination/facets without canonical

### Indexation
- Index status in Google Search Console
- Canonicalization correct (no self-referencing issues)
- No noindex on important pages

### Core Web Vitals
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1

### Mobile
- Responsive design
- Tap targets adequate
- No horizontal scroll
- Viewport meta tag set

### Security
- Site-wide HTTPS
- SSL certificate valid
- No mixed content
- Redirect chains ≤2 hops

## On-Page Audit

**Title Tags**: unique, primary keyword near start, 50-60 chars, compelling

**Meta Descriptions**: unique, 150-160 chars, includes keyword, clear value prop

**Heading Structure**: one H1, logical H1→H2→H3 hierarchy, descriptive

**Content**: keyword in first 100 words, sufficient depth, answers search intent

**Images**: descriptive filenames, alt text, compressed, modern formats (WebP), lazy loading

**Internal Linking**: important pages well-linked, descriptive anchors, no broken links

**Keyword Targeting**: clear primary target per page, no cannibalization

## Content Quality (E-E-A-T)

- **Experience**: first-hand demonstration, original insights
- **Expertise**: author credentials, accurate info, proper sourcing
- **Authoritativeness**: recognized in space, cited by others
- **Trustworthiness**: accurate, transparent business, HTTPS, privacy policy

## Schema Markup Note

`web_fetch` and `curl` cannot reliably detect structured data — many CMS plugins inject JSON-LD via JavaScript. Use:
- Browser: `document.querySelectorAll('script[type="application/ld+json"]')`
- Google Rich Results Test
- Screaming Frog

## Common Issues by Site Type

| Type | Common Issues |
|------|---------------|
| SaaS | Thin feature pages, no comparisons, blog not integrated |
| E-commerce | Thin category pages, duplicate descriptions, missing schema |
| Content/Blog | Outdated content, cannibalization, no topical clusters |
| Local Business | Inconsistent NAP, missing schema, no location pages |

## Output Format

**Executive Summary**: overall health, top 3-5 issues, quick wins

**Findings per category**: Issue / Impact / Evidence / Fix / Priority

**Prioritized Action Plan**:
1. Critical (blocking indexation/ranking)
2. High-impact improvements
3. Quick wins
4. Long-term recommendations

## Free Tools

Google Search Console, PageSpeed Insights, Rich Results Test, Mobile-Friendly Test, Schema Validator

## Paid Tools

Screaming Frog, Ahrefs/Semrush, Sitebulb, ContentKing
