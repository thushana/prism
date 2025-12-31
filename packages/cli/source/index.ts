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

export { createCommand, withErrorHandling, displayBanner } from "./command";

// Run command for child apps
export type { RunCommandOptions } from "./run";
export { registerRunCommand, runRunCommand } from "./run";

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
} from "./utilities";

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

// Styling utilities
export type { ColorName, CLIConfig } from "./styling";
export { 
  chalk, 
  styles, 
  statusMessage, 
  colors, 
  colorNames, 
  materialColors, 
  generateBanner, 
  setBannerConfig,
  loadCLIConfig,
  generateColorGradient,
  initializeBannerFromConfig
} from "./styling";
