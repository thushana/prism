# Project health (CI, dependencies, hooks)

This document is the **checklist for Prism monorepo maintainers** and for **apps generated with `prism generate`** (especially those that embed Prism as a **git submodule**). Code remains authoritative for exact script names—see each repo’s `package.json`.

## Goals

- Catch regressions **before** deploy (format, lint, typecheck, tests, build).
- Keep dependencies **reviewed** (Dependabot) without drowning in noise (grouping).
- Keep **local commits** small and consistent (lint-staged + Husky), without running a full production build on every save.

## 1. GitHub Actions CI

- Add **`.github/workflows/ci.yml`** that installs with **`pnpm install --frozen-lockfile`**, pins Node via **`.nvmrc`** (same major as `engines` in `package.json`), and runs **read-only** checks.
- Use **`pnpm/action-setup@v4`** without a hardcoded `version:` — it reads **`packageManager`** from root **`package.json`** (must match local Corepack / embedder apps).
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
- **Embedder apps** (TimeTraveler): also watch **`directory: "/prism"`** (Prism lockfile) and **`package-ecosystem: gitsubmodule`** (submodule SHA). See TimeTraveler [`.github/dependabot.yml`](../../.github/dependabot.yml).

## 3. Git hooks (Husky — Prism consumer standard)

