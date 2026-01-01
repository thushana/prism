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

// Material UI color palette (50, 600, 900 variants)
// Colors in order from https://materialui.co/colors
const materialColors = {
  red: {
    50: "#FFEBEE",
    600: "#E53935",
    900: "#B71C1C",
  },
  pink: {
    50: "#FCE4EC",
    600: "#D81B60",
    900: "#880E4F",
  },
  purple: {
    50: "#F3E5F5",
    600: "#8E24AA",
    900: "#4A148C",
  },
  deepPurple: {
    50: "#EDE7F6",
    600: "#5E35B1",
    900: "#311B92",
  },
  indigo: {
    50: "#E8EAF6",
    600: "#3949AB",
    900: "#1A237E",
  },
  blue: {
    50: "#E3F2FD",
    600: "#1E88E5",
    900: "#0D47A1",
  },
  lightBlue: {
    50: "#E1F5FE",
    600: "#039BE5",
    900: "#01579B",
  },
  cyan: {
    50: "#E0F7FA",
    600: "#00ACC1",
    900: "#006064",
  },
  teal: {
    50: "#E0F2F1",
    600: "#00897B",
    900: "#004D40",
  },
  green: {
    50: "#E8F5E9",
    600: "#43A047",
    900: "#1B5E20",
  },
  lightGreen: {
    50: "#F1F8E9",
    600: "#7CB342",
    900: "#33691E",
  },
  lime: {
    50: "#F9FBE7",
    600: "#C0CA33",
    900: "#827717",
  },
  yellow: {
    50: "#FFFDE7",
    600: "#FDD835",
    900: "#F57F17",
  },
  amber: {
    50: "#FFF8E1",
    600: "#FFB300",
    900: "#FF6F00",
  },
  orange: {
    50: "#FFF3E0",
    600: "#FB8C00",
    900: "#E65100",
  },
  deepOrange: {
    50: "#FBE9E7",
    600: "#F4511E",
    900: "#BF360C",
  },
  brown: {
    50: "#EFEBE9",
    600: "#6D4C41",
    900: "#3E2723",
  },
  grey: {
    50: "#FAFAFA",
    600: "#757575",
    900: "#212121",
  },
  blueGrey: {
    50: "#ECEFF1",
    600: "#546E7A",
    900: "#263238",
  },
} as const;

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

// Create all color variants
export const colors: Record<ColorName, ColorVariant> = {
  red: createColorVariant("red"),
  pink: createColorVariant("pink"),
  purple: createColorVariant("purple"),
  deepPurple: createColorVariant("deepPurple"),
  indigo: createColorVariant("indigo"),
  blue: createColorVariant("blue"),
  lightBlue: createColorVariant("lightBlue"),
  cyan: createColorVariant("cyan"),
  teal: createColorVariant("teal"),
  green: createColorVariant("green"),
  lightGreen: createColorVariant("lightGreen"),
  lime: createColorVariant("lime"),
  yellow: createColorVariant("yellow"),
  amber: createColorVariant("amber"),
  orange: createColorVariant("orange"),
  deepOrange: createColorVariant("deepOrange"),
  brown: createColorVariant("brown"),
  grey: createColorVariant("grey"),
  blueGrey: createColorVariant("blueGrey"),
};

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
export const colorNames: ColorName[] = [
  "red",
  "pink",
  "purple",
  "deepPurple",
  "indigo",
  "blue",
  "lightBlue",
  "cyan",
  "teal",
  "green",
  "lightGreen",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deepOrange",
  "brown",
  "grey",
  "blueGrey",
] as const;

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
  const colorOrder: ColorName[] = [
    "red",
    "pink",
    "purple",
    "deepPurple",
    "indigo",
    "blue",
    "lightBlue",
    "cyan",
    "teal",
    "green",
    "lightGreen",
    "lime",
    "yellow",
    "amber",
    "orange",
    "deepOrange",
    "brown",
    "grey",
    "blueGrey",
  ];

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
