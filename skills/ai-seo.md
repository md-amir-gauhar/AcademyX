---
name: ai-seo
description: Optimize content for discovery, citation, and visibility across AI search platforms — ChatGPT, Perplexity, Claude, Gemini, Copilot, Google AI Overviews.
---

Optimize content to be cited by AI search engines. Traditional SEO gets ranked. AI SEO gets cited.

## Key Stats

- AI Overviews appear in ~45% of Google searches
- AI Overviews reduce clicks by up to 58%
- Brands 6.5x more likely cited via third-party sources than own domains
- Optimized content cited 3x more often
- Statistics and citations boost visibility 40%+

## Platform Overview

| Platform | Source Selection |
|----------|-----------------|
| Google AI Overviews | Correlates with traditional rankings |
| ChatGPT (with search) | Wider range, not just top-ranked |
| Perplexity | Authoritative, recent, well-structured |
| Gemini | Google index + Knowledge Graph |
| Copilot | Bing index + authoritative sources |
| Claude | Brave Search (when enabled) |

## Three-Pillar Strategy

### Pillar 1: Structure (Make Content Extractable)

AI extracts passages, not pages. Every key claim must work standalone.

**Content block patterns:**
- Definition blocks → "What is X?" queries
- Step-by-step blocks → "How to X" queries
- Comparison tables → "X vs Y" queries
- FAQ blocks → common questions
- Statistic blocks with cited sources

**Rules:**
- Lead every section with direct answer
- Key answer passages: 40-60 words optimal
- H2/H3 headings match how people phrase queries
- Tables > prose for comparisons
- Numbered lists > paragraphs for processes

### Pillar 2: Authority (Make Content Citable)

| Method | Boost | How |
|--------|-------|-----|
| Cite sources | +40% | Authoritative references with links |
| Add statistics | +37% | Specific numbers with sources |
| Expert quotes | +30% | Name and title required |
| Authoritative tone | +25% | Demonstrated expertise |
| Clarity | +20% | Simplify complex concepts |
| Technical terms | +18% | Domain-specific vocabulary |
| Unique vocab | +15% | Word diversity |
| Fluency | +15-30% | Readability and flow |
| Keyword stuffing | **-10%** | **Hurts AI visibility** |

Freshness matters: "Last updated: [date]" prominently. Quarterly minimum refresh for competitive topics.

### Pillar 3: Presence (Be Where AI Looks)

Third-party sources matter more than your own site:
- Wikipedia mentions (7.8% of ChatGPT citations)
- Reddit discussions (1.8% of ChatGPT citations)
- Industry publications and guest posts
- Review sites (G2, Capterra for B2B SaaS)
- YouTube (frequently cited by Google AI Overviews)

## AI Bot Access (robots.txt)

Verify these are allowed:
- `GPTBot`, `ChatGPT-User` — OpenAI
- `PerplexityBot` — Perplexity
- `ClaudeBot`, `anthropic-ai` — Anthropic
- `Google-Extended` — Gemini + AI Overviews
- `Bingbot` — Copilot

Blocking = no citations from that platform.

## Machine-Readable Files

### `/pricing.md`

```markdown
## Free
- Price: $0/month
- Limits: 100 emails/month, 1 user
- Features: Basic templates, API access

## Pro
- Price: $29/month
- Limits: 10,000 emails/month, 5 users
```

AI agents evaluate products before humans visit. Opaque pricing gets filtered out.

### `/llms.txt`

Context file for AI systems. Product overview, target audience, links to key pages.

## Schema for AI

| Content Type | Schema |
|-------------|--------|
| Articles | Article, BlogPosting |
| How-to | HowTo |
| FAQs | FAQPage |
| Products | Product |
| Comparisons | ItemList |
| Organization | Organization |

Content with schema: 30-40% higher AI visibility.

## AI Visibility Audit

Test 10-20 priority queries across ChatGPT, Perplexity, Google:
- "What is [your product category]?"
- "Best [category] for [use case]"
- "[Brand] vs [competitor]"
- "How to [problem your product solves]"

Document: AI Overview present? Your brand cited? Who else cited?

## Content Types by Citation Rate

| Type | Citation Share |
|------|----------------|
| Comparison articles | ~33% |
| Definitive guides | ~15% |
| Original research | ~12% |
| Best-of/listicles | ~10% |
| How-to guides | ~8% |

## Common Mistakes

- Gating authoritative content (AI can't access it)
- No freshness signals (undated content loses)
- Blocking AI bots in robots.txt
- Keyword stuffing (−10% visibility)
- No schema markup
- Ignoring third-party presence
- No /pricing.md file
- Not monitoring AI visibility monthly

## Monitoring Tools

| Tool | Coverage |
|------|----------|
| Otterly AI | ChatGPT, Perplexity, Google AI Overviews |
| Peec AI | ChatGPT, Gemini, Perplexity, Claude, Copilot |
| ZipTie | Brand mention + sentiment tracking |
| LLMrefs | SEO keyword → AI visibility mapping |
