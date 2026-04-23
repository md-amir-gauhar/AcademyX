---
name: seo-geo
description: Optimize websites for AI search engines (ChatGPT, Perplexity, Gemini, Copilot, Claude) and traditional search via GEO + SEO.
---

GEO (Generative Engine Optimization) + traditional SEO. AI search engines don't rank pages — they cite sources.

## Workflow

### Step 1: Audit
- Check meta tags, robots.txt, sitemap
- Verify AI bot access: Googlebot, Bingbot, PerplexityBot, ChatGPT-User, ClaudeBot, GPTBot

### Step 2: Keyword Research
- Search volume and difficulty
- Competitor keyword strategies
- Long-tail opportunities

### Step 3: GEO Optimization (Princeton Methods)

| Method | Visibility Boost |
|--------|-----------------|
| Cite sources | +40% |
| Add statistics | +37% |
| Add expert quotes | +30% |
| Authoritative tone | +25% |
| Simplify complex concepts | +20% |
| Include technical terms | +18% |
| Unique vocabulary | +15% |
| Fluency optimization | +15-30% |
| Keyword stuffing | **-10% — AVOID** |

**Best combination:** Fluency + Statistics = maximum boost

### Step 4: Traditional SEO

**Meta Tags:**
```html
<title>{Primary Keyword} - {Brand} | {Secondary Keyword}</title>
<meta name="description" content="{150-160 chars with keyword}">
<meta property="og:title" content="{Title}">
<meta property="og:image" content="{1200x630 image}">
<meta name="twitter:card" content="summary_large_image">
```

**Content Checklist:**
- H1 contains primary keyword
- Images have descriptive alt text
- Internal links to related content
- External links: `rel="noopener noreferrer"`
- Mobile-friendly
- Page loads < 3 seconds

### Step 5: Validate & Monitor

Schema validation:
- Google Rich Results Test
- Schema.org Validator

Check indexing:
- `site:yourdomain.com` in Google and Bing

## Schema Templates

**FAQPage:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is [topic]?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "According to [source], [answer with statistics]."
    }
  }]
}
```

## Platform-Specific

| Platform | Key Factor |
|----------|-----------|
| ChatGPT | Branded domain authority, content updated <30 days (3.2x citations) |
| Perplexity | Allow PerplexityBot, FAQ schema, PDF hosting |
| Google AI Overviews | E-E-A-T, structured data, topical authority |
| Microsoft Copilot | Bing indexing required, page speed <2s |
| Claude AI | Brave Search indexing, high factual density |

## Content Structure

- Answer-first format (direct answer at top)
- H1 > H2 > H3 hierarchy
- Bullet points and numbered lists
- Tables for comparison data
- Short paragraphs (2-3 sentences max)
