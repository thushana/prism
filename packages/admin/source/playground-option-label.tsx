"use client";

import type { ReactNode } from "react";
import {
  PrismTypography,
  type PartialPrismColorSpec,
  type PrismTypographyProps,
} from "@ui";

const INACTIVE_PLAYGROUND_OPTION: PartialPrismColorSpec = {
  semanticText: "muted",
};

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
