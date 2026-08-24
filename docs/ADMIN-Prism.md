# Admin Pattern

Every Prism app ships with a password-protected `/admin` section. This doc covers the mental model and what each piece is for. Exact props and signatures live in `packages/authentication/source/`.

Naming for admin shell props and the shared title map follows [NAMING.md](../.cursor/commands/NAMING.md) (camelCase props, PascalCase types, `SCREAMING_SNAKE_CASE` for app-level constants such as `ADMIN_PATH_BAR_TITLE_BY_PATH_PREFIX`).

## Application config

At the **Next.js app root** (`apps/web/`), ship **`config.prism.json`** (Prism-standard: app chrome + deployments) and **`config.app.json`** (client-specific domain). See [APP-CONFIG-Prism.md](./APP-CONFIG-Prism.md).

Standard chrome fields in **`config.prism.json` → `app`** (via `readApplicationSettings()`):

| Field            | Purpose                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `nameDisplay`    | Human-facing app name (e.g. admin section label above application links).                      |
| `nameIdentifier` | Stable slug (e.g. `porch-scope`) for dev hostnames (`{nameIdentifier}.localhost`).             |
| `description`    | Short product description (e.g. `AdminPageShell` subtitle on `/admin` and `/admin/app`).       |
| `icon`           | Optional string token for shell icons (e.g. Lucide export name); map in UI when you render it. |

## How It Works

Prism’s default is **Better Auth** (email/password sessions in Postgres, **passkeys**, API keys for integrations). See **[AUTHENTICATION-Prism.md](./AUTHENTICATION-Prism.md)** for env vars, app wiring (`library/authentication/authentication-gates.ts`), migration, passkey registration, and API key headers.

Admin pages still use the same gate pattern; import `requireAdminPage` from your app’s `library/authentication/authentication-gates.ts` (not the legacy `@authentication/admin-page` shared-secret helper).

**Rate limits** (in-memory, per client IP): API routes — 120 requests / min after API key verification. Use Vercel Firewall for stronger production protection.

## Route Structure

Generated apps (`prism generate`) receive this structure out of the box:

```
app/
├── admin/
│   ├── page.tsx                  # Admin home (path-style nav)
│   ├── app/
│   │   ├── page.tsx              # Admin / App hub
│   │   ├── system/
│   │   │   └── page.tsx          # Admin / App / System (system sheet)
│   │   ├── security/
│   │   │   └── page.tsx          # Admin / App / Security (passkeys)
│   │   ├── api-keys/
│   │   │   └── page.tsx          # Admin / App / API keys
│   │   └── components/
│   │       └── page.tsx          # Admin / App / Components (app-specific)
│   └── prism/
│       └── components/
│           ├── page.tsx          # Admin / Prism / Components hub
│           ├── prism-button/
│           │   └── page.tsx      # Admin / Prism / Components / PrismButton
│           └── prism-typography/
│               └── page.tsx      # Admin / Prism / Components / PrismTypography
└── api/
    └── admin/
        ├── api-keys/
        │   └── route.ts          # POST — create Better Auth API key (admin)
        └── signout/
            └── route.ts          # POST — clears cookie, redirects /admin
```

Apps add their own sub-pages under `app/admin/`. The API routes are fixed — `PasswordForm` and `SignOutForm` call these paths by convention.

## Building an Admin Page

Every admin page follows the same three-line server gate:

```typescript
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyAdminPage() {
  const gate = await requireAdminPage();
  if (gate) return gate; // unauthenticated → shows PasswordForm
  // … render authenticated content
}
```

For pages that need a consistent chrome (slash path bar, title, sign out):

```typescript
return (
  <AdminPageShell
    prismPathBarTitleByPathPrefix={ADMIN_PATH_BAR_TITLE_BY_PATH_PREFIX}
    title="My Section"
    description="What this section does."
    showSignOut
  >
    {/* page content */}
  </AdminPageShell>
);
```

**Layout width:** `AdminPageShell` wraps the header and `{children}` in **`PrismLayoutMain`** from `@ui` (`.content-main`, centered, **1280px** max). Prefer this over ad hoc `max-w-*` on the shell. The optional **`className`** prop on `AdminPageShell` is merged onto that **`PrismLayoutMain`** column. For **`SystemSheetPage`** inside admin, pass **`nestedUnderAdminPageShell: true`** so the sheet skips its own Tailwind **`container`** wrapper and aligns with the shell.

