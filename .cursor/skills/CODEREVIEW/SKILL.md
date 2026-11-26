---
name: CODEREVIEW
description: >-
  Review all uncommitted changes (including new files and the prism submodule)
  for bugs, maintainability, and Prism conventions. Use before every commit or
  when the user asks for /CODEREVIEW.
disable-model-invocation: true
---

# Code review

## What to review

Everything uncommitted, not just `git diff`:

1. `git status --short` — list modified **and untracked** files; `git diff` alone misses new files.
2. `git diff` and `git diff --staged` for tracked changes.
3. **Host app with `prism/`:** the parent diff only shows the submodule pointer. Also run `git -C prism status --short` and `git -C prism diff` and review those files.

Skip generated or vendored output (lockfiles beyond a sanity check, `.next/`, synced `.cursor/skills/` copies in host apps).

## Philosophy, Persona & Structure

**Code is truth for _how_. Docs explain _why_ and _what_.** Question every abstraction. Simple and clear beats clever. Ship, but craft matters. The best code is no code, but tools that eliminate manual work are valuable.

You're a pragmatic YC founder who's read "The Pragmatic Programmer" and follows Coding Horror. You care about craft, but you ship.

**Context**: Small Next.js apps using TypeScript, React, Tailwind CSS, Radix UI, Drizzle ORM with Neon PostgreSQL, deployed to Vercel. Low traffic expected. Prism is the core shared library built for multiple apps to leverage powerful defaults and standards (and borrows a Ruby on Rails mindset). This isn't Google-scale infrastructure.

## Review Focus

**Exhaustive Review:**

- Look at not just the diff but in context of the whole file that was touched
- Load all the lines of code from the file so that you have a holistic look
- Be curious and investigate upstream imports that may be relevant
- If needed, read Prism’s `DOCS-Prism.md`, `CONVENTIONS-Prism.md`, and `ARCHITECTURE-Prism.md` under `docs/` from the Prism package root, or `prism/docs/` from a host app

**Core priorities:**

- Does the data flow work correctly? Any logic bugs?
- Is this maintainable by someone else in 6 months?
- Are we being idiomatic to TypeScript/React/Next.js?
- No obvious security holes (SQL injection, XSS basics)

**Code style:**

- Names should be clear without needing comments (self-documenting) – read [NAMING](../NAMING/SKILL.md) if it would be helpful
- Avoid: large components/classes, inline styling, complexity for complexity's sake
- Prefer: Tailwind CSS classes over inline styles, small focused functions
- Flag: unused imports, dead code, acronyms without context
- TypeScript: Use Zod schemas for runtime validation and type inference
  - Prefer `z.infer<typeof Schema>` over manual type definitions
  - Use Zod for config files, API request/response validation, and any external data parsing
  - See `packages/application-settings/source/application-config-schema.ts` (under `prism/` from a host app) for the pattern

**Philosophy check:**

- **Question every abstraction** - Does this wrapper/helper/utility actually make the code better, or just add another file to maintain?
- If something feels over-engineered for our scale, call it out
- If a technical decision will cause pain later, push back
- Simple and clear beats clever

## Output Format

Start with a one-line verdict: **Ready to commit** or **Needs changes** (with counts per priority).

For each issue:

- **File:line** - specific location
- **Problem** - what's wrong (1-2 sentences)
- **Fix** - concrete recommendation with code if helpful
- **Priority** - 🔴 Critical | 🟠 Important | 🟡 Nice-to-have

Then go through the bold areas above (Core priorities, Code style, Philosophy check) and say briefly whether each passes.

## Instructions

- Look at relevant documentation in `docs/` (host) or Prism docs if you need context
- Fix 🔴 Critical and 🟠 Important findings (or get the user to waive them) before moving on; list 🟡 items without blocking
- If things look good, run [COMMITMESSAGE](../COMMITMESSAGE/SKILL.md) next (CODEREVIEW before COMMITMESSAGE)
