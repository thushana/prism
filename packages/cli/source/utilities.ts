/**
 * CLI utility functions
 */

import * as path from "path";
import * as fs from "fs";
import stringWidth from "string-width";

/**
 * Resolve a file path relative to the current working directory
 */
export function resolvePath(filePath: string): string {
  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Validate that a required option is provided
 */
export function requireOption(
  value: any,
  optionName: string,
  commandName?: string
): void {
  if (value === undefined || value === null || value === "") {
    const prefix = commandName ? `Command "${commandName}":` : "Error:";
    throw new Error(`${prefix} --${optionName} is required`);
  }
}

/**
 * Parse a comma-separated string into an array
 */
export function parseList(value: string): string[] {
  const trimmedValue = value?.trim() ?? "";

  if (trimmedValue.length === 0) {
    return [];
  }

  // Support JSON array input for foolproof quoting (e.g., ["Route 1","Route, 2"])
  if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmedValue);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => item?.toString().trim())
          .filter((item): item is string => Boolean(item && item.length > 0));
      }
    } catch {
      // Fall through to CSV parsing on JSON parse failure
    }
  }

  const items: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < trimmedValue.length; i++) {
    const char = trimmedValue[i];

    if (char === '"' && trimmedValue[i - 1] !== "\\") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      items.push(current);
      current = "";
      continue;
    }

    if (char === "\\" && inQuotes && i + 1 < trimmedValue.length) {
      current += trimmedValue[i + 1];
      i++;
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    items.push(current);
  }

  return items.map((item) => item.trim()).filter((item) => item.length > 0);
}

/**
 * Parse a number with validation
 */
export function parseNumber(
  value: string,
  optionName: string,
  min?: number,
  max?: number
): number {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    throw new Error(`--${optionName} must be a valid number`);
  }

  if (min !== undefined && num < min) {
    throw new Error(`--${optionName} must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new Error(`--${optionName} must be at most ${max}`);
  }

  return num;
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDirectory(dirPath: string): void {
  const resolvedPath = resolvePath(dirPath);
  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
  }
}

/**
 * Get the directory of a file path
 */
export function getDirectory(filePath: string): string {
  return path.dirname(resolvePath(filePath));
}

/**
 * Create a progress reporter for long-running tasks
 */
export function createProgressReporter(total: number) {
  let current = 0;

  return {
    increment: (amount: number = 1) => {
      current += amount;
      return { current, total, percentage: (current / total) * 100 };
    },
    get current() {
      return current;
    },
    get total() {
      return total;
    },
    get percentage() {
      return (current / total) * 100;
    },
  };
}

/**
 * Text alignment utilities using visual width (handles emojis, ANSI codes, wide characters)
 */

/**
 * Get the visual width of a string (accounts for emojis, ANSI codes, wide characters)
 */
export function getVisualWidth(str: string): number {
  return stringWidth(str);
}

/**
 * Pad a string to a specific visual width
 * @param str String to pad
 * @param width Target visual width
 * @param padChar Character to use for padding (default: space)
 * @param align Alignment: 'left' | 'right' | 'center'
 */
export function padToWidth(
  str: string,
  width: number,
  align: "left" | "right" | "center" = "left",
  padChar: string = " "
): string {
  const visualWidth = getVisualWidth(str);
  const paddingNeeded = Math.max(0, width - visualWidth);

  if (paddingNeeded === 0) {
    return str;
  }

  switch (align) {
    case "right":
      return padChar.repeat(paddingNeeded) + str;
    case "center": {
      const leftPad = Math.floor(paddingNeeded / 2);
      const rightPad = paddingNeeded - leftPad;
      return padChar.repeat(leftPad) + str + padChar.repeat(rightPad);
    }
    case "left":
    default:
      return str + padChar.repeat(paddingNeeded);
  }
}

/**
 * Format a key-value pair with aligned values
 * @param items Array of { label, value } objects
 * @param options Formatting options
 */
export interface AlignedItem {
  label: string;
  value: string | number;
}

export interface AlignOptions {
  labelWidth?: number; // Auto-calculate if not provided
  separator?: string; // Default: ": "
  indent?: string; // Default: "   "
}

export function alignItems(
  items: AlignedItem[],
  options: AlignOptions = {}
): string[] {
  const { separator = ": ", indent = "   " } = options;

  // Calculate max label width if not provided
  let labelWidth = options.labelWidth;
  if (labelWidth === undefined) {
    labelWidth = Math.max(...items.map((item) => getVisualWidth(item.label)));
  }

  return items.map((item) => {
    const paddedLabel = padToWidth(item.label, labelWidth, "right");
    return `${indent}${paddedLabel}${separator}${item.value}`;
  });
}

/**
 * Format a summary with aligned labels and values
 * Useful for import summaries, statistics, etc.
 */
export function formatAlignedSummary(
  title: string,
  items: AlignedItem[],
  options: AlignOptions = {}
): string[] {
  const lines = alignItems(items, options);
  return [title, ...lines];
}