Same as [TimeTraveler](https://github.com/thushana/timetraveler): **`husky`** in **`devDependencies`**, **`"prepare": "husky"`** (plus **`tsx prism/scripts/sync-commands.ts`** on generated consumers).

| Hook | Role |
|------|------|
| **`.husky/pre-commit`** | **`pnpm exec lint-staged --no-stash`** — Prettier + ESLint on staged files only |
| **`.husky/post-merge`** | **`pnpm exec tsx prism/scripts/sync-commands.ts --quiet`** — refresh copied **`.cursor/commands/`** after **`git pull`** |

- Scaffolded by **`prism generate`**; refreshed via **`pnpm prism:sync:hooks`** or **`pnpm prism:sync`**.
- Do **not** use **`.githooks/`** or symlinked **`.cursor/commands`** (Cursor does not index symlinks reliably).
- Do **not** run **`next build`** on every commit; CI owns full build + tests.

## 4. Scripts naming

- **`quality:ci`** — single command that matches CI (format **check**, lint, typecheck, tests, build). Add at the app root for discoverability.
- Avoid using **`pnpm run quality`** from **`prism/scripts/quality.ts`** inside CI as-is if it runs **`format --write`**; use **`quality:ci`** or the explicit check steps above.

## 5. Ongoing hygiene

- **`@typescript-eslint`** may warn about TypeScript versions newer than its declared range until upstream catches up—track upgrades rather than silencing blindly.
- **Dependabot** handles most version bumps weekly; the ritual below is for drift you still want to eyeball (submodule SHA, shared ranges, audits, dead code).

## 6. Monthly dependency & code health ritual

**Time budget:** ~10–15 minutes at the app root (e.g. TimeTraveler). **Quarterly:** add the extras at the end.

Use this after merging Dependabot PRs or whenever things feel “stale.” All commands assume the **app repo root** (parent of `prism/` for embedder apps) unless noted.

**Cursor:** run **`/CHORES`** — thin wrapper; this section is the source of truth.

**CLI:** `pnpm run chores` from the app repo root runs the **(report)** steps deterministically (`prism/scripts/chores.ts`). Flags: `--pull`, `--quarterly`, `--skip-quality`, `--strict`, `--help`.

### For agents (Cursor / automation)

**Default mode is `report-only`.** Only switch modes when the user’s message explicitly says so.

| Mode                | When                                                                       | What to do                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`report-only`**   | Default; user said `/CHORES`, “monthly chores”, “health pass”, etc.        | Run steps below marked **(report)**. Summarize findings. **Do not** change deps, lockfiles, submodule SHA, or git state beyond `git pull` / `submodule update --init`. **Do not** commit or push. |
| **`apply-updates`** | User approved specific bumps from a prior report (or said “apply updates”) | Run **(apply)** steps only for what they approved, then **(verify)** again. Commit/push **only** if they asked.                                                                                   |
| **`quarterly`**     | User said “quarterly”                                                      | Same as `report-only`, plus **(quarterly)** steps. Still no **(apply)** unless they also said `apply-updates`.                                                                                    |

**Guardrails (all modes):**

- Never run `pnpm audit fix --force`.
- Never run `git submodule update --remote` unless the user explicitly asked to advance the submodule SHA.
- Never run `pnpm prism:sync`, `prism:sync:dependencies --update`, `pnpm update`, or `pnpm install` in **`apply-updates`** without user approval of what to change (install after pull in **report-only** is OK only if lockfiles changed from `git pull`).
- On knip / audit / quality failures: **report and stop**; do not delete code or bump packages to green the run unless the user asked you to fix.
- **Submodule apps:** if committing, push **`prism/`** first, then the parent (see step 7).
- **Dependabot PRs:** optional `gh pr list` — report open dependency PRs; do not merge unless asked.

**Deliverable (report-only):** short sections — toolchain, git/submodule, outdated (root + prism), `prism:sync:dependencies` dry-run, audit (high), knip, quality (app + prism), build (app + prism web), recommended next actions (no changes made).

### Before you start

- [ ] On **`main`**, working tree clean (or stash WIP).
- [ ] **Node** matches [`.nvmrc`](../../.nvmrc): `node -v` (app) / `cat prism/.nvmrc` (Prism-only work).
- [ ] **pnpm** matches **`packageManager`** in `package.json`: `corepack enable` then `pnpm -v`.

### 1. Pull latest (1 min) **(report)**

```bash
git pull
git submodule update --init --recursive
cd prism && git pull && cd ..
```

- Prefer merging **Dependabot `prism` submodule PRs** over blind `git submodule update --remote` if you want a reviewed SHA.
- If Prism moved on the remote and you need its packages: bump the submodule commit, then continue. **Agents:** do not change the submodule pointer in `report-only`.

### 2. See what drifted (2 min) **(report)**

```bash
pnpm outdated
pnpm prism:sync:dependencies          # dry-run: parent vs prism/apps/web ranges
cd prism && pnpm outdated && cd ..
```

- **`pnpm outdated`** — what can move within current semver ranges in each lockfile.
- **`prism:sync:dependencies`** — whether the **parent `package.json` ranges** still match Prism’s canonical web app (no file writes until `--update`).

### 3. Install & update (when you intend to change deps) **(apply)**

Pick one path; don’t run everything blindly. **Agents:** skip entire step in `report-only`.

| Goal                                                           | What to run                                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Refresh lockfiles after pull / submodule bump                  | `pnpm install` then `cd prism && pnpm install && cd ..`                      |
| Bump selected packages                                         | `pnpm update <pkg>` (root) and/or `cd prism && pnpm update <pkg>`            |
| Align parent ranges with Prism web app                         | `pnpm prism:sync:dependencies --update` then `pnpm install`                  |
| Full embedder sync (git + scripts + commands + deps + install) | `pnpm prism:sync` — heavier; use when submodule or generated scripts drifted |

After any lockfile change:

```bash
pnpm install
cd prism && pnpm install && cd ..
```

### 4. Security snapshot (1 min) **(report)**

```bash
pnpm audit --audit-level=high
cd prism && pnpm audit --audit-level=high && cd ..
```

- **Exit 0** with moderate advisories listed is normal today (e.g. Next-bundled PostCSS, drizzle-kit’s old esbuild chain). Triage; don’t use `pnpm audit fix --force`.
- To chase moderates: consider `pnpm audit --audit-level=moderate` after reading advisories.

### 5. Dead code & exports (2–5 min) **(report)**; `knip:exports` **(quarterly)**

```bash
pnpm run knip                 # dependencies + orphan files (CI runs this)
pnpm run knip:exports         # quarterly only (unused exports; local only)
```

- **`knip`** — unlisted/unused deps and orphan files (see root `knip.config.ts` in app and prism).
- **`knip:exports`** — tighter export surface; noisier, run occasionally not every month.

### 6. Verify before you commit (5 min) **(report)** / **(verify)** after apply

Chores runs **knip → quality (app + prism) → build** so all tests finish before any production build.

```bash
pnpm run chores                 # full ritual (report-only by default)
pnpm run quality:ci             # app CI parity in one command (includes build)
cd prism && pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test:run && cd ..
pnpm run build                  # app production build (last gate before deploy)
```

Or locally with auto-format: `pnpm run quality:all` (mutates formatting). **Agents:** prefer `quality:ci` or `pnpm run chores` unless the user asked to format.

### 7. Commit & push (submodule apps only) **(apply)**

**Agents:** only if the user explicitly asked to commit and/or push.

If **`prism/`** changed:

1. Commit and push **inside `prism/`** first.
2. Then commit the **submodule pointer** (and app changes) at the app root and push.

Never push the parent with a new submodule SHA before that commit exists on the Prism remote.

### Quarterly extras (~5 min) **(quarterly)**

- [ ] `pnpm store prune` — reclaim disk from old store entries.
- [ ] Skim open **Dependabot** PRs; adjust [`.github/dependabot.yml`](../../.github/dependabot.yml) groups if noisy.
- [ ] `pnpm run knip:exports` if you skipped it in step 5.
- [ ] Optional: `pnpm prism:sync:commands` / `pnpm prism:sync:scripts` dry-run if Cursor commands or `package.json` scripts feel out of date.

### Prism monorepo only (no embedder parent)

From **`prism/`** root:

```bash
git pull
pnpm outdated
pnpm install
pnpm audit --audit-level=high
pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test:run
```

Publish or bump embedder apps separately via **`gitsubmodule`** / manual submodule updates.

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