### Path bar (`PrismPathBar`)

`AdminPageShell` renders a slash-style **`PrismPathBar`** (from `@ui`) on every sub-page that passes **`title`** (any route except `/admin`). Legacy **`AdminBackLink`** (`← Admin`) is only used when **`backHref`** is set **without** `title`.

1. **Explicit** — pass `explicitPrismPathBarSegments: PrismPathBarSegment[]` (from `@ui` / `@authentication` re-export). When non-empty, it takes precedence over auto mode. Use when you need non-URL segments or a custom order.
2. **Auto (default)** — pass **`title`**; optionally pass `prismPathBarTitleByPathPrefix` (a `Record` of **normalized path prefix →** `PrismPathBarTitleEntry`). The shell uses `usePathname()` and builds ancestor links from the path; **`title` is the only leaf label** (same string as the `<h1>`), so display names are never inferred from URL slugs. Unmapped ancestors fall back to slug-derived labels (e.g. `api-keys` → `Api Keys`). Map values are either a **string** (label + default `href` = key) or **`{ label, href? }`** for sections with no route (omit `href` for plain text). Optional **`prismPathBarIcon`** renders a leading icon. `/admin` is always seeded as **`backLabel`** (default `"Admin"`).

Keep one shared constant in the app, e.g. `app/admin/admin-path-bar-title-by-path-prefix.ts` exporting **`ADMIN_PATH_BAR_TITLE_BY_PATH_PREFIX`**, aligned with real routes.

The admin home route (`/admin`) omits the path bar so the headline is not duplicated as a single crumb.

Pages with complex custom layouts (e.g., full-width tools) skip `AdminPageShell` and use only `requireAdminPage()` + their own `<main>`; if you still need a path row, render `PrismPathBar` from `@ui` using **`mode="explicit"`** and **`segments`**, or **`mode="auto"`** with `pathname`, `titleByPathPrefix`, and `pageTitle`. `AdminPageShell` uses **`explicitPrismPathBarSegments`** and **`prismPathBarTitleByPathPrefix`** and passes them through—see [UI-Prism.md](./UI-Prism.md).

## `@authentication` Exports

The package root (`@authentication`) exports **only client-safe** modules (`PasswordForm`, `AdminPageShell`, `AdminBackLink`, `SignOutForm`, and `verifyKey` from `./core`). Server-only code uses **`import "server-only"`** and **Next server APIs**; it must be imported from **subpaths** so client bundles never traverse those modules.

| Export                                                           | Import from                            | Kind            | Purpose                                            |
| ---------------------------------------------------------------- | -------------------------------------- | --------------- | -------------------------------------------------- |
| `requireAdminPage()`                                             | `@authentication/admin-page`           | async server fn | Cookie check; returns `<PasswordForm />` or `null` |
| `checkWebAuthentication`, `clearWebAuthenticationCookie`, …      | `@authentication/web`                  | server          | Cookie signing / verification                      |
| `requireApiAuthentication`                                       | `@authentication/api`                  | server          | `x-api-key` gate (rate limited); legacy subpath docs may say `x-prism-api-key` |
| `createAuthenticationRoute`                                      | `@authentication/authentication_route` | server          | Factory for login route (rate limited)             |
| `AdminPageShell`, `AdminBackLink`, `SignOutForm`, `PasswordForm` | `@authentication`                      | client          | Admin UI chrome and forms                          |
| `verifyKey`                                                      | `@authentication`                      | isomorphic      | Shared key equality check                          |
| `enforceRateLimit`, `getClientIp`, `RATE_LIMIT_*`                | `@authentication/rate-limit`           | server          | Per-IP limits for login, API auth, app routes      |

In generated `apps/web`, replace `@authentication` with the package name `authentication` and the same subpaths (e.g. `authentication/web`).

## Prism Web App (`apps/web`)

`apps/web` serves as the generator template. Its `/admin` section is intentionally minimal — only pages universal to all apps (system sheet). App-specific admin pages live in the consuming app.

## Environment Variables

See [DEPLOYMENT-Prism.md](./DEPLOYMENT-Prism.md) for the full list. Admin-specific:

- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — see [AUTHENTICATION-Prism.md](./AUTHENTICATION-Prism.md)
