# Application config (`config.prism.json` + `config.app.json`)

Prism consumer apps use **two manifest files** at the Next.js app root (`apps/web/`). The `config.*` prefix keeps them adjacent in the file tree.

| File                    | Owner          | Purpose                                                                                       |
| ----------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| **`config.prism.json`** | **Prism**      | Standard shape for every Prism app: `app` chrome + `deployments` (dev port, future CLI hooks) |
| **`config.app.json`**   | **Client app** | Domain settings unique to this app (elections, feature flags, etc.)                           |

## `config.prism.json`

Same structure for all Prism apps:

```json
{
  "app": {
    "nameIdentifier": "alameda-elections",
    "nameDisplay": "Alameda Elections",
    "description": "Precinct-level election results map for Alameda County.",
    "icon": "map"
  },
  "deployments": {
    "dev": {
      "port": 1776
    }
  }
}
```

- Validated by `prismConfigBaseSchema` in `application-settings`.
- `app.nameIdentifier` — stable slug for dev hostnames and tooling (e.g. `porch-scope`).
- `app.nameDisplay` — human-facing name (admin chrome, passkey RP name, page titles).
- `app.postSignInPath` — optional redirect after sign-in (e.g. `/addresses`; default `/`). Wire via `createAuthGates(auth, { postSignInPath })`.
- `package.json` `dev` script should call `tsx ../../prism/scripts/run-next-dev.ts` so Next.js binds to `{nameIdentifier}.localhost` and prints the Prism dev URL on startup.
- Keep `deployments.dev.port` in sync with any hardcoded kill scripts (e.g. root `dev:kill`).
- **Local dev URL:** `http://{nameIdentifier}.localhost:{port}` (e.g. `http://alameda-elections.localhost:1776`). Optional `deployments.dev.host` overrides the hostname. Resolved by `resolveDevDeployment()` / `loadDevDeploymentFromDirectory()` in `application-settings`.
- Legacy `app.displayName` is still accepted and mapped to `nameDisplay`.
- `readApplicationSettings()` reads the `app` section for admin chrome and metadata.

## `config.app.json`

Client-specific domain only — no chrome fields:

```json
{
  "elections": {
    "defaultElectionId": "2025-11",
    "catalog": [
      {
        "id": "2025-11",
        "name": "November 2025 Special Election",
        "filePrecincts": "precincts-2025-11.geojson",
        "fileResults": "results/results-2025-11.json"
      }
    ]
  }
}
```

Each app defines its domain schema in `library/config/schema.ts`.

### Loading

| Pattern                                | When                                                |
| -------------------------------------- | --------------------------------------------------- |
| JSON import + Zod in `library/config/` | Client + server, static export                      |
| `readApplicationSettings()`            | Server-only chrome from `config.prism.json` → `app` |
| `readPrismConfigFromDirectory()`       | Full platform config in server scripts              |

Vercel tracing:

```typescript
outputFileTracingIncludes: {
  "/*": ["./config.app.json", "./config.prism.json"],
},
```

## Generator

`prism generate` writes both files plus `library/config/schema.ts`, `prism-schema.ts`, and `index.ts`.

## Layout

```
apps/web/
  config.prism.json      # Prism-standard: app chrome + deployments
  config.app.json        # Client-specific domain
  library/config/
    schema.ts            # config.app.json Zod schema
    prism-schema.ts      # config.prism.json Zod schema
    index.ts
```

## Upgrading existing projects

Prism renamed the manifest files so they sort together. **Readers in `application-settings` accept legacy names** until you rename; **JSON imports in `library/config/` do not** — update those when you migrate.

| Current (legacy)         | New                                          |
| ------------------------ | -------------------------------------------- |
| `prism.config.json`      | `config.prism.json`                          |
| `app.config.json`        | `config.app.json`                            |
| `app.json` (chrome only) | Move chrome into `config.prism.json` → `app` |

### Migration checklist

1. **Rename files** at the Next.js app root:
   ```bash
   mv prism.config.json config.prism.json   # if present
   mv app.config.json config.app.json       # if present
   ```
2. **If you still have `app.json`** (flat chrome): merge into `config.prism.json`:
   ```json
   {
     "app": {
       "nameIdentifier": "my-app",
       "nameDisplay": "...",
       "description": "...",
       "icon": "..."
     },
     "deployments": { "dev": { "port": 3000 } }
   }
   ```
   Remove `app.json` after merge.
3. **If `app.config.json` mixed chrome + domain**: move `nameDisplay`, `description`, and `icon` into `config.prism.json` → `app`; leave only domain keys (e.g. `elections`) in `config.app.json`.
4. **Update imports** in `library/config/index.ts`:
   ```typescript
   import appConfigJson from "../../config.app.json";
   import prismConfigJson from "../../config.prism.json";
   ```
5. **Update `next.config.ts`** tracing:
   ```typescript
   outputFileTracingIncludes: {
     "/*": ["./config.app.json", "./config.prism.json"],
   },
   ```
6. **Search the repo** for hard-coded legacy paths (`app.config.json`, `prism.config.json`) in scripts and docs.
7. **Run** `pnpm run typecheck` and config tests.

### Runtime fallback (server-only)

`readApplicationSettings()`, `readPrismConfigFromDirectory()`, and `readApplicationConfigFromDirectory()` resolve files in this order:

| Helper                  | Candidates                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Prism platform / chrome | `config.prism.json` → `prism.config.json` → flat `app.config.json` / `app.json` (chrome only) |
| Client domain           | `config.app.json` → `app.config.json`                                                         |

Static JSON imports used by Next.js bundles **must** use the new filenames after migration.
