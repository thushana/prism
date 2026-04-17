/**
 * PrismButton presets: shortcut styles that bundle common prop combinations.
 *
 * **Naming:** `pill*` = default pill radius (full round); `box*` = rectangular / segmented rows.
 * Built-ins: `pillGradient`, `pillMonochrome`, `boxButtons`, `boxButtonsUnderlined`.
 *
 * **Icons:** Presets may set `icon` (Lucide). PrismButton renders it when `variant="icon"` and
 * `icon` is defined; with `iconOnly`, pass `icon` too so the control is not empty (label stays for a11y).
 *
 * - Apps can register more via registerPrismButtonPresets().
 * - Merge order: defaultPresets[preset] + appPresets[preset] + explicit props (explicit wins).
 */

import {
  AlignJustify,
  Circle,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import type { PrismButtonProps } from "../components/prism-button";

/** A preset is a partial set of PrismButton props (label is always from the caller). */
export type PrismButtonPresetProps = Partial<Omit<PrismButtonProps, "label">>;

const DEFAULT_PRISM_BUTTON_PRESETS: Record<string, PrismButtonPresetProps> = {
  // .icon .colorGradientSideways .sizeNormal
  pillGradient: {
    variant: "icon",
    icon: Sparkles,
    colorVariant: "gradient-sideways",
    size: "normal",
  },
  // .iconOnly .colorMonochrome .shapeGapNo .sizeNormal
  pillMonochrome: {
    variant: "icon",
    icon: Circle,
    iconOnly: true,
    colorVariant: "monochrome",
    shapeGapNo: true,
    size: "normal",
  },
  // .iconLeft .shapeRectangle .shapeLineNo .sizeNormal (no border)
  boxButtons: {
    variant: "icon",
    icon: LayoutGrid,
    iconPosition: "left",
    shapeRectangle: true,
    shapeLineNo: true,
    size: "normal",
  },
  // .iconLeft .shapeRectangle .shapeLineBottom .sizeNormal (underline only)
  boxButtonsUnderlined: {
    variant: "icon",
    icon: AlignJustify,
    iconPosition: "left",
    shapeRectangle: true,
    shapeLineBottom: true,
    size: "normal",
  },
};

/** App-specific presets; merged over defaults when resolving a preset. */
const appPresets: Record<string, PrismButtonPresetProps> = {};

/**
 * Register presets for this app. Merges with existing app presets; same key overwrites.
 * Call once at app startup (e.g. in root layout or a config module).
 */
export function registerPrismButtonPresets(
  presets: Record<string, PrismButtonPresetProps>
): void {
  for (const [key, value] of Object.entries(presets)) {
    appPresets[key] = { ...appPresets[key], ...value };
  }
}

const DEFAULT_COLOR: PrismButtonProps["color"] = "blueGrey";

/**
 * Resolve preset + explicit props. Order: defaultPresets[preset] + appPresets[preset] + explicit.
 * Returns merged PrismButtonProps (color/label guaranteed); passes through any extra keys (e.g. DOM props).
 */
export function resolvePrismButtonPreset<T extends Record<string, unknown>>(
  preset: string | undefined,
  explicit: (Partial<PrismButtonProps> & { label: string }) & T
): PrismButtonProps & T {
  if (!preset) {
    const { label, color, ...rest } = explicit;
    return {
      color: color ?? DEFAULT_COLOR,
      label,
      ...rest,
    } as PrismButtonProps & T;
  }
  const defaultP = DEFAULT_PRISM_BUTTON_PRESETS[preset] ?? {};
  const appP = appPresets[preset] ?? {};
  const merged = { ...defaultP, ...appP, ...explicit };
  const { label, color, ...rest } = merged;
  if (!label) {
    throw new Error(
      `PrismButton with preset="${preset}" requires a \`label\` prop.`
    );
  }
  return {
    color: color ?? DEFAULT_COLOR,
    label,
    ...rest,
  } as PrismButtonProps & T;
}

/** Get merged preset props only (for debugging or tooling). Does not include explicit props. */
export function getPrismButtonPreset(
  preset: string
): PrismButtonPresetProps | undefined {
  const defaultP = DEFAULT_PRISM_BUTTON_PRESETS[preset];
  const appP = appPresets[preset];
  if (!defaultP && !appP) return undefined;
  return { ...defaultP, ...appP };
}

/** List default preset names. */
export function getDefaultPrismButtonPresetNames(): string[] {
  return Object.keys(DEFAULT_PRISM_BUTTON_PRESETS);
}
