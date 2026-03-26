import * as React from "react";

import { cn } from "@utilities";

export const PRISM_TYPOGRAPHY_ROLES = [
  "display",
  "headline",
  "title",
  "body",
  "label",
  "overline",
] as const;

export const PRISM_TYPOGRAPHY_SIZES = ["large", "medium", "small"] as const;

export type PrismTypographyRole = (typeof PRISM_TYPOGRAPHY_ROLES)[number];
export type PrismTypographySize = (typeof PRISM_TYPOGRAPHY_SIZES)[number];

export type PrismTypographyFont = "sans" | "serif" | "mono";

/** Semantic text color → `text-*` utilities (shadcn-style tokens in globals.css). Extend when new text tokens exist. */
export type PrismTypographyColor =
  | "inherit"
  | "foreground"
  | "muted"
  | "primary"
  | "primaryForeground"
  | "secondaryForeground"
  | "destructive"
  | "accentForeground"
  | "cardForeground";

const TEXT_COLOR_CLASS: Record<PrismTypographyColor, string | undefined> = {
  inherit: undefined,
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  primaryForeground: "text-primary-foreground",
  secondaryForeground: "text-secondary-foreground",
  destructive: "text-destructive",
  accentForeground: "text-accent-foreground",
  cardForeground: "text-card-foreground",
};

type PrismTypographyElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span";

const DEFAULT_ELEMENT: Record<
  PrismTypographyRole,
  Record<PrismTypographySize, PrismTypographyElement>
> = {
  display: { large: "h1", medium: "h2", small: "h3" },
  headline: { large: "h1", medium: "h2", small: "h3" },
  title: { large: "h4", medium: "h5", small: "h6" },
  body: { large: "p", medium: "p", small: "p" },
  label: { large: "span", medium: "span", small: "span" },
  overline: { large: "span", medium: "span", small: "span" },
};

export type PrismTypographyProps = {
  role: PrismTypographyRole;
  /** Defaults to `"medium"`. */
  size?: PrismTypographySize;
  color?: PrismTypographyColor;
  font?: PrismTypographyFont;
  fontFamily?: string;
  /** Override rendered element (a11y / SEO). */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "style" | "color">;

/**
 * Prism type scale: `role` × `size` → `.typography-{role}-{size}` in globals.css.
 * Color uses shadcn semantic `text-*` utilities via `color` or `className`.
 */
export function PrismTypography({
  role,
  size: sizeProp,
  color = "inherit",
  font = "sans",
  fontFamily,
  as,
  className,
  style,
  children,
  ...rest
}: PrismTypographyProps): React.ReactElement {
  const size = sizeProp ?? "medium";
  const Comp = (as ?? DEFAULT_ELEMENT[role][size]) as React.ElementType;

  const fontClass =
    fontFamily !== undefined && fontFamily !== ""
      ? undefined
      : font === "serif"
        ? "font-serif"
        : font === "mono"
          ? "font-mono"
          : undefined;

  const mergedStyle =
    fontFamily !== undefined && fontFamily !== ""
      ? { ...style, fontFamily }
      : style;

  const typographyClass = `typography-${role}-${size}`;

  return React.createElement(
    Comp,
    {
      className: cn(
        typographyClass,
        fontClass,
        TEXT_COLOR_CLASS[color],
        className
      ),
      style: mergedStyle,
      ...rest,
    },
    children
  );
}
