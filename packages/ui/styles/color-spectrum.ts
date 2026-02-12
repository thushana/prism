/**
 * Color spectrum in order (red → blueGrey)
 * Used for assigning colors to journeys, items, etc. in sequence
 */

// Import auto-generated color values and type
import { colorHexValues, type ColorName } from "./color-values";

export const colorSpectrum: ColorName[] = [
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

// Re-export ColorName type for convenience
export type { ColorName };

/**
 * Get color name for a given index (0-based)
 * Cycles through the spectrum if index exceeds available colors
 */
export function getColorForIndex(index: number): ColorName {
  return colorSpectrum[index % colorSpectrum.length];
}

/**
 * Get color class name for a given index and shade
 * @param index - 0-based index
 * @param shade - Color shade (default: 600)
 * @returns Tailwind class name like "background-red-600"
 */
export function getColorClassForIndex(
  index: number,
  shade: number | "a100" | "a200" | "a400" | "a700" = 600
): string {
  const colorName = getColorForIndex(index);
  const kebabColor = colorName.replace(/([A-Z])/g, "-$1").toLowerCase();
  return `background-${kebabColor}-${shade}`;
}

/**
 * Get color variable name for a given index and shade
 * @param index - 0-based index
 * @param shade - Color shade (default: 600)
 * @returns CSS variable name like "--color-red-600"
 */
export function getColorVariableForIndex(
  index: number,
  shade: number | "a100" | "a200" | "a400" | "a700" = 600
): string {
  const colorName = getColorForIndex(index);
  const kebabColor = colorName.replace(/([A-Z])/g, "-$1").toLowerCase();
  return `--color-${kebabColor}-${shade}`;
}

/**
 * Get computed hex color value for a given index and shade
 * Returns direct hex values - useful when CSS variables can't be used
 * (e.g., in charts, canvas, inline styles, or when you need computed values)
 *
 * @param index - 0-based index
 * @param shade - Color shade (default: 600)
 * @returns Hex color value like "#e53935"
 */
export function getColorValueForIndex(
  index: number,
  shade: number | "a100" | "a200" | "a400" | "a700" = 600
): string {
  const colorName = getColorForIndex(index);
  const colorShades = colorHexValues[colorName];
  if (!colorShades) {
    return "#e53935"; // Fallback to red-600
  }
  return colorShades[shade] || colorShades[600] || "#e53935";
}

/**
 * Get computed hex color value from CSS variable
 * Reads the actual computed value from the DOM (client-side only)
 * Falls back to direct hex lookup if CSS variable not available
 *
 * @param variable - CSS variable name like "--color-red-600"
 * @param fallbackIndex - Optional index to use for fallback color lookup
 * @param fallbackShade - Optional shade to use for fallback color lookup
 * @returns Hex color value like "#e53935"
 */
export function getComputedColorValue(
  variable: string,
  fallbackIndex?: number,
  fallbackShade: number | "a100" | "a200" | "a400" | "a700" = 600
): string {
  // Try to get computed value from CSS variable (client-side only)
  if (typeof window !== "undefined") {
    const computed = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
    if (computed) {
      return computed;
    }
  }

  // Fallback to direct hex lookup if index provided
  if (fallbackIndex !== undefined) {
    return getColorValueForIndex(fallbackIndex, fallbackShade);
  }

  // Final fallback
  return "#e53935";
}
