import * as React from "react";

import { cn } from "@utilities";

/* Layout wrappers — Tailwind breakpoint widths (see layout-wrappers.css) */

function PrismLayoutText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-text"
      className={cn("content-text", className)}
      {...props}
    />
  );
}

function PrismLayoutMain({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-main"
      className={cn("content-main", className)}
      {...props}
    />
  );
}

function PrismGraphicsMain({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="graphics-main"
      className={cn("graphics-main", className)}
      {...props}
    />
  );
}

function PrismGraphicsLarge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="graphics-large"
      className={cn("graphics-large", className)}
      {...props}
    />
  );
}

function PrismGraphicsFull({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="graphics-full"
      className={cn("graphics-full", className)}
      {...props}
    />
  );
}

/** Full-viewport breakout wrapper (bands that escape the page container). */
function PrismLayoutBreakout({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-breakout"
      className={cn("breakout-full", className)}
      style={{
        width: "100vw",
        position: "relative",
        left: "50%",
        marginLeft: "-50vw",
        paddingLeft: 24,
        paddingRight: 24,
      }}
      {...props}
    />
  );
}

const LAYOUT_WRAPPER_BAR_VARIANTS = {
  contentText: {
    label: ".content-text — sm 640px",
    wrapper: PrismLayoutText,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-640 layout-wrapper-bar-red",
  },
  contentMain: {
    label: ".content-main — xl 1280px",
    wrapper: PrismLayoutMain,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-1280 layout-wrapper-bar-pink",
  },
  graphicsMain: {
    label: ".graphics-main — xl 1280px",
    wrapper: PrismGraphicsMain,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-1280 layout-wrapper-bar-purple",
  },
  graphicsLarge: {
    label: ".graphics-large — 2xl 1536px",
    wrapper: PrismGraphicsLarge,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-1536 layout-wrapper-bar-indigo",
  },
  graphicsFull: {
    label: ".graphics-full — edge to edge",
    wrapper: PrismGraphicsFull,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-full layout-wrapper-bar-blue",
  },
} as const;

export type PrismLayoutWrapperBarVariant =
  keyof typeof LAYOUT_WRAPPER_BAR_VARIANTS;

/** Single layout wrapper reference bar (width + label); use inside PrismLayout* wrappers. */
function PrismLayoutWrapperBar({
  variant,
  label,
  className,
  ...props
}: {
  variant: PrismLayoutWrapperBarVariant;
  label?: string;
} & React.ComponentProps<"div">) {
  const config = LAYOUT_WRAPPER_BAR_VARIANTS[variant];
  const Wrapper = config.wrapper;
  return (
    <Wrapper>
      <div className={cn(config.barClass, className)} {...props}>
        {label ?? config.label}
      </div>
    </Wrapper>
  );
}

/** Reference section: breakout + heading + five colored bars (system sheet / docs). */
function PrismLayoutWrappersReference({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <PrismLayoutBreakout className={cn("border-t pt-8", className)} {...props}>
      <div className="mb-8">
        <h2 className="mb-4">Layout Wrappers</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Tailwind container breakpoint widths. This section breaks out of the
          page container so bands can reach their full width (e.g.
          graphics-large 2xl 1536px).
        </p>
        <div className="mt-8 space-y-6">
          <PrismLayoutWrapperBar variant="contentText" />
          <PrismLayoutWrapperBar variant="contentMain" />
          <PrismLayoutWrapperBar variant="graphicsMain" />
          <PrismLayoutWrapperBar variant="graphicsLarge" />
          <PrismLayoutWrapperBar variant="graphicsFull" />
        </div>
      </div>
    </PrismLayoutBreakout>
  );
}

export {
  PrismLayoutText,
  PrismLayoutMain,
  PrismGraphicsMain,
  PrismGraphicsLarge,
  PrismGraphicsFull,
  PrismLayoutBreakout,
  PrismLayoutWrapperBar,
  PrismLayoutWrappersReference,
};
