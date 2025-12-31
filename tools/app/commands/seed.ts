/**
 * Seed Command
 *
 * Seeds the database with sample data for development and testing.
 */

import { Command } from "commander";
import { parseNumber } from "../../../packages/cli/source/utilities";
import { database, users } from "@database";
import {
  serverLogger as logger,
  logStart,
  logSuccess,
  logStats,
} from "@logger/server";
import type { BaseCommandOptions } from "../../../packages/cli/source/command";

export interface SeedCommandOptions extends BaseCommandOptions {
  count?: string;
  table?: string;
}

/**
 * Generate sample user data
 */
function generateUsers(count: number) {
  const sampleUsers = [];

  for (let i = 1; i <= count; i++) {
    sampleUsers.push({
      name: `User ${i}`,
      email: `user${i}@example.com`,
    });
  }

  return sampleUsers;
}

/**
 * Seed users table
 */
async function seedUsers(count: number): Promise<void> {
  logStart(`Seeding ${count} users...`);

  const usersData = generateUsers(count);

  try {
    // Insert users in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < usersData.length; i += batchSize) {
      const batch = usersData.slice(i, i + batchSize);
      await database.insert(users).values(batch);
      inserted += batch.length;
      logger.info(`Inserted ${inserted}/${count} users`);
    }

    logSuccess(`Successfully seeded ${count} users`);
  } catch (error) {
    logger.error("Failed to seed users", { error });
    throw error;
  }
}

/**
 * Run the seed command
 */
export async function runSeedCommand(
  options: SeedCommandOptions
): Promise<void> {

  // Parse options
  const count = options.count ? parseNumber(options.count, "count", 1) : 10;
  const table = options.table || "users";

  logStart(`Starting seed command`);
  logStats(`Table: ${table}, Count: ${count}`);

  // Enable debug logging if requested
  if (options.debug || options.verbose) {
    logger.level = "debug";
    logger.debug("Debug mode enabled");
  }

  // Seed the specified table
  switch (table) {
    case "users":
      await seedUsers(count);
      break;

    default:
      logger.error(`Unknown table: ${table}`);
      logger.info("Available tables: users");
      process.exitCode = 1;
      return;
  }

  logSuccess("Seed command completed");
}

/**
 * Register the seed command
 */
export function registerSeedCommand(program: Command): void {
  program
    .command("seed")
    .description("Seed the database with sample data")
    .option("-c, --count <number>", "Number of records to seed", "10")
    .option("-t, --table <name>", "Table to seed (users)", "users")
    .option("-v, --verbose", "Enable verbose logging", false)
    .option("-d, --debug", "Enable debug logging", false)
    .action(async (options: SeedCommandOptions) => {
      try {
        await runSeedCommand(options);
      } catch (error) {
        logger.error("Seed command failed", { error });
        process.exitCode = 1;
      }
    });
}
