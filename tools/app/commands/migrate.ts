/**
 * Migrate Command
 *
 * Runs database migrations using Drizzle Kit.
 */

import { Command } from "commander";
import * as loggerModule from "../../../packages/logger/source/server.ts";
import { execSync } from "child_process";
import * as path from "path";

const { serverLogger: logger, logStart, logSuccess } = loggerModule;

import type { BaseCommandOptions } from "../../../packages/cli/source/command.ts";

export interface MigrateCommandOptions extends BaseCommandOptions {
  rollback?: boolean;
  generate?: boolean;
  push?: boolean;
}

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  logStart("Running database migrations...");

  try {
    // Get the path to the database package
    const dbConfigPath = path.resolve(
      process.cwd(),
      "../packages/database/drizzle.config.ts"
    );

    // Run drizzle-kit migrate
    const command = `npx drizzle-kit migrate --config=${dbConfigPath}`;
    logger.info(`Executing: ${command}`);

    execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    logSuccess("Migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed", { error });
    throw error;
  }
}

/**
 * Generate migrations
 */
async function generateMigrations(): Promise<void> {
  logStart("Generating migrations from schema changes...");

  try {
    const dbConfigPath = path.resolve(
      process.cwd(),
      "../packages/database/drizzle.config.ts"
    );

    const command = `npx drizzle-kit generate --config=${dbConfigPath}`;
    logger.info(`Executing: ${command}`);

    execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    logSuccess("Migrations generated successfully");
  } catch (error) {
    logger.error("Migration generation failed", { error });
    throw error;
  }
}

/**
 * Push schema directly to database (no migrations)
 */
async function pushSchema(): Promise<void> {
  logStart("Pushing schema directly to database...");

  try {
    const dbConfigPath = path.resolve(
      process.cwd(),
      "../packages/database/drizzle.config.ts"
    );

    const command = `npx drizzle-kit push --config=${dbConfigPath}`;
    logger.info(`Executing: ${command}`);

    execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    logSuccess("Schema pushed successfully");
  } catch (error) {
    logger.error("Schema push failed", { error });
    throw error;
  }
}

/**
 * Run the migrate command
 */
export async function runMigrateCommand(
  options: MigrateCommandOptions
): Promise<void> {
  logStart("Starting migrate command");

  // Enable debug logging if requested
  if (options.debug || options.verbose) {
    logger.level = "debug";
    logger.debug("Debug mode enabled");
  }

  // Handle different migration modes
  if (options.generate) {
    await generateMigrations();
  } else if (options.push) {
    await pushSchema();
  } else if (options.rollback) {
    logger.warn("Rollback functionality not yet implemented");
    logger.info(
      "To rollback, manually delete the last migration file and re-run migrations"
    );
    process.exitCode = 1;
  } else {
    await runMigrations();
  }

  logSuccess("Migrate command completed");
}

/**
 * Register the migrate command
 */
export function registerMigrateCommand(program: Command): void {
  program
    .command("migrate")
    .description("Run database migrations")
    .option("-r, --rollback", "Rollback the last migration", false)
    .option("-g, --generate", "Generate migrations from schema changes", false)
    .option("-p, --push", "Push schema directly (no migrations)", false)
    .option("-v, --verbose", "Enable verbose logging", false)
    .option("-d, --debug", "Enable debug logging", false)
    .action(async (options: MigrateCommandOptions) => {
      try {
        await runMigrateCommand(options);
      } catch (error) {
        logger.error("Migrate command failed", { error });
        process.exitCode = 1;
      }
    });
}
