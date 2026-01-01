# Code Conventions

Style and naming conventions for this codebase.

**See also**: [DOCS-Prism.md](./DOCS-Prism.md) for documentation philosophy.

## URLs

- Use **kebab-case** (lowercase with hyphens)
- Use **plural nouns** for collections
- **RESTful Pattern (Preferred)**: Collections and individual resources both use plural
  - Collections: `/users/` - list of users
  - Individual resources: `/users/[id]/` - single user
  - Collections: `/posts/` - list of posts
  - Individual resources: `/posts/[id]/` - single post
- **App Router Pattern**: Use Next.js App Router conventions
  - `/about` - static page
  - `/users/[id]` - dynamic route with parameter
  - `/admin/settings` - nested routes

## API Endpoints

- Follow **REST conventions** with standard HTTP methods
- Use **kebab-case** resource names matching database table names
- Use **plural nouns** for collections
- Standard HTTP methods:
  - `GET` - Read/List resources
  - `POST` - Create resource
  - `PUT` - Update resource (full update)
  - `PATCH` - Update resource (partial update)
  - `DELETE` - Delete resource

### Endpoint Structure

- Collection endpoints: `/api/{resource}/route.ts`
  - `GET /api/{resource}` - List all resources
  - `POST /api/{resource}` - Create new resource
- Individual resource endpoints: `/api/{resource}/[id]/route.ts`
  - `GET /api/{resource}/{id}` - Get single resource
  - `PUT /api/{resource}/{id}` - Update resource
  - `PATCH /api/{resource}/{id}` - Update resource (partial)
  - `DELETE /api/{resource}/{id}` - Delete resource

### Examples

- `/api/users` - Users collection
- `/api/users/123` - Single user
- `/api/posts` - Posts collection
- `/api/posts/456` - Single post
- `/api/config` - Config resource (not a database table)

### Query Parameters

- Use query parameters for filtering and options
- Examples:
  - `GET /api/users?role=admin`
  - `GET /api/posts?authorId=123`
  - `GET /api/posts?format=json`

### Sort Parameters

- Use `sort` query parameter for controlling result ordering
- Sort values should be descriptive strings indicating the sort field/method
- Default to a sensible default (usually alphabetical or by creation date)
- Examples:
  - `GET /api/users?sort=alphabetical` - Sort by name alphabetically
  - `GET /api/posts?sort=date` - Sort by creation date (descending, newest first)
- Common sort patterns:
  - `alphabetical` - Sort alphabetically by name/key field
  - `date` - Sort by date (usually descending, newest first)
  - `created` - Sort by creation timestamp
- Implementation pattern:

  ```typescript
  const { searchParams } = new URL(request.url);
  const sortParam = searchParams.get("sort") || "date";

  if (sortParam === "alphabetical") {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortParam === "date") {
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  ```

## Database Tables and Columns

- Use **snake_case** (lowercase with underscores) for tables/columns and plural table names.
- Example tables: `users`, `posts`, `comments`.
- Common columns: `id`, `created_at`, `updated_at`.

### TypeScript Properties

- Use **camelCase** for TypeScript/JavaScript properties.
- Map snake_case → camelCase in application code:
  - `created_at` → `createdAt`
  - `updated_at` → `updatedAt`
  - `user_id` → `userId`

### Foreign Keys

- Use `{table}_id` pattern for foreign key columns
- Examples:
  - `user_id` - references `users.id`
  - `post_id` - references `posts.id`

## Logging

The centralized logging infrastructure is implemented and available via the `logger` package.

- **Avoid `console.log/error/warn`** - Use the centralized logger instead
- **Client components**: Import from `"@logger/client"` (or `@prism/core/logger` when consuming Prism as a package)
- **Server code**: Import from `"@logger/server"` (or `@prism/core/logger` when consuming Prism as a package)
- Use appropriate log levels: `error`, `warn`, `info`, `debug`, `verbose`, `silly`
- Include structured metadata for errors and context
- See [docs/LOGGER-Prism.md](./LOGGER-Prism.md) for detailed documentation

### Usage Examples

**Client-side (React components):**

```typescript
import { logger, logSuccess } from "@logger/client";

logger.info("Component mounted");
logger.error("Error occurred", { error });
logSuccess("Operation completed");
```

**Server-side (API routes, server components):**

```typescript
import { serverLogger as logger, logStart } from "@logger/server";

logger.info("Request received");
logger.error("Database error", { error });
logStart("Processing started");
```

## Folder Structure

### Apps Structure

Each app (`apps/web` and generated apps) follows Next.js App Router conventions:

```
apps/web/
├── app/                    # Next.js App Router pages and layouts
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── components/         # App-specific components
├── public/                 # Static assets
└── package.json            # App dependencies
```

### Packages Structure

Shared packages are organized under `packages/`:

