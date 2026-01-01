/**
 * CLI utility functions
 */

import * as path from "path";
import * as fs from "fs";

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
