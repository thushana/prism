# Prism Architecture

This document is the **mental model** for the Prism monorepo: **what** lives where and **why** the layout looks this way. It follows [DOCS-Prism.md](./DOCS-Prism.md): **how** (exact versions, scripts, props) belongs in **`package.json`**, route handlers, and TypeScript source—link there instead of duplicating.

## Tech Stack

**Versions, ranges, and scripts** live in the repo root **`package.json`** (`packageManager`, `engines`, `dependencies`, `devDependencies`, `scripts`). The list below is the **high-level stack** (names and concepts) so you can see what Prism is built on without copying numbers that drift.

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React
- **Styling**: Tailwind CSS
- **Database**: Drizzle ORM, PostgreSQL (Neon in sample / typical deployment)
- **Testing**: Vitest; component tests may use React Testing Library where a package opts in (see that package’s `package.json`)
- **Linting**: ESLint (Next-oriented config at repo root)
- **Formatting**: Prettier
- **Runtime**: Node.js (`engines` in `package.json`)
- **Monorepo**: **pnpm** workspaces (`packageManager` in `package.json`; packages under `apps/` and `packages/`)
- **Quality automation**: Husky, lint-staged (see root `package.json`); CI runs the same ideas as `pnpm run quality` / `pnpm run lint` (see workflow files)

## Monorepo Structure

pnpm workspace monorepo for sample apps and shared packages:

```
prism/
├── apps/
│   └── web/              # Sample application (generated apps go here)
├── packages/
│   ├── ui/               # Shared UI components
│   ├── database/         # Database layer (sample schema; apps may own their own)
│   ├── utilities/        # Shared utilities
│   ├── logger/           # Centralized logging
│   ├── intelligence/     # AI helpers and task registry
│   ├── admin/             # System sheet page + Prism admin component demos
│   ├── authentication/   # Authentication utilities (API and web)
│   ├── charts/           # Nivo wrappers + theme (see CHARTS-Prism.md)
│   ├── feature-flags/    # Feature flag helpers
│   └── cli/              # Shared CLI utilities
├── tools/                 # CLI entrypoint and generator
└── package.json          # Root workspace configuration
```

### Benefits of Monorepo

1. **Code Sharing**: Easily share UI components, utilities, and database logic between apps
2. **Atomic Commits**: Changes across multiple apps/packages in a single commit
3. **Consistent Versioning**: All packages and apps use the same dependency versions
4. **Simplified Development**: Run all apps with a single command
5. **Independent Deployment**: Each app can be deployed separately

## Project Structure

### Apps

#### Apps/web

Main customer-facing Next.js application:

- `app/` - Next.js App Router pages and layouts
- `public/` - Static assets
- `package.json` - App-specific dependencies
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration with workspace paths
- `vercel.json` - Vercel deployment configuration

#### Generated Apps

Apps generated via **`pnpm run prism generate <app-name>`** (see root `package.json` scripts `prism` / `tools`) follow the same structure as `apps/web`:

- `app/` - Next.js App Router pages and layouts
- `public/` - Static assets
- `package.json` - App-specific dependencies
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration with workspace paths
- `vercel.json` - Vercel deployment configuration

**Note:** The `apps/web` directory is kept as a sample reference. New apps can be generated using the CLI tool.

### Packages

#### Packages/ui

Shared UI component library:

- `components/` - React components (`PrismButton`, `PrismCard`, `PrismBadge`, `PrismIcon`, `PrismLayout*`, …)
- `source/` - Presets and secondary modules (e.g. `prism-button-presets.ts`; package entry re-exports from `components/` + styles)
- `styles/` - Font configurations and global CSS
- `fonts/` - Font files (.woff2)
- Built with Radix UI primitives
- Uses Class Variance Authority for variants
- Includes fonts: Satoshi, Sentient, Zodiak, Gambarino
- Exports font configurations for Next.js `localFont`

#### Packages/database

Shared database layer:

- `source/` - Database schema and queries
- `drizzle.config.ts` - Drizzle ORM configuration
- Neon PostgreSQL for both development and production
- Type-safe queries with Drizzle ORM

#### Packages/utilities

Shared utility functions:

- `source/` - Utility functions
- `source/classnames.ts` - Tailwind class name merger (`cn`)
- Includes tests for utilities

#### Packages/logger

Centralized logging used across server and client:

- `source/` - Client and server loggers with transport abstractions
- `source/server.ts` - Server logger, lifecycle helpers
- `source/client.ts` - Client logger with browser-safe outputs
- Tests cover client/server usage

#### Packages/intelligence

AI task registry and helpers:

- `source/tasks/` - Task definitions and registry
- `source/utilities/` - Cost tracking, retry logic, model helpers
- `models.config.json` - Model configuration defaults

#### Packages/admin

System information page plus Prism component demos for admin/sheets routes:

