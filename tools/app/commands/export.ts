/**
 * Export Command
 *
 * Exports data from the database to CSV or JSON format.
 */

import { Command } from "commander";
import {
  requireOption,
  resolvePath,
  ensureDirectory,
  getDirectory,
} from "@cli";
import { generateBanner } from "../../../packages/cli/source/styling.ts";
import { database, users } from "@database";
import {
  serverLogger as logger,
  logStart,
  logSuccess,
  logStats,
} from "@logger/server";
import * as fs from "fs";
import type { BaseCommandOptions } from "@cli";

export interface ExportCommandOptions extends BaseCommandOptions {
  table: string;
  format?: string;
  output?: string;
}

/**
 * Convert data to CSV format
 */
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return "";
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape values containing commas or quotes
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        typeof value === "boolean" ||
        typeof value === "number"
      ) {
        return String(value);
      }
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Export users table
 */
async function exportUsers(format: string, output: string): Promise<void> {
  logStart("Exporting users table...");

  try {
    // Fetch all users
    const usersData = await database.select().from(users);
    logger.info(`Fetched ${usersData.length} users from database`);

    if (usersData.length === 0) {
      logger.warn("No users found in database");
      return;
    }

    // Convert to requested format
    let content: string;
    if (format === "csv") {
      content = toCSV(usersData);
    } else {
      // JSON format
      content = JSON.stringify(usersData, null, 2);
    }

    // Ensure output directory exists
    const outputPath = resolvePath(output);
    const outputDir = getDirectory(outputPath);
    ensureDirectory(outputDir);

    // Write to file
    fs.writeFileSync(outputPath, content, "utf-8");

    logSuccess(`Exported ${usersData.length} users to ${outputPath}`);
    logStats(`Format: ${format.toUpperCase()}, Size: ${content.length} bytes`);
  } catch (error) {
    logger.error("Failed to export users", { error });
    throw error;
  }
}

/**
 * Run the export command
 */
export async function runExportCommand(
  options: ExportCommandOptions
): Promise<void> {
  // Display banner
  const banner = generateBanner();
  banner.split("\n").forEach((line) => {
    if (line) logger.info(line);
  });
  logger.info("");

  logStart("Starting export command");

  // Validate required options
  requireOption(options.table, "table", "export");

  // Parse options
  const table = options.table;
  const format = (options.format || "json").toLowerCase();
  const defaultOutput = `./export-${table}.${format}`;
  const output = options.output || defaultOutput;

  // Validate format
  if (format !== "csv" && format !== "json") {
    logger.error(`Invalid format: ${format}`);
    logger.info("Supported formats: csv, json");
    process.exitCode = 1;
    return;
  }

  logStats(`Table: ${table}, Format: ${format}, Output: ${output}`);

  // Enable debug logging if requested
  if (options.debug || options.verbose) {
    logger.level = "debug";
    logger.debug("Debug mode enabled");
  }

  // Export the specified table
  switch (table) {
    case "users":
      await exportUsers(format, output);
      break;

    default:
      logger.error(`Unknown table: ${table}`);
      logger.info("Available tables: users");
      process.exitCode = 1;
      return;
  }

  logSuccess("Export command completed");
}

/**
 * Register the export command
 */
export function registerExportCommand(program: Command): void {
  program
    .command("export")
    .description("Export data from the database")
    .requiredOption("-t, --table <name>", "Table to export (e.g., users)")
    .option(
      "-f, --format <type>",
      "Export format: csv or json (default: json)",
      "json"
    )
    .option("-o, --output <path>", "Output file path")
    .option("-v, --verbose", "Enable verbose logging", false)
    .option("-d, --debug", "Enable debug logging", false)
    .action(async (options: ExportCommandOptions) => {
      try {
        await runExportCommand(options);
      } catch (error) {
        logger.error("Export command failed", { error });
        process.exitCode = 1;
      }
    });
}
