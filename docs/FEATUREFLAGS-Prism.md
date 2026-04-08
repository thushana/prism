# Feature Flags Package

The **`packages/feature-flags`** package is Prism’s feature-flag layer. It wraps [Flags SDK](https://flags-sdk.dev/) and adds a single evaluation context (env, env keys, URL overrides, auth, user type) so apps share the same API shape. **Server-side only** in v1 (proxy, Server Components, API routes).

**See also**: [DOCS-Prism.md](./DOCS-Prism.md) — code and `package.json` are truth for versions and detailed types; this doc explains **why** and **where**.

## Mental Model

Feature flags are evaluated per request. One **context** is built per request (env, optional env vars, URL overrides from query params, user from auth). Each flag’s `decide(context)` receives that shape. The **proxy** copies flag query params into the header **`x-prism-flag-overrides`** so Server Components and routes do not need `searchParams` threaded everywhere.

- **Why a wrapper?** Flags SDK exposes `identify` / `decide` without a standard Prism context (URL, env, auth). The proxy plus `createIdentify` unify that.
- **Why server-side only (v1)?** Proxy and cookies/headers are request-scoped; client components do not get that for free. Client-side flags can be added later if needed.

## Public API (Pointers)

| Concern | Start here |
|--------|------------|
| Context type | [`types.ts`](../packages/feature-flags/source/types.ts) (`FeatureFlagContext`, configs) |
| `identify` builder | [`identify.ts`](../packages/feature-flags/source/identify.ts) (`createIdentify`) |
| Flag factory | [`flag.ts`](../packages/feature-flags/source/flag.ts) (`createFlag`) |
| Next proxy | [`proxy.ts`](../packages/feature-flags/source/proxy.ts) (`getProxy` → sets `x-prism-flag-overrides`) |
| Helpers | [`helpers.ts`](../packages/feature-flags/source/helpers.ts) (`parseFlagOption`, URL/env helpers) |
| Vercel Flags Explorer | [`discovery.ts`](../packages/feature-flags/source/discovery.ts) (`createFlagsDiscoveryEndpoint`, `getProviderData`) |
| Barrel exports | [`index.ts`](../packages/feature-flags/source/index.ts) |

## Standard Flag Factories

Prism-wide flags use consistent keys and semantics. Each factory takes your shared **`identify`** function (from `createIdentify`) and returns a flag:

- **`createIsDebugFlag`**, **`createIsLocalFlag`**, **`createIsStagingFlag`**, **`createIsProductionFlag`** — env-based; URL override wins where implemented.
- **`createIsAdminFlag`**, **`createIsAuthenticatedFlag`** — auth-based; URL override can simulate (e.g. demos).
- **`createIsVerboseLoggingFlag`** — support / logging verbosity.

Implementations: [`packages/feature-flags/source/standard/`](../packages/feature-flags/source/standard/). Naming: prefer `is*` / `has*` / `can*` for **keys**; URL/env option values are typically `on` | `off` (see `parseFlagOption`).

## Design Decisions

### Why Proxy for URL Overrides?

So every evaluation sees the same overrides without passing `searchParams` at each call site. The proxy runs once per request and sets one header; `createIdentify` reads it into `context.urlOverrides`.

### Why One Context Type?

One mental model and one logging shape for env, URL, and user—no ad-hoc context per flag.

### Why Standard Flags in the Package?

Shared semantics for debug, environment, and auth across Prism apps. App-specific flags use **`createFlag`** beside these.

## Package Structure

```
packages/feature-flags/
├── source/
│   ├── types.ts
│   ├── helpers.ts
│   ├── identify.ts
│   ├── flag.ts
│   ├── proxy.ts
│   ├── discovery.ts
│   ├── standard/
│   └── index.ts
├── package.json          # peer: flags, next — versions in lockfile / consuming app
└── README.md
```

## Installation

- **Inside this monorepo**: depend on **`feature-flags`** with **`workspace:*`** (see [`apps/web/package.json`](../apps/web/package.json)) and add **`flags`** to the app’s dependencies; run **`pnpm install`** from the repo root.
- **App with Prism as submodule / `file:`**: use the path your layout uses (e.g. `file:./prism/packages/feature-flags`) plus **`flags`** per [`packages/feature-flags/package.json`](../packages/feature-flags/package.json) peer/dev ranges; **`pnpm install`** (or your lockfile-aware installer).

**Vercel Flags Explorer (optional):** set **`FLAGS_SECRET`** (see Flags SDK docs). Mount **`/.well-known/vercel/flags`** using `createFlagsDiscoveryEndpoint` and `getProviderData`.

## Usage (Sketch)

Root **`proxy.ts`**: `export const proxy = getProxy({ paramPrefix: "flag_" })` (or `allowedKeys`). Build **`identify`** with **`createIdentify`** (`authCheck`, optional `envFlagPrefix` / `envFlagKeys`). Instantiate standard flags with **`createIsDebugFlag(identify)`**, etc., and await them in Server Components or route handlers. Overrides: **`?flag_<key>=on`** (proxy strips the prefix for `context.urlOverrides`). Full patterns: source files above and sample **`apps/web`**.

## Testing

URL overrides in test requests (`?flag_isDebug=on`) or pass a custom context via Flags SDK’s **`run`** with a stub **`identify`**—see Flags SDK testing docs and [`helpers.test.ts`](../packages/feature-flags/source/helpers.test.ts).

## Resources

- [Flags SDK](https://flags-sdk.dev/)
- [Flags SDK – Evaluation context](https://flags-sdk.dev/frameworks/next/evaluation-context)