- `source/system/page.tsx` - Main system information page component
- `source/system/data.ts` - Reference data exposed to apps
- `source/system/types.ts` - Types for system sheet entries
- `source/registry.ts` - `PRISM_ADMIN_COMPONENT_REGISTRY` for dynamic demo routes

#### Packages/authentication

Shared authentication utilities for API and web authentication:

- `source/core.ts` - Shared core verification function
- `source/api.ts` - API key authentication (header-based)
- `source/web.ts` - Cookie-based web authentication
- `source/password-form.tsx` - Password form component
- `source/authentication_route.ts` - Authentication endpoint factory

#### Packages/charts

Nivo-based chart wrappers and theme mapping from CSS variables. See [CHARTS-Prism.md](./CHARTS-Prism.md).

#### Packages/feature-flags

Shared feature-flag discovery and standard environment flags for apps embedding Prism.

#### Packages/cli

Shared CLI utilities used by generator/ops commands:

- `source/` - Commander helpers, registry utilities, parsing helpers
- Consumed by `tools/app/commands/*`

## Key Decisions

### Monorepo Architecture

- **Workspace management**: **pnpm** workspaces (`packageManager` in root `package.json`)
- **Package names**: Simple names without scope (`ui`, `database`, `utilities`, `logger`, `intelligence`, `admin`, `authentication`, `charts`, `feature-flags`, `cli`)
- **Directory Convention**: `source/` instead of `src/` for packages
- **Versioning**: All packages use `*` for workspace dependencies
- **Import Style**: @ prefixed imports from package names (`import { PrismButton } from "@ui"`)

### Application Architecture

- **App Router**: Using Next.js App Router (not Pages Router) for both apps
- **TypeScript Path Alias**: `@/*` points to app root, workspace packages by name
- **Feature Organization**: Feature-based organization in `source/features/` within each app
- **Shared Code**: Common components, utilities, and database logic in packages

### Database

- **ORM**: Drizzle ORM for type safety and excellent TypeScript support
- **Development**: Neon PostgreSQL with @neondatabase/serverless
- **Production**: Consider managed PostgreSQL or other serverless-compatible databases
- **Schema Location**: `packages/database/source/schema.ts`
- **Migrations**: Managed by Drizzle Kit

### Styling

- **Framework**: Tailwind CSS (version in root `package.json`; CSS-first configuration)
- **Centralized Scanning**: The `packages/ui/styles/globals.css` file contains all `@source` directives for scanning Prism packages
- **Path Resolution**: Uses relative paths (`../../utilities`, `../../admin`) that work in both:
  - **Monorepo**: From `packages/ui/styles/` → `packages/utilities/`
  - **Standalone**: From `node_modules/ui/styles/` → `node_modules/utilities/`
- **App Integration**: Apps import Prism's base styles via `@import "ui/styles/globals.css"` and only scan their own files
- **Location Independence**: Apps never use relative paths to packages - all package scanning happens in the UI package
- **Fonts**: Custom fonts (Satoshi, Sentient, Zodiak, Gambarino) in `packages/ui/fonts/`
- **Font Configuration**: Font exports from `packages/ui/styles/fonts.ts` using Next.js `localFont`
- **Global Styles**: Base styles and theme variables in `packages/ui/styles/globals.css`
- **Icons**: Material Symbols Rounded (Google Fonts) with preconnect for fast loading
- **Theme**: CSS variables defined in `globals.css` with dark mode support

### Testing

- **Framework**: Vitest for fast unit/integration tests (see workspace `vitest.config` files)
- **Component tests**: Where used, colocated with packages (see each package’s devDependencies)
- **Location**: Tests colocated with source files (`*.test.ts`, `*.test.tsx`)
- **Coverage**: V8 coverage provider
- **CI**: Tests run in GitHub Actions on pull requests

### Code Quality

- **Type Checking**: TypeScript strict mode enabled across all workspaces
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with automatic formatting on save
- **Pre-commit Hooks**: Husky + lint-staged for automated formatting and linting
- **Quality scripts**: `pnpm run quality` at Prism root (see `scripts/quality.ts`)

### Naming Conventions

- **No Acronyms**: Use full words for package and folder names (e.g., "database" not "db", "utilities" not "utils"). For identifiers (props, types, constants), follow [NAMING.md](../.cursor/commands/NAMING.md), including its small allowlist (`api`, `ui`, …) where appropriate.
- **Kebab-case**: For file and directory names
- **PascalCase**: For React components and TypeScript types
- **camelCase**: For functions and variables

### Deployment

- **Platform**: Vercel
- **Strategy**: Independent deployment for each app
- **Web App**: Deploy from `apps/web` root (sample)
- **Generated Apps**: Deploy from `apps/<app-name>` root
- **Domains**: Configure per app in Vercel
- **Build**: Vercel automatically detects and builds changed apps

### Git Workflow

- **Commits**: Use descriptive commit messages (see [COMMIT-Prism.md](./COMMIT-Prism.md) and `.cursor/commands/COMMITMESSAGE.md` in consuming repos)
- **File Moves**: Use `git mv` to preserve file history
- **Hooks**: Pre-commit hooks run format, lint, and typecheck
- **CI**: GitHub Actions runs quality checks on every push

