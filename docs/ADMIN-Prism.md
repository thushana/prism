# Admin Pattern

Every Prism app ships with a password-protected `/admin` section. This doc covers the mental model and what each piece is for. Exact props and signatures live in `packages/authentication/source/`.

Naming for admin shell props and the shared title map follows [NAMING.md](../.cursor/commands/NAMING.md) (camelCase props, PascalCase types, `SCREAMING_SNAKE_CASE` for app-level constants such as `ADMIN_PATH_BAR_TITLE_BY_PATH_PREFIX`).

## Application settings (`app.json`)

At the **repository root**, Prism apps ship an `app.json` file validated by the **`application-settings`** package (`readApplicationSettings()` from `application-settings`, server-only). Fields:

| Field | Purpose |
| --- | --- |
| `displayName` | Human-facing app name (e.g. admin section label above application links). |
| `description` | Short product description (e.g. `AdminPageShell` subtitle on `/admin` and `/admin/app`). |
| `icon` | Optional string token for shell icons (e.g. Lucide export name); map in UI when you render it. |

## How It Works

Authentication uses a **signed cookie** (`prism-admin-authentication`) set against `PRISM_KEY_WEB`. There is no user table — the password *is* the key. Suitable for internal tools with a single owner or small team.

Two keys exist so API and web surfaces can be rotated independently:

| Key | Used by |
|---|---|
| `PRISM_KEY_WEB` | Web page cookie auth (`/admin`, password form) |
| `PRISM_KEY_API` | API route header auth (`x-prism-api-key`) |

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
        ├── authentication/
        │   └── route.ts          # POST — verifies password, sets cookie
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
  if (gate) return gate;            // unauthenticated → shows PasswordForm
  // … render authenticated content
}
```

For pages that need a consistent chrome (back link, title, sign out):

```typescript
return (
  <AdminPageShell
    backHref="/admin"
    title="My Section"
    description="What this section does."
    showSignOut
  >
    {/* page content */}
  </AdminPageShell>
);
```

### Path bar (`PrismPathBar`)

`AdminPageShell` can render a **`PrismPathBar`** (from `@ui`) instead of a single `AdminBackLink`:

1. **Explicit** — pass `explicitPrismPathBarSegmentList: PrismPathBarSegment[]` (from `@ui` / `@authentication` re-export). When non-empty, it takes precedence over auto mode. Use when you need non-URL segments or a custom order.
2. **Auto** — pass `prismPathBarTitleByPathPrefix` (a `Record` of **normalized path prefix →** `PrismPathBarTitleEntry`) together with **`title`**. The shell uses `usePathname()` and builds ancestor links from the path; **`title` is the only leaf label** (same string as the `<h1>`), so display names are never inferred from URL slugs. Map values are either a **string** (label + default `href` = key) or **`{ label, href? }`** for sections with no route (omit `href` for plain text). Optional **`prismPathBarIcon`** renders a leading icon.

Keep one shared constant in the app, e.g. `app/admin/admin-path-bar-title-by-path-prefix.ts` exporting **`ADMIN_PATH_BAR_TITLE_BY_PATH_PREFIX`**, aligned with real routes.

The admin home route (`/admin`) typically omits the path bar so the headline is not duplicated as a single crumb.

Pages with complex custom layouts (e.g., full-width tools) skip `AdminPageShell` and use only `requireAdminPage()` + their own `<main>`; if you still need a path row, render `PrismPathBar` from `@ui` using its props (`explicitModeSegmentList`, `titleByPathPrefix`, `pageTitle`, …). `AdminPageShell` wraps the same component but uses longer names (`explicitPrismPathBarSegmentList`, `prismPathBarTitleByPathPrefix`) and passes them through—see [UI-Prism.md](./UI-Prism.md).

## `@authentication` Exports

The package root (`@authentication`) exports **only client-safe** modules (`PasswordForm`, `AdminPageShell`, `AdminBackLink`, `SignOutForm`, and `verifyKey` from `./core`). Server-only code uses **`import "server-only"`** and **Next server APIs**; it must be imported from **subpaths** so client bundles never traverse those modules.

| Export | Import from | Kind | Purpose |
|---|---|---|---|
| `requireAdminPage()` | `@authentication/admin-page` | async server fn | Cookie check; returns `<PasswordForm />` or `null` |
| `checkWebAuthentication`, `clearWebAuthenticationCookie`, … | `@authentication/web` | server | Cookie signing / verification |
| `requireApiAuthentication` | `@authentication/api` | server | `x-prism-api-key` gate |
| `createAuthenticationRoute` | `@authentication/authentication_route` | server | Factory for `app/api/admin/authentication/route.ts` |
| `AdminPageShell`, `AdminBackLink`, `SignOutForm`, `PasswordForm` | `@authentication` | client | Admin UI chrome and forms |
| `verifyKey` | `@authentication` | isomorphic | Shared key equality check |

In generated `apps/web`, replace `@authentication` with the package name `authentication` and the same subpaths (e.g. `authentication/web`).

## Prism Web App (`apps/web`)

`apps/web` serves as the generator template. Its `/admin` section is intentionally minimal — only pages universal to all apps (system sheet). App-specific admin pages live in the consuming app.

## Environment Variables

See [DEPLOYMENT-Prism.md](./DEPLOYMENT-Prism.md) for the full list. Admin-specific:

- `PRISM_KEY_WEB` — required; web page password
- `PRISM_KEY_API` — required; API route key
