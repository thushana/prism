"use client";

/**
 * Style system: one component, variant props (.plain | .icon), optional .uppercase.
 * data-variant and data-uppercase allow stylesheet overrides (e.g. [data-variant="plain"]).
 */

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import type { ColorName } from "../styles/color-spectrum";

function colorToKebab(color: ColorName): string {
  return color.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/** Variant: .plain = no icon, .icon = with Lucide icon */
export type PrismButtonVariant = "plain" | "icon";

export interface PrismButtonProps {
  /** Palette color name (100 fill, 800 border/text) */
  color: ColorName;
  /** Button label, e.g. "Download" */
  label: string;
  /** .plain = no icon, .icon = with icon (requires icon prop) */
  variant?: PrismButtonVariant;
  /** Lucide icon component; used when variant is "icon" */
  icon?: LucideIcon;
  /** .uppercase — render label in uppercase */
  uppercase?: boolean;
  /** Render as span for display-only (e.g. in style guide) */
  asSpan?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const ICON_SIZE = 18;

const HOVER_TRANSITION =
  "transform 0.25s ease-in-out, background-color 0.25s ease-in-out, border-color 0.25s ease-in-out, color 0.25s ease-in-out";

/**
 * Prism button: 100 fill, 800 border/text, sans 800 weight. Variants: .plain (no icon), .icon (with Lucide icon). Option: .uppercase.
 */
export function PrismButton({
  color,
  label,
  variant = "icon",
  icon: IconComponent,
  uppercase = false,
  asSpan = false,
  className = "",
  ...rest
}: PrismButtonProps &
  (React.ComponentProps<"button"> | React.ComponentProps<"span">)) {
  const [hovered, setHovered] = React.useState(false);
  const kebab = colorToKebab(color);
  const bgVar = `var(--color-${kebab}-100)`;
  const fgVar = `var(--color-${kebab}-800)`;
  const bgHoverVar = `var(--color-${kebab}-800)`;
  const fgHoverVar = `var(--color-${kebab}-100)`;
  const showIcon = variant === "icon" && IconComponent;

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 9999,
    border: "3px solid",
    borderColor: hovered ? bgHoverVar : fgVar,
    backgroundColor: hovered ? bgHoverVar : bgVar,
    fontFamily: "var(--font-satoshi)",
    fontWeight: 800,
    fontSize: "0.875rem",
    color: hovered ? fgHoverVar : fgVar,
    cursor: asSpan ? "default" : "pointer",
    textTransform: uppercase ? "uppercase" : undefined,
    transition: HOVER_TRANSITION,
    transformOrigin: "center",
    transform: hovered ? "scale(1.2)" : "scale(1)",
  };

  const content = (
    <>
      {showIcon && IconComponent && (
        <span style={{ display: "inline-flex", color: "inherit" }}>
          <IconComponent size={ICON_SIZE} strokeWidth={2.5} />
        </span>
      )}
      <span>{label}</span>
    </>
  );

  const restSpan = rest as React.ComponentProps<"span">;
  const restButton = rest as React.ComponentProps<"button">;
  const onEnter = (e: React.PointerEvent<HTMLElement>) => {
    setHovered(true);
    if (asSpan) restSpan.onPointerEnter?.(e as React.PointerEvent<HTMLSpanElement>);
    else restButton.onPointerEnter?.(e as React.PointerEvent<HTMLButtonElement>);
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    setHovered(false);
    if (asSpan) restSpan.onPointerLeave?.(e as React.PointerEvent<HTMLSpanElement>);
    else restButton.onPointerLeave?.(e as React.PointerEvent<HTMLButtonElement>);
  };

  if (asSpan) {
    return (
      <span
        className={className}
        style={style}
        data-variant={variant}
        data-uppercase={uppercase || undefined}
        {...restSpan}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      data-variant={variant}
      data-uppercase={uppercase || undefined}
      {...restButton}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {content}
    </button>
  );
}
