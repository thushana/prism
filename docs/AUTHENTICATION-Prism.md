# Authentication (Better Auth)

Prism’s default authentication stack: **Better Auth** with Drizzle on Postgres (Neon), email/password sign-in, **passkeys** (WebAuthn), admin roles, and API keys for extensions and integrations.

**How** (exports, env names, route paths) lives in `packages/authentication/source/` and the `apps/web` template. This doc is the **mental model** and migration checklist.

See also: [ADMIN-Prism.md](./ADMIN-Prism.md) (admin shell and routes), [ARCHITECTURE-Prism.md](./ARCHITECTURE-Prism.md) (monorepo layout).

## What replaced shared-secret auth

| Before (`PRISM_KEY_*`)                        | After (Better Auth)                                      |
| --------------------------------------------- | -------------------------------------------------------- |
| `PRISM_KEY_WEB` + password form + HMAC cookie | Session cookie via Better Auth (`/api/auth/*`)           |
| `PRISM_KEY_API` + `x-prism-api-key`           | Named API keys in DB + `x-api-key` header                |
| No user rows                                  | `user`, `session`, `account`, `apikey`, `passkey` tables |

Legacy helpers remain under `@authentication/web`, `@authentication/admin-page`, and `@authentication/api-legacy` for one release while consumers migrate.

## Prism-owned pieces

| Piece                | Location                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| Auth factory         | `@authentication/better-auth` → `createPrismAuth()`                                            |
| Session helpers      | `@authentication/better-auth/session`                                                          |
| Gate factory         | `@authentication/gates` → `createAuthGates(auth)`                                              |
| API key gate factory | `@authentication/api` → `createApiAuthentication(auth)`                                        |
| Client               | `@authentication/client` → `createPrismAuthClient()` (includes passkey client)                 |
| Sign-in UI           | `@authentication` → `SignInPage` / `SignInForm` (email + passkey)                              |
| Passkey admin UI     | `@authentication/passkey-settings` → `PasskeySettings`                                         |
| Passkey schema SQL   | `@authentication/better-auth/migrations/passkey.sql` (idempotent)                              |
| Template schema      | `apps/web/database/schema/auth.ts` (includes `passkey`; run `db:generate`)                     |
| Template bindings    | `library/authentication/authentication.ts`, `authentication-gates.ts`, `authentication-api.ts` |

Each app **binds** the factory to its own Drizzle `db`, merged schema, and env. Prism does not use a global singleton auth instance.

## Environment variables

| Variable              | Purpose                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`  | Signing secret (`openssl rand -base64 32`, min 32 chars)                                      |
| `BETTER_AUTH_URL`     | Public app URL — also used as WebAuthn **origin** / RP scope (must match the URL users visit) |
| `SEED_ADMIN_EMAIL`    | One-time bootstrap (with `db:seed:admin`)                                                     |
| `SEED_ADMIN_PASSWORD` | One-time bootstrap                                                                            |

Public self-sign-up is **disabled** in `createPrismAuth` (`disableSignUp: true`). Create users via `pnpm run db:seed:admin` or the admin plugin.

## App wiring (template / generated apps)

1. **Instance** — `library/authentication/authentication.ts` calls `createPrismAuth({ db, schema, secret, baseURL, trustedOrigins, rpName })`. Passkeys are **on by default** when `rpName` is set (use `readApplicationSettings().nameDisplay` from `config.prism.json`). Include `resolveTrustedAuthOrigins(BETTER_AUTH_URL, DEV_APP_ORIGINS)` so `{nameIdentifier}.localhost` works when `.env` still points at `localhost`.
2. **Browser client** — `createPrismAuthClient()` uses `window.location.origin` so fetches stay same-origin when users visit `{nameIdentifier}.localhost` while `BETTER_AUTH_URL` is still `localhost`.
3. **Gates** — `library/authentication/authentication-gates.ts` calls `createAuthGates(auth, { signInPathDropOff: SIGN_IN_PATH_DROP_OFF })`. `SIGN_IN_PATH_DROP_OFF` comes from `library/config` (set via `authentication.signInPathDropOff` in `config.prism.json`; default `/`).
4. **API keys** — `library/authentication/authentication-api.ts` exports `requireApiAuthentication` (async; use `await` in route handlers).
5. **Handler** — `app/api/auth/[...all]/route.ts` uses `toNextJsHandler(auth)`.
6. **Sign-in** — `app/(auth)/sign-in/page.tsx` → `<SignInPage authBaseURL={authEnv.BETTER_AUTH_URL} redirectTo={SIGN_IN_PATH_DROP_OFF} />`; pre-checks session and redirects if already authenticated.
7. **Admin API keys** — `app/admin/app/api-keys` + `POST /api/admin/api-keys`.
8. **Passkeys** — `app/admin/app/security` → `<PasskeySettings />`; sign-in page shows **Sign in with passkey** when `passkeys` is enabled (default).

## Passkeys

Passkeys use the [`@better-auth/passkey`](https://www.better-auth.com/docs/plugins/passkey) plugin, wired in `createPrismAuth` when `rpName` is provided.

| Step     | Action                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Schema   | `passkey` table in `database/schema/auth.ts` (included in the Prism `apps/web` template)                                        |
| Migrate  | `pnpm run db:generate` then `pnpm run db:migrate`, or apply `packages/authentication/source/better-auth/migrations/passkey.sql` |
| Register | Sign in with password → **Admin → Security → Add passkey**                                                                      |
| Sign in  | Sign-out → **Sign in with passkey** on `/sign-in` (or browser autofill on email field)                                          |

**Production:** `BETTER_AUTH_URL` must be the canonical site URL (e.g. `https://your-app.vercel.app`). The WebAuthn RP ID is derived from that URL in `resolvePasskeyRelyingParty()` — do not use `localhost` in production env.

