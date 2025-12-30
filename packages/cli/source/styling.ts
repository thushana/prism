/**
 * CLI Styling Utilities
 *
 * Provides chalk-based styling for CLI output using Material UI color palette
 */

import chalk from "chalk";

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
 * Generate PRISM ASCII art banner with Material UI colors
 */
export function generateBanner(): string {
  const bannerLines = [
    "   ___  ___  __________  ___",
    "  / _ \\/ _ \\/  _/ __/  |/  /",
    " / ___/ , _// /_\\ \\/ /|_/ /",
    "/_/  /_/|_/___/___/_/  /_/",
  ];

  const bannerColors = [
    colors.pink.default,
    colors.purple.default,
    colors.deepPurple.default,
    colors.indigo.default,
  ];

  return bannerLines
    .map((line, index) => bannerColors[index](line))
    .join("\n");
}
