# 💎 Prism Generate - Developer Experience

The `prism generate` command scaffolds a complete Next.js application pre-wired with Prism core, ready to deploy.

## Quick Start

```bash
# From the Prism monorepo root
npm run prism generate my-app
```

That's it! The generator handles everything automatically.

## What Gets Generated

The generator creates a fully functional Next.js app with:

### Core Stack

- **Next.js 16** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS 4** (pre-configured with Prism theme)
- **Drizzle ORM** with Neon PostgreSQL
- **Prism core packages** integration

### Project Structure

```
my-app/
  package.json              # Dependencies and scripts
  tsconfig.json            # TypeScript config
  next.config.js           # Next.js config
  vercel.json              # Vercel deployment config
  .eslintrc                 # ESLint config
  .prettierrc               # Prettier config
  .gitignore                # Git ignore rules
  .env.example              # Environment template
  .env                      # Auto-copied from .env.example

  app/
    layout.tsx              # Root layout with Prism UI
    page.tsx                # Home page (Prism demo)
    dev-sheet/
      page.tsx              # Dev sheet page
    api/
      dev-sheet/
        route.ts            # Dev sheet API route

  ui/
    styles/
      globals.css           # Tailwind CSS with Prism theme

  docs/
    index.mdx               # Documentation scaffold

  database/
    drizzle.config.ts       # Drizzle configuration
    schema.ts               # Database schema
    migrations/             # Migration files
    seed.ts                 # Seed script
    db.ts                   # Database client

  intelligence/
    tasks/
      exampleTask.ts        # Example AI task

  cli/
    index.ts                # Sample CLI command

  public/
    .gitkeep                # Placeholder for public assets
```

## What Runs Automatically

The generator performs these steps automatically:

1. **Creates directory structure** - All folders and files
2. **Generates template files** - Pre-configured with Prism defaults
3. **Installs dependencies** - Detects and uses npm/yarn/pnpm
4. **Sets up database** - Runs `drizzle-kit generate` and `migrate`
5. **Seeds database** - Runs the seed script with sample data
6. **Initializes git** - Creates repo and makes first commit

## First Time Usage

After generation, you're ready to go:

```bash
cd my-app
npm run dev
```

Visit:

- **App**: http://localhost:3000
- **Dev Sheet**: http://localhost:3000/dev-sheet

## Database Workflow

The generated app includes a complete database setup:

```bash
# Generate migrations from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (dev only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed database
npm run db:seed
```

### Database (Neon PostgreSQL)

- Uses Neon PostgreSQL with `@neondatabase/serverless`
- Configure `DATABASE_URL` in `.env` with your Neon connection string
- Pooled connection for runtime queries, unpooled for migrations
- Get connection strings from [Neon Console](https://console.neon.tech)

## Prism Core Integration

The generated app uses `@prism/core` as a dependency:

```typescript
// UI components
import { Button, Card } from "@prism/core/ui";

// Database
import { db } from "../database/db";

// Intelligence (AI tasks)
import { BaseTask } from "@prism/core/intelligence/tasks/base";

// Logger
import { logger } from "@prism/core/logger";

// Dev sheet
import { DevSheetPage } from "@prism/core/dev-sheet";
```

## Standalone App Deployment

For standalone apps (generated outside the monorepo), you have two options:

### Option 1: Git Submodule (Recommended - One Deployable Repo)

Generate without `--prism-repo` to add Prism as a git submodule inside your app:

```bash
npm run prism generate my-app --path ../my-app
```

This automatically:

- Adds Prism as a git submodule at `./prism` inside your app
- Uses `file:./prism/packages/...` dependencies for fast iteration
- Creates a single deployable repo (your app + Prism submodule)

**Workflow:**

```bash
cd my-app

# Make changes to Prism
vim prism/packages/ui/source/button.tsx

# Commit to Prism (pushes to github.com/thushana/prism)
cd prism
git add . && git commit -m "UI - Update button"
git push
cd ..

# Update submodule reference in app
git add prism
git commit -m "Update Prism submodule"
git push  # Deploys to Vercel
```

Vercel automatically handles git submodules during deployment.

### Option 2: Git Dependency (Alternative for Deployment)

Generate with the `--prism-repo` flag to use Prism from GitHub as an npm dependency:

```bash
npm run prism generate my-app --path ../my-app --prism-repo "git+https://github.com/thushana/prism.git"
```

This creates a deployable app that Vercel can build. Prism will be cloned from GitHub during the build process. Note: You won't be able to commit Prism changes from within your app with this approach.

## Customization

### Adding Database Tables

1. Edit `database/schema.ts`:

```typescript
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

2. Generate and apply migration:

```bash
npm run db:generate
npm run db:migrate
```

### Adding AI Tasks

1. Create a new task in `intelligence/tasks/`:

```typescript
import { BaseTask } from "@prism/core/intelligence/tasks/base";
import { z } from "zod";

export class MyTask extends BaseTask<Input, Output> {
  name = "my-task";
  // ... implement task
}
```

2. Register the task in your app code

### Adding CLI Commands

Edit `cli/index.ts` to add your own commands:

```typescript
program
  .command("my-command")
  .description("My custom command")
  .action(() => {
    // Your logic here
  });
```

## Deployment

The generated app is ready for Vercel deployment:

1. **Push to GitHub**
2. **Import to Vercel** - Point to the app directory
3. **Set environment variables** - Add `DATABASE_URL` for production
4. **Deploy** - Vercel handles the rest

The `vercel.json` file is pre-configured with:

- Region: `iad1`
- Function timeout: 10 seconds

## Troubleshooting

### Database Issues

If migrations fail:

```bash
# Reset database (dev only)
rm -rf data/database/*.db*
npm run db:push
```

### Import Errors

If imports fail:

- **Monorepo apps**: Ensure workspace dependencies are installed: `npm install` (from monorepo root)
- **Standalone apps with git dependency**: Ensure Prism repo is accessible and `npm install` completes
- **Standalone apps with file dependencies**: Ensure Prism submodule is initialized: `git submodule update --init --recursive`
- Check that TypeScript paths in `tsconfig.json` are correctly configured

### Build Errors

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format
```

## Philosophy

The generator is **highly opinionated** - no configuration options beyond the app name. This ensures:

- **Consistency** - All Prism apps follow the same structure
- **Speed** - No decision fatigue, just generate and go
- **Best practices** - Prism defaults are baked in
- **Ready to deploy** - Everything is configured for production

## Next Steps

- Read the [Architecture Guide](./ARCHITECTURE.md)
- Check the [Database Guide](./DATABASE.md)
- Explore [Intelligence Tasks](./INTELLIGENCE.md)
- Review [Deployment Guide](./DEPLOYMENT.md)
