# Monorepo Migration Summary

This document summarizes the migration from a single Next.js app to a monorepo structure.

## What Changed

### Structure

**Before:**

```
starter-project/
├── app/                  # Next.js app
├── components/ui/        # UI components
├── data/database/        # Database
├── utilities/            # Utilities
└── package.json
```

**After:**

```
starter-project/
├── apps/
│   ├── web/              # Main app (was root app/)
│   └── admin/            # Admin app (was app/admin/)
├── packages/
│   ├── ui/               # Shared UI (was components/ui/)
│   ├── database/         # Shared database (was data/database/)
│   └── utilities/        # Shared utilities (was utilities/)
└── package.json          # Root workspace config
```

## Migration Details

### 1. Workspace Configuration

- Added npm workspaces to root `package.json`
- Configured workspaces: `["apps/*", "packages/*"]`
- Created individual `package.json` files for each workspace

### 2. Apps Created

#### apps/web

- Main customer-facing application
- Runs on http://localhost:3000
- Includes all original app pages (except admin)
- Independent Next.js configuration
- Independent deployment to Vercel

#### apps/admin

- Admin dashboard application
- Runs on http://localhost:3001
- Includes dev-sheet page (moved from /admin/dev-sheet)
- New admin homepage with navigation
- Independent deployment to Vercel

### 3. Packages Created

#### packages/ui

- Contains all UI components (Button, Card, Badge, Icon)
- Depends on: utilities, class-variance-authority, lucide-react
- Exports all components from `source/index.ts`
- Used by both web and admin apps

#### packages/database

- Contains database schema and Drizzle configuration
- SQLite with better-sqlite3 for development
- Can be shared across multiple apps
- Includes drizzle.config.ts

#### packages/utilities

- Contains utility functions (cn for classnames)
- Includes tests
- No external dependencies beyond tailwind-merge and clsx
- Used by ui package and both apps

### 4. Import Changes

**Before:**

```typescript
import { Button } from "@/components/ui/button";
import { db } from "@/data/database";
import { cn } from "@/utilities/classnames";
```

**After:**

```typescript
import { Button } from "ui";
import { db } from "database";
import { cn } from "utilities";
```

### 5. Scripts Updated

**Root package.json** now includes workspace-aware scripts:

- `npm run dev` - Run all apps
- `npm run dev:web` - Run web app only
- `npm run dev:admin` - Run admin app only
- `npm run build` - Build all apps
- `npm run build:web` - Build web app only
- `npm run build:admin` - Build admin app only
- `npm run typecheck` - Type check all workspaces
- `npm run lint` - Lint all workspaces
- `npm run test:run` - Test all workspaces

### 6. TypeScript Configuration

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

### 7. Deployment Strategy

**Before:** Single Vercel project

**After:** Two Vercel projects (same repo, different root directories)

- **Web**: Root directory `apps/web` → `yourdomain.com`
- **Admin**: Root directory `apps/admin` → `admin.yourdomain.com`

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for setup instructions.

## Benefits

1. **Code Reusability**: Share UI components, database, and utilities across apps
2. **Independent Deployment**: Deploy web and admin apps separately
3. **Better Organization**: Clear separation of concerns
4. **Scalability**: Easy to add new apps or packages
5. **Type Safety**: Workspace packages maintain full TypeScript support
6. **Atomic Changes**: Update shared code and all apps in one commit

## Testing

All apps and packages have been tested:

- ✅ `npm run typecheck` - All TypeScript checks pass
- ✅ `npm run build:web` - Web app builds successfully
- ✅ `npm run build:admin` - Admin app builds successfully
- ✅ Dependencies installed and linked correctly
- ✅ Workspace packages resolve properly

## Next Steps

### Development

```bash
# Install dependencies
npm install

# Run both apps
npm run dev

# Or run individually
npm run dev:web    # http://localhost:3000
npm run dev:admin  # http://localhost:3001
```

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

### Future Enhancements

Consider:

- Adding more shared packages (e.g., `config`, `types`, `api-client`)
- Creating new apps (e.g., `apps/mobile-web`, `apps/api`)
- Open sourcing packages (ui, utilities) with separate licenses
- Adding Turborepo for faster builds with caching
- Setting up Changesets for package versioning

## Documentation

- [README.md](./README.md) - Updated with monorepo commands and structure
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Updated with monorepo architecture decisions
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Vercel deployment guide for both apps

## Migration Completed

Date: November 20, 2025
All todos completed successfully! ✨
