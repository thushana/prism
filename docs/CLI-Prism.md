# CLI Tool Documentation

The CLI tool (`npm run tools`) provides a unified command-line interface for common development and maintenance tasks. It uses **Commander.js** for argument parsing and command registration, with a clean separation between generic CLI utilities (`packages/cli`) and specific commands (`tools`).

## Architecture

The CLI is split into two parts following monorepo best practices:

- **`packages/cli`** - Generic CLI utilities and patterns (reusable across projects)
  - Command patterns and interfaces
  - Command registry utilities
  - Common CLI utilities (path resolution, validation, etc.)
  - Styling utilities (chalk-based text styling for console output)

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

#### `run`

Kill existing servers, start development environment, and open browser tabs. This command is automatically available to child apps (apps using `@cli` package).

```bash
# Start dev environment (kills existing servers, starts dev server and Drizzle Studio, opens browser tabs)
npm run tools run dev

# With custom ports
npm run tools run dev --port 3001 --drizzle-port 4984

# Enable verbose logging
npm run tools run dev --verbose
```

**What it does:**

1. Kills all running dev servers and Drizzle Studio
2. Starts the dev server (Next.js)
3. Starts Drizzle Studio (if available)
4. Waits for services to be ready
5. Opens browser tabs for:
   - Host project dashboard (if `HOST_PROJECT_DASHBOARD` env var is set)
   - Host project deployments page
   - Drizzle Studio (`https://local.drizzle.studio`)
   - System sheet page (`/admin/system-sheet`)
   - Main application (`http://localhost:3000`)

**Options:**

- `-p, --port <port>` - Port for dev server (default: 3000)
- `-d, --drizzle-port <port>` - Port for Drizzle Studio (default: 4983)
- `-v, --verbose` - Enable verbose logging
- `--debug` - Enable debug logging

**Environment Variables:**

- `HOST_PROJECT_DASHBOARD` - URL to your hosting platform's project dashboard (e.g., `https://vercel.com/username/project`). Used to open dashboard and deployments pages.

**Note:** This command is automatically inherited by child apps. For example, in a TimeTraveler app, you can run `timetraveler run dev` directly.

## Actual File Structure

```
packages/cli/
├── package.json
├── tsconfig.json
└── source/
    ├── index.ts           # Package exports
    ├── command.ts         # Base command patterns/interfaces (createCommand, withErrorHandling)
    ├── registry.ts        # Command registration helpers
    ├── utilities.ts       # CLI utilities
    └── styling.ts         # Styling utilities (chalk-based)

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
import { serverLogger as logger, logStart, logSuccess } from "@logger/server";
import type { BaseCommandOptions } from "@cli";

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
        logSuccess("Command completed");
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
import { serverLogger as logger, logStart, logSuccess } from "@logger/server";
import type { BaseCommandOptions } from "@cli";

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
  chalk,
  styles,
  statusMessage,
} from "@cli";

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
import { serverLogger as logger, logStart, logSuccess } from "@logger/server";
logger.info("Processing...");

// ❌ Bad
console.log("Processing...");
```

### 4. Use Logger with Styling for Formatted Output

Use the Winston logger for all output. Apply styling to logger messages for visual feedback:

```typescript
// ✅ Good
import { serverLogger as logger, logStart, logSuccess } from "@logger/server";
import { styles, statusMessage } from "@cli";

// Structured logging with styled messages
logger.info(styles.success("Route created"));
logger.error(styles.errorBold("Failed to import"));
logger.info(statusMessage("success", "Import completed"));

// Use logStart/logSuccess for command lifecycle
logStart("Starting route import");
logSuccess("Import completed successfully");

// For formatted output (progress bars, summaries), use logger with styled strings
logger.info(`${styles.checkmark} Route imported`);
logger.warn(`${styles.warningSymbol} Quota approaching`);

// ❌ Bad
console.log("Route created"); // Use logger instead
logger.info("Route created"); // No styling for visual feedback
```

### 5. Provide Helpful Descriptions

```typescript
// ✅ Good
.command('crawl <placeType>')
.description('Crawl Google Maps for a specific place type')
.option('--debug', 'Enable verbose debug logging', false)

// ❌ Bad
```

