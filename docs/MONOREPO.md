# Monorepo Structure

This project uses a monorepo architecture to organize multiple applications and shared packages.

## Current Structure

```
starter-project/
├── apps/
│   ├── web/              # Main customer-facing application
│   └── admin/            # Admin dashboard
├── packages/
│   ├── ui/               # Shared UI components
│   ├── database/         # Shared database layer
│   └── utilities/        # Shared utility functions
└── package.json          # Root workspace configuration
```

## Workspace Configuration

The root `package.json` uses npm workspaces:

- Workspaces: `["apps/*", "packages/*"]`
- Each workspace has its own `package.json`
- Dependencies are managed at the workspace level

## Apps

### apps/web

Main customer-facing Next.js application:

- Runs on http://localhost:3000
- Also accessible via http://www.localhost:3000 and http://web.localhost:3000 (after setup)
- Independent Next.js configuration
- Independent deployment to Vercel

### apps/admin

Admin dashboard Next.js application:

- Runs on http://localhost:3001
- Also accessible via http://admin.localhost:3001 (after setup)
- Includes dev-sheet page for development information
- Independent deployment to Vercel

## Packages

### packages/ui

Shared UI component library:

- Contains UI components (Button, Card, Badge, Icon)
- Depends on: utilities, class-variance-authority
- Exports all components from `source/index.ts`
- Used by both web and admin apps
- Uses Material Symbols Rounded icons (Google Fonts)

### packages/database

Shared database layer:

- Contains database schema and Drizzle configuration
- SQLite with better-sqlite3 for development
- Shared across multiple apps
- Includes `drizzle.config.ts`

### packages/utilities

Shared utility functions:

- Contains utility functions (`cn` for classnames)
- Includes tests
- Dependencies: tailwind-merge and clsx
- Used by ui package and both apps

## Import Style

Apps import from shared packages using workspace package names:

```typescript
// Import UI components
import { Button, Card } from "ui";

// Import database
import { db } from "database";

// Import utilities
import { cn } from "utilities";
```

## Scripts

The root `package.json` includes workspace-aware scripts:

### Development

- `npm run dev` - Run all apps concurrently (uses `concurrently` for colored output)
- `npm run dev:web` - Run web app only (port 3000)
- `npm run dev:admin` - Run admin app only (port 3001)
- `npm run dev:kill` - Kill all dev servers on ports 3000 and 3001
- `npm run dev:setup` - Set up subdomain routing (adds to `/etc/hosts`)

### Building

- `npm run build` - Build all apps
- `npm run build:web` - Build web app only
- `npm run build:admin` - Build admin app only

### Code Quality

- `npm run typecheck` - Type check all workspaces
- `npm run lint` - Lint all workspaces
- `npm run test:run` - Test all workspaces

## TypeScript Configuration

Each workspace has its own `tsconfig.json` with paths configured to resolve workspace packages:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "ui": ["../../packages/ui/source"],
      "database": ["../../packages/database/source"],
      "utilities": ["../../packages/utilities/source"]
    }
  }
}
```

## Deployment Strategy

The monorepo deploys each app independently on Vercel:

- **Web**: Root directory `apps/web` → `yourdomain.com`
- **Admin**: Root directory `apps/admin` → `admin.yourdomain.com`

Both projects point to the same GitHub repository but use different root directories.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## Benefits

1. **Code Reusability**: Share UI components, database, and utilities across apps
2. **Independent Deployment**: Deploy web and admin apps separately
3. **Better Organization**: Clear separation of concerns
4. **Scalability**: Easy to add new apps or packages
5. **Type Safety**: Workspace packages maintain full TypeScript support
6. **Atomic Changes**: Update shared code and all apps in one commit

## Getting Started

### Installation

```bash
npm install
```

This installs dependencies for all workspaces (apps and packages).

### Development

```bash
# Set up subdomain routing (one-time, optional)
npm run dev:setup

# Run both apps concurrently
npm run dev

# Or run individually
npm run dev:web    # http://localhost:3000 (also www.localhost:3000, web.localhost:3000)
npm run dev:admin  # http://localhost:3001 (also admin.localhost:3001)
```

**Note**: `npm run dev` automatically kills any existing dev servers before starting, preventing port conflicts.

### Deployment

1. **Set up Vercel projects**:
   - Create two projects in Vercel dashboard
   - Both point to same GitHub repo
   - Set different root directories (`apps/web` and `apps/admin`)

2. **Configure custom domains**:
   - Web app: `yourdomain.com`
   - Admin app: `admin.yourdomain.com`

3. **Environment variables**:
   - Set per-project in Vercel dashboard
   - Can be different for each app

## Future Enhancements

Consider:

- Adding more shared packages (e.g., `config`, `types`, `api-client`)
- Creating new apps (e.g., `apps/mobile-web`, `apps/api`)
- Open sourcing packages (ui, utilities) with separate licenses
- Adding Turborepo for faster builds with caching
- Setting up Changesets for package versioning

## Related Documentation

- [README.md](../README.md) - Project overview and quick start
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture decisions and patterns
- [docs/DEPLOYMENT.md](./DEPLOYMENT.md) - Vercel deployment guide
