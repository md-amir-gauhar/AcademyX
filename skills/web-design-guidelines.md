---
name: web-design-guidelines
description: Audit UI code against Vercel's Web Interface Guidelines. Fetches latest rules before review, outputs findings in file:line format.
---

Audit UI code against Vercel's Web Interface Guidelines.

## How to Use

1. Fetch latest guidelines from source URL before review
2. Read specified files (or prompt user if none provided)
3. Check code against all rules in fetched guidelines
4. Output findings in `file:line` format

## Guidelines Source

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Fetch this URL with WebFetch before every audit to ensure current rules.

## Output Format

```
src/components/Button.tsx:24 — missing focus-visible ring (accessibility)
src/pages/index.astro:87 — tap target below 44×44px minimum (touch)
src/styles/global.css:12 — color contrast ratio below 4.5:1 (WCAG AA)
```

Terse `file:line — issue (category)` format. No prose, no summaries.

## Trigger

When user provides file paths or patterns, audit against fetched guidelines.
If no files specified, ask user which files to review.
