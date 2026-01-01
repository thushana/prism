#!/usr/bin/env node

/**
 * CLI Tools Entry Point
 *
 * This is the main entry point for the CLI application.
 * It registers all available commands and handles execution.
 */

import { Command } from "commander";
// TODO: Fix tsx ESM resolution issue - revert to @logger/server when fixed
// Workaround: Use namespace import due to tsx bug with package.json exports
import * as LoggerModule from "../../packages/logger/source/server";
const logger = LoggerModule.serverLogger;
const setCLIMode = LoggerModule.setCLIMode;
import * as dotenv from "dotenv";
import { displayBanner } from "../../packages/cli/source/command";

// Enable CLI mode for cleaner output (no timestamps, no [INFO] prefixes)
// Only enable if setCLIMode is available (it's a peer dependency)
if (setCLIMode && typeof setCLIMode === "function") {
  setCLIMode(true);
}

// Load environment variables
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
dotenv.config({ opsOff: true } as Parameters<typeof dotenv.config>[0]);

// Create the main program
const program = new Command();

// Configure program metadata
program
  .name("prism")
  .description("Prism CLI tools for database management and development")
  .version("0.1.0");

// Automatically display banner before any command (except help)
program.hook("preAction", (thisCommand, actionCommand) => {
  // Don't show banner for help commands
  if (
    actionCommand.name() !== "" &&
    actionCommand.name() !== "help" &&
    !process.argv.includes("--help") &&
    !process.argv.includes("-h")
  ) {
    displayBanner();
  }
});

// Register all commands (lazy import to avoid loading database for generate command)
(async () => {
  try {
    // Always register commands that don't need database first
    const { registerGenerateCommand } = await import("./commands/generate.ts");
    registerGenerateCommand(program);
    
    try {
      const { registerStylingCommand } = await import("./commands/styling.ts");
      registerStylingCommand(program);
    } catch (stylingError) {
      // Silently fail if styling command can't load (e.g., @cli not available)
      if (process.argv[2] === "styling") {
        if (logger) {
          logger.error("Styling command is not available", { error: stylingError });
        } else {
          console.error("Styling command is not available:", stylingError);
        }
        process.exit(1);
      }
    }

    // Register run command (doesn't need database)
    try {
      const { registerRunCommand } = await import("./commands/run.ts");
      registerRunCommand(program);
    } catch (runError) {
      // Silently fail if run command can't load
      if (process.argv[2] === "run") {
        if (logger) {
          logger.error("Run command is not available", { error: runError });
        } else {
          console.error("Run command is not available:", runError);
        }
        process.exit(1);
      }
    }

    // Try to register database commands, but don't fail if they can't load
    const command = process.argv[2];
    if (
      command !== "generate" &&
      command !== "styling" &&
      command !== "run" &&
      command !== "--help" &&
      command !== "-h" &&
      !command?.startsWith("--")
    ) {
      // Only try to load database commands if a database command is being used
      try {
        const { registerSeedCommand } = await import("./commands/seed.ts");
        const { registerMigrateCommand } =
          await import("./commands/migrate.ts");
        const { registerExportCommand } = await import("./commands/export.ts");
        registerSeedCommand(program);
        registerMigrateCommand(program);
        registerExportCommand(program);
      } catch {
        // If database commands fail to load (e.g., DATABASE_URL not configured)
        if (
          command === "seed" ||
          command === "migrate" ||
          command === "export"
        ) {
          logger.error(
            "Database commands are not available. Ensure DATABASE_URL environment variable is set."
          );
          process.exit(1);
        }
        // Otherwise, silently continue - generate command will still work
      }
    } else {
      // For help or non-database commands, try to register all commands for help display
      // but catch errors gracefully
      try {
        const { registerSeedCommand } = await import("./commands/seed.ts");
        const { registerMigrateCommand } =
          await import("./commands/migrate.ts");
        const { registerExportCommand } = await import("./commands/export.ts");
        registerSeedCommand(program);
        registerMigrateCommand(program);
        registerExportCommand(program);
      } catch {
        // Silently fail - help will just show non-database commands
      }
    }

    // Parse command line arguments after all commands are registered
    program.parse(process.argv);

    // Show help if no command provided
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (error) {
    if (logger) {
      logger.error("Failed to register commands", { error });
    } else {
      console.error("Failed to register commands:", error);
    }
    process.exit(1);
  }
})();