## CLI Mode and Banner Display

### CLI Mode

**All CLI applications must use CLI mode** for cleaner output. CLI mode removes timestamps and log level prefixes, showing only the message and emoji. This provides a much cleaner, more readable output for command-line tools.

**CLI Mode Output:**

```
🚀 Starting timetraveler server
     ENVIRONMENT - development
     APP ROOT - /Users/thushan/Code/timetraveler
```

**Default Mode Output (for comparison):**

```
2025-12-31 08:00:33 🚀 [INFO] Starting timetraveler server
2025-12-31 08:00:33 ℹ️ [INFO] ENVIRONMENT - development
```

**How to enable CLI mode:**

**Automatic CLI mode (already configured):**

- `packages/cli/source/command.ts` - Automatically enabled for commands using `createCommand()`
- `tools/app/tools.ts` - Enabled for prism tools entry point

**For new CLI apps (required):**

When creating a new CLI application, **you must enable CLI mode** at the entry point:

```typescript
// cli/index.ts or your CLI entry point
import { Command } from "commander";
import { setCLIMode } from "@logger/server";
import { createCommand } from "@cli";

// ⚠️ IMPORTANT: Enable CLI mode FIRST - before any logger calls
setCLIMode(true);

const program = new Command();
// ... rest of CLI setup
```

**Why this is required:**

- CLI mode provides clean, readable output without timestamps/log levels
- All CLI apps in the Prism ecosystem should use CLI mode for consistency
- Without CLI mode, output will include timestamps and log level prefixes which are unnecessary for CLI tools

**Important:**

- CLI mode must be enabled **before** any logger calls are made
- Enable it at the very top of your CLI entry point file, right after imports
- This ensures all logger output throughout your CLI uses the clean format

### Banner Display

All CLI commands automatically display a banner at startup. The banner is ASCII art with Material UI colors.

**How banners work:**

1. **Default banner**: Prism CLI uses the default PRISM banner (loaded from `banner.txt` in `packages/cli/source/`)
2. **Custom banners**: Child apps can override the banner using `setBannerConfig()`
3. **Automatic display**: Banners are shown automatically via:
   - `createCommand()` - Displays banner before command handler
   - `tools/app/tools.ts` - Displays banner via `preAction` hook for all commands
   - `registerRunCommand()` - Displays banner unless `skipBanner: true` is passed

**Setting a custom banner (for child apps):**

```typescript
// cli/banner.ts
import { setBannerConfig, colors } from "@cli";
import * as fs from "fs";
import * as path from "path";

export function initializeBanner(): void {
  // Load banner from cli.config.json
  const configPath = path.join(__dirname, "cli.config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  // Generate color gradient with specified color on second row
  // The gradient automatically cycles through Material UI colors
  const colorOrder: ColorName[] = [
    "red",
    "pink",
    "purple",
    "deepPurple",
    "indigo",
    "blue",
    "lightBlue",
    "cyan",
    "teal",
    "green",
    "lightGreen",
    "lime",
    "yellow",
    "amber",
    "orange",
    "deepOrange",
    "brown",
    "grey",
    "blueGrey",
  ];

  // Find second row color index, then calculate start (one before)
  const secondRowIndex = colorOrder.indexOf(config.color);
  const startIndex =
    secondRowIndex === 0 ? colorOrder.length - 1 : secondRowIndex - 1;

  const bannerColors = config.banner.map((_: string, i: number) => {
    const colorName = colorOrder[(startIndex + i) % colorOrder.length];
    return colors[colorName].default;
  });

  setBannerConfig({
    lines: config.banner,
    colorSequence: bannerColors,
  });
}

// cli/index.ts
import { initializeBanner } from "./banner";
initializeBanner(); // Call before registering commands
```

**Banner configuration files:**

- Banners are stored in `cli.config.json` files in the appropriate directory
- For Prism CLI: `packages/cli/source/cli.config.json`
- For child apps: `cli/cli.config.json` (or wherever the banner initialization code is)
- Format:
  ```json
  {
    "banner": [
      "   ___  ___  __________  ___",
      "  / _ \\/ _ \\/  _/ __/  |/  /",
      " / ___/ , _// /_\\ \\/ /|_/ /",
      "/_/  /_/|_/___/___/_/  /_/"
    ],
    "color": "purple"
  }
  ```