```
packages/
├── ui/                     # Shared UI components
│   └── source/
│       ├── button.tsx
│       ├── card.tsx
│       └── index.ts
├── database/               # Database layer
│   └── source/
│       ├── schema.ts
│       └── index.ts
├── utilities/              # Shared utilities
│   └── source/
│       ├── classnames.ts
│       └── index.ts
├── logger/                 # Centralized logging (client/server)
│   └── source/
│       ├── client.ts
│       ├── server.ts
│       └── index.ts
├── intelligence/           # AI task registry and helpers
│   └── source/
│       ├── tasks/
│       ├── utilities/
│       └── index.ts
├── system-sheet/           # System information page primitives
│   └── source/
│       ├── page.tsx
│       ├── data.ts
│       └── index.ts
├── authentication/         # Authentication utilities
│   └── source/
│       ├── core.ts
│       ├── api.ts
│       ├── web.ts
│       ├── password-form.tsx
│       └── index.ts
└── cli/                    # Shared CLI utilities
    └── source/
        ├── command.ts
        ├── registry.ts
        └── index.ts
```

### File Organization Rules

- **`packages/ui/source/`** - Shared UI components (Button, Card, Badge, Icon)
- **`packages/database/source/`** - Database schema and queries
- **`packages/utilities/source/`** - Utility functions (classnames, etc.)
- **`packages/logger/source/`** - Centralized logging for client/server
- **`packages/intelligence/source/`** - AI helpers, tasks, and utilities
- **`packages/system-sheet/source/`** - System information page primitives
- **`packages/authentication/source/`** - Authentication utilities
- **`packages/cli/source/`** - Shared CLI helpers used by tools
- **`apps/*/app/`** - Next.js App Router pages and layouts
- **`apps/*/app/components/`** - App-specific React components

### Naming Conventions

1. **Use short, descriptive names** - `classnames.ts` not `utility-classnames.ts`
2. **Group by domain** - Related functionality in subdirectories (e.g., `packages/database/source/`)
3. **Keep exports in index files** - Each package has an `index.ts` that re-exports public API
4. **Consistent casing** - kebab-case for directories, camelCase for exports

### Import Path Conventions

- Use @ prefixed package names for shared packages: `import { Button } from "@ui"`
- Use `@/*` path alias for app-specific imports (points to app root)
- Use relative imports for local files
- Examples:

  ```typescript
  // Workspace packages (shared)
  import { Button, Card } from "@ui";
  import { db } from "@database";
  import { cn } from "@utilities";

  // App-specific imports (using @ alias)
  import { MyComponent } from "@/components/MyComponent";
  import { myUtil } from "@/lib/utils";

  // Relative imports
  import { helper } from "./helper";
  import { types } from "../types";
  ```

- When consuming Prism outside this monorepo:
  - Generated apps use path aliases (`@ui`, `@database`, etc.) that work with both git and file dependencies
  - The generator automatically configures TypeScript paths to resolve these imports
  - Prism is available at: `git+https://github.com/thushana/prism.git`
  - The generator automatically adds Prism as a git submodule at `./prism` inside your app (one deployable repo)

## CLI Commands

> The CLI tool is implemented. See [docs/CLI-Prism.md](./CLI-Prism.md) for usage and patterns.

- CLI tool entry point: `npm run tools`
- Commands are defined under `tools/app/commands`
- Each command has:
  - A `run*` function with the implementation
  - A `register*` function that registers the command with Commander
- Use TypeScript interfaces for command options
- Prefer `createCommand`/`withErrorHandling` from `packages/cli` for consistency
- Reuse utilities like `parseNumber`, `requireOption`, and `createRegistry`

### Import Patterns for CLI Commands

**Always use package-style imports** - never relative imports for shared packages:

```typescript
// ✅ Good - Package-style imports
import { serverLogger, logStart, logSuccess } from "@logger/server";
import { parseNumber, requireOption } from "@cli";
import { database, users } from "@database";
import type { BaseCommandOptions } from "@cli";

// ❌ Bad - Relative imports (hard to maintain)
import { serverLogger } from "../../../packages/logger/source/server";
import { parseNumber } from "../../../packages/cli/source/index";

// ❌ Bad - Non-prefixed package imports (will fail ESLint)
import { Button } from "ui";
import { db } from "database";
```

### Enforcement

The `@` prefix requirement is automatically enforced:

1. **ESLint Rule**: The `no-restricted-imports` rule prevents non-prefixed package imports
   - Configured in `eslint.config.mjs`
   - Blocks: `database`, `cli`, `logger`, `ui`, `utilities`, `intelligence`, `system-sheet`, `authentication`
   - Requires: `@database`, `@cli`, `@logger`, `@ui`, `@utilities`, `@intelligence`, `@system-sheet`, `@authentication`

2. **Pre-commit Hook**: Runs `lint-staged` which executes ESLint with `--fix` on staged files
   - Automatically fixes violations when possible
   - Blocks commits if violations cannot be auto-fixed

3. **CI/CD**: GitHub Actions runs `npm run lint` on every push/PR
   - Ensures all code conforms before merging
   - Part of the quality checks workflow

4. **TypeScript**: Path mappings in `tsconfig.json` only support `@` prefixed paths
   - Non-prefixed imports will fail type checking
   - Ensures consistency across the codebase

**Relative imports are only acceptable** for local files within the same directory/subdirectory:

```typescript
// ✅ Acceptable - Local file in same directory
import { helper } from "./helper";
import { types } from "../types";
```

- Use the centralized logger from `"@logger/server"` for all logging
- Handle errors gracefully and set `process.exitCode` instead of throwing

### Command Naming (Future)

- Use **kebab-case** for command names
- Use descriptive names that indicate the action
- Examples:
  - `seed` - Seed database with sample data
  - `migrate` - Run database migrations
  - `export` - Export data
