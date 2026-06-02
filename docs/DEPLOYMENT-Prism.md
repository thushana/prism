# Vercel Deployment Guide

How sample and generated **Next.js** apps in this monorepo map to **Vercel** projects. Per [DOCS-Prism.md](./DOCS-Prism.md), exact **build/install** script names live in **`package.json`**; this file stays oriented around **what** to configure and **why**.

## Monorepo Layout (pnpm)

Workspaces are declared in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) (`apps/*`, `packages/*`, `tools`). The repo root is **`@prism/core`** and uses **pnpm** (`packageManager` in root [`package.json`](../package.json)). Vercel must install from the **repo root** so `workspace:*` dependencies resolve.

## Setup

### Sample app: `apps/web`

1. Vercel → Add Project → import this Git repository.
2. **Root Directory**: `apps/web` (required so Next finds `app/`).
3. **Install Command** (example): `cd ../.. && pnpm install` — runs from `apps/web`, goes to monorepo root, installs all workspaces.
4. **Build Command**: `pnpm run build` (default for the app) or equivalent; root also exposes `pnpm run build:web` from the monorepo root if you ever build from `/`.
5. **Output**: Next default `.next` relative to the app root.

Framework preset: **Next.js**.

### Generated apps under `apps/<name>`

Same pattern: **Root Directory** `apps/<name>`, **Install Command** `cd ../.. && pnpm install`, then the app’s **`pnpm run build`**.

Generate apps from the repo root with **`pnpm run tools generate <name>`** or **`pnpm run prism generate <name>`** (see root scripts).

### Consumer repo (generated with `prism generate --path …`)

**Recommended layout** (Porch Scope, TimeTraveler, …): Next.js at **`apps/web/`**, Prism submodule at **`prism/`**.

| Vercel setting      | Value                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Root Directory**  | `apps/web`                                                                                       |
| **Install Command** | `cd ../.. && pnpm install`                                                                       |
| **Build Command**   | `pnpm run build`                                                                                 |
| Git                 | Enable **submodules** (or use generated `.github/workflows/ci.yml` with `submodules: recursive`) |

Install and scripts run from the **consumer repo root** (`pnpm run dev` → `pnpm --filter web`). Do not set Root Directory to the repo root — Next.js `app/` is under `apps/web/app/`.

See [GENERATE-Prism.md](./GENERATE-Prism.md) and [SYNC-Prism.md](./SYNC-Prism.md).

## Deployment Behavior

- Each Vercel **project** deploys on git pushes that affect it (per Vercel’s ignore/build settings).
- Multiple projects can point at the **same** repository with different **root directories** for separate URLs and env vars.

## Database and Environment Variables

Neon (or any Postgres) URLs are set in Vercel **Project → Settings → Environment Variables**. Typical pair: **`DATABASE_URL`** (pooled) and **`DATABASE_URL_UNPOOLED`** (for migrations / drizzle-kit). Details: [DATABASE-Prism.md](./DATABASE-Prism.md).

## Local Build Checks

From the Prism root, **`pnpm run vercel:test:web`** runs the sample web production build (`pnpm --filter web run build`)—fast parity with what Vercel runs for `apps/web` after install.

For a full Vercel-local simulation, use **Vercel CLI** (`vercel link`, `vercel build`) from the app directory; see Vercel’s docs.

## Troubleshooting

### No `app` or `pages` directory

**Root Directory** is wrong. Set it to `apps/web` or `apps/<your-app>`.

### Husky during install

Root **`prepare`** skips Husky when **`CI`** or **`VERCEL`** is set ([`package.json`](../package.json)). If a custom environment still fails, mirror that guard or omit `prepare` in the install path you control.

### Workspace packages not found (`database`, `ui`, …)

Install must run from the **monorepo root** (e.g. `cd ../.. && pnpm install` with root directory `apps/web`). Submodule consumers must have **`prism/`** (or paths in `file:` deps) present on the build machine.

### TypeScript errors

**`pnpm run typecheck`** from the Prism root (see [`package.json`](../package.json)).

## CI Example (Conceptual)

Use the same commands your team runs locally, for example root **`pnpm install`** and **`pnpm run vercel:test:web`**. Pin **pnpm** via **`packageManager`** and **Corepack** if your CI supports it.

## Related Docs

- [DOCS-Prism.md](./DOCS-Prism.md)
- [DATABASE-Prism.md](./DATABASE-Prism.md)
- [ARCHITECTURE-Prism.md](./ARCHITECTURE-Prism.md)
