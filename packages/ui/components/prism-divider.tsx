"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@utilities";

import {
  PrismIcon,
  PRISM_ICON_DEFAULTS,
  type PrismIconProps,
} from "./prism-icon";
import { PrismTypography } from "./prism-typography";

const prismDividerRootVariants = cva(
  "relative flex w-full min-w-0 shrink-0 items-center justify-center overflow-visible",
  {
    variants: {
      spacing: {
        none: "py-0",
        compact: "py-6",
        comfortable: "py-10",
      },
    },
    defaultVariants: {
      spacing: "comfortable",
    },
  }
);

const prismDividerBarVariants = cva(
  "pointer-events-none absolute left-0 right-0 top-1/2 z-[1] w-full min-w-0 -translate-y-1/2",
  {
    variants: {
      lineWeight: {
        hairline: "h-px",
        thin: "h-0.5",
        medium: "h-1",
        thick: "h-1.5",
      },
      tone: {
        default: "bg-foreground/18",
        muted: "bg-muted-foreground/45",
        primary: "bg-primary",
      },
      roundedBar: {
        true: "rounded-full",
        false: "rounded-none",
      },
    },
    defaultVariants: {
      lineWeight: "thin",
      tone: "default",
      roundedBar: false,
    },
  }
);

export type PrismDividerLineWeight = NonNullable<
  VariantProps<typeof prismDividerBarVariants>["lineWeight"]
>;
export type PrismDividerTone = NonNullable<
  VariantProps<typeof prismDividerBarVariants>["tone"]
>;
export type PrismDividerSpacing = NonNullable<
  VariantProps<typeof prismDividerRootVariants>["spacing"]
>;

export type PrismDividerProps = Omit<
  React.ComponentProps<"div">,
  "children"
> & {
  spacing?: PrismDividerSpacing;
  lineWeight?: PrismDividerLineWeight;
  tone?: PrismDividerTone;
  /** When true, the rule uses a fixed pill radius (`rounded-full`). */
  roundedBar?: boolean;
  /** Extra classes on the bar (e.g. gradient utilities); use with `lineStyle` for full control. */
  lineClassName?: string;
  lineStyle?: React.CSSProperties;
  /** Opaque surface behind the emblem so the rule appears cut. Match parent (`bg-background`, `bg-card`, …). */
  surfaceClassName?: string;
  /** Renders instead of `letter` / `iconName` when set. */
  emblem?: React.ReactNode;
  /** First visible character is shown in the center disc. */
  letter?: string;
  iconName?: string;
  iconSize?: PrismIconProps["size"];
  iconWeight?: PrismIconProps["weight"];
  iconFill?: PrismIconProps["fill"];
};

function resolveCenterContent(
  props: Pick<
    PrismDividerProps,
    "emblem" | "letter" | "iconName" | "iconSize" | "iconWeight" | "iconFill"
  >
): React.ReactNode {
  if (props.emblem !== undefined && props.emblem !== null) {
    return props.emblem;
  }
  if (props.letter !== undefined && props.letter.trim() !== "") {
    const char = Array.from(props.letter.trim())[0] ?? "";
    if (!char) return null;
    return (
      <PrismTypography
        role="title"
        size="small"
        color={{ semanticText: "foreground" }}
        as="span"
      >
        {char}
      </PrismTypography>
    );
  }
  if (props.iconName !== undefined && props.iconName !== "") {
    return (
      <PrismIcon
        name={props.iconName}
        size={props.iconSize ?? PRISM_ICON_DEFAULTS.size}
        weight={props.iconWeight ?? PRISM_ICON_DEFAULTS.weight}
        fill={props.iconFill ?? PRISM_ICON_DEFAULTS.fill}
      />
    );
  }
  return null;
}

function PrismDivider({
  className,
  spacing,
  lineWeight,
  tone,
  roundedBar = false,
  lineClassName,
  lineStyle,
  surfaceClassName,
  emblem,
  letter,
  iconName,
  iconSize,
  iconWeight,
  iconFill,
  "aria-label": ariaLabel,
  role,
  ...rest
}: PrismDividerProps): React.JSX.Element {
  const center = resolveCenterContent({
    emblem,
    letter,
    iconName,
    iconSize,
    iconWeight,
    iconFill,
  });

  const rootRole =
    role ?? (ariaLabel !== undefined ? "separator" : "presentation");

  return (
    <div
      data-slot="divider"
      role={rootRole}
      aria-label={ariaLabel}
      className={cn(prismDividerRootVariants({ spacing }), className)}
      {...rest}
    >
      <div
        aria-hidden
        className={cn(
          prismDividerBarVariants({
            lineWeight,
            tone,
            roundedBar,
          }),
          lineClassName
        )}
        style={lineStyle}
      />
      {center ? (
        <div
          className={cn(
            "relative z-10 flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border/70 px-2.5 shadow-sm",
            surfaceClassName ?? "bg-background"
          )}
        >
          {center}
        </div>
      ) : null}
    </div>
  );
}

export { PrismDivider, prismDividerRootVariants, prismDividerBarVariants };
