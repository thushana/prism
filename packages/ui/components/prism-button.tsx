"use client";

/**
 * PrismButton: variant axes (paint, shape, line, spacing, gap, textCase, size) + motion opt-outs (`disable*`).
 *
 * Variants: `plain` | `icon` · Icon position · GSAP hover scale · Material palette + paint modes · `asChild` for non-button root (Radix Slot → inner span).
 */

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { gsap } from "gsap";
import {
  PrismColor,
  type PartialPrismColorSpec,
  type PrismPaletteId,
  type PrismSwatchKey,
} from "../styles/prism-color";
import type { PrismSize } from "../source/prism-size";
import {
  PRISM_BUTTON_SPACING_MULTIPLIER,
  type PrismSpacing,
} from "../source/prism-spacing";
import { resolvePrismButtonPreset } from "../source/prism-button-presets";
import {
  PRISM_LUCIDE_DRAW_SVG_SELECTOR,
  prismLucideStrokeDraw,
} from "../source/prism-lucide-stroke-draw";
import {
  resolvePrismMotionDurationSeconds,
  type PrismIconMotionProps,
} from "../source/prism-motion";
import { PrismIcon } from "./prism-icon";

/** Stable default for {@link PrismIcon} when `materialSymbol` is set and `iconMotion` is omitted. */
const PRISM_BUTTON_DEFAULT_MATERIAL_MOTION: PrismIconMotionProps = {
  playback: "once",
  durationIn: "regular",
  presetIn: "fadeScale",
};

/** camelCase → kebab-case for data-* attributes (DOM convention). */
function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

/** Build data-* record from camelCase prop names; omit undefined/false. */
function toDataAttrs(
  entries: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean | undefined> {
  const out: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== false)
      out[`data-${camelToKebab(key)}`] = value;
  }
  return out;
}

/** Variant: `plain` = no icon, `icon` = with Lucide icon */
export type PrismButtonVariant = "plain" | "icon";

/** Fill / outline modes (camelCase values). Gradients are controlled by `color.gradient`. */
export type PrismButtonPaint =
  | "background"
  | "backgroundLight"
  | "backgroundDark"
  | "backgroundSolid"
  | "backgroundNone"
  | "monochrome";

export type PrismButtonShape = "pill" | "rectangle" | "rectangleRounded";
export type PrismButtonLine = "full" | "bottom" | "none";
export type PrismButtonSpacing = PrismSpacing;
export type PrismButtonGap = "normal" | "none";
export type PrismButtonTextCase = "default" | "uppercase" | "lowercase";

export type { PrismSize as PrismButtonSize } from "../source/prism-size";

const SIZE_SCALE: Record<PrismSize, number> = {
  small: 0.75,
  regular: 1,
  large: 1.5,
  huge: 2,
  gigantic: 2.5,
};

const BASE_PADDING_VERTICAL = 8;
const BASE_PADDING_HORIZONTAL = 14;
const BASE_FONT_SIZE = 14;
const BASE_ICON_SIZE = 18;

/** Max rAF attempts while Lucide SVG is in DOM but not yet measurable (collapsed toolbar, etc.). */
const LUCIDE_DRAW_MAX_ATTEMPTS = 120;

