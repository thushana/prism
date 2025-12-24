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
npm run tools --help

# Show help for a specific command
npm run tools seed --help
npm run tools migrate --help
npm run tools export --help
```

## Commands

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
4. Test with `npm run tools <command-name> --help`

## Development

```bash
# Run typecheck
npm run typecheck -w apps/cli

# Run CLI directly (from apps/cli directory)
cd apps/cli
npm start -- --help
npm start -- seed --count 5
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
