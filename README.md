# 💎 Prism Core

**@prism/core** - Foundational infrastructure for Next.js applications built with TypeScript, Tailwind CSS, Drizzle ORM, and AI capabilities.

A [Next.js](https://nextjs.org) monorepo that can be used as a standalone package by apps in separate repositories. Uses npm workspaces to manage multiple applications and shared packages.

## Project Structure

```
prism/
├── packages/
│   ├── ui/               # Shared UI components
│   ├── database/         # Database layer (Drizzle ORM + Neon PostgreSQL)
│   ├── intelligence/     # AI tasks and utilities
│   ├── logger/           # Logging infrastructure
│   ├── utilities/        # Shared utility functions
│   ├── system-sheet/     # System information page
│   └── authentication/   # Authentication utilities
├── apps/
│   └── web/              # Sample application (generated apps go here)
├── tools/                 # CLI tools and generator
└── package.json          # @prism/core configuration
```

## Prerequisites

- Node.js >= 22.0.0 (as specified in `package.json`)
- npm (comes with Node.js)

## Getting Started

### Installation

Install all dependencies for the monorepo:

```bash
npm install
```

This will install dependencies for all workspaces (apps and packages).

### Development

Run the web app in development mode:

```bash
npm run dev
```

This will:

- Kill any existing dev servers on port 3000
- Start the web app
- Web app: http://localhost:3000

Or run the web app:

```bash
# Web app (http://localhost:3000)
npm run dev:web
```

**Note:** The `apps/web` directory is kept as a sample. You can generate new apps using `npm run prism generate <app-name>`, which will create them in the `apps/` directory.

## Available Scripts

### Development

- `npm run dev` - Run web app in development mode (kills existing servers first)
- `npm run dev:web` - Run web app only (port 3000)
- `npm run dev:kill` - Kill all development servers on port 3000

### Building

- `npm run build` - Build all apps
- `npm run build:web` - Build web app only

### Production

- `npm run start` - Start all production servers
- `npm run start:web` - Start web app (port 3000)

### Code Quality

- `npm run typecheck` - Run TypeScript type checking across all workspaces
- `npm run lint` - Run ESLint across all workspaces
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run quality` - Run typecheck, lint, format, and tests
- `npm run quality:quick` - Run typecheck, lint, and format (no tests)

### Testing

- `npm run test` - Run all tests
- `npm run test:run` - Run all tests once
- `npm run test:ui` - Run tests with Vitest UI (web app)
- `npm run test:coverage` - Generate coverage report (web app)

### Database

- `npm run database:generate` - Generate database migrations
- `npm run database:migrate` - Run database migrations
- `npm run database:push` - Push schema changes to database
- `npm run database:studio` - Open Drizzle Studio (database GUI)

### Utilities

- `npm run clean` - Clean build artifacts
- `npm run watch` - Watch TypeScript files

## Tech Stack

### Core

- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript 5.9.3 (target: ES2022)
- **Styling**: Tailwind CSS 4.1.17
- **Monorepo**: npm workspaces

### Apps

- **apps/web**: Sample Next.js application (reference implementation)
- **apps/\***: Generated apps (created via `npm run prism generate <name>`)

### Packages

- **packages/ui**: Shared UI components (Button, Card, Badge, Icon)
  - Radix UI primitives
  - Class Variance Authority for variants
  - Material Symbols Rounded icons (via Google Fonts)
- **packages/database**: Database layer
  - Drizzle ORM 0.44.7
  - Neon PostgreSQL with @neondatabase/serverless
- **packages/utilities**: Shared utility functions
  - `cn()` - Tailwind class name merger

### Development

- **Testing**: Vitest 4.0.10 with React Testing Library
- **Linting**: ESLint 9.39.1 with Next.js config
- **Formatting**: Prettier 3.6.2
- **Git Hooks**: Husky 9.1.7 with lint-staged
- **Fonts**: Satoshi (variable font) via `next/font/local`

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. Tests should be placed in files ending with `.test.ts` or `.test.tsx`.

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Database

This project uses [Drizzle ORM](https://orm.drizzle.team/) with Neon PostgreSQL. The database schema is defined in `packages/database/source/schema.ts`.

### Usage Example

```typescript
import { db } from "@database";

// Both apps can import from the shared database package
const data = await db.query.users.findMany();
```

### Database Commands

```bash
# Generate migrations from schema changes
npm run database:generate

# Apply migrations
npm run database:migrate

# Push schema changes directly (development)
npm run database:push

# Open Drizzle Studio GUI
npm run database:studio
```

## Using Prism Core

### As a Standalone Package

Apps in separate repositories can import Prism Core as a dependency. The generator handles this automatically:

**Option 1: Git Submodule (Recommended - One Deployable Repo)**

```bash
# Generate app (automatically adds Prism as submodule at ./prism)
npm run prism generate my-app --path ../my-app
```

This automatically:

- Adds Prism as a git submodule inside your app at `./prism`
- Uses `file:./prism/packages/...` dependencies for fast iteration
- Creates a single deployable repo (your app + Prism submodule)
- Allows committing Prism changes from within your app

**Option 2: Git Dependency (Alternative for Deployment)**

```bash
# Generate app with git dependency
npm run prism generate my-app --path ../my-app --prism-repo "git+https://github.com/thushana/prism.git"
```

This creates a deployable app that Vercel can build. Prism will be cloned from GitHub during the build process. Note: You won't be able to commit Prism changes from within your app with this approach.

**Import in your app:**

```typescript
// Import UI components
import { Button, Card } from "@prism/core/ui";

// Import database
import { db } from "@prism/core/database";

// Import AI utilities
import { getAIModel } from "@prism/core/intelligence";

// Import logger
import { logger } from "@prism/core/logger";

// Import utilities
import { cn } from "@prism/core/utilities";

// Import system-sheet (for system information pages)
import { SystemSheetPage } from "@prism/core/system-sheet";

// Import authentication utilities
import { requireApiAuthentication } from "@prism/core/authentication";
```

### Within the Monorepo

Apps within this monorepo can use direct package imports:

```typescript
// Import UI components
import { Button, Card } from "@ui";

// Import database
import { db } from "@database";

// Import utilities
import { cn } from "@utilities";

// Import logger (client-side)
import { logger, logSuccess } from "@logger/client";

// Import logger (server-side)
import { serverLogger as logger, logStart } from "@logger/server";

// Import system-sheet
import { SystemSheetPage } from "@system-sheet";

// Import authentication
import { requireApiAuthentication } from "@authentication";
```

### Dev-Sheet

Prism includes a shared development information page that shows environment details, git status, dependencies, and more.

**Add to your app:**

```typescript
// app/dev-sheet/page.tsx
import { DevSheetPage } from "@dev-sheet";
import type { DevSheetData } from "@dev-sheet";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function fetchDevSheetData(): Promise<DevSheetData | null> {
  try {
    // Construct absolute URL for server component fetch
    // In server components, relative URLs don't work with fetch()
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3001";
    const protocol = process.env.VERCEL_URL
      ? "https"
      : host.includes("localhost")
        ? "http"
        : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/dev-sheet`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? json.data : null;
  } catch {
    return null;
  }
}

export default async function Page() {
  // Hide in production unless explicitly enabled
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_DEV_SHEET !== "true"
  ) {
    return null;
  }

  const data = await fetchDevSheetData();
  return <DevSheetPage data={data} />;
}
```

**Note:** Your app needs to implement an `/api/dev-sheet` route that returns development data. See the generator templates for a reference implementation.

### Package Exports

Prism Core uses the `exports` field in `package.json` to expose packages as subpath imports (e.g., `@prism/core/ui`).

**Important Notes:**

- **TypeScript Source Files**: The exports point directly to TypeScript source files (`.ts`), not compiled JavaScript. This works because:
  - Next.js/Turbopack handles TypeScript compilation and bundling
  - TypeScript path mappings in `tsconfig.json` resolve these imports
  - This is designed for **monorepo/internal use** or apps using TypeScript with proper tooling

- **For External Consumers**: If you plan to publish this package or use it in apps without TypeScript tooling:
  - Consider adding a build step to compile TypeScript to JavaScript
  - Update exports to point to compiled `.js` files
  - Or ensure consuming apps have TypeScript configured with path mapping support

- **Current Exports**:
  - `@prism/core/ui` - UI components
  - `@prism/core/database` - Database layer
  - `@prism/core/intelligence` - AI utilities
  - `@prism/core/logger` - Logging infrastructure
  - `@prism/core/utilities` - Utility functions
  - `@prism/core/dev-sheet` - Development info page

### Package Structure

Each package follows the same structure:

```
packages/[package-name]/
├── source/           # Source files
│   └── index.ts      # Main export file
├── package.json      # Package configuration
└── tsconfig.json     # TypeScript configuration
```

## Deployment

This monorepo is designed to deploy each app independently on Vercel. See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

### Quick Summary

1. **Web App**: Deploy from `apps/web` root directory (sample)
2. **Generated Apps**: Deploy from `apps/<app-name>` root directory

Each app can be deployed independently from the same GitHub repository by setting different root directories in Vercel.

### Custom Domains

- Web: `yourdomain.com` or `www.yourdomain.com`
- Generated apps: Configure per app in Vercel

### Database

**Neon PostgreSQL** is used for both development and production:

- Configure via `DATABASE_URL` environment variable
- Use pooled connection for runtime queries
- Use unpooled connection (`DATABASE_URL_UNPOOLED`) for migrations
- Serverless-friendly with Neon's serverless driver

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your environment variables. Never commit `.env.local` or any files containing secrets.

Environment variables can be set per-app in Vercel or at the root level for all apps.

### Logger Configuration

Configure log levels using environment variables:

- **Server-side**: `LOG_LEVEL` (default: "info" in production, "debug" in development)
- **Client-side**: `NEXT_PUBLIC_LOG_LEVEL` (default: "info" in production, "debug" in development)

Valid log levels: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`

Example `.env.local`:

```bash
LOG_LEVEL=debug
NEXT_PUBLIC_LOG_LEVEL=debug
```

See [docs/LOGGER.md](./docs/LOGGER.md) for full logger documentation.

## Learn More

### Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub repository](https://github.com/vercel/next.js)

### Monorepos

- [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Turborepo](https://turbo.build/) - Consider for larger monorepos

### Drizzle ORM

- [Drizzle Documentation](https://orm.drizzle.team/)
- [Drizzle with Next.js](https://orm.drizzle.team/docs/tutorials/drizzle-with-nextjs)

## Contributing

1. Make changes in the appropriate workspace
2. Run `npm run quality` to ensure code quality
3. Commit with descriptive messages (see `.cursor/commands/commitmessage.md`)
4. Pre-commit hooks will automatically format and lint your code

## License

This project is private and not licensed for public use.