export interface PrismButtonProps {
  /**
   * Prism color spec for the button.
   *
   * Visual no-op constraint: solid fills/borders are derived like the legacy API:
   * - `backgroundLight`: background=100, border/text=800
   * - `backgroundDark`: background=800, border/text=100
   * - hover swaps those two
   *
   * When `color.gradient` is set, a gradient background is used. If `gradient.swatches`
   * is omitted/empty, PrismButton derives two stops from `swatchPrimary` using
   * `PrismColor.Loop.step(+1)` (next-in-spectrum).
   *
   * Ignored when `paint="monochrome"`.
   */
  color: PartialPrismColorSpec;
  /** Button label (hidden when iconOnly; used for aria-label/title) */
  label: string;
  /** Optional node before icon/label (e.g. Noto emoji). */
  leadingSlot?: React.ReactNode;
  variant?: PrismButtonVariant;
  icon?: LucideIcon;
  /**
   * Material Symbols glyph (passed to {@link PrismIcon `name`} with default `iconStyle="material"`).
   * When set, wins over `icon`. Lucide stroke-draw on buttons uses `icon` + `iconStyle="lucide"` on {@link PrismIcon} instead.
   */
  materialSymbol?: string;
  /** Forwarded to {@link PrismIcon} when `materialSymbol` is set; ignored for Lucide `icon`. */
  iconMotion?: PrismIconMotionProps;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;
  shape?: PrismButtonShape;
  line?: PrismButtonLine;
  spacing?: PrismButtonSpacing;
  gap?: PrismButtonGap;
  textCase?: PrismButtonTextCase;
  paint?: PrismButtonPaint;
  segmentPosition?: "first" | "middle" | "last";
  size?: PrismSize;
  font?: "sans" | "serif" | "mono";
  disableMotion?: boolean;
  disableGrow?: boolean;
  disableColorChange?: boolean;
  disableIconMotion?: boolean;
  inverted?: boolean;
  disabled?: boolean;
  /**
   * Pressed / selected state: drives visuals and keeps “hover” semantics while on.
   * With `paint="backgroundNone"`, selection uses a **tinted chip** (primary ~100) plus
   * **full-strength** label/icon color (~800), not a faint foreground wash.
   */
  toggled?: boolean;
  /**
   * Animate the label out (max-width + opacity → 0) while keeping the icon visible.
   * Used by segmented controls to collapse non-selected buttons to icon-only on narrow viewports.
   * The label stays in the DOM so the CSS transition plays both ways.
   */
  labelHidden?: boolean;
  /** Merge props onto a single inner span (display-only / style-guide); not a native `<button>`. */
  asChild?: boolean;
  className?: string;
  preset?: string;
}

const COLOR_TRANSITION =
  "background-color 0.25s ease-in-out, border-color 0.25s ease-in-out, color 0.25s ease-in-out";

