# CLI Tools

Command-line tools for database management and development workflows.

## Overview

This CLI application provides a unified interface for common development tasks like seeding databases, running migrations, and exporting data. It uses the generic CLI infrastructure from `packages/cli` and integrates with the project's database and logger packages.

## Architecture

- **`packages/cli`** - Generic CLI utilities and patterns (reusable)
- **`apps/cli`** - Specific CLI commands for this project

## Usage

From the project root:

```bash
# Show help
npm run prism --help

# Show help for a specific command
npm run prism seed --help
npm run prism migrate --help
npm run prism export --help
npm run prism generate --help
```

**Note**: You can also use `npm run tools` as an alias for `npm run prism`.

## Commands

### Prism Generate

Generate a new Next.js app with Prism core pre-wired.

```bash
# Generate a new app
npm run prism generate my-app
```

This command scaffolds a complete Next.js application with:

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS (pre-configured)
- Drizzle ORM + SQLite (dev) / PostgreSQL (prod-ready)
- Prism core packages integration
- Dev sheet page at `/dev-sheet`
- Starter `intelligence/tasks/` folder
- Sample CLI command in `cli/`
- Documentation scaffold in `docs/`
- Vercel deployment configuration

The generator automatically:

- Creates all necessary files and folder structure
- Installs dependencies
- Runs database migrations and seeds
- Initializes git and makes the first commit

**Generated App Structure:**

```
my-app/
  package.json
  tsconfig.json
  next.config.js
  vercel.json
  .eslintrc
  .prettierrc
  .gitignore
  .env.example
  .env
  app/
    layout.tsx
    page.tsx (Prism demo)
    dev-sheet/
      page.tsx
    api/
      dev-sheet/
        route.ts
  ui/
    styles/
      globals.css
  docs/
    index.mdx
  database/
    drizzle.config.ts
    schema.ts
    migrations/
    seed.ts
    db.ts
  intelligence/
    tasks/
      exampleTask.ts
  cli/
    index.ts (sample command)
  public/
    .gitkeep
```

**Next Steps After Generation:**

```bash
cd my-app
npm run dev
```

Visit http://localhost:3000 to see your app, and http://localhost:3000/dev-sheet for the dev sheet.

### Seed

Seed the database with sample data for development and testing.

```bash
# Seed with default count (10 users)
npm run tools seed

# Seed with specific count
npm run tools seed --count 50

# Seed a specific table
npm run tools seed --table users --count 100

# Enable verbose logging
npm run tools seed --count 20 --verbose
```

**Options:**

- `-c, --count <number>` - Number of records to seed (default: 10)
- `-t, --table <name>` - Table to seed (default: users)
- `-v, --verbose` - Enable verbose logging
- `-d, --debug` - Enable debug logging

### Migrate

Run database migrations using Drizzle Kit.

```bash
# Run all pending migrations
npm run tools migrate

# Generate migrations from schema changes
npm run tools migrate --generate

# Push schema directly without migrations
npm run tools migrate --push

# Enable verbose logging
npm run tools migrate --verbose
```

**Options:**

- `-r, --rollback` - Rollback the last migration (not yet implemented)
- `-g, --generate` - Generate migrations from schema changes
- `-p, --push` - Push schema directly (no migrations)
- `-v, --verbose` - Enable verbose logging
- `-d, --debug` - Enable debug logging

### Export

Export data from the database to CSV or JSON format.

```bash
# Export users to JSON (default)
npm run tools export --table users

# Export to CSV
npm run tools export --table users --format csv

# Export with custom output path
npm run tools export --table users --output ./data/users.json

# Export with all options
npm run tools export --table users --format csv --output ./exports/users.csv --verbose
```

**Options:**

- `-t, --table <name>` - Table to export (required)
- `-f, --format <type>` - Export format: csv or json (default: json)
- `-o, --output <path>` - Output file path (default: ./export-{table}.{format})
- `-v, --verbose` - Enable verbose logging
- `-d, --debug` - Enable debug logging

## Adding New Commands

See the [CLI Documentation](../../docs/CLI.md) for detailed instructions on adding new commands.

Quick steps:

1. Create a new command file in `app/commands/`
2. Implement the command following the pattern in existing commands
3. Register the command in `app/tools.ts`
4. Test with `npm run prism <command-name> --help`

## Development

```bash
# Run typecheck
npm run typecheck -w apps/cli

# Run CLI directly (from apps/cli directory)
cd apps/cli
npm start -- --help
npm start -- seed --count 5
npm start -- generate my-app
```

## Integration with Database

The CLI integrates with the `database` package:

- Uses Drizzle ORM for database operations
- Respects the database configuration in `packages/database/drizzle.config.ts`
- Works with the existing schema and migrations

## Logging

All commands use the centralized logger from `packages/logger`:

- Consistent formatting across all commands
- Emoji prefixes for different log types
- Configurable log levels (debug, verbose, info, etc.)
- LOG_LEVEL environment variable support
