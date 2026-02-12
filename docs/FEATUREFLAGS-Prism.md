# Feature Flags Package

The `packages/feature-flags` package is Prism's standard feature-flag layer. It wraps [Flags SDK](https://flags-sdk.dev/) and adds a single evaluation context (env, env keys, URL overrides, auth, user type) so every app uses the same API and naming. **Server-side only** (proxy, Server Components, API routes).

## Mental Model

Feature flags are evaluated per request. One **context** object is built per request (env, optional env vars, URL overrides from query params, and user from auth). Every flag's `decide(context)` receives that same shape. URL overrides are copied from the request URL into a header by the **proxy**, so Server Components and API routes see them without receiving `searchParams` explicitly.

- **Why a wrapper?** Flags SDK gives `identify` and `decide` but doesn't pass URL or a standard context shape. We add a proxy + a single context type so apps get env, URL, and auth in one place.
- **Why server-side only (v1)?** Proxy and `identify` use request headers/cookies; client components don't have that. Client flags can be added later if needed.

## What It Provides

### Context and identification

- **`FeatureFlagContext`** – Single type: `env`, `envFlags?`, `urlOverrides?`, `user?`. Exported from the package; see [`source/types.ts`](../packages/feature-flags/source/types.ts).
- **`createIdentify(options)`** – Builds the shared `identify` function. Options: `authCheck`, `envFlagPrefix`, `envFlagKeys`. Fills context from `process.env`, the `x-prism-flag-overrides` header (set by proxy), and auth. See [`source/identify.ts`](../packages/feature-flags/source/identify.ts).

### Flags and proxy

- **`createFlag(config)`** – Wraps Flags SDK `flag()`; your `decide(context: FeatureFlagContext)` receives the shared context. See [`source/flag.ts`](../packages/feature-flags/source/flag.ts).
- **`getProxy(config)`** – Returns a request handler that copies flag query params (prefix `flag_` or allowlist) into `x-prism-flag-overrides`. Export it as `proxy` in root `proxy.ts`. See [`source/proxy.ts`](../packages/feature-flags/source/proxy.ts).

### Helpers and discovery

- **`parseFlagOption(value)`** – `'on'` → true, `'off'` → false, else undefined. See [`source/helpers.ts`](../packages/feature-flags/source/helpers.ts).
- **`createFlagsDiscoveryEndpoint`**, **`getProviderData`** – Re-exports from Flags SDK for the `/.well-known/vercel/flags` route (Vercel Flags Explorer). See [`source/discovery.ts`](../packages/feature-flags/source/discovery.ts).

### Standard flags

Factories for Prism-wide flags with consistent semantics. All take the shared `identify` and return a flag:

- **`isDebug`**, **`isLocal`**, **`isStaging`**, **`isProduction`** – Env-based; URL override wins.
- **`isAdmin`**, **`isAuthenticated`** – Auth-based; URL override can simulate (e.g. for demos).
- **`isVerboseLogging`** – URL or env override for support.

See [`source/standard/`](../packages/feature-flags/source/standard/) for implementations. Naming: prefer `is*` / `has*` / `can*` for keys; option values are `on` | `off`.

## Design Decisions

### Why proxy for URL overrides?

So every flag evaluation sees URL overrides without passing `searchParams` at each call site. The proxy runs once per request and sets a single header; `identify` reads it and fills `context.urlOverrides`.

### Why one context type?

So all flags share the same mental model and logging shape. One place to see env, URL, and user; no ad-hoc entities per flag.

### Why standard flags in the package?

So every Prism app gets the same semantics for debug, env, and auth. Apps can add app-specific flags with `createFlag` alongside the standard ones.

## Package Structure

```
packages/feature-flags/
├── source/
│   ├── types.ts           # FeatureFlagContext, config types
│   ├── helpers.ts         # parseFlagOption, parseUrlOverrides, getEnvFlags
│   ├── identify.ts        # createIdentify
│   ├── flag.ts            # createFlag
│   ├── proxy.ts           # getProxy (use in root proxy.ts as export const proxy = getProxy(...))
│   ├── discovery.ts       # Re-exports for Flags Explorer
│   ├── standard/          # Standard flag factories
│   │   ├── isDebug.ts
│   │   ├── isLocal.ts
│   │   ├── isStaging.ts
│   │   ├── isProduction.ts
│   │   ├── isAdmin.ts
│   │   ├── isAuthenticated.ts
│   │   ├── isVerboseLogging.ts
│   │   └── index.ts
│   ├── index.ts           # Public API exports
│   └── helpers.test.ts    # Unit tests for helpers
├── vitest.config.ts
├── package.json
└── README.md              # Points to this doc
```

## Installation and setup

- Add dependency: `"feature-flags": "file:./prism/packages/feature-flags"` and `"flags": "^4.0.0"` (or current); run `npm install`.
- **Optional (Vercel Flags Explorer):** Set `FLAGS_SECRET` in env (32 bytes base64; e.g. `openssl rand -base64 32`). Only needed if you mount the discovery route.

## Usage

Apps use root `proxy.ts` with `export const proxy = getProxy({ paramPrefix: 'flag_' })`, create a flags file that calls `createIdentify` (with `authCheck` and optional `envFlagPrefix`) and the standard flag factories, then use flags in Server Components or API routes by awaiting the flag (e.g. `await isDebug()`). Override via URL: `?flag_<key>=on` or `?flag_<key>=off` (proxy strips the `flag_` prefix into `context.urlOverrides`). Optional: mount GET `/.well-known/vercel/flags` with `createFlagsDiscoveryEndpoint` and `getProviderData(yourFlags)` for Vercel Flags Explorer (requires `FLAGS_SECRET`).

TypeScript types and JSDoc live in the source files.

## Testing

Use URL overrides in test URLs (`?flag_isDebug=on`) or pass custom context: `await someFlag.run({ identify: () => testContext })`.

## Resources

- [Flags SDK](https://flags-sdk.dev/)
- [Flags SDK – Evaluation context](https://flags-sdk.dev/frameworks/next/evaluation-context)