## Workspace Dependencies

Each app declares dependencies on shared packages:

```json
{
  "dependencies": {
    "ui": "*",
    "database": "*",
    "utilities": "*",
    "logger": "*",
    "intelligence": "*",
    "admin": "*",
    "authentication": "*",
    "charts": "*",
    "feature-flags": "*"
  }
}
```

The `*` version means "use the local workspace version" during development. Each app declares only what it needs; see generated `package.json` files under `apps/`.

### Using Prism as a Package

Prism is intended to be consumed as a dependency when building new apps:

**For Standalone Apps (Outside Monorepo):**

1. **Git Submodule** (recommended - one deployable repo):

   ```bash
   # Generate app (automatically adds Prism as submodule at ./prism)
   pnpm run prism generate my-app --path ../my-app
   ```

   - Prism is added as a git submodule inside your app at `./prism`
   - Uses `file:./prism/packages/...` dependencies
   - One repo to deploy (your app + Prism submodule)
   - Can commit Prism changes from within your app
   - Perfect for iterative development and deployment

2. **Git Dependency** (alternative for deployment):

   ```bash
   # Generate app with git dependency
   pnpm run prism generate my-app --path ../my-app --prism-repo "git+https://github.com/thushana/prism.git"
   ```

   - Vercel will clone Prism from GitHub during build
   - Works seamlessly for deployment
   - Note: You won't be able to commit Prism changes from within your app

**Import Patterns:**

- Install `@prism/core` (from git or file source) and import subpaths per package.
- Subpath exports map to the workspace packages: `@prism/core/ui`, `@prism/core/database`, `@prism/core/utilities`, `@prism/core/logger`, `@prism/core/intelligence`, `@prism/core/admin`, and `@prism/core/authentication`.
- Inside this monorepo we use path aliases like `@ui` and `@logger`; external apps can import the same modules via the `@prism/core/*` subpaths without custom path mapping.
- Generated apps scaffolded by the CLI are already wired to use these imports (with path aliases like `@ui` that work in both modes).

## Typescript Configuration

Each workspace has its own `tsconfig.json`:

- **Root**: Minimal config for IDE
- **Apps**: Full Next.js config with workspace paths
- **Packages**: Minimal config for type checking

TypeScript path mapping allows imports like:

```typescript
import { PrismButton } from "@ui"; // packages/ui
import { db } from "@database"; // packages/database
import { cn } from "@utilities"; // packages/utilities
import { serverLogger } from "@logger/server"; // packages/logger
import { getDefaultModel } from "@intelligence"; // packages/intelligence
import { SystemSheetPage } from "@admin"; // packages/admin
import { requireApiAuthentication } from "@authentication/api"; // packages/authentication
```

## Build Process

1. **Install**: `pnpm install` at repo root (see `packageManager` in `package.json`)
2. **Development**: Per-app dev scripts (e.g. `pnpm run dev`, `pnpm run dev:web`)
3. **Build**: `pnpm run build` / filtered builds (see scripts)
4. **Deploy**: Typically Vercel per app; paths in `vercel.json` per app

## Future Considerations

### When to Extract More Packages

Consider creating new packages when:

- Code is shared by multiple apps
- Logic is domain-specific and reusable
- You want to publish to npm (open source)

### When to Create New Apps

Consider creating new apps when:

- Functionality is distinct from existing apps
- You need different deployment/scaling characteristics
- You want separate authentication or access control

### Scaling the Monorepo

For larger monorepos, consider:

- **Turborepo**: For faster builds with caching
- **Build Dependencies**: Explicit dependency graphs
- **Package Versioning**: Independent versioning instead of `*`
- **Changesets**: For managing package versions and changelogs

## Development Workflow

1. **Local development** (exact names in root `package.json`):

   ```bash
   pnpm run dev        # Kill stale servers, then run the web app on :3000
   pnpm run dev:web    # Run web only
   pnpm run dev:setup  # Subdomain routing (one-time)
   ```

   **Subdomain routing**: After `pnpm run dev:setup`, you can access:
   - Web: `http://www.localhost:3000` or `http://web.localhost:3000`

2. **Making Changes**:
   - Edit files in any workspace
   - Hot reload works automatically
   - Shared packages update all dependent apps

3. **Testing / quality**:

   ```bash
   pnpm run test       # Vitest across workspaces (see script)
   pnpm run quality    # Full quality check
   ```

4. **Deployment**:
   - Push to GitHub
   - Vercel deploys changed apps automatically
   - Review deploy previews before merging

## References

- [DOCS-Prism.md](./DOCS-Prism.md) — documentation philosophy
- [CONVENTIONS-Prism.md](./CONVENTIONS-Prism.md) — code conventions
- [Next.js App Router](https://nextjs.org/docs/app)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Vitest](https://vitest.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
