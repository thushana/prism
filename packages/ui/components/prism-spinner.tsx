"use client";

import type { ComponentProps } from "react";

import { cn } from "@utilities";
import type { PrismSize } from "../source/prism-size";
import {
  prismColorSpecToHex,
  type PartialPrismColorSpec,
} from "../styles/prism-color";
import {
  PRISM_ICON_WEIGHT_NAME_TO_VALUE,
  type PrismIconWeightName,
} from "./prism-icon";

/** Smaller than {@link PrismIcon} at the same `PrismSize` — spinners are inline loading indicators. */
const PRISM_SPINNER_DIAMETER_PX: Record<PrismSize, number> = {
  small: 20,
  regular: 24,
  large: 28,
  huge: 32,
  gigantic: 40,
};

function strokeWidthForWeight(lineWeight: PrismIconWeightName | number): number {
  const v =
    typeof lineWeight === "number"
      ? Math.min(700, Math.max(100, Math.round(lineWeight)))
      : PRISM_ICON_WEIGHT_NAME_TO_VALUE[lineWeight];
  return 1.65 + ((v - 100) / 600) * 1.85;
}

export type PrismSpinnerProps = {
  color?: PartialPrismColorSpec;
  lineWeight?: PrismIconWeightName | number;
  size?: PrismSize | number;
  className?: string;
} & Pick<ComponentProps<"svg">, "aria-hidden" | "role" | "id">;

const VIEW_BOX = 24;
const CENTER = 12;
const R = 10;
const CIRC = 2 * Math.PI * R;

/**
 * Indeterminate arc spinner using SVG-native **`<animateTransform>`** — no CSS keyframes,
 * no Tailwind layer dependency, works unconditionally. Respects `prefers-reduced-motion`
 * via the `dur` / `repeatCount` values.
 */
export function PrismSpinner({
  color: colorSpec,
  lineWeight = "regular",
  size = "small",
  className,
  ...rest
}: PrismSpinnerProps) {
  const px =
    typeof size === "number" ? size : PRISM_SPINNER_DIAMETER_PX[size];
  const strokeW = strokeWidthForWeight(lineWeight);
  const hasSpec = colorSpec != null && Object.keys(colorSpec).length > 0;
  const stroke = hasSpec ? prismColorSpecToHex(colorSpec) : "currentColor";
  const dashLen = CIRC * 0.26;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
      className={cn(
        "shrink-0",
        !hasSpec && "text-muted-foreground",
        className
      )}
      {...rest}
    >
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${CENTER} ${CENTER}`}
          to={`360 ${CENTER} ${CENTER}`}
          dur="1s"
          repeatCount="indefinite"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${dashLen} ${CIRC - dashLen}`}
          opacity={hasSpec ? 1 : 0.35}
        />
      </g>
    </svg>
  );
}