**Local Prism dev:** Visiting `http://{nameIdentifier}.localhost:{port}` requires RP ID `{nameIdentifier}.localhost`, not `localhost`. `resolvePrismBetterAuthUrl()` upgrades legacy `BETTER_AUTH_URL=http://localhost:{port}` to the Prism dev URL in development; passkey RP ID uses the full `*.localhost` hostname.

Disable passkeys for an app: omit `rpName` in `createPrismAuth`, or pass `<SignInPage passkeys={false} />`.

## Authentication (`config.prism.json` → `authentication`)

Set at `prism generate` time with `--auth-gate admin|app` (default `admin`). Stored in **`config.prism.json`**:

```json
{
  "authentication": {
    "gateMode": "admin",
    "signInPathDropOff": "/admin"
  }
}
```

Consumer apps export **`AUTH_GATE_MODE`** and **`SIGN_IN_PATH_DROP_OFF`** from `library/config` via `resolveAuthenticationGateMode()` and `resolveSignInPathDropOff()`.

| Mode    | Behavior                                                                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin` | Only `/admin/*` uses `requireAdminPage()`; public routes stay open                                                                                    |
| `app`   | Proxy redirects unauthenticated users to `/sign-in` (optimistic UX); **real** enforcement is still `requireSessionPage()` in layout and gates on APIs |

Proxy cookie checks are not a security boundary — always enforce in layouts and route handlers.

## Admin pages

Same three-line gate as before; import from the app binding:

```typescript
import { requireAdminPage } from "@/library/authentication/authentication-gates";

const gate = await requireAdminPage();
if (gate) return gate;
```

## API routes

```typescript
import { requireApiAuthentication } from "@/library/authentication/authentication-api";

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

1. Auth tables live in `database/schema/auth.ts` (`user`, `session`, `account`, `verification`, `apikey`, **`passkey`**).
2. Re-export from `database/schema.ts` and include in Drizzle `db` schema map.
3. `pnpm run db:generate` → `pnpm run db:migrate` (or `db:push` in early dev)
4. `SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… pnpm run db:seed:admin`

## Consumer migration checklist

Use after bumping the `prism` submodule to a commit that includes Better Auth defaults.

1. `pnpm install` from the **host app root** (not only inside `prism/`).
2. Add `library/authentication/authentication.ts`, `authentication-gates.ts`, `authentication-api.ts` (copy from `apps/web` template).
3. Add `app/api/auth/[...all]/route.ts`, `app/(auth)/sign-in/page.tsx`.
4. Run auth schema migration on Neon; bootstrap admin user.
5. Replace `requireAdminPage` import: `authentication/admin-page` → `@/library/authentication/authentication-gates`.
6. Replace `checkWebAuthentication` → `checkSession` from `@/library/authentication/authentication-gates`.
7. Replace `requireApiAuthentication`: use `@/library/authentication/authentication-api` and **await**; switch header to `x-api-key`.
8. Update extension/CORS if applicable (`x-api-key`, not `x-prism-api-key`).
9. Set `BETTER_AUTH_*` in Vercel/local env; remove `PRISM_KEY_*`.
10. Remove `app/api/admin/authentication/route.ts`; update sign-out to Better Auth.

### TimeTraveler notes

- Admin-only gate (no root layout auth).
- Preserve cron ladder on `GET …/measure/automated`: `x-vercel-cron` → `CRON_SECRET` → `requireApiAuthentication`.
- Fix `app/flags/index.ts` to use `@/library/authentication/authentication-gates` + `authCheck`.

### porch-scope notes

- App-wide gate: root `layout.tsx` uses `requireSessionPage()` (not `requireAdminPage`).
- Chrome extension: Better Auth key from `/admin/app/api-keys`, header `x-api-key`.

## `prism generate`

- `--auth-gate admin|app` — writes `authentication.gateMode` into `config.prism.json`
- Adds `better-auth`, `@better-auth/passkey`, adapters, `zod` to dependencies
- CI dummy env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`

## Next.js build notes

- `createPrismAuth` uses `better-auth/minimal` (Drizzle adapter only; avoids pulling Kysely).
- Template `next.config.ts` sets `serverExternalPackages` for Better Auth packages (including `@better-auth/passkey`) and `outputFileTracingRoot` for the Prism monorepo layout.
- Consumer apps generated with `--webpack` should match the webpack `watchOptions` pattern in the template if dev watch breaks.

## Future: volunteers / RBAC

Better Auth organization and extended roles (`turf_lead`, `volunteer`) are **consumer** concerns. Prism documents hook points (`createPrismAuth` plugins, `authCheck` `type`); data scoping stays in app query layers.
