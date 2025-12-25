#!/usr/bin/env node

/**
 * CLI Tools Entry Point
 *
 * This is the main entry point for the CLI application.
 * It registers all available commands and handles execution.
 */

import { Command } from "commander";
import * as loggerModule from "../../packages/logger/source/server.ts";
import * as dotenv from "dotenv";

const { serverLogger: logger } = loggerModule;

// Load environment variables
dotenv.config();

// Create the main program
const program = new Command();

// Configure program metadata
program
  .name("prism")
  .description("Prism CLI tools for database management and development")
  .version("0.1.0");

// Register all commands (lazy import to avoid loading database for generate command)
(async () => {
  try {
    // Always register generate first (doesn't need database)
    const { registerGenerateCommand } = await import("./commands/generate.ts");
    registerGenerateCommand(program);

    // Try to register database commands, but don't fail if they can't load
    const command = process.argv[2];
    if (
      command !== "generate" &&
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
        // If database commands fail to load (e.g., better-sqlite3 not compiled)
        if (
          command === "seed" ||
          command === "migrate" ||
          command === "export"
        ) {
          logger.error(
            "Database commands are not available. Run 'npm rebuild better-sqlite3' to fix."
          );
          process.exit(1);
        }
        // Otherwise, silently continue - generate command will still work
      }
    } else {
      // For help or generate, try to register all commands for help display
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
        // Silently fail - help will just show generate command
      }
    }

    // Parse command line arguments after all commands are registered
    program.parse(process.argv);

    // Show help if no command provided
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (error) {
    logger.error("Failed to register commands", { error });
    process.exit(1);
  }
})();
