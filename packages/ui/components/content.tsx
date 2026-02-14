import * as React from "react";

import { cn } from "@utilities";

/* Layout wrapper components — apply Tailwind breakpoint widths (see layout-wrappers.css) */

function ContentText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-text"
      className={cn("content-text", className)}
      {...props}
    />
  );
}

function ContentMain({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-main"
      className={cn("content-main", className)}
      {...props}
    />
  );
}

function GraphicsMain({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="graphics-main"
      className={cn("graphics-main", className)}
      {...props}
    />
  );
}

function GraphicsLarge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="graphics-large"
      className={cn("graphics-large", className)}
      {...props}
    />
  );
}

function GraphicsFull({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="graphics-full"
      className={cn("graphics-full", className)}
      {...props}
    />
  );
}

/** Full-viewport breakout wrapper (use for bands that need to escape page container). */
function ContentBreakout({ className, ...props }: React.ComponentProps<"div">) {
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
    wrapper: ContentText,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-640 layout-wrapper-bar-red",
  },
  contentMain: {
    label: ".content-main — xl 1280px",
    wrapper: ContentMain,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-1280 layout-wrapper-bar-pink",
  },
  graphicsMain: {
    label: ".graphics-main — xl 1280px",
    wrapper: GraphicsMain,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-1280 layout-wrapper-bar-purple",
  },
  graphicsLarge: {
    label: ".graphics-large — 2xl 1536px",
    wrapper: GraphicsLarge,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-1536 layout-wrapper-bar-indigo",
  },
  graphicsFull: {
    label: ".graphics-full — edge to edge",
    wrapper: GraphicsFull,
    barClass:
      "layout-wrapper-bar layout-wrapper-bar-w-full layout-wrapper-bar-blue",
  },
} as const;

type LayoutWrapperBarVariant = keyof typeof LAYOUT_WRAPPER_BAR_VARIANTS;

/** Single layout wrapper reference bar (width + label); use inside Content* wrappers. */
function LayoutWrapperBar({
  variant,
  label,
  className,
  ...props
}: {
  variant: LayoutWrapperBarVariant;
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

/** Full reference section: breakout + heading + five colored bars (for system sheet / docs). */
function LayoutWrappersReference({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ContentBreakout className={cn("border-t pt-8", className)} {...props}>
      <div className="mb-8">
        <h2 className="mb-4">Layout Wrappers</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Tailwind container breakpoint widths. This section breaks out of the
          page container so bands can reach their full width (e.g.
          graphics-large 2xl 1536px).
        </p>
        <div className="space-y-6 mt-8">
          <LayoutWrapperBar variant="contentText" />
          <LayoutWrapperBar variant="contentMain" />
          <LayoutWrapperBar variant="graphicsMain" />
          <LayoutWrapperBar variant="graphicsLarge" />
          <LayoutWrapperBar variant="graphicsFull" />
        </div>
      </div>
    </ContentBreakout>
  );
}

export {
  ContentText,
  ContentMain,
  GraphicsMain,
  GraphicsLarge,
  GraphicsFull,
  ContentBreakout,
  LayoutWrapperBar,
  LayoutWrappersReference,
};

export type { LayoutWrapperBarVariant };
