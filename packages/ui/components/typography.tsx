import * as React from "react";

import { cn } from "@utilities";

export const TYPOGRAPHY_VARIANTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "subtitle1",
  "subtitle2",
  "body1",
  "body2",
  "button",
  "caption",
  "overline",
] as const;

export type TypographyVariant = (typeof TYPOGRAPHY_VARIANTS)[number];

export type TypographyFont = "sans" | "serif" | "mono";

type TypographyTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

const VARIANT_TAG: Record<TypographyVariant, TypographyTag> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "p",
  subtitle2: "p",
  body1: "p",
  body2: "p",
  button: "span",
  caption: "span",
  overline: "span",
};

export type TypographyProps = {
  variant: TypographyVariant;
  font?: TypographyFont;
  fontFamily?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "style">;

/**
 * MUI-style typography: maps variant to semantic HTML and `.typography-*` classes from globals.css.
 * Prefer this over applying `typography-*` or ad-hoc `text-*` / `font-*` on raw elements.
 */
export function Typography({
  variant,
  font = "sans",
  fontFamily,
  className,
  style,
  children,
  ...rest
}: TypographyProps): React.ReactElement {
  const Tag: TypographyTag = VARIANT_TAG[variant];
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

  return React.createElement(
    Tag,
    {
      className: cn(`typography-${variant}`, fontClass, className),
      style: mergedStyle,
      ...rest,
    },
    children
  );
}
