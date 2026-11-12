# Database Guide

Prism uses **Drizzle ORM** with **Neon** (PostgreSQL). This doc is the **mental model** and **where things live**. Per [DOCS-Prism.md](./DOCS-Prism.md), exact script names, dependency versions, and API shapes belong in **`package.json`** and TypeScript source—link there instead of copying.

## Philosophy

- **Type-safe**: Schema and queries in TypeScript
- **Two layers**: Shared **`packages/database`** (CLI, cross-app) vs **per-app `apps/<app>/database`** (sample `web` and generated apps)
- **Serverless driver**: Runtime clients use Neon HTTP (`drizzle-orm/neon-http`); see `packages/database/source/index.ts` and `apps/web/database/db.ts`

## Where Things Live

| Area             | Schema                                                                        | Drizzle config                                                                  | Migrations output                                           |
| ---------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Shared package   | [`packages/database/source/schema.ts`](../packages/database/source/schema.ts) | [`packages/database/drizzle.config.ts`](../packages/database/drizzle.config.ts) | `packages/database/migrations/`                             |
| Sample app `web` | [`apps/web/database/schema.ts`](../apps/web/database/schema.ts)               | [`apps/web/database/drizzle.config.ts`](../apps/web/database/drizzle.config.ts) | `apps/web/database/migrations/` (created when you generate) |

**Imports**

- **Shared package**: `import { db, database } from "database"` — `db` and `database` are the same instance ([`packages/database/source/index.ts`](../packages/database/source/index.ts)). Schema: `import { … } from "database/schema"` as needed.
- **App-local**: `import { db } from "@/database/db"` or a path alias your app defines; the sample web app exports **`db` only** from [`apps/web/database/db.ts`](../apps/web/database/db.ts) (no `database` alias there).

Use the **workspace `database` package** for shared tooling and cross-app code. Use **app `database/`** for that app’s own schema, seeds, and Drizzle CLI config.

## Commands

Run from the **Prism repo root** with **pnpm** (see root [`package.json`](../package.json)).

**Shared `packages/database`**

- `pnpm run database:generate` — `drizzle-kit generate` using `packages/database/drizzle.config.ts`
- `pnpm run database:migrate` — `drizzle-kit migrate` (same config)
- `pnpm run database:push` — `drizzle-kit push` (dev-only shortcut; see below)
- `pnpm run database:studio` — Drizzle Studio

**Sample app `web`** (scripts live in [`apps/web/package.json`](../apps/web/package.json))

- `pnpm --filter web run db:generate` / `db:migrate` / `db:push` / `db:studio` / `db:seed`

Do not mix **`push`** and **`migrate`** on the same database without understanding Drizzle’s migration journal: if the DB was created with `push`, applying the full migration history can try to recreate existing objects. Prefer **generate → migrate** for anything you care to reproduce.

## Environment

- **`DATABASE_URL`** — Required at runtime (pooled Neon URL is typical for the app).
- **`DATABASE_URL_UNPOOLED`** — Preferred for **drizzle-kit** (generate / migrate / push / studio); configs fall back to `DATABASE_URL` if unset ([`packages/database/drizzle.config.ts`](../packages/database/drizzle.config.ts), [`apps/web/database/drizzle.config.ts`](../apps/web/database/drizzle.config.ts)).
- **`DATABASE_URL_TEST` / `DATABASE_URL_TEST_UNPOOLED`** — Disposable Neon branch for Vitest integration projects. Never point these at production.

Production/staging: set both in the host (e.g. Vercel). See [DEPLOYMENT-Prism.md](./DEPLOYMENT-Prism.md).

## Disposable `test` branch (`pnpm neon:test`)

Prism ships a first-class Neon helper at [`scripts/neon-test-branch.ts`](../scripts/neon-test-branch.ts) (consumer script: `pnpm neon:test`). It wraps the Neon CLI so apps do not invent one-off fork scripts.

Requires the [Neon CLI](https://neon.com/docs/cli/quickstart) authenticated locally. Optional: `NEON_PROJECT_ID` in `.env`, or `--project-id=…` / a single-project Neon account.

| Command | Effect |
| ------- | ------ |
| `pnpm neon:test run` | **Default loop:** ensure → migrate → `test:integration` → **destroy on success**; **keep on failure** so you can inspect |
| `pnpm neon:test ensure` | Create copy-on-write branch `test` if missing; upsert `DATABASE_URL_TEST*` into `apps/web/.env` (or `./.env`) without printing secrets |
| `pnpm neon:test reset` | Reset `test` from its parent, then re-wire env |
| `pnpm neon:test migrate` | Run `db:migrate` with `DATABASE_URL_UNPOOLED` set from the test branch |
| `pnpm neon:test status` | Branch existence + whether env keys are set (no URLs) |
| `pnpm neon:test destroy` | Delete the branch and remove `DATABASE_URL_TEST*` from `.env` |

On success the branch is deleted. On failure it is kept (env URLs remain) until you `pnpm neon:test destroy`. Use `--keep` to retain even after green runs; `--destroy-on-fail` for CI that must always clean up.

## Production Notes

- Do not use **`database:push`** / **`db:push`** against production databases; use migrations.
- Review generated SQL under the relevant `migrations/` folder before applying.
- Drizzle records applied migrations in **`__drizzle_migrations`** in the database.

## Troubleshooting

**“Table already exists” after switching to migrate**

Often means the DB was initialized with **`push`**. Recovery is operational (archive or realign migrations, reset or reconcile `__drizzle_migrations`); there is no single command—coordinate with your team and Neon backups.

**Wrong migration paths**

- Shared package: `packages/database/migrations/`
- Web app: `apps/web/database/migrations/` (not the repo root `database/` folder)

**Connection errors**

- Confirm `DATABASE_URL` (and for kit ops, `DATABASE_URL_UNPOOLED` if you rely on unpooled URLs).
- Neon typically expects TLS; follow Neon’s connection string docs.

## Related Docs

- [DOCS-Prism.md](./DOCS-Prism.md) — Documentation philosophy
- [ARCHITECTURE-Prism.md](./ARCHITECTURE-Prism.md) — Monorepo layout
- [DEPLOYMENT-Prism.md](./DEPLOYMENT-Prism.md) — Vercel and env vars
- [Drizzle ORM](https://orm.drizzle.team/) — Upstream reference
