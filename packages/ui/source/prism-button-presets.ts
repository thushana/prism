/**
 * PrismButton presets: shortcut styles that bundle common prop combinations.
 *
 * **Naming:** `pill*` = default pill radius; `box*` = rectangular / segmented rows.
 * Built-ins: `pillGradient`, `pillMonochrome`, `boxButtons`, `boxButtonsUnderlined`.
 *
 * Merge order: defaultPresets[preset] + appPresets[preset] + explicit props (explicit wins).
 */

import { AlignJustify, Circle, LayoutGrid, Sparkles } from "lucide-react";
import type { PrismButtonProps } from "../components/prism-button";

/** A preset is a partial set of PrismButton props (label is always from the caller). */
export type PrismButtonPresetProps = Partial<Omit<PrismButtonProps, "label">>;

const DEFAULT_PRISM_BUTTON_PRESETS: Record<string, PrismButtonPresetProps> = {
  pillGradient: {
    variant: "icon",
    icon: Sparkles,
    paint: "gradientSideways",
    size: "medium",
  },
  pillMonochrome: {
    variant: "icon",
    icon: Circle,
    iconOnly: true,
    paint: "monochrome",
    gap: "none",
    size: "medium",
  },
  boxButtons: {
    variant: "icon",
    icon: LayoutGrid,
    iconPosition: "left",
    shape: "rectangle",
    line: "none",
    size: "medium",
  },
  boxButtonsUnderlined: {
    variant: "icon",
    icon: AlignJustify,
    iconPosition: "left",
    shape: "rectangle",
    line: "bottom",
    size: "medium",
  },
};

const appPresets: Record<string, PrismButtonPresetProps> = {};

export function registerPrismButtonPresets(
  presets: Record<string, PrismButtonPresetProps>
): void {
  for (const [key, value] of Object.entries(presets)) {
    appPresets[key] = { ...appPresets[key], ...value };
  }
}

const DEFAULT_COLOR: PrismButtonProps["color"] = "blueGrey";

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

export function getPrismButtonPreset(
  preset: string
): PrismButtonPresetProps | undefined {
  const defaultP = DEFAULT_PRISM_BUTTON_PRESETS[preset];
  const appP = appPresets[preset];
  if (!defaultP && !appP) return undefined;
  return { ...defaultP, ...appP };
}

export function getDefaultPrismButtonPresetNames(): string[] {
  return Object.keys(DEFAULT_PRISM_BUTTON_PRESETS);
}
