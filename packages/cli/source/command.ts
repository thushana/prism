/**
 * Base command patterns and interfaces for CLI applications
 */

import type { Command } from "commander";

// Import logger (peer dependency)
// TODO: Fix tsx ESM resolution issue - revert to @logger/server when fixed
// Workaround: Use relative import due to tsx bug with package.json exports
import * as LoggerModule from "../../logger/source/server";
const serverLogger = LoggerModule.serverLogger;
const setCLIMode = LoggerModule.setCLIMode;
import { generateBanner } from "./styling";

// Use serverLogger for error logging
const logger = serverLogger;

// Enable CLI mode for cleaner output (no timestamps, no [INFO] prefixes)
// Only enable if setCLIMode is available (it's a peer dependency)
if (setCLIMode && typeof setCLIMode === "function") {
  setCLIMode(true);
}

/**
 * Base command options that all commands should support
 */
export interface BaseCommandOptions {
  verbose?: boolean;
  debug?: boolean;
}

/**
 * Command handler function type
 */
export type CommandHandler<T extends BaseCommandOptions = BaseCommandOptions> =
  (options: T) => Promise<void> | void;

/**
 * Command registration function type
 */
export type CommandRegistrar = (program: Command) => void;

/**
 * Command definition for type-safe command registration
 */
export interface CommandDefinition<
  T extends BaseCommandOptions = BaseCommandOptions,
> {
  name: string;
  description: string;
  handler: CommandHandler<T>;
  options?: CommandOption[];
  aliases?: string[];
}

/**
 * Command option definition
 */
export interface CommandOption {
  flags: string;
  description: string;
  defaultValue?: any;
}

/**
 * Create a command registration function from a definition
 */
export function createCommand<T extends BaseCommandOptions>(
  definition: CommandDefinition<T>
): CommandRegistrar {
  return (program: Command) => {
    const command = program
      .command(definition.name)
      .description(definition.description);

    // Add aliases if provided
    if (definition.aliases && definition.aliases.length > 0) {
      command.aliases(definition.aliases);
    }

    // Add options if provided
    if (definition.options) {
      for (const option of definition.options) {
        command.option(option.flags, option.description, option.defaultValue);
      }
    }

    // Add action handler with automatic banner display
    command.action(async (options: T) => {
      try {
        // Display banner automatically for all commands
        const banner = generateBanner();
        const log = (logger as unknown as typeof console) ?? console;
        banner.split("\n").forEach((line) => {
          if (line) log.info(line);
        });
        log.info("");

        await definition.handler(options);
      } catch (error) {
        logger.error("Command failed", { error });
        process.exitCode = 1;
      }
    });
  };
}

/**
 * Wrap a command handler with error handling
 */
export function withErrorHandling<T extends BaseCommandOptions>(
  handler: CommandHandler<T>
): CommandHandler<T> {
  return async (options: T) => {
    try {
      await handler(options);
    } catch (error) {
      logger.error("Command failed", { error });
      process.exitCode = 1;
      throw error;
    }
  };
}

/**
 * Display the Prism banner
 * Can be used by commands that register directly (not using createCommand)
 */
export function displayBanner(): void {
  const banner = generateBanner();
  const log = (logger as unknown as typeof console) ?? console;
  banner.split("\n").forEach((line) => {
    if (line) log.info(line);
  });
  log.info("");
}
