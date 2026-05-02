# Project health (CI, dependencies, hooks)

This document is the **checklist for Prism monorepo maintainers** and for **apps generated with `prism generate`** (especially those that embed Prism as a **git submodule**). Code remains authoritative for exact script names—see each repo’s `package.json`.

## Goals

- Catch regressions **before** deploy (format, lint, typecheck, tests, build).
- Keep dependencies **reviewed** (Dependabot) without drowning in noise (grouping).
- Keep **local commits** small and consistent (lint-staged + Husky), without running a full production build on every save.

## 1. GitHub Actions CI

- Add **`.github/workflows/ci.yml`** that installs with **`pnpm install --frozen-lockfile`**, pins Node via **`.nvmrc`** (same major as `engines` in `package.json`), and runs **read-only** checks:
  - **`pnpm run format:check`** (never `format` / `--write` in CI—that mutates the tree).
  - **`pnpm run lint`**
  - **`pnpm run typecheck`**
  - **`pnpm run test:run`** (or your test runner’s CI equivalent).
  - **`pnpm run build`**
- Optional: **`pnpm audit --audit-level=high`** with **`continue-on-error: true`** until the backlog is clear.

### Submodule apps (TimeTraveler-style)

If the app vendors Prism at **`./prism`** with `file:./prism/packages/...`:

1. **Checkout** must load the submodule:

   ```yaml
   - uses: actions/checkout@v4
     with:
       submodules: recursive
   ```

2. Run **two** quality passes when you maintain Prism in-tree:
   - Root app: `format:check`, `lint`, `typecheck`, `test:run`, `build`.
   - **`cd prism && pnpm install --frozen-lockfile`** then Prism’s `format:check`, `lint`, `typecheck`, `test:run`.

Reference implementation: **TimeTraveler** `.github/workflows/ci.yml`.

### Generated standalone apps

`prism generate` copies a starter **`.github/workflows/ci.yml`** from **`prism/apps/web/.github/`**. Adjust if you use only a git/npm Prism dependency (no submodule—omit `submodules: recursive`).

## 2. Dependabot

- Add **`.github/dependabot.yml`** with **`package-ecosystem: npm`**, **`directory: "/"`**, weekly schedule, and **groups** for related packages (e.g. React/Next, typescript-eslint).

## 3. Pre-commit (lint-staged + Husky)

- Use **`lint-staged`** to run **Prettier** and **ESLint** only on **staged** files.
- Use **`husky`** **`pre-commit`** to invoke **`pnpm exec lint-staged`**.
- Do **not** run **`next build`** on every commit (slow); CI owns full build + tests.

## 4. Scripts naming

- **`quality:ci`** — single command that matches CI (format **check**, lint, typecheck, tests, build). Add at the app root for discoverability.
- Avoid using **`pnpm run quality`** from **`prism/scripts/quality.ts`** inside CI as-is if it runs **`format --write`**; use **`quality:ci`** or the explicit check steps above.

## 5. Ongoing hygiene

- Periodically: **`pnpm outdated`**, **`pnpm store prune`**, unused-deps scan (**knip** / **depcheck**).
- **`@typescript-eslint`** may warn about TypeScript versions newer than its declared range until upstream catches up—track upgrades rather than silencing blindly.

## Where implemented (reference)

| Artifact              | Location (examples)                                      |
| --------------------- | -------------------------------------------------------- |
| CI workflow           | TimeTraveler `.github/workflows/ci.yml`                  |
| Dependabot            | TimeTraveler `.github/dependabot.yml`                    |
| Lint-staged           | TimeTraveler `.lintstagedrc.json`                        |
| Husky hook            | TimeTraveler `.husky/pre-commit`                         |
| Generated CI template | `prism/apps/web/.github/workflows/ci.yml`                |
| Generate scripts      | `prism/tools/app/commands/generate.ts` (`quality:ci`, …) |

## Related

- [DOCS-Prism.md](./DOCS-Prism.md) — documentation philosophy
- [GENERATE-Prism.md](./GENERATE-Prism.md) — scaffolding apps
- [SYNC-Prism.md](./SYNC-Prism.md) — submodule workflow for child apps
