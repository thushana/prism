import { colorHexValues, type ColorName } from "../styles/color-values";
import {
  PrismColor,
  prismDefaultFamilyKebabToColorName,
  type PrismDefaultPaletteShadeKey,
  type PrismPaletteId,
  type PrismSwatchKey,
} from "../styles/prism-color";

/** Default (Material) palette: shade row order for the picker grid (includes accent keys). */
export const PRISM_COLOR_PALETTE_MATERIAL_SHADE_ORDER = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, "a100", "a200", "a400", "a700",
] as const;

export type MaterialShadeKey =
  (typeof PRISM_COLOR_PALETTE_MATERIAL_SHADE_ORDER)[number];

/** Tailwind palette: numeric shade rows only (50–950, no accents). Matches `tailwind-color-values.ts`. */
export const PRISM_COLOR_PALETTE_TAILWIND_SHADE_ORDER = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

export type TailwindNumericShade =
  (typeof PRISM_COLOR_PALETTE_TAILWIND_SHADE_ORDER)[number];

export type PrismColorPickerSwatch = {
  palette: PrismPaletteId;
  family: PrismSwatchKey;
  shade: MaterialShadeKey | TailwindNumericShade;
  hex: string;
};

/** Swatch used for labels + the resolved CSS token for that face (committed value, hover preview, or cell hex). */
export type PrismColorPickerColorFace = {
  swatch: PrismColorPickerSwatch | null;
  token: string;
};

export function materialColorDisplayName(colorName: ColorName): string {
  const withSpaces = colorName.replace(/([A-Z])/g, " $1").trim();
  return withSpaces
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Display title for a palette family key (Material uses ColorName formatting; Tailwind uses title-case segments). */
export function paletteFamilyDisplayTitle(
  palette: PrismPaletteId,
  familyKebab: PrismSwatchKey,
): string {
  if (palette === "tailwind") {
    return familyKebab.split("-").map(capitalizeWord).join(" ");
  }
  const cn = prismDefaultFamilyKebabToColorName(familyKebab);
  return cn ? materialColorDisplayName(cn) : capitalizeWord(familyKebab);
}

function normalizeHexadecimalColorString(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return withHash.toLowerCase();
}

/** Stable comparison for picker cells (#hex or CSS color strings such as oklch). */
export function normalizePickerColorToken(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function materialShadeLabelDisplay(
  shade: MaterialShadeKey | TailwindNumericShade,
): string {
  if (typeof shade === "number") return String(shade);
  return shade.replace("a", "A");
}

export function resolvePickerCellHex(
  palette: PrismPaletteId,
  family: PrismSwatchKey,
  shade: MaterialShadeKey | TailwindNumericShade,
): string | null {
  if (palette === "tailwind") {
    if (typeof shade !== "number") return null;
    return PrismColor.hex({ palette: "tailwind", family, shade });
  }
  return PrismColor.hex({
    palette: "default",
    family,
    shade: shade as PrismDefaultPaletteShadeKey,
  });
}

export function shadeOrderForPalette(
  palette: PrismPaletteId,
): readonly (MaterialShadeKey | TailwindNumericShade)[] {
  return palette === "tailwind"
    ? PRISM_COLOR_PALETTE_TAILWIND_SHADE_ORDER
    : PRISM_COLOR_PALETTE_MATERIAL_SHADE_ORDER;
}

/**
 * Finds an exact palette swatch whose resolved color string matches `hexadecimalColor`
 * (hex or CSS color syntax such as oklch).
 */
export function findPaletteSwatchForHex(
  palette: PrismPaletteId,
  hexadecimalColor: string,
): PrismColorPickerSwatch | null {
  const normalizedInput = normalizePickerColorToken(hexadecimalColor);
  if (!normalizedInput) return null;

  const families = PrismColor.Loop.families(palette);
  const shades = shadeOrderForPalette(palette);

  for (const shade of shades) {
    for (const family of families) {
      const hex = resolvePickerCellHex(palette, family, shade);
      if (!hex) continue;
      if (normalizePickerColorToken(hex) === normalizedInput) {
        return { palette, family, shade, hex };
      }
    }
  }
  return null;
}

function hexadecimalColorToRgbChannels(
  hexadecimalColor: string,
): { red: number; green: number; blue: number } | null {
  const normalized = normalizeHexadecimalColorString(hexadecimalColor);
  const compact = normalized.slice(1);
  if (compact.length === 3) {
    return {
      red: parseInt(compact[0]! + compact[0]!, 16),
      green: parseInt(compact[1]! + compact[1]!, 16),
      blue: parseInt(compact[2]! + compact[2]!, 16),
    };
  }
  if (compact.length === 6) {
    return {
      red: parseInt(compact.slice(0, 2), 16),
      green: parseInt(compact.slice(2, 4), 16),
      blue: parseInt(compact.slice(4, 6), 16),
    };
  }
  return null;
}

/**
 * Closest palette swatch in **default Material** space when the value is not exact (RGB distance on #hex cells).
 * Tailwind palette does not implement nearest-match (return null); use exact {@link findPaletteSwatchForHex}.
 */
export function findNearestPaletteSwatchForHex(
  palette: PrismPaletteId,
  hexadecimalColor: string,
): PrismColorPickerSwatch | null {
  const exact = findPaletteSwatchForHex(palette, hexadecimalColor);
  if (exact) return exact;
  if (palette !== "default") return null;

  const targetRgb = hexadecimalColorToRgbChannels(hexadecimalColor);
  if (!targetRgb) return null;

  let bestDistanceSquared = Number.POSITIVE_INFINITY;
  let bestSwatch: PrismColorPickerSwatch | undefined;

  const families = PrismColor.Loop.families("default");
  const shades = shadeOrderForPalette("default");

  for (const shade of shades) {
    for (const family of families) {
      const hex = resolvePickerCellHex("default", family, shade);
      if (!hex) continue;
      const rgb = hexadecimalColorToRgbChannels(hex);
      if (!rgb) continue;
      const distanceSquared =
        (targetRgb.red - rgb.red) ** 2 +
        (targetRgb.green - rgb.green) ** 2 +
        (targetRgb.blue - rgb.blue) ** 2;
      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestSwatch = { palette: "default", family, shade: shade as MaterialShadeKey, hex };
      }
    }
  }

  return bestSwatch ?? null;
}

/**
 * Luminance-aware label color on a tinted trigger. Uses the family's own shade 100/900 when the
 * swatch is a default-palette family (more on-brand than pure white/near-black).
 */
export function resolveTriggerForegroundHexadecimal(
  swatchForLabeling: PrismColorPickerSwatch | null,
  triggerBackgroundToken: string,
): string {
  const normalizedBackground =
    normalizeHexadecimalColorString(triggerBackgroundToken) || "#808080";
  const luminance = PrismColor.relativeLuminanceFromHex(normalizedBackground);

  if (swatchForLabeling && swatchForLabeling.palette === "default") {
    const cn = prismDefaultFamilyKebabToColorName(swatchForLabeling.family);
    if (cn) {
      const shades = colorHexValues[cn];
      if (luminance < 0.45) {
        return shades[100] ?? shades[50] ?? shades.a100 ?? "#ffffff";
      }
      return shades[900] ?? shades[800] ?? shades.a700 ?? "#171717";
    }
  }

  return luminance < 0.45 ? "#ffffff" : "#171717";
}