- `banner`: Array of strings, each representing a line of the ASCII art
- `color`: Color name for the **second row** from Material UI palette (e.g., "pink", "purple", "indigo")
- Colors are automatically generated as a gradient with the specified color on the second row
- The first row uses the color before the specified color in the Material UI order
- If config file is missing, falls back to showing app name in bold

### Best Practice: Always Enable CLI Mode

**All CLI applications should enable CLI mode** at their entry point. This ensures consistent, clean output across all CLI tools.

**Example CLI entry point:**

```typescript
// cli/index.ts
import { Command } from "commander";
import { setCLIMode } from "@logger/server";
import { createCommand } from "@cli";

// Enable CLI mode FIRST - before any logger calls
setCLIMode(true);

// ... rest of CLI setup
```

**Why CLI mode?**

- Removes noisy timestamps and log level prefixes
- Makes output more readable and focused
- Consistent experience across all CLI tools
- Better for interactive command-line usage

## Styling Utilities

The `@cli` package provides chalk-based styling utilities for consistent, colorful CLI output.

### Available Exports

```typescript
import { chalk, styles, statusMessage } from "@cli";
```

### Direct Chalk Usage

Use `chalk` directly for full control, then pass styled strings to logger:

```typescript
import { chalk } from "@cli";
import { serverLogger as logger } from "@logger/server";

logger.info(chalk.green("Success!"));
logger.error(chalk.red.bold("Error!"));
logger.info(chalk.cyan.underline("Info"));
```

### Pre-configured Styles

Use the `styles` object for common patterns with logger:

```typescript
import { styles } from "@cli";
import { serverLogger as logger } from "@logger/server";

// Status colors
logger.info(styles.success("Route created"));
logger.error(styles.error("Import failed"));
logger.warn(styles.warning("Quota approaching"));
logger.info(styles.info("Processing routes"));

// Text styles
logger.info(styles.bold("Important message"));
logger.debug(styles.dim("Secondary info"));

// Combined styles
logger.info(styles.successBold("Success!"));
logger.error(styles.errorBold("Critical error!"));

// Pre-styled symbols
logger.info(`${styles.checkmark} Route imported`);
logger.error(`${styles.cross} Route failed`);
logger.warn(`${styles.warningSymbol} Quota exceeded`);
logger.info(`${styles.infoSymbol} Processing...`);
logger.info(`${styles.arrow} Next step`);
```

### Status Messages

Use `statusMessage()` for formatted status output with logger:

```typescript
import { statusMessage } from "@cli";
import { serverLogger as logger } from "@logger/server";

logger.info(statusMessage("success", "Import completed"));
logger.error(statusMessage("error", "Import failed"));
logger.warn(statusMessage("warning", "Quota approaching"));
logger.info(statusMessage("info", "Processing routes"));
```

Output (when logger outputs to console):

```
✓ Import completed
✗ Import failed
⚠ Quota approaching
ℹ Processing routes
```

### Best Practices

1. **Use logger, not console**: All output should go through the Winston logger instance
2. **Apply styling to logger messages**: Style strings before passing to logger methods
3. **Use styles for consistency**: Prefer `styles.success()` over `chalk.green()` for common patterns
4. **Use statusMessage for status output**: Provides consistent symbol + color formatting
5. **Respect terminal capabilities**: Chalk automatically detects color support

### Example: Styled Command Output

```typescript
import { serverLogger as logger, logStart, logSuccess } from "@logger/server";
import { styles, statusMessage } from "@cli";

export async function runImportCommand() {
  logStart("Starting route import");
  logger.info(styles.infoBold("Processing routes..."));

  try {
    await processRoutes();
    logSuccess("Import completed");
    logger.info(styles.success(`Created ${count} routes`));
  } catch (error) {
    logger.error(statusMessage("error", "Import failed"));
    logger.error(styles.errorBold(error.message));
  }
}
```

