/**
 * CLI Package - Generic CLI utilities and patterns
 *
 * This package provides reusable utilities for building command-line interfaces
 * using Commander.js with TypeScript support and consistent patterns.
 */

// Command patterns and types
export type {
  BaseCommandOptions,
  CommandHandler,
  CommandRegistrar,
  CommandDefinition,
  CommandOption,
} from "./command";

export { createCommand, withErrorHandling } from "./command";

// Command registry
export type { CommandRegistry } from "./registry";
export { registerCommands, createRegistry } from "./registry";

// Utilities
export {
  resolvePath,
  fileExists,
  requireOption,
  parseList,
  parseNumber,
  ensureDirectory,
  getDirectory,
  createProgressReporter,
} from "./utils";

// Interactive prompts
export type { PromptChoice } from "./prompts";
export {
  promptMultiSelect,
  promptSelect,
  promptConfirm,
  promptInput,
  promptPassword,
  promptNumber,
  promptCustom,
  isPromptCancelled,
} from "./prompts";
