import { cn } from "@utilities";

/** Named size steps map to pixel `fontSize` / clamped `opsz` (20–48). */
export type PrismIconSizeName = "small" | "medium" | "large" | "extraLarge";

/** Named weight steps map to the variable font **wght** axis. */
export type PrismIconWeightName = "thin" | "medium" | "thick" | "heavy";

/** Filled variant: **FILL** axis `1` when `"on"`. */
export type PrismIconFillMode = "on" | "off";

export interface PrismIconProps {
  name: string;
  className?: string;
  /**
   * Named step (`"small"` … `"extraLarge"`) or raw pixel size for layout-driven
   * cases (still clamps **opsz** to 20–48 so ligatures resolve).
   */
  size?: PrismIconSizeName | number;
  /** Named step or raw **wght** axis value (100–700). */
  weight?: PrismIconWeightName | number;
  /** `"on"` / `"off"` or legacy boolean. */
  fill?: PrismIconFillMode | boolean;
}

const PRISM_ICON_SIZE_NAME_TO_PX: Record<PrismIconSizeName, number> = {
  small: 20,
  medium: 24,
  large: 28,
  /** Twice the default (`medium`) pixel height for emphasis icons. */
  extraLarge: 48,
};

const PRISM_ICON_WEIGHT_NAME_TO_VALUE: Record<PrismIconWeightName, number> = {
  thin: 300,
  medium: 400,
  thick: 600,
  heavy: 700,
};

function resolvePrismIconSizePx(size: PrismIconProps["size"]): number {
  if (size === undefined) return PRISM_ICON_SIZE_NAME_TO_PX.medium;
  if (typeof size === "number") return size;
  return PRISM_ICON_SIZE_NAME_TO_PX[size];
}

function resolvePrismIconWeightValue(
  weight: PrismIconProps["weight"]
): number {
  if (weight === undefined) return PRISM_ICON_WEIGHT_NAME_TO_VALUE.medium;
  if (typeof weight === "number") {
    return Math.min(700, Math.max(100, Math.round(weight)));
  }
  return PRISM_ICON_WEIGHT_NAME_TO_VALUE[weight];
}

function resolvePrismIconFill(fill: PrismIconProps["fill"]): boolean {
  if (fill === undefined) return false;
  if (typeof fill === "boolean") return fill;
  return fill === "on";
}

export function PrismIcon({
  name,
  className,
  size = "medium",
  weight = "medium",
  fill = "off",
}: PrismIconProps) {
  const sizePx = resolvePrismIconSizePx(size);
  const weightValue = resolvePrismIconWeightValue(weight);
  const filled = resolvePrismIconFill(fill);
  const opsz = Math.min(48, Math.max(20, sizePx));
  return (
    <span
      className={cn("material-symbols-rounded", className)}
      style={{
        fontSize: `${sizePx}px`,
        fontFeatureSettings: '"liga" 1',
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weightValue}, 'GRAD' 0, 'opsz' ${opsz}`,
      }}
    >
      {name}
    </span>
  );
}
