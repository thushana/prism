"use client";

import type { ReactNode } from "react";
import {
  PrismTypography,
  type PartialPrismColorSpec,
  type PrismTypographyProps,
} from "@ui";
import { cn } from "@utilities";

const INACTIVE_PLAYGROUND_OPTION: PartialPrismColorSpec = {
  semanticText: "muted",
};

/** Motion prop tails shown uppercase in column titles (e.g. `durationIn` → Duration IN). */
const PLAYGROUND_PROP_UPPER_TAILS = new Set(["in", "out"]);

/**
 * Playground column title from a component prop identifier (camelCase).
 * @example `durationIn` → `Duration IN`, `iconStyle` → `Icon Style`, `name` → `Name`
 */
export function playgroundPropDisplayLabel(propIdentifier: string): string {
  const parts = propIdentifier
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index > 0 && PLAYGROUND_PROP_UPPER_TAILS.has(lower)) {
        return lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Customize column legend: human title derived from the API prop name.
 * Uses default overline typography (not mono). `title` keeps the raw prop for hover/debug.
 */
export function PlaygroundPropLegend({
  prop,
  className,
}: {
  prop: string;
  className?: string;
}) {
  return (
    <PrismTypography
      role="overline"
      size="small"
      className={cn("block", className)}
      title={prop}
    >
      {playgroundPropDisplayLabel(prop)}
    </PrismTypography>
  );
}

/**
 * Mono label for playground Customize checkboxes / radios (PLAYGROUNDS: API-adjacent option text).
 * Shared styling: small type, bold weight. Prefer **`active`**; pass **`color`** only when not a simple on/off pair
 * (avoid `color={x ? undefined : muted}` — `undefined` is treated like an omitted prop and falls back to **`active`**).
 */
export type PrismPlaygroundOptionLabelProps = Omit<
  PrismTypographyProps,
  "role" | "size" | "font" | "fontWeight"
> & {
  /**
   * When `color` is omitted: `true` → inherit foreground; `false` → `semanticText: muted`.
   */
  active?: boolean;
};

export function PrismPlaygroundOptionLabel({
  children,
  active = true,
  color,
  className,
  ...rest
}: PrismPlaygroundOptionLabelProps) {
  const resolvedColor: PartialPrismColorSpec | undefined =
    color !== undefined
      ? color
      : active
        ? undefined
        : INACTIVE_PLAYGROUND_OPTION;

  return (
    <PrismTypography
      role="label"
      size="small"
      font="mono"
      fontWeight="bold"
      color={resolvedColor}
      className={className}
      {...rest}
    >
      {children}
    </PrismTypography>
  );
}

/** One Customize column: overline heading + stacked controls. */
export function PrismPlaygroundOptionColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <PrismTypography role="overline" size="small">
        {title}
      </PrismTypography>
      {children}
    </div>
  );
}
