# Architecture Decisions

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5.9.3 (target: ES2022)
- **Styling**: Tailwind CSS 4.1.17
- **Database**: Drizzle ORM (beta) with SQLite (better-sqlite3)
- **Testing**: Vitest 4.0.10 with React Testing Library
- **Linting**: ESLint 9.39.1
- **Formatting**: Prettier 3.6.2
- **Runtime**: Node.js 22.x (LTS)
- **Monorepo**: npm workspaces

## Monorepo Structure

This project uses a monorepo architecture to organize multiple applications and shared packages:

```
prism/
├── apps/
│   └── web/              # Sample application (generated apps go here)
├── packages/
│   ├── ui/               # Shared UI components
│   ├── database/         # Database layer
│   ├── utilities/        # Shared utilities
│   ├── logger/           # Centralized logging
│   ├── intelligence/     # AI helpers and task registry
│   ├── dev-sheet/        # Developer cheatsheet app primitives
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

#### apps/web

Main customer-facing Next.js application:

- `app/` - Next.js App Router pages and layouts
- `public/` - Static assets
- `package.json` - App-specific dependencies
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration with workspace paths
- `vercel.json` - Vercel deployment configuration

#### Generated Apps

Apps generated via `npm run prism generate <app-name>` follow the same structure as `apps/web`:

- `app/` - Next.js App Router pages and layouts
- `public/` - Static assets
- `package.json` - App-specific dependencies
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration with workspace paths
- `vercel.json` - Vercel deployment configuration

**Note:** The `apps/web` directory is kept as a sample reference. New apps can be generated using the CLI tool.

### Packages

#### packages/ui

Shared UI component library:

- `source/` - Component source files (Button, Card, Badge, Icon)
- `styles/` - Font configurations and global CSS
- `fonts/` - Font files (.woff2)
- `source/index.ts` - Main export file (exports components and styles)
- Built with Radix UI primitives
- Uses Class Variance Authority for variants
- Includes fonts: Satoshi, Sentient, Zodiak, Gambarino
- Exports font configurations for Next.js `localFont`

#### packages/database

Shared database layer:

- `source/` - Database schema and queries
- `drizzle.config.ts` - Drizzle ORM configuration
- SQLite for development (consider PostgreSQL for production)
- Type-safe queries with Drizzle ORM

#### packages/utilities

Shared utility functions:

- `source/` - Utility functions
- `source/classnames.ts` - Tailwind class name merger (`cn`)
- Includes tests for utilities

#### packages/logger

Centralized logging used across server and client:

- `source/` - Client and server loggers with transport abstractions
- `source/server.ts` - Server logger, lifecycle helpers
- `source/client.ts` - Client logger with browser-safe outputs
- Tests cover client/server usage

#### packages/intelligence

AI task registry and helpers:

- `source/tasks/` - Task definitions and registry
- `source/utilities/` - Cost tracking, retry logic, model helpers
- `models.config.json` - Model configuration defaults

#### packages/dev-sheet

Shared primitives for the developer cheatsheet experience:

- `source/page.tsx` - Main cheatsheet page component
- `source/data.ts` - Reference data exposed to apps
- `source/types.ts` - Types for cheatsheet entries

#### packages/cli

Shared CLI utilities used by generator/ops commands:

- `source/` - Commander helpers, registry utilities, parsing helpers
- Consumed by `tools/app/commands/*`

## Key Decisions

### Monorepo Architecture

- **Workspace Management**: Using npm workspaces (native npm feature)
- **Package Names**: Simple names without scope (`ui`, `database`, `utilities`, `logger`, `intelligence`, `dev-sheet`, `cli`)
- **Directory Convention**: `source/` instead of `src/` for packages
- **Versioning**: All packages use `*` for workspace dependencies
- **Import Style**: @ prefixed imports from package names (`import { Button } from "@ui"`)

### Application Architecture

- **App Router**: Using Next.js App Router (not Pages Router) for both apps
- **TypeScript Path Alias**: `@/*` points to app root, workspace packages by name
- **Feature Organization**: Feature-based organization in `source/features/` within each app
- **Shared Code**: Common components, utilities, and database logic in packages

### Database

- **ORM**: Drizzle ORM for type safety and excellent TypeScript support
- **Development**: SQLite with better-sqlite3 for local development
- **Production**: Consider managed PostgreSQL or other serverless-compatible databases
- **Schema Location**: `packages/database/source/schema.ts`
- **Migrations**: Managed by Drizzle Kit

### Styling

- **Framework**: Tailwind CSS 4.1.17 (CSS-first configuration)
- **Configuration**: Each app's `globals.css` includes `@source` directives to scan workspace packages
- **Fonts**: Custom fonts (Satoshi, Sentient, Zodiak, Gambarino) in `packages/ui/fonts/`
- **Font Configuration**: Font exports from `packages/ui/styles/fonts.ts` using Next.js `localFont`
- **Global Styles**: Base styles and theme variables in `packages/ui/styles/globals.css`
- **Icons**: Material Symbols Rounded (Google Fonts) with preconnect for fast loading
- **Theme**: CSS variables defined in `globals.css` with dark mode support

### Testing

- **Framework**: Vitest for fast unit/integration tests
- **React Testing**: React Testing Library for component tests
- **Location**: Tests colocated with source files (`*.test.ts`, `*.test.tsx`)
- **Coverage**: V8 coverage provider
- **CI**: Tests run in GitHub Actions on pull requests

### Code Quality

- **Type Checking**: TypeScript strict mode enabled across all workspaces
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with automatic formatting on save
- **Pre-commit Hooks**: Husky + lint-staged for automated formatting and linting
- **Quality Scripts**: `npm run quality` runs full quality checks

### Naming Conventions

- **No Acronyms**: Use full words (e.g., "database" not "db", "utilities" not "utils")
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

- **Commits**: Use descriptive commit messages (see `.cursor/commands/commitmessage.md`)
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
    "dev-sheet": "*"
  }
}
```

The `*` version means "use the local workspace version" during development.

### Using Prism as a Package

Prism is intended to be consumed as a dependency when building new apps:

- Install `@prism/core` (from npm or a Git source) and import subpaths per package.
- Subpath exports map to the workspace packages: `@prism/core/ui`, `@prism/core/database`, `@prism/core/utilities`, `@prism/core/logger`, `@prism/core/intelligence`, and `@prism/core/dev-sheet`.
- Inside this monorepo we use path aliases like `@ui` and `@logger`; external apps can import the same modules via the `@prism/core/*` subpaths without custom path mapping.
- Generated apps scaffolded by the CLI are already wired to use these imports.

## TypeScript Configuration

Each workspace has its own `tsconfig.json`:

- **Root**: Minimal config for IDE
- **Apps**: Full Next.js config with workspace paths
- **Packages**: Minimal config for type checking

TypeScript path mapping allows imports like:

```typescript
import { Button } from "@ui"; // packages/ui
import { db } from "@database"; // packages/database
import { cn } from "@utilities"; // packages/utilities
import { serverLogger } from "@logger/server"; // packages/logger
import { getDefaultModel } from "@intelligence"; // packages/intelligence
import { DevSheetPage } from "@dev-sheet"; // packages/dev-sheet
```

## Build Process

1. **Install**: `npm install` installs all workspace dependencies
2. **Development**: Each app runs independently with hot reload
3. **Build**: Each app builds independently, including workspace packages
4. **Deploy**: Each app deploys to separate Vercel projects

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

1. **Local Development**:

   ```bash
   npm run dev        # Kill stale servers, then run the web app on :3000
   npm run dev:web    # Run web only (alias)
   npm run dev:setup  # Set up subdomain routing (one-time setup)
   ```

   **Subdomain Routing**: After running `npm run dev:setup`, you can access:
   - Web: `http://www.localhost:3000` or `http://web.localhost:3000`

2. **Making Changes**:
   - Edit files in any workspace
   - Hot reload works automatically
   - Shared packages update all dependent apps

3. **Testing**:

   ```bash
   npm run test       # Test all workspaces
   npm run quality    # Full quality check
   ```

4. **Deployment**:
   - Push to GitHub
   - Vercel deploys changed apps automatically
   - Review deploy previews before merging

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [npm Workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Vitest](https://vitest.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
