/**
 * PrismButton presets: shortcut styles that bundle common prop combinations.
 *
 * - Default presets live here (e.g. gradientIcon, monochromPilllBar, boxButtons).
 * - Apps can register their own via registerPrismButtonPresets() to extend or override.
 * - Merge order: defaultPresets[preset] + appPresets[preset] + explicit props (explicit wins).
 */

import type { PrismButtonProps } from "../components/prism-button";

/** A preset is a partial set of PrismButton props (label is always from the caller). */
export type PrismButtonPresetProps = Partial<Omit<PrismButtonProps, "label">>;

const DEFAULT_PRISM_BUTTON_PRESETS: Record<string, PrismButtonPresetProps> = {
  // .icon .colorGradientSideways .sizeNormal
  gradientIcon: {
    variant: "icon",
    colorVariant: "gradient-sideways",
    size: "normal",
  },
  // .iconOnly .colorMonochrome .shapeGapNo .sizeLarge
  monochromPilllBar: {
    variant: "icon",
    iconOnly: true,
    colorVariant: "monochrome",
    shapeGapNo: true,
    size: "large",
  },
  // .iconLeft .shapeRectangle .shapeLineNo .sizeNormal (no border)
  boxButtons: {
    variant: "icon",
    iconPosition: "left",
    shapeRectangle: true,
    shapeLineNo: true,
    size: "normal",
  },
  // .iconLeft .shapeRectangle .shapeLineBottom .sizeNormal (underline only)
  boxButtonsUnderlined: {
    variant: "icon",
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
