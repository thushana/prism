# CLI Tool Documentation

The CLI tool (`npm run tools`) provides a unified command-line interface for common development and maintenance tasks. It uses **Commander.js** for argument parsing and command registration, with a clean separation between generic CLI utilities (`packages/cli`) and specific commands (`tools`).

## Architecture

The CLI is split into two parts following monorepo best practices:

- **`packages/cli`** - Generic CLI utilities and patterns (reusable across projects)
  - Command patterns and interfaces
  - Command registry utilities
  - Common CLI utilities (path resolution, validation, etc.)

- **`tools`** - Specific CLI application for this project
  - Actual command implementations (seed, migrate, export, generate)
  - Integration with database and logger packages
  - Main tools.ts entry point

## Design Philosophy

1. **Unified Entry Point**: Single `tools` command with subcommands
2. **Modular Commands**: Each command is in its own file for maintainability
3. **Consistent Logging**: All commands use the centralized logger with emoji prefixes
4. **Type-Safe**: Full TypeScript support with proper types
5. **Extensible**: Easy to add new commands following established patterns
6. **Reusable**: Generic CLI infrastructure can be used by other apps in the monorepo

## Usage

### Running Commands

```bash
# Show help
npm run tools --help

# Show version
npm run tools --version

# Run a command
npm run tools <command> [options]
```

### Available Commands

#### `seed`

Seed the database with sample data.

```bash
# Seed database
npm run tools seed

# Seed with specific count
npm run tools seed --count 100
```

#### `generate`

Scaffold a new Prism-powered Next.js app.

```bash
# Generate a new app
npm run tools generate my-app

# Overwrite existing directory if needed
npm run tools generate my-app --force
```

#### `migrate`

Run database migrations manually.

```bash
# Run all pending migrations
npm run tools migrate

# Rollback last migration
npm run tools migrate --rollback
```

#### `export`

Export data from the database.

```bash
# Export users to CSV
npm run tools export users --format csv

# Export to JSON
npm run tools export users --format json
```

## Actual File Structure

```
packages/cli/
├── package.json
├── tsconfig.json
└── source/
    ├── index.ts           # Package exports
    ├── command.ts         # Base command patterns/interfaces (createCommand, withErrorHandling)
    ├── registry.ts        # Command registration helpers
    └── utils.ts           # CLI utilities

tools/
├── package.json
├── tsconfig.json
├── README.md
└── app/
    ├── tools.ts           # Main CLI entry point
    └── commands/
        ├── generate.ts     # App scaffolding command
        ├── seed.ts        # Database seeding command
        ├── migrate.ts     # Migration runner
        └── export.ts      # Data export command
```

### Command Registration Pattern

Commands are registered in the main `tools.ts` file:

```typescript
import { registerGenerateCommand } from "./commands/generate";
import { registerSeedCommand } from "./commands/seed";
import { registerMigrateCommand } from "./commands/migrate";
import { registerExportCommand } from "./commands/export";

registerGenerateCommand(program);
registerSeedCommand(program);
registerMigrateCommand(program);
registerExportCommand(program);
```

### Command Implementation Pattern

Each command will follow this structure:

```typescript
import { Command } from "commander";
import { serverLogger as logger, logStart, logSuccess } from "logger/server";
import type { BaseCommandOptions } from "cli";

export interface MyCommandOptions extends BaseCommandOptions {
  flag?: boolean;
  option?: string;
}

export async function runMyCommand(options: MyCommandOptions) {
  if (options.debug || options.verbose) {
    logger.level = "debug";
  }

  logStart("Command started");
  // ... command logic
  logSuccess("Command completed");
}

export function registerMyCommand(program: Command) {
  program
    .command("my-command")
    .description("Description of what the command does")
    .option("--flag", "Flag description", false)
    .option("--option <value>", "Option description", "default")
    .action(async (options: MyCommandOptions) => {
      try {
        await runMyCommand(options);
        logger.success("Command completed");
      } catch (error) {
        logger.error("Command failed", { error });
        process.exitCode = 1;
      }
    });
}
```

## Adding New Commands

### Step 1: Create Command File

Create `tools/app/commands/my-command.ts`:

```typescript
import { Command } from "commander";
import { serverLogger as logger, logStart, logSuccess } from "logger/server";
import type { BaseCommandOptions } from "cli";

export interface MyCommandOptions extends BaseCommandOptions {
  input?: string;
  output?: string;
  verbose?: boolean;
  crawler?: boolean;
}

export async function runMyCommand(options: MyCommandOptions) {
  if (options.verbose) {
    logger.level = "debug";
  }

  logStart("Starting my command");

  // Your command logic here
  logger.info("Processing...", { input: options.input });

  logSuccess("Command completed");
}

export function registerMyCommand(program: Command) {
  program
    .command("my-command")
    .description("Does something useful")
    .option("-i, --input <file>", "Input file path")
    .option("-o, --output <file>", "Output file path")
    .option("-v, --verbose", "Enable verbose logging", false)
    .action(async (options: MyCommandOptions) => {
      try {
        await runMyCommand(options);
      } catch (error) {
        logger.error("My command failed", { error });
        process.exitCode = 1;
      }
    });
}
```

### `packages/cli` helpers (current)

Use the shared CLI helpers for consistency:

