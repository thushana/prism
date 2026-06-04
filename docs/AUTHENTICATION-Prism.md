# Authentication (Better Auth)

Prism’s default authentication stack: **Better Auth** with Drizzle on Postgres (Neon), email/password sign-in, admin roles, and API keys for extensions and integrations.

**How** (exports, env names, route paths) lives in `packages/authentication/source/` and the `apps/web` template. This doc is the **mental model** and migration checklist.

See also: [ADMIN-Prism.md](./ADMIN-Prism.md) (admin shell and routes), [ARCHITECTURE-Prism.md](./ARCHITECTURE-Prism.md) (monorepo layout).

## What replaced shared-secret auth

| Before (`PRISM_KEY_*`)                        | After (Better Auth)                            |
| --------------------------------------------- | ---------------------------------------------- |
| `PRISM_KEY_WEB` + password form + HMAC cookie | Session cookie via Better Auth (`/api/auth/*`) |
| `PRISM_KEY_API` + `x-prism-api-key`           | Named API keys in DB + `x-api-key` header      |
| No user rows                                  | `user`, `session`, `account`, `apikey` tables  |

Legacy helpers remain under `@authentication/web`, `@authentication/admin-page`, and `@authentication/api-legacy` for one release while consumers migrate.

## Prism-owned pieces

| Piece                | Location                                                       |
| -------------------- | -------------------------------------------------------------- |
| Auth factory         | `@authentication/better-auth` → `createPrismAuth()`            |
| Session helpers      | `@authentication/better-auth/session`                          |
| Gate factory         | `@authentication/gates` → `createAuthGates(auth)`              |
| API key gate factory | `@authentication/api` → `createApiAuthentication(auth)`        |
| Client               | `@authentication/client` → `createPrismAuthClient()`           |
| Sign-in UI           | `@authentication` → `SignInPage` / `SignInForm`                |
| Template schema      | `apps/web/database/schema/auth.ts` (CLI-generated)             |
| Template bindings    | `apps/web/lib/auth.ts`, `lib/auth-gates.ts`, `lib/api-auth.ts` |

Each app **binds** the factory to its own Drizzle `db`, merged schema, and env. Prism does not use a global singleton auth instance.

## Environment variables

| Variable              | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `BETTER_AUTH_SECRET`  | Signing secret (`openssl rand -base64 32`, min 32 chars) |
| `BETTER_AUTH_URL`     | Public app URL (e.g. `https://your-app.vercel.app`)      |
| `SEED_ADMIN_EMAIL`    | One-time bootstrap (with `db:seed:admin`)                |
| `SEED_ADMIN_PASSWORD` | One-time bootstrap                                       |

Public self-sign-up is **disabled** in `createPrismAuth` (`disableSignUp: true`). Create users via `pnpm run db:seed:admin` or the admin plugin.

## App wiring (template / generated apps)

1. **Instance** — `lib/auth.ts` calls `createPrismAuth({ db, schema, secret, baseURL, trustedOrigins })`.
2. **Gates** — `lib/auth-gates.ts` exports `requireAdminPage`, `requireSessionPage`, `checkSession`, etc.
3. **API keys** — `lib/api-auth.ts` exports `requireApiAuthentication` (async; use `await` in route handlers).
4. **Handler** — `app/api/auth/[...all]/route.ts` uses `toNextJsHandler(auth)`.
5. **Sign-in** — `app/(auth)/sign-in/page.tsx`.
6. **Admin API keys** — `app/admin/app/api-keys` + `POST /api/admin/api-keys`.

## Gate modes (`auth-gate.json`)

Set at `prism generate` time with `--auth-gate admin|app` (default `admin`).

| Mode    | Behavior                                                                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin` | Only `/admin/*` uses `requireAdminPage()`; public routes stay open                                                                                    |
| `app`   | Proxy redirects unauthenticated users to `/sign-in` (optimistic UX); **real** enforcement is still `requireSessionPage()` in layout and gates on APIs |

Proxy cookie checks are not a security boundary — always enforce in layouts and route handlers.

## Admin pages

Same three-line gate as before; import from the app binding:

```typescript
import { requireAdminPage } from "@/lib/auth-gates";

const gate = await requireAdminPage();
if (gate) return gate;
```

## API routes

```typescript
import { requireApiAuthentication } from "@/lib/api-auth";

export async function POST(request: Request) {
  await requireApiAuthentication(request);
  // ...
}
```

Optional scopes when creating the factory binding:

```typescript
createApiAuthentication(auth, {
  permissions: { ingest: ["write"] },
});
```

Prism rate limits (`@authentication/rate-limit`) still wrap API key verification as defense-in-depth.

## Database

1. Auth tables live in `database/schema/auth.ts` (generate with Better Auth CLI against `lib/auth.ts`).
2. Re-export from `database/schema.ts` and include in Drizzle `db` schema map.
3. `pnpm run db:generate` → `pnpm run db:migrate`
4. `SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… pnpm run db:seed:admin`

## Consumer migration checklist

Use after bumping the `prism` submodule to a commit that includes Better Auth defaults.

1. `pnpm install` from the **host app root** (not only inside `prism/`).
2. Add `lib/auth.ts`, `lib/auth-gates.ts`, `lib/api-auth.ts` (copy from `apps/web` template).
3. Add `app/api/auth/[...all]/route.ts`, `app/(auth)/sign-in/page.tsx`.
4. Run auth schema migration on Neon; bootstrap admin user.
5. Replace `requireAdminPage` import: `authentication/admin-page` → `@/lib/auth-gates`.
6. Replace `checkWebAuthentication` → `checkSession` from `@/lib/auth-gates`.
7. Replace `requireApiAuthentication`: use `@/lib/api-auth` and **await**; switch header to `x-api-key`.
8. Update extension/CORS if applicable (`x-api-key`, not `x-prism-api-key`).
9. Set `BETTER_AUTH_*` in Vercel/local env; remove `PRISM_KEY_*`.
10. Remove `app/api/admin/authentication/route.ts`; update sign-out to Better Auth.

### TimeTraveler notes

- Admin-only gate (no root layout auth).
- Preserve cron ladder on `GET …/measure/automated`: `x-vercel-cron` → `CRON_SECRET` → `requireApiAuthentication`.
- Fix `app/flags/index.ts` to use `@/lib/auth-gates` + `authCheck`.

### porch-scope notes

- App-wide gate: root `layout.tsx` uses `requireSessionPage()` (not `requireAdminPage`).
- Chrome extension: Better Auth key from `/admin/app/api-keys`, header `x-api-key`.

## `prism generate`

- `--auth-gate admin|app`
- Writes `auth-gate.json`
- Adds `better-auth`, adapters, `zod` to dependencies
- CI dummy env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`

## Next.js build notes

- `createPrismAuth` uses `better-auth/minimal` (Drizzle adapter only; avoids pulling Kysely).
- Template `next.config.ts` sets `serverExternalPackages` for Better Auth packages and `outputFileTracingRoot` for the Prism monorepo layout.
- Consumer apps generated with `--webpack` should match the webpack `watchOptions` pattern in the template if dev watch breaks.

## Future: volunteers / RBAC

Better Auth organization and extended roles (`turf_lead`, `volunteer`) are **consumer** concerns. Prism documents hook points (`createPrismAuth` plugins, `authCheck` `type`); data scoping stays in app query layers.
