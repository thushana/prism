import { cn } from "@utilities";
import type { PrismSize } from "../source/prism-size";
import {
  prismColorSpecToIconGlyphPaint,
  type PartialPrismColorSpec,
} from "../styles/prism-color";

/** Named size steps map to pixel `fontSize` / clamped `opsz` (20–48); aligns with `PrismButton` `size`. */
export type PrismIconSizeName = PrismSize;

/**
 * Named weight steps map to the Material Symbols **wght** axis (100–700).
 * These five names are a curated ladder; pass a number for any other axis value.
 */
export type PrismIconWeightName =
  | "light"
  | "thin"
  | "regular"
  | "bold"
  | "heavy";

/** Filled variant: **FILL** axis `1` when `"on"`. */
export type PrismIconFillMode = "on" | "off";

/** Single source of truth for {@link PrismIcon} when optional props are omitted. */
export const PRISM_ICON_DEFAULTS: {
  size: PrismIconSizeName;
  weight: PrismIconWeightName;
  fill: PrismIconFillMode;
} = {
  size: "medium",
  weight: "regular",
  fill: "off",
};

export interface PrismIconProps {
  name: string;
  className?: string;
  /**
   * Named step or raw pixel size for layout-driven cases (still clamps **opsz** to 20–48).
   * @default {@link PRISM_ICON_DEFAULTS.size} (`"medium"`)
   */
  size?: PrismIconSizeName | number;
  /**
   * Named step (`light` … `heavy` → wght 100 / 200 / 400 / 600 / 700) or any **wght** integer **100–700**
   * (use a number for steps between named values, e.g. **300**).
   * @default {@link PRISM_ICON_DEFAULTS.weight} (`"regular"`)
   */
  weight?: PrismIconWeightName | number;
  /** @default {@link PRISM_ICON_DEFAULTS.fill} (`"off"`) */
  fill?: PrismIconFillMode;
  /**
   * Same shape as other Prism `color` props; resolved by `prismColorSpecToIconGlyphPaint`:
   * solid `color`, or **`gradient.swatches`** → resolved `linear-gradient` + background-clip text
   * (light ramp; glyphs cannot use `color: linear-gradient(...)`).
   *
   * When omitted, no glyph `color` / gradient is set inline — the symbol inherits **`color`**
   * from CSS (typically the parent text color, e.g. `text-foreground`), not a fixed black hex.
   */
  color?: PartialPrismColorSpec;
}

const PRISM_ICON_SIZE_NAME_TO_PX: Record<PrismIconSizeName, number> = {
  small: 20,
  medium: 24,
  large: 28,
  huge: 48,
  gigantic: 64,
};

const PRISM_ICON_WEIGHT_NAME_TO_VALUE: Record<PrismIconWeightName, number> = {
  light: 100,
  thin: 200,
  regular: 400,
  bold: 600,
  heavy: 700,
};

function resolvePrismIconSizePx(size: PrismIconProps["size"]): number {
  if (size === undefined)
    return PRISM_ICON_SIZE_NAME_TO_PX[PRISM_ICON_DEFAULTS.size];
  if (typeof size === "number") return size;
  return PRISM_ICON_SIZE_NAME_TO_PX[size];
}

function resolvePrismIconWeightValue(
  weight: PrismIconProps["weight"]
): number {
  if (weight === undefined)
    return PRISM_ICON_WEIGHT_NAME_TO_VALUE[PRISM_ICON_DEFAULTS.weight];
  if (typeof weight === "number") {
    return Math.min(700, Math.max(100, Math.round(weight)));
  }
  return PRISM_ICON_WEIGHT_NAME_TO_VALUE[weight];
}

function resolvePrismIconFill(fill: PrismIconProps["fill"]): boolean {
  if (fill === undefined) return PRISM_ICON_DEFAULTS.fill === "on";
  return fill === "on";
}

export function PrismIcon({
  name,
  className,
  size = PRISM_ICON_DEFAULTS.size,
  weight = PRISM_ICON_DEFAULTS.weight,
  fill = PRISM_ICON_DEFAULTS.fill,
  color: colorSpec,
}: PrismIconProps) {
  const sizePx = resolvePrismIconSizePx(size);
  const weightValue = resolvePrismIconWeightValue(weight);
  const filled = resolvePrismIconFill(fill);
  const opsz = Math.min(48, Math.max(20, sizePx));
  const glyphPaint =
    colorSpec !== undefined &&
    colorSpec !== null &&
    Object.keys(colorSpec).length > 0
      ? prismColorSpecToIconGlyphPaint(colorSpec)
      : undefined;

  const gradientClipStyle =
    glyphPaint && "gradient" in glyphPaint
      ? {
          display: "inline-block" as const,
          backgroundImage: glyphPaint.gradient,
          backgroundRepeat: "no-repeat" as const,
          backgroundSize: "100% 100%" as const,
          color: "transparent",
          WebkitBackgroundClip: "text" as const,
          backgroundClip: "text" as const,
          WebkitTextFillColor: "transparent" as const,
        }
      : {};

  const solidStyle =
    glyphPaint && "solid" in glyphPaint ? { color: glyphPaint.solid } : {};

  return (
    <span
      className={cn("material-symbols-rounded", className)}
      style={{
        fontSize: `${sizePx}px`,
        fontFeatureSettings: '"liga" 1',
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weightValue}, 'GRAD' 0, 'opsz' ${opsz}`,
        ...solidStyle,
        ...gradientClipStyle,
      }}
    >
      {name}
    </span>
  );
}
