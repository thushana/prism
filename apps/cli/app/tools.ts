#!/usr/bin/env node

/**
 * CLI Tools Entry Point
 *
 * This is the main entry point for the CLI application.
 * It registers all available commands and handles execution.
 */

import { Command } from "commander";
import { registerSeedCommand } from "./commands/seed.ts";
import { registerMigrateCommand } from "./commands/migrate.ts";
import { registerExportCommand } from "./commands/export.ts";
import * as loggerModule from "../../../packages/logger/source/server.ts";
import * as dotenv from "dotenv";

const { serverLogger: logger } = loggerModule;

// Load environment variables
dotenv.config();

// Create the main program
const program = new Command();

// Configure program metadata
program
  .name("tools")
  .description("CLI tools for database management and development")
  .version("0.1.0");

// Register all commands
try {
  registerSeedCommand(program);
  registerMigrateCommand(program);
  registerExportCommand(program);
} catch (error) {
  logger.error("Failed to register commands", { error });
  process.exit(1);
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
