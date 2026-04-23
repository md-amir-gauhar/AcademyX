---
name: compress
description: Compress natural language files (CLAUDE.md, todos, preferences) into caveman-speak to reduce input tokens. Backs up original.
---

Compress natural language files into caveman-speak to reduce input tokens.

## Trigger

`/caveman:compress <filepath>` or when user asks to compress a memory/config file.

## Process

1. Find directory containing this SKILL.md
2. Run: `cd <directory> && python3 -m scripts <absolute_filepath>`
3. CLI will:
   - Detect file type
   - Call Claude to compress
   - Validate output
   - Cherry-pick fix errors (up to 2 retries)
   - If failing after 2 retries: report error, leave original untouched
4. Return result to user

## Compression Rules

**Remove:**
- Articles: a, an, the
- Filler: just, really, basically, actually, simply, essentially, generally
- Pleasantries: sure, certainly, of course, happy to, I'd recommend
- Hedging: it might be worth, you could consider, it would be good to
- Redundant phrasing: "in order to" → "to", "make sure to" → "ensure"
- Connective fluff: however, furthermore, additionally, in addition

**Preserve EXACTLY:**
- Code blocks (fenced ``` and indented)
- Inline code (`backtick content`)
- URLs, links, file paths, commands
- Technical terms, proper nouns
- Dates, version numbers, numeric values
- Environment variables

**Preserve Structure:**
- Markdown headings
- Bullet point hierarchy
- Numbered lists
- Tables
- Frontmatter/YAML headers

**Compress:**
- Short synonyms: "big" not "extensive"
- Fragments OK: "Run tests before commit"
- Drop "you should", "make sure to", "remember to"
- Merge redundant bullets
- One representative example

**CRITICAL:** Anything inside backticks copied EXACTLY.

## File Type Rules

**Allowed:** `.md`, `.txt`, extensionless files

**NEVER modify:** `.py`, `.js`, `.ts`, `.json`, `.yaml`, `.yml`, `.toml`, `.env`, `.lock`, `.css`, `.html`, `.xml`, `.sql`, `.sh`

Mixed content: compress prose sections only.

Backup original as `FILE.original.md`. Never compress `FILE.original.md`.
