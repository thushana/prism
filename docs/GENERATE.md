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
- **Drizzle ORM** with SQLite (dev) / PostgreSQL (prod-ready)
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

### Development (SQLite)

- Uses SQLite with `better-sqlite3`
- Database file: `./data/database/sqlite.db`
- Fast and simple for local development

### Production (PostgreSQL)

- Update `DATABASE_URL` in `.env` to PostgreSQL connection string
- Update `database/drizzle.config.ts` to use PostgreSQL adapter
- Migrations work the same way

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

**Note**: The generated app references `@prism/core` via `file:../prism` in `package.json`. For standalone apps, you'll need to:

- Install `@prism/core` as a dependency, or
- Link it locally, or
- Publish and install from npm

## Customization

### Adding Database Tables

1. Edit `database/schema.ts`:

```typescript
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
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

If `@prism/core` imports fail:

- Ensure `@prism/core` is installed: `npm install`
- Check that the Prism monorepo is accessible
- For standalone apps, install `@prism/core` as a dependency

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
