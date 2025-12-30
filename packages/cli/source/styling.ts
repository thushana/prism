/**
 * CLI Styling Utilities
 *
 * Provides chalk-based styling for CLI output
 */

import chalk from "chalk";

// Re-export chalk for direct use
export { default as chalk } from "chalk";

// Common styled text helpers
export const styles = {
  // Status colors
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  
  // Text styles
  bold: chalk.bold,
  dim: chalk.dim,
  italic: chalk.italic,
  underline: chalk.underline,
  
  // Common combinations
  successBold: chalk.green.bold,
  errorBold: chalk.red.bold,
  warningBold: chalk.yellow.bold,
  infoBold: chalk.blue.bold,
  
  // Status symbols with colors
  checkmark: chalk.green("✓"),
  cross: chalk.red("✗"),
  warningSymbol: chalk.yellow("⚠"),
  infoSymbol: chalk.blue("ℹ"),
  arrow: chalk.cyan("→"),
};

/**
 * Format a status message with appropriate styling
 */
export function statusMessage(
  type: "success" | "error" | "warning" | "info",
  message: string
): string {
  const symbols = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
  };
  
  const colors = {
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue,
  };
  
  return `${colors[type](symbols[type])} ${message}`;
}
