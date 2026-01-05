/**
 * CLI Styling Utilities
 *
 * Provides chalk-based styling for CLI output using Material UI color palette
 */

import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Re-export chalk for direct use
export { chalk };

// Import Material UI colors from package (single source of truth)
// Only extract the shades we need for CLI (50, 600, 900)
const materialUIColors = require("material-ui-colors");
const materialColors = Object.keys(materialUIColors)
  .filter((name: string) => name !== "common")
  .reduce((acc: Record<string, { 50: string; 600: string; 900: string }>, colorName: string) => {
    const shades = materialUIColors[colorName];
    acc[colorName] = {
      50: shades[50],
      600: shades[600],
      900: shades[900],
    };
    return acc;
  }, {} as Record<string, { 50: string; 600: string; 900: string }>);

// Create color objects with light, default (600), and dark variants
type ColorName = keyof typeof materialColors;

interface ColorVariant {
  light: chalk.Chalk;
  default: chalk.Chalk;
  dark: chalk.Chalk;
}

const createColorVariant = (name: ColorName): ColorVariant => {
  const colors = materialColors[name];
  return {
    light: chalk.hex(colors[50]),
    default: chalk.hex(colors[600]),
    dark: chalk.hex(colors[900]),
  };
};

// Export ColorName type for use in banner configs
export type { ColorName };

// Create all color variants dynamically from materialColors
export const colors: Record<ColorName, ColorVariant> = Object.keys(materialColors).reduce(
  (acc, colorName) => {
    acc[colorName as ColorName] = createColorVariant(colorName as ColorName);
    return acc;
  },
  {} as Record<ColorName, ColorVariant>
);

// Common styled text helpers (using default 600 variants for status colors)
export const styles = {
  // Status colors (Material UI 600)
  success: colors.green.default,
  error: colors.red.default,
  warning: colors.amber.default,
  info: colors.blue.default,

  // Text styles
  bold: chalk.bold,
  dim: chalk.dim,
  italic: chalk.italic,
  underline: chalk.underline,

  // Common combinations
  successBold: colors.green.default.bold,
  errorBold: colors.red.default.bold,
  warningBold: colors.amber.default.bold,
  infoBold: colors.blue.default.bold,

  // Status symbols with colors (using emojis)
  checkmark: colors.green.default("✅"),
  cross: colors.red.default("❌"),
  warningSymbol: colors.amber.default("⚠️"),
  infoSymbol: colors.blue.default("ℹ️"),
  arrow: colors.cyan.default("➡️"),
};

/**
 * Format a status message with appropriate styling
 */
export function statusMessage(
  type: "success" | "error" | "warning" | "info",
  message: string
): string {
  const symbols = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  const colorMap = {
    success: colors.green.default,
    error: colors.red.default,
    warning: colors.amber.default,
    info: colors.blue.default,
  };

  // Use tab separator for consistent column alignment
  return `${colorMap[type](symbols[type])}\t${message}`;
}

// Export color names for reference (in Material UI order)
// Generated from materialColors keys to ensure consistency
export const colorNames: ColorName[] = Object.keys(materialColors) as ColorName[];

// Export materialColors for reference
export { materialColors };

/**
 * Banner configuration - can be overridden by apps
 */
let bannerConfig: {
  lines: string[];
  colorSequence: Array<chalk.Chalk>;
} | null = null;

/**
 * Set custom banner configuration (for apps to override default PRISM banner)
 */
export function setBannerConfig(config: {
  lines: string[];
  colorSequence: Array<chalk.Chalk>;
}): void {
  bannerConfig = config;
}

/**
 * Load banner configuration from cli.config.json
 */
export interface CLIConfig {
  banner: string[];
  color: string;
}

/**
 * Load banner configuration from cli.config.json
 * @param configDir Optional directory path to load config from. If not provided, uses the directory of this file.
 */