// ❌ Bad
.command('crawl')
.description('Crawl')

````

### 5. Use Package-Style Imports

```typescript
// ✅ Good - Package-style imports (configured via tsconfig.json paths)
import { serverLogger as logger } from "@logger/server";
import { parseNumber } from "@cli";
import { database } from "@database";

// ❌ Bad - Relative imports (hard to maintain, break on refactoring)
import { serverLogger as logger } from "../../../packages/logger/source/server";

// ❌ Bad - Path aliases don't work in CLI context
import { serverLogger as logger } from "@/library/logger/server";
````

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

## Interactive Prompts

The CLI package includes interactive prompt utilities using `inquirer` for building user-friendly command-line interfaces.

### Available Prompt Functions

All prompt functions are exported from `@cli`:

- `promptMultiSelect<T>()` - Multi-select checkboxes
- `promptSelect<T>()` - Single-select lists
- `promptConfirm()` - Yes/no confirmations
- `promptInput()` - Text input
- `promptPassword()` - Password input (hidden)
- `promptNumber()` - Number input with validation
- `promptCustom<T>()` - Custom inquirer prompts
- `isPromptCancelled()` - Helper to detect Ctrl+C cancellation

### Usage Examples

#### Multi-Select (Checkbox)

```typescript
import { promptMultiSelect, type PromptChoice } from "@cli";

const choices: PromptChoice<number>[] = [
  { name: "Option 1", value: 1 },
  { name: "Option 2", value: 2 },
  { name: "Option 3", value: 3 },
];

const selected = await promptMultiSelect<number>(
  "Select options (use space to select, enter to confirm):",
  choices
);

// selected is number[] (e.g., [1, 3])
```

#### Single Select (List)

```typescript
import { promptSelect } from "@cli";

const choices: PromptChoice<string>[] = [
  { name: "Option A", value: "a" },
  { name: "Option B", value: "b" },
];

const selected = await promptSelect<string>("Choose an option:", choices);

// selected is string (e.g., "a")
```

#### Confirmation

```typescript
import { promptConfirm } from "@cli";

const confirmed = await promptConfirm("Proceed with operation?", true);
if (!confirmed) {
  logger.info("Operation cancelled");
  return;
}
```

#### Text Input

```typescript
import { promptInput } from "@cli";

const name = await promptInput("Enter your name:", {
  validate: (input) => {
    if (input.length < 3) {
      return "Name must be at least 3 characters";
    }
    return true;
  },
});
```

#### Number Input

```typescript
import { promptNumber } from "@cli";

const count = await promptNumber("Enter count:", {
  min: 1,
  max: 100,
  default: 10,
});
```

#### Handling Cancellation

```typescript
import { promptMultiSelect, isPromptCancelled } from "@cli";

try {
  const selected = await promptMultiSelect("Select items:", choices);
  // Process selection
} catch (error) {
  if (isPromptCancelled(error)) {
    logger.info("Operation cancelled by user");
    process.exitCode = 0;
    return;
  }
  throw error;
}
```

### Prompt Choice Interface

```typescript
interface PromptChoice<T = any> {
  name: string; // Display name
  value: T; // Value returned when selected
  short?: string; // Optional short name
}
```

### Best Practices

1. **Always handle cancellation**: Use `isPromptCancelled()` to gracefully handle Ctrl+C
2. **Provide clear messages**: Make prompt messages descriptive and actionable
3. **Validate input**: Use validation functions for text/number inputs
4. **Use appropriate prompt types**: Choose the right prompt type for the use case
5. **Type safety**: Use TypeScript generics for type-safe prompt results

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
import { database } from "@database";
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
import { logStart, logStats } from "@logger/server";

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

1. Use package-style imports (`@logger/server`, `cli`, `database`) - never relative imports for packages
2. Verify `tsconfig.json` has the correct path mappings configured
3. Check that the file is in the correct directory
4. Verify TypeScript compilation

### Logger Not Working

If logger output doesn't appear:

1. Check `LOG_LEVEL` environment variable
2. Verify logger is imported correctly
3. Ensure log level is appropriate (e.g., `debug` won't show in `info` mode)
