# 💎 Prism Generate - Developer Experience

The `prism generate` command scaffolds a Next.js application pre-wired with Prism core.

## Which command should I use?

| Goal | Command | Where the app lives |
| --- | --- | --- |
| **New consumer app** (Porch Scope, TimeTraveler, …) — **recommended** | `prism generate my-app --path ../my-app` | `../my-app/apps/web/` + `../my-app/prism/` submodule |
| New package inside the Prism monorepo | `prism generate my-app` (from Prism root) | `prism/apps/my-app/` |
| Legacy: flat repo + Prism from npm/git only | `prism generate my-app --path ../my-app --prism-repo "git+https://github.com/thushana/prism.git"` | `../my-app/app/` at repo root (no `apps/web/`) |

**Rule of thumb:** If you will use a **`prism/` git submodule**, use `--path` **without** `--prism-repo`. You get the **workspace layout** (`apps/web/`).

## Quick Start

**Recommended**: Set up direct command access (one-time setup):

```bash
# Run setup script to link CLI globally
npm run setup

# New consumer app (recommended)
prism generate my-app --path ../my-app

# Show help
prism --help
```

## Usage Methods

The CLI can be run in three ways. **Direct mode is recommended** after initial setup:

### 1. Direct Command (Recommended) ⭐

After running `npm run setup`, use the CLI directly:

```bash
prism generate my-app --path ../my-app
prism --help
```

### 2. Via Npx (No Setup Required)

```bash
npx @prism/core generate my-app --path ../my-app
```

### 3. Via npm Script

```bash
npm run prism generate my-app --path ../my-app
```

## Examples

```bash
# ✅ RECOMMENDED — consumer repo: apps/web + prism submodule
prism generate my-app --path ../my-app

# Inside the Prism monorepo only (saves to prism/apps/my-app)
prism generate my-app

# Overwrite existing directory
prism generate my-app --path ../my-app --force

# ⚠️ LEGACY — flat layout at repo root + @prism/core from git (deploy-only style)
prism generate my-app --path ../my-app --prism-repo "git+https://github.com/thushana/prism.git"
```

## What Gets Generated

### Core Stack

- **Next.js 16** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS 4** (Prism theme via submodule)
- **Drizzle ORM** with Neon PostgreSQL (template default)
- **Prism packages** via submodule `file:` deps or monorepo `workspace:*`

### Project Structure (recommended consumer layout)

`prism generate my-app --path ../my-app` **without** `--prism-repo`:

```
my-app/
  README.md                 # Setup cheat sheet (generated)
  prism/                    # git submodule
  apps/web/                 # Next.js app (pnpm workspace name: web)
    package.json
    tsconfig.json
    next.config.ts
    .env.example
    app/
    database/
    intelligence/tasks/
    ui/styles/
    cli/
    ...
  pnpm-workspace.yaml
  package.json              # Root scripts: pnpm --filter web, prism:sync, …
  .nvmrc
  .github/workflows/ci.yml  # checkout with submodules: recursive
```

**Install and run from repo root:**

```bash
cd my-app
git submodule update --init --recursive
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm run dev
```

**Vercel:** Root Directory = `apps/web`, Install = `cd ../.. && pnpm install`.

### Legacy flat layout

Only when you pass **`--prism-repo`**. App files sit at **repo root** (`app/`, `database/`, …). Prefer the workspace layout for new apps.

## What Runs Automatically

1. **Creates directories** — under `apps/web/` (consumer) or `prism/apps/<name>` (monorepo)
2. **Adds `prism/` submodule** — consumer layout only (unless `--prism-repo`)
3. **Writes `package.json`** — root orchestrator + `apps/web/package.json` when using workspace layout
4. **Copies template** from `prism/apps/web`
5. **`pnpm install`** — from **consumer repo root** (not only inside `prism/`)
6. **Database** — `db:generate`, `db:migrate`, `db:seed` via root scripts (`pnpm --filter web` when workspace)
7. **Git** — initial commit; **README.md** at consumer repo root with setup steps

## First Time Usage (consumer workspace)

```bash
cd my-app
git submodule update --init --recursive
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm run db:push
pnpm run dev
```

Visit the URL printed by Next (default sample uses port 3000 unless you change `apps/web/package.json`).

- **System sheet** (if generated): `/system-sheet`
- Edit app code only under **`apps/web/`**

## Database Workflow

From **repo root** (workspace layout):

```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:push
pnpm run db:studio
pnpm run db:seed
```

Env file: **`apps/web/.env`** (not repo root).

### Database (Neon PostgreSQL)

Template defaults to Neon. Configure `DATABASE_URL` in `apps/web/.env`. See [DATABASE-Prism.md](./DATABASE-Prism.md).

## Feature Flags

See [FEATUREFLAGS-Prism.md](./FEATUREFLAGS-Prism.md). Generated paths are under `apps/web/app/…` for consumer layout.

## Import patterns (consumer workspace)

Inside `apps/web/`, use the same aliases as the Prism sample app:

```typescript
import { PrismButton } from "@ui";
import { db } from "@/database/db";
import { BaseTask } from "@intelligence/tasks/base";
```

Paths resolve to `../../prism/packages/…` via `tsconfig.json` and webpack.

## Standalone App Deployment

### Option 1: Submodule + `apps/web` (recommended)

```bash
prism generate my-app --path ../my-app
```

- Submodule at `./prism`
- App at `./apps/web`
- Vercel Root Directory: **`apps/web`**
- Enable git **submodules** on the Vercel project

**Iterate on Prism:**

```bash
cd my-app/prism
# edit, commit, push to github.com/thushana/prism
cd ..
git add prism && git commit -m "Update Prism submodule"
```

### Option 2: Legacy git dependency (flat root)

```bash
prism generate my-app --path ../my-app --prism-repo "git+https://github.com/thushana/prism.git"
```

Flat layout; Vercel builds from repo root. You cannot commit Prism changes from the app repo.

## Customization

Paths below are relative to the **Next.js app root** (`apps/web/` for consumer layout).

### Adding Database Tables

1. Edit `apps/web/database/schema.ts` (consumer) or `database/schema.ts` (monorepo app).
2. From repo root: `pnpm run db:generate` then `pnpm run db:migrate`.

### Adding AI Tasks

Add tasks under `apps/web/intelligence/tasks/` and register them. See [INTELLIGENCE-Prism.md](./INTELLIGENCE-Prism.md).

## Related Docs

- [ARCHITECTURE-Prism.md](./ARCHITECTURE-Prism.md) — monorepo vs consumer layout
- [DEPLOYMENT-Prism.md](./DEPLOYMENT-Prism.md) — Vercel root directory and install
- [SYNC-Prism.md](./SYNC-Prism.md) — `prism:sync` for consumer repos