```typescript
import {
  createCommand,
  withErrorHandling,
  parseNumber,
  requireOption,
} from "cli";

interface HelloOptions extends BaseCommandOptions {
  name?: string;
}

export const registerHelloCommand = createCommand<HelloOptions>({
  name: "hello",
  description: "Say hello",
  options: [{ flags: "-n, --name <name>", description: "Name to greet" }],
  handler: withErrorHandling(async (options) => {
    requireOption(options.name, "name", "hello");
    if (options.debug || options.verbose) {
      logger.level = "debug";
    }
    logger.info(`Hello, ${options.name}!`);
  }),
});
```

### Step 2: Register Command

Add to `tools/app/tools.ts`:

```typescript
import { registerMyCommand } from "./commands/my-command";

// In main()
registerMyCommand(program);
```

### Step 3: Test

```bash
npm run tools my-command --help
npm run tools my-command --input file.txt --verbose
```

## Best Practices

### 1. Use TypeScript Interfaces for Options

```typescript
// ✅ Good
export interface MyCommandOptions {
  input?: string;
  output?: string;
  verbose?: boolean;
}

// ❌ Bad
action(async (options: any) => { ... })
```

### 2. Handle Errors Gracefully

```typescript
// ✅ Good
export function registerMyCommand(program: Command) {
  program.command("my-command").action(async (options) => {
    try {
      await runMyCommand(options);
    } catch (error) {
      logger.error("Command failed", { error });
      process.exitCode = 1; // Set exit code, don't throw
    }
  });
}
```

### 3. Use Logger, Not Console

```typescript
// ✅ Good
import { serverLogger as logger, logStart, logSuccess } from "logger/server";
logger.info("Processing...");

// ❌ Bad
console.log("Processing...");
```

### 4. Provide Helpful Descriptions

```typescript
// ✅ Good
.command('crawl <placeType>')
.description('Crawl Google Maps for a specific place type')
.option('--debug', 'Enable verbose debug logging', false)

// ❌ Bad
.command('crawl')
.description('Crawl')
```

### 5. Use Package-Style Imports

```typescript
// ✅ Good - Package-style imports (configured via tsconfig.json paths)
import { serverLogger as logger } from "logger/server";
import { parseNumber } from "cli";
import { database } from "database";

// ❌ Bad - Relative imports (hard to maintain, break on refactoring)
import { serverLogger as logger } from "../../../packages/logger/source/server";

// ❌ Bad - Path aliases don't work in CLI context
import { serverLogger as logger } from "@/library/logger/server";
```

**Note**: Package-style imports are enabled via `tsconfig.json` path mappings. Never use relative imports (`../../../packages/...`) for shared packages - always use the package name directly.

### 6. Validate Required Arguments

```typescript
export async function runMyCommand(options: MyCommandOptions) {
  if (!options.input) {
    logger.error("Input file is required");
    process.exit(1);
  }
  // ... rest of command
}
```

### 7. Support Debug Mode

```typescript
export async function runMyCommand(options: MyCommandOptions) {
  if (options.debug) {
    logger.level = "debug";
  }
  // ... rest of command
}
```

## Environment Variables

Commands can access environment variables:

```typescript
import * as dotenv from "dotenv";

dotenv.config(); // Load .env file

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  logger.error("GOOGLE_MAPS_API_KEY not set");
  process.exit(1);
}
```

## Testing Commands

### Manual Testing

```bash
# Test with help
npm run tools my-command --help

# Test with various options
npm run tools my-command --input test.txt
npm run tools my-command --input test.txt --verbose
```

### Unit Testing

Commands can be tested by importing the `run*` function:

```typescript
import { runMyCommand } from "./my-command";

describe("MyCommand", () => {
  it("should process input", async () => {
    await runMyCommand({ input: "test.txt" });
    // Assertions
  });
});
```

## Common Patterns

### Loading Configuration

```typescript
import * as fs from "fs";
import * as path from "path";

function loadConfig() {
  const configPath = path.join(process.cwd(), "config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("config.json not found");
  }
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}
```

### Database Access

```typescript
import { database } from "database";
import * as path from "path";

const dbPath = path.join(process.cwd(), "businesses.db");
const db = database.withConfig({ url: dbPath });

try {
  // Use db
} finally {
  db.close();
}
```

### Progress Reporting

```typescript
import { logStart, logStats } from "logger/server";

for (let i = 0; i < items.length; i++) {
  logStart(`[${i + 1}/${items.length}] Processing ${items[i].name}`);
  // Process item
}

logStats(`Processed ${items.length} items`);
```

## Troubleshooting

### Command Not Found

If a command doesn't appear in help:

1. Check that the command is registered in `tools.ts`
2. Verify the import path is correct
3. Ensure the `register*` function is called in `main()`

### Import Errors

If you see module resolution errors:

1. Use package-style imports (`logger/server`, `cli`, `database`) - never relative imports for packages
2. Verify `tsconfig.json` has the correct path mappings configured
3. Check that the file is in the correct directory
4. Verify TypeScript compilation

### Logger Not Working

If logger output doesn't appear:

1. Check `LOG_LEVEL` environment variable
2. Verify logger is imported correctly
3. Ensure log level is appropriate (e.g., `debug` won't show in `info` mode)