export function loadCLIConfig(
  configDir?: string
): { banner: string[]; color: string } | null {
  try {
    let configPath: string;
    if (configDir) {
      configPath = path.join(configDir, "cli.config.json");
    } else {
      // Use import.meta.url for ESM compatibility
      const currentFilePath = fileURLToPath(import.meta.url);
      const currentDir = path.dirname(currentFilePath);
      configPath = path.join(currentDir, "cli.config.json");
    }
    const content = fs.readFileSync(configPath, "utf-8");
    const config: CLIConfig = JSON.parse(content);
    return {
      banner: config.banner,
      color: config.color,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate color gradient with specified color on second row
 * Uses the Material UI color order to create a gradient
 * The specified color will be used for the second row (index 1)
 */
export function generateColorGradient(
  secondRowColorName: string,
  count: number
): Array<chalk.Chalk> {
  // Use colorNames array to ensure consistent order
  const colorOrder: ColorName[] = colorNames;

  // Find the index of the specified color (for second row)
  const secondRowIndex = colorOrder.indexOf(secondRowColorName as ColorName);
  if (secondRowIndex === -1) {
    // Invalid color, default to pink gradient (pink is second row, so start one before)
    const defaultColorIndex = colorOrder.indexOf("pink");
    // Handle wrap-around: if pink is at index 0 (shouldn't happen, but defensive),
    // or if pink not found, start from red (index 0)
    const defaultStartIndex =
      defaultColorIndex === -1
        ? 0
        : defaultColorIndex === 0
          ? colorOrder.length - 1
          : defaultColorIndex - 1;

    // Generate gradient with wrap-around (blueGrey loops back to red)
    return Array(count)
      .fill(0)
      .map((_, i) => {
        const colorIndex = (defaultStartIndex + i) % colorOrder.length;
        return colors[colorOrder[colorIndex]].default;
      });
  }

  // Calculate start index: second row uses the specified color, so first row is one before
  // Handle wrap-around: if secondRowIndex is 0 (red), first row should be last color (blueGrey)
  const startIndex =
    secondRowIndex === 0 ? colorOrder.length - 1 : secondRowIndex - 1;

  // Generate gradient by cycling through colors from start position
  const gradient: Array<chalk.Chalk> = [];
  for (let i = 0; i < count; i++) {
    const colorIndex = (startIndex + i) % colorOrder.length;
    const colorName = colorOrder[colorIndex];
    gradient.push(colors[colorName].default);
  }

  return gradient;
}

/**
 * Initialize banner from cli.config.json file
 * Utility function for child apps to easily set up their banner
 * @param configDir Directory containing cli.config.json (defaults to current file's directory)
 * @param fallbackAppName App name to show in bold if config not found
 * @param fallbackColor Default color to use if config not found
 */
export function initializeBannerFromConfig(
  configDir?: string,
  fallbackAppName?: string,
  fallbackColor: ColorName = "pink"
): void {
  const config = loadCLIConfig(configDir);

  // Fallback: show app name in bold if config not found
  if (!config || config.banner.length === 0) {
    const appName = fallbackAppName || "App";
    setBannerConfig({
      lines: [appName],
      colorSequence: [colors[fallbackColor].default.bold],
    });
    return;
  }

  // Generate color gradient with specified color on second row
  const bannerColors = generateColorGradient(
    config.color,
    config.banner.length
  );

  // If single line (fallback app name), use bold
  if (config.banner.length === 1) {
    setBannerConfig({
      lines: config.banner,
      colorSequence: [bannerColors[0].bold],
    });
    return;
  }

  setBannerConfig({
    lines: config.banner,
    colorSequence: bannerColors,
  });
}

/**
 * Generate ASCII art banner with Material UI colors
 * Uses custom banner if set via setBannerConfig(), otherwise uses default PRISM banner from cli.config.json
 */
export function generateBanner(): string {
  if (bannerConfig) {
    return bannerConfig.lines
      .map((line, index) =>
        bannerConfig!.colorSequence[index % bannerConfig!.colorSequence.length](
          line
        )
      )
      .join("\n");
  }

  // Default PRISM banner - load from cli.config.json
  const config = loadCLIConfig();

  // Fallback: show "PRISM" in bold if config not found
  if (!config || config.banner.length === 0) {
    return colors.pink.default.bold("PRISM");
  }

  // Generate color gradient with specified color on second row
  const bannerColors = generateColorGradient(
    config.color,
    config.banner.length
  );

  // If single line (fallback app name), use bold
  if (config.banner.length === 1) {
    return bannerColors[0].bold(config.banner[0]);
  }

  return config.banner
    .map((line, index) => bannerColors[index](line))
    .join("\n");
}
