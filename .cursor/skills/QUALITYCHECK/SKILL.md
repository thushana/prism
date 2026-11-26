---
name: QUALITYCHECK
description: >-
  Run `pnpm run quality` (format, lint, typecheck, knip, tests for the app and
  Prism) and fix failures until it passes. Use before committing or when the
  user asks for /QUALITYCHECK.
disable-model-invocation: true
---

# Quality check

**Code quality is not optional.** Fix errors iteratively until every check passes. Goal: a commitable, deployable tree.

**Working directory:** app repo root (or `prism/` root for Prism-only work).

## What `pnpm run quality` runs

Implemented in `prism/scripts/quality.ts`, for the current project and then its partner (app → Prism, or Prism → parent app):

1. `format` — Prettier **writes** files (expect formatting diffs)
2. `lint`
3. `typecheck`
4. `knip` — only if the project defines it
5. `test:run`

For a faster inner loop while fixing, use `pnpm run quality:quick` (format + lint + typecheck, current project only). Finish with the full `pnpm run quality`.

## Process

1. Run `pnpm run quality` and read the output.
2. Fix the first failing step. Lint, typecheck, knip, and tests need real fixes — do not silence them with `eslint-disable`, `@ts-ignore`, `any`, skipped tests, or new knip ignores unless the cause is truly a tool false positive (say so).
3. Re-run (`quality:quick` while iterating, full `quality` to confirm).
4. Repeat until all checks pass, then report what you fixed.