export function PrismButton(
  props: PrismButtonProps &
    (
      | Omit<React.ComponentProps<"button">, "color">
      | Omit<React.ComponentProps<"span">, "color">
    )
) {
  const { preset, ...propsMinusPreset } = props;
  const resolved = preset
    ? resolvePrismButtonPreset(preset, propsMinusPreset)
    : (propsMinusPreset as PrismButtonProps &
        (React.ComponentProps<"button"> | React.ComponentProps<"span">));

  const {
    color,
    label,
    leadingSlot,
    variant = "icon",
    icon: IconComponent,
    materialSymbol,
    iconMotion,
    iconPosition = "left",
    iconOnly = false,
    shape = "pill",
    line = "full",
    spacing = "regular",
    gap = "normal",
    textCase = "default",
    paint = "background",
    segmentPosition,
    size = "regular",
    font = "sans",
    disableMotion = false,
    disableGrow = false,
    disableColorChange = false,
    disableIconMotion = false,
    inverted = false,
    disabled = false,
    toggled,
    labelHidden = false,
    asChild = false,
    className = "",
    ...rest
  } = resolved;
  const [hovered, setHovered] = React.useState(false);
  const rootRef = React.useRef<HTMLButtonElement | HTMLElement>(null);
  const iconDrawDoneRef = React.useRef(false);

  const effectiveHovered = disabled ? false : toggled ? true : hovered;

  const lineBottom = line === "bottom";
  const lineNo = line === "none";
  const gapNone = gap === "none";
  const spacingMultiplier = PRISM_BUTTON_SPACING_MULTIPLIER[spacing];

  const shouldGrow =
    !disableMotion && !disableGrow && !lineBottom && !toggled && !gapNone;

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!shouldGrow) {
      gsap.set(el, { scale: 1 });
      return;
    }
    if (effectiveHovered) {
      gsap.to(el, {
        scale: 1.1,
        duration: resolvePrismMotionDurationSeconds(0.3),
        ease: "back.out(1.56)",
        overwrite: true,
      });
    } else {
      gsap.to(el, {
        scale: 1,
        duration: resolvePrismMotionDurationSeconds("speedy"),
        ease: "power2.out",
        overwrite: true,
      });
    }
    return () => {
      gsap.killTweensOf(el);
    };
  }, [effectiveHovered, shouldGrow]);

  const isBackgroundNo = paint === "backgroundNone";
  const isMonochrome = paint === "monochrome";
  const isBackgroundSolid = paint === "backgroundSolid";

  const backgroundShade = paint === "backgroundDark" ? "dark" : "light";

  const palette: PrismPaletteId = (color?.palette ??
    "default") as PrismPaletteId;
  const primaryFamily: PrismSwatchKey = PrismColor.Loop.normalize(
    palette,
    color?.swatchPrimary ?? "blue-grey"
  );
  const baseSwatchesRaw = color?.gradient?.swatches;
  const baseSwatches =
    Array.isArray(baseSwatchesRaw) && baseSwatchesRaw.length > 0
      ? baseSwatchesRaw.map((s) => PrismColor.Loop.normalize(palette, s))
      : [primaryFamily, PrismColor.Loop.step(palette, primaryFamily, 1)];
  const gradientDirection = color?.gradient?.direction ?? "horizontal";
  const gradientPair = PrismColor.gradient.linearStrings({
    palette,
    swatches: baseSwatches,
    direction: gradientDirection,
    shade: { light: 100, dark: 800 },
    stopResolution: "cssVar",
  });
  const gradientBorder = gradientPair.dark;
  const gradientBackground =
    backgroundShade === "dark" ? gradientPair.dark : gradientPair.light;
  const gradientHoverBackground =
    backgroundShade === "dark" ? gradientPair.light : gradientPair.dark;

  const isGradient =
    !isMonochrome &&
    !isBackgroundNo &&
    !!color?.gradient &&
    baseSwatches.length > 0 &&
    gradientBackground !== "none";

  const solidBackgroundLight = PrismColor.var({
    palette,
    family: primaryFamily,
    shade: 100,
  });
  const solidBackgroundDark = PrismColor.var({
    palette,
    family: primaryFamily,
    shade: 800,
  });

  const baseBackground = isMonochrome
    ? "#ffffff"
    : isGradient
      ? gradientBackground
      : backgroundShade === "dark"
        ? solidBackgroundDark
        : solidBackgroundLight;
  const baseForeground = isMonochrome
    ? "#000000"
    : backgroundShade === "dark"
      ? solidBackgroundLight
      : solidBackgroundDark;
  const baseHoverBackground = isMonochrome
    ? "#000000"
    : isGradient
      ? gradientHoverBackground
      : backgroundShade === "dark"
        ? solidBackgroundLight
        : solidBackgroundDark;
  const baseHoverForeground = isMonochrome
    ? "#ffffff"
    : backgroundShade === "dark"
      ? solidBackgroundDark
      : solidBackgroundLight;

  const backgroundValue =
    inverted && !isGradient ? baseForeground : baseBackground;
  const foregroundValue =
    inverted && !isGradient ? baseBackground : baseForeground;
  const hoverBackgroundValue =
    inverted && !isGradient ? baseHoverForeground : baseHoverBackground;
  const hoverForegroundValue =
    inverted && !isGradient ? baseHoverBackground : baseHoverForeground;

  const showPrismGlyph =
    Boolean(materialSymbol) && (variant === "icon" || iconOnly);
  const showLucideGlyph =
    Boolean(IconComponent) &&
    !materialSymbol &&
    (variant === "icon" || iconOnly);
  const shouldDrawIcon =
    showLucideGlyph && !disableMotion && !disableIconMotion;
  React.useEffect(() => {
    if (!shouldDrawIcon || !rootRef.current) return;
    const el = rootRef.current;
    let cancelled = false;
    let frameId = 0;
    let attempts = 0;

    const run = () => {
      if (cancelled || iconDrawDoneRef.current) return;
      const result = prismLucideStrokeDraw(el, {
        durationSec: resolvePrismMotionDurationSeconds("regular"),
      });
      if (result === "drawn") {
        iconDrawDoneRef.current = true;
        return;
      }
      if (result === "retry" && attempts++ < LUCIDE_DRAW_MAX_ATTEMPTS) {
        frameId = requestAnimationFrame(run);
      }
    };

    frameId = requestAnimationFrame(run);

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        if (
          !entries.some((e) => e.isIntersecting && e.intersectionRatio > 0)
        ) {
          return;
        }
        if (iconDrawDoneRef.current) return;
        attempts = 0;
        frameId = requestAnimationFrame(run);
      });
      observer.observe(el);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      observer?.disconnect();
      const elements = el.querySelectorAll<SVGGeometryElement>(
        PRISM_LUCIDE_DRAW_SVG_SELECTOR
      );
      gsap.killTweensOf(elements);
    };
  }, [shouldDrawIcon]);

  React.useEffect(() => {
    if (!shouldDrawIcon) iconDrawDoneRef.current = false;
  }, [shouldDrawIcon]);

  const scaleFactor = SIZE_SCALE[size];
  const paddingV = Math.round(
    BASE_PADDING_VERTICAL * scaleFactor * spacingMultiplier
  );
  const paddingH = Math.round(
    BASE_PADDING_HORIZONTAL * scaleFactor * spacingMultiplier
  );
  const fontSizePx = Math.round(BASE_FONT_SIZE * scaleFactor);
  const iconPx = Math.round(BASE_ICON_SIZE * scaleFactor);
  const flexGap = Math.round(6 * scaleFactor);
  const BASE_BORDER = 3;
  const strokeWidth = Math.max(2, Math.round(BASE_BORDER * scaleFactor));
  const hasFullBorder = !lineNo && !lineBottom;
  const borderWidth = hasFullBorder ? strokeWidth : 0;

  let baseRadius = 9999;
  if (shape === "rectangleRounded") baseRadius = 6;
  else if (shape === "rectangle") baseRadius = 0;

  const borderRadiusValue: number | string =
    gapNone && segmentPosition === "first"
      ? `${baseRadius}px 0 0 ${baseRadius}px`
      : gapNone && segmentPosition === "last"
        ? `0 ${baseRadius}px ${baseRadius}px 0`
        : gapNone && segmentPosition === "middle"
          ? 0
          : baseRadius;

  const shouldChangeColor = !disableMotion && !disableColorChange;

  const borderColorValue = isBackgroundSolid
    ? shouldChangeColor && effectiveHovered
      ? hoverBackgroundValue
      : backgroundValue
    : shouldChangeColor && effectiveHovered
      ? hoverBackgroundValue
      : foregroundValue;
  const borderSolidColor =
    isGradient && lineBottom
      ? solidBackgroundDark
      : typeof borderColorValue === "string"
        ? borderColorValue
        : undefined;
  const segmentBorders = gapNone && segmentPosition && hasFullBorder;
  const segmentBorderColor =
    segmentBorders &&
    typeof borderSolidColor === "string" &&
    !borderSolidColor.startsWith("linear-gradient")
      ? borderSolidColor
      : segmentBorders
        ? solidBackgroundDark
        : undefined;
  const borderStyle: React.CSSProperties = lineNo
    ? { borderWidth: 0, borderStyle: "none" }
    : lineBottom
      ? {
          borderLeftWidth: 0,
          borderTopWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: strokeWidth,
          borderLeftStyle: "none",
          borderTopStyle: "none",
          borderRightStyle: "none",
          borderBottomStyle: "solid",
          ...(borderSolidColor && { borderBottomColor: borderSolidColor }),
        }
      : segmentBorders
        ? (() => {
            const segColor = segmentBorderColor ?? "currentColor";
            const showLeft = segmentPosition === "first";
            const showRight = segmentPosition === "last";
            return {
              borderLeftWidth: showLeft ? strokeWidth : 0,
              borderLeftStyle: "solid",
              borderLeftColor: showLeft ? segColor : "transparent",
              borderRightWidth: showRight ? strokeWidth : 0,
              borderRightStyle: "solid",
              borderRightColor: showRight ? segColor : "transparent",
              borderTopWidth: strokeWidth,
              borderTopStyle: "solid",
              borderTopColor: segColor,
              borderBottomWidth: strokeWidth,
              borderBottomStyle: "solid",
              borderBottomColor: segColor,
            } as React.CSSProperties;
          })()
        : hasFullBorder && isGradient && isBackgroundSolid
          ? {
              borderWidth: strokeWidth,
              borderStyle: "solid",
              borderColor: "transparent",
            }
          : hasFullBorder && isGradient
            ? {
                borderWidth: strokeWidth,
                borderStyle: "solid",
                borderColor: "transparent",
                backgroundImage: `${gradientBackground}, ${gradientBorder}`,
                backgroundSize: "100% 100%, 100% 100%",
                backgroundOrigin: "padding-box, border-box",
                backgroundClip: "padding-box, border-box",
                backgroundPosition: "0 0, 0 0",
                backgroundRepeat: "no-repeat",
              }
            : {
                borderWidth,
                borderStyle: "solid",
                ...(borderSolidColor && { borderColor: borderSolidColor }),
              };

  const fontFamily =
    font === "serif"
      ? "var(--font-sentient), Georgia, serif"
      : font === "mono"
        ? "var(--font-mono), ui-monospace, monospace"
        : "var(--font-satoshi), system-ui, sans-serif";

  const transitionValue = disableMotion ? "none" : COLOR_TRANSITION;

  /**
   * Ghost buttons (`paint="backgroundNone"`): the generic hover pair swaps to
   * `hoverForegroundValue` (light swatch) which reads as faint/disabled on a
   * white surface. For hover **and** `toggled`, use a tinted fill +
   * **full-strength** `foregroundValue` instead — standard “selected chip” UX.
   */
  const ghostSurfaceActive = isBackgroundNo && effectiveHovered;

  const resolvedBackground = isBackgroundNo
    ? ghostSurfaceActive
      ? solidBackgroundLight
      : "transparent"
    : shouldChangeColor && effectiveHovered
      ? hoverBackgroundValue
      : backgroundValue;
  const useGradientBorderLayers = hasFullBorder && isGradient;
  const paddingStyle = `${paddingV}px ${paddingH}px`;
  const resolvedGradient =
    shouldChangeColor && effectiveHovered
      ? gradientHoverBackground
      : gradientBackground;
  const gradientFillStyle: React.CSSProperties = useGradientBorderLayers
    ? isBackgroundSolid
      ? {
          borderWidth: strokeWidth,
          borderStyle: "solid",
          borderColor: "transparent",
          backgroundImage: `${resolvedGradient}, ${resolvedGradient}`,
          backgroundSize: "100% 100%, 100% 100%",
          backgroundOrigin: "padding-box, border-box",
          backgroundClip: "padding-box, border-box",
          backgroundPosition: "0 0, 0 0",
          backgroundRepeat: "no-repeat",
        }
      : {
          backgroundImage:
            shouldChangeColor && effectiveHovered
              ? `${hoverBackgroundValue}, ${gradientBorder}`
              : `${gradientBackground}, ${gradientBorder}`,
          backgroundSize: "100% 100%, 100% 100%",
          backgroundOrigin: "padding-box, border-box",
          backgroundClip: "padding-box, border-box",
          backgroundPosition: "0 0, 0 0",
          backgroundRepeat: "no-repeat",
        }
    : {};
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: flexGap,
    padding: paddingStyle,
    borderRadius: borderRadiusValue,
    ...borderStyle,
    ...gradientFillStyle,
    ...(useGradientBorderLayers
      ? {}
      : typeof resolvedBackground === "string" &&
          resolvedBackground.startsWith("linear-gradient")
        ? { background: resolvedBackground }
        : { backgroundColor: resolvedBackground }),
    fontFamily,
    fontWeight: 800,
    fontSize: `${fontSizePx}px`,
    color: isBackgroundNo
      ? foregroundValue
      : shouldChangeColor && effectiveHovered
        ? hoverForegroundValue
        : foregroundValue,
    cursor: asChild || disabled ? "default" : "pointer",
    textTransform:
      textCase === "uppercase"
        ? "uppercase"
        : textCase === "lowercase"
          ? "lowercase"
          : undefined,
    transition: transitionValue,
    transformOrigin: "center",
    willChange: shouldGrow ? "transform" : "auto",
    opacity: disabled ? 0.33 : 1,
    pointerEvents: disabled ? "none" : undefined,
    ...(gapNone && {
      margin: 0,
      lineHeight: 1,
      ...(segmentPosition && segmentPosition !== "first" && { marginLeft: -1 }),
    }),
  };

  const prismIconMotionResolved: PrismIconMotionProps | undefined =
    showPrismGlyph && !disableMotion && !disableIconMotion
      ? (iconMotion ?? PRISM_BUTTON_DEFAULT_MATERIAL_MOTION)
      : undefined;

  const iconNode =
    showPrismGlyph && materialSymbol ? (
      <span style={{ display: "inline-flex", color: "inherit" }}>
        <PrismIcon
          name={materialSymbol}
          size={iconPx}
          motion={prismIconMotionResolved}
        />
      </span>
    ) : showLucideGlyph && IconComponent ? (
      <span style={{ display: "inline-flex", color: "inherit" }}>
        <IconComponent size={iconPx} strokeWidth={2.5} />
      </span>
    ) : null;
  const labelNode = !iconOnly && (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        maxWidth: labelHidden ? 0 : "12rem",
        opacity: labelHidden ? 0 : 1,
        // Slower collapse on hide; slightly quicker expand when selected.
        transition: disableMotion
          ? "none"
          : labelHidden
            ? "max-width 320ms cubic-bezier(0.4,0,0.2,1), opacity 280ms cubic-bezier(0.4,0,0.2,1)"
            : "max-width 280ms cubic-bezier(0,0,0.2,1), opacity 240ms cubic-bezier(0,0,0.2,1)",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
      aria-hidden={labelHidden}
    >
      {label}
    </span>
  );

  const content = iconOnly ? (
    <>
      {leadingSlot}
      {iconNode}
    </>
  ) : iconPosition === "right" ? (
    <>
      {leadingSlot}
      {labelNode}
      {iconNode}
    </>
  ) : (
    <>
      {leadingSlot}
      {iconNode}
      {labelNode}
    </>
  );

  const ariaLabel = iconOnly || labelHidden ? label : undefined;
  const title = iconOnly || labelHidden ? label : undefined;

  const restSpan = rest as React.ComponentProps<"span">;
  const restButton = rest as React.ComponentProps<"button">;
  const onEnter = (e: React.PointerEvent<HTMLElement>) => {
    if (!disabled && !toggled) {
      requestAnimationFrame(() => setHovered(true));
    }
    if (asChild)
      restSpan.onPointerEnter?.(e as React.PointerEvent<HTMLSpanElement>);
    else
      restButton.onPointerEnter?.(e as React.PointerEvent<HTMLButtonElement>);
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    /** Always clear local hover on leave. If we skip when `toggled`, `hovered` stays true and
     *  sticks after `toggled` becomes false — monochrome / inverted fills then look “stuck on”. */
    if (!disabled) {
      requestAnimationFrame(() => setHovered(false));
    }
    if (asChild)
      restSpan.onPointerLeave?.(e as React.PointerEvent<HTMLSpanElement>);
    else
      restButton.onPointerLeave?.(e as React.PointerEvent<HTMLButtonElement>);
  };

  const dataAttrs = toDataAttrs({
    variant,
    iconPosition: iconPosition !== "left" ? iconPosition : undefined,
    iconOnly: iconOnly || undefined,
    shape: shape !== "pill" ? shape : undefined,
    line: line !== "full" ? line : undefined,
    spacing: spacing !== "regular" ? spacing : undefined,
    gap: gap !== "normal" ? gap : undefined,
    textCase: textCase !== "default" ? textCase : undefined,
    paint,
    segmentPosition,
    size,
    disableMotion: disableMotion || undefined,
    disableGrow: disableGrow || undefined,
    disableColorChange: disableColorChange || undefined,
    disableIconMotion: disableIconMotion || undefined,
    drawIcon: showLucideGlyph && !disableIconMotion ? true : undefined,
    inverted: inverted || undefined,
    disabled: disabled || undefined,
    toggled: toggled || undefined,
  });

  const {
    className: _omit,
    style: restSpanStyle,
    ...restSpanSafe
  } = rest as React.ComponentProps<"span">;
  const {
    className: _omitBtn,
    style: restButtonStyle,
    ...restButtonSafe
  } = rest as React.ComponentProps<"button">;

  if (asChild) {
    return (
      <Slot
        ref={rootRef as React.Ref<HTMLElement>}
        className={className}
        style={{ ...style, ...restSpanStyle }}
        title={title}
        aria-label={ariaLabel}
        aria-pressed={toggled !== undefined ? toggled : undefined}
        {...dataAttrs}
        {...restSpanSafe}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
      >
        <span>{content}</span>
      </Slot>
    );
  }

  return (
    <button
      ref={rootRef as React.RefObject<HTMLButtonElement>}
      type="button"
      className={className}
      style={{ ...style, ...restButtonStyle }}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={toggled !== undefined ? toggled : undefined}
      {...dataAttrs}
      {...restButtonSafe}
      disabled={disabled}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {content}
    </button>
  );
}
