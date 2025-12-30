# CLI Tools

Command-line tools for database management and development workflows.

## Overview

This CLI application provides a unified interface for common development tasks like seeding databases, running migrations, and exporting data. It uses the generic CLI infrastructure from `packages/cli` and integrates with the project's database and logger packages.

## Architecture

- **`packages/cli`** - Generic CLI utilities and patterns (reusable)
- **`tools`** - Specific CLI commands for this project

## Usage

**Recommended**: Set up direct command access (one-time setup):

```bash
# Run setup script to link CLI globally
npm run setup

# Now use the CLI directly
prism --help
prism generate my-app
```

### Usage Methods

The CLI can be run in three ways. **Direct mode is recommended** after initial setup:

#### 1. Direct Command (Recommended) ⭐

After running `npm run setup`, use the CLI directly:

```bash
# Show help
prism --help

# Show help for a specific command
prism seed --help
prism migrate --help
prism export --help
prism generate --help
```

#### 2. Via npx (No Setup Required)

Use `npx` to run without setup:

```bash
npx @prism/core --help
npx @prism/core generate my-app
```

#### 3. Via npm Script

Use the npm script (useful for development):

```bash
npm run prism --help
npm run prism generate my-app
```

**Note**: You can also use `npm run tools` as an alias for `npm run prism`.

## Commands

### Prism Generate

Generate a new Next.js app with Prism core pre-wired.

```bash
# Direct mode (recommended after setup)
prism generate my-app

# Or via npx (no setup needed)
npx @prism/core generate my-app

# Or via npm script
npm run prism generate my-app
```

This command scaffolds a complete Next.js application with:

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS (pre-configured)
- Drizzle ORM + Neon PostgreSQL
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
# Direct mode (recommended after setup)
prism seed
prism seed --count 50
prism seed --table users --count 100
prism seed --count 20 --verbose

# Or via npm script
npm run tools seed
npm run tools seed --count 50
```

**Options:**

- `-c, --count <number>` - Number of records to seed (default: 10)
- `-t, --table <name>` - Table to seed (default: users)
- `-v, --verbose` - Enable verbose logging
- `-d, --debug` - Enable debug logging

### Migrate

Run database migrations using Drizzle Kit.

```bash
# Direct mode (recommended after setup)
prism migrate
prism migrate --generate
prism migrate --push
prism migrate --verbose

# Or via npm script
npm run tools migrate
npm run tools migrate --generate
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
# Direct mode (recommended after setup)
prism export --table users
prism export --table users --format csv
prism export --table users --output ./data/users.json
prism export --table users --format csv --output ./exports/users.csv --verbose

# Or via npm script
npm run tools export --table users
```

**Options:**

- `-t, --table <name>` - Table to export (required)
- `-f, --format <type>` - Export format: csv or json (default: json)
- `-o, --output <path>` - Output file path (default: ./export-{table}.{format})
- `-v, --verbose` - Enable verbose logging
- `-d, --debug` - Enable debug logging

## Adding New Commands

See the [CLI Documentation](../docs/CLI.md) for detailed instructions on adding new commands.

Quick steps:

1. Create a new command file in `app/commands/`
2. Implement the command following the pattern in existing commands
3. Register the command in `app/tools.ts`
4. Test with `npm run prism <command-name> --help`

## Development

```bash
# Run typecheck
npm run typecheck -w tools

# Run CLI directly (from tools directory)
cd tools
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
