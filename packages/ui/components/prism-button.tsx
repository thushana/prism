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
import { type ColorName } from "../styles/color-values";
import { nextPrismDefaultColorName } from "../styles/prism-color";
import type { PrismSize } from "../source/prism-size";
import { resolvePrismButtonPreset } from "../source/prism-button-presets";

function colorToKebab(color: ColorName): string {
  return color.replace(/([A-Z])/g, "-$1").toLowerCase();
}

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

/** Next color in default palette loop (same order as ColorLoop default). */
function nextColorInSpectrum(color: ColorName): ColorName {
  return nextPrismDefaultColorName(color);
}

/** Variant: `plain` = no icon, `icon` = with Lucide icon */
export type PrismButtonVariant = "plain" | "icon";

/** Fill / gradient / outline modes (camelCase values). */
export type PrismButtonPaint =
  | "background"
  | "backgroundLight"
  | "backgroundDark"
  | "backgroundSolid"
  | "backgroundNone"
  | "monochrome"
  | "gradientSideways"
  | "gradientUp"
  | "gradientAngle";

export type PrismButtonShape = "pill" | "rectangle" | "rectangleRounded";
export type PrismButtonLine = "full" | "bottom" | "none";
export type PrismButtonSpacing = "normal" | "tight";
export type PrismButtonGap = "normal" | "none";
export type PrismButtonTextCase = "default" | "uppercase" | "lowercase";

export type { PrismSize as PrismButtonSize } from "../source/prism-size";

const SIZE_SCALE: Record<PrismSize, number> = {
  small: 0.75,
  medium: 1,
  large: 1.5,
  huge: 2,
  gigantic: 2.5,
};

const BASE_PADDING_VERTICAL = 8;
const BASE_PADDING_HORIZONTAL = 14;
const BASE_FONT_SIZE = 14;
const BASE_ICON_SIZE = 18;

const DRAW_SVG_SELECTOR =
  "svg path, svg line, svg polyline, svg polygon, svg circle, svg ellipse, svg rect";

export interface PrismButtonProps {
  /** Palette color name (100 fill, 800 border/text); ignored when monochrome */
  color: ColorName;
  /** Button label (hidden when iconOnly; used for aria-label/title) */
  label: string;
  variant?: PrismButtonVariant;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;
  shape?: PrismButtonShape;
  line?: PrismButtonLine;
  spacing?: PrismButtonSpacing;
  gap?: PrismButtonGap;
  textCase?: PrismButtonTextCase;
  paint?: PrismButtonPaint;
  colorSecondary?: ColorName;
  segmentPosition?: "first" | "middle" | "last";
  size?: PrismSize;
  font?: "sans" | "serif" | "mono";
  disableMotion?: boolean;
  disableGrow?: boolean;
  disableColorChange?: boolean;
  disableIconMotion?: boolean;
  inverted?: boolean;
  disabled?: boolean;
  toggled?: boolean;
  /** Merge props onto a single inner span (display-only / style-guide); not a native `<button>`. */
  asChild?: boolean;
  className?: string;
  preset?: string;
}

const COLOR_TRANSITION =
  "background-color 0.25s ease-in-out, border-color 0.25s ease-in-out, color 0.25s ease-in-out";

export function PrismButton(
  props: PrismButtonProps &
    (React.ComponentProps<"button"> | React.ComponentProps<"span">)
) {
  const { preset, ...propsMinusPreset } = props;
  const resolved = preset
    ? resolvePrismButtonPreset(preset, propsMinusPreset)
    : (propsMinusPreset as PrismButtonProps &
        (React.ComponentProps<"button"> | React.ComponentProps<"span">));

  const {
    color,
    label,
    variant = "icon",
    icon: IconComponent,
    iconPosition = "left",
    iconOnly = false,
    shape = "pill",
    line = "full",
    spacing = "normal",
    gap = "normal",
    textCase = "default",
    paint = "background",
    colorSecondary,
    segmentPosition,
    size = "medium",
    font = "sans",
    disableMotion = false,
    disableGrow = false,
    disableColorChange = false,
    disableIconMotion = false,
    inverted = false,
    disabled = false,
    toggled = false,
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
  const tight = spacing === "tight";

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
        duration: 0.3,
        ease: "back.out(1.56)",
        overwrite: true,
      });
    } else {
      gsap.to(el, {
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true,
      });
    }
    return () => {
      gsap.killTweensOf(el);
    };
  }, [effectiveHovered, shouldGrow]);

  const primaryColorKebab = colorToKebab(color);
  const isBackgroundNo = paint === "backgroundNone";
  const isMonochrome = paint === "monochrome";
  const isGradient =
    paint === "gradientSideways" ||
    paint === "gradientUp" ||
    paint === "gradientAngle";
  const isBackgroundSolid = paint === "backgroundSolid";

  const secondColor: ColorName = colorSecondary ?? nextColorInSpectrum(color);
  const secondaryColorKebab = colorToKebab(secondColor);

  const gradientDir =
    paint === "gradientSideways"
      ? "to right"
      : paint === "gradientUp"
        ? "to top"
        : paint === "gradientAngle"
          ? "135deg"
          : "to right";
  const backgroundShade = paint === "backgroundDark" ? "dark" : "light";
  const gradientBackgroundLight = `linear-gradient(${gradientDir}, var(--color-${primaryColorKebab}-100), var(--color-${secondaryColorKebab}-100))`;
  const gradientBackgroundDark = `linear-gradient(${gradientDir}, var(--color-${primaryColorKebab}-800), var(--color-${secondaryColorKebab}-800))`;
  const gradientBorder = gradientBackgroundDark;
  const gradientBackground =
    backgroundShade === "dark"
      ? gradientBackgroundDark
      : gradientBackgroundLight;
  const gradientHoverBackground =
    backgroundShade === "dark"
      ? gradientBackgroundLight
      : gradientBackgroundDark;

  const baseBackground = isMonochrome
    ? "#ffffff"
    : isGradient
      ? gradientBackground
      : backgroundShade === "dark"
        ? `var(--color-${primaryColorKebab}-800)`
        : `var(--color-${primaryColorKebab}-100)`;
  const baseForeground = isMonochrome
    ? "#000000"
    : backgroundShade === "dark"
      ? `var(--color-${primaryColorKebab}-100)`
      : `var(--color-${primaryColorKebab}-800)`;
  const baseHoverBackground = isMonochrome
    ? "#000000"
    : isGradient
      ? gradientHoverBackground
      : backgroundShade === "dark"
        ? `var(--color-${primaryColorKebab}-100)`
        : `var(--color-${primaryColorKebab}-800)`;
  const baseHoverForeground = isMonochrome
    ? "#ffffff"
    : backgroundShade === "dark"
      ? `var(--color-${primaryColorKebab}-800)`
      : `var(--color-${primaryColorKebab}-100)`;

  const backgroundValue =
    inverted && !isGradient ? baseForeground : baseBackground;
  const foregroundValue =
    inverted && !isGradient ? baseBackground : baseForeground;
  const hoverBackgroundValue =
    inverted && !isGradient ? baseHoverForeground : baseHoverBackground;
  const hoverForegroundValue =
    inverted && !isGradient ? baseHoverBackground : baseHoverForeground;

  const showIcon = (variant === "icon" && IconComponent) || iconOnly;

  const shouldDrawIcon = showIcon && !disableMotion && !disableIconMotion;
  React.useEffect(() => {
    if (!shouldDrawIcon || !rootRef.current || iconDrawDoneRef.current) return;
    const el = rootRef.current;
    const run = () => {
      const elements =
        el.querySelectorAll<SVGGeometryElement>(DRAW_SVG_SELECTOR);
      if (elements.length === 0) return;
      iconDrawDoneRef.current = true;
      elements.forEach((node) => {
        const len = node.getTotalLength();
        node.style.strokeDasharray = String(len);
        node.style.strokeDashoffset = String(len);
      });
      gsap.to(elements, {
        strokeDashoffset: 0,
        duration: 1,
        stagger: 0.03,
        ease: "power2.out",
        overwrite: true,
      });
    };
    const id = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(id);
      const elements =
        el.querySelectorAll<SVGGeometryElement>(DRAW_SVG_SELECTOR);
      gsap.killTweensOf(elements);
    };
  }, [shouldDrawIcon]);

  const scaleFactor = SIZE_SCALE[size];
  const tightMultiplier = tight ? 0.5 : 1;
  const paddingV = Math.round(
    BASE_PADDING_VERTICAL * scaleFactor * tightMultiplier
  );
  const paddingH = Math.round(
    BASE_PADDING_HORIZONTAL * scaleFactor * tightMultiplier
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
      ? `var(--color-${primaryColorKebab}-800)`
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
        ? `var(--color-${primaryColorKebab}-800)`
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

  const resolvedBackground = isBackgroundNo
    ? "transparent"
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
    color:
      shouldChangeColor && effectiveHovered
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

  const iconNode =
    showIcon && IconComponent ? (
      <span style={{ display: "inline-flex", color: "inherit" }}>
        <IconComponent size={iconPx} strokeWidth={2.5} />
      </span>
    ) : null;
  const content = iconOnly ? (
    <>{iconNode}</>
  ) : iconPosition === "right" ? (
    <>
      <span>{label}</span>
      {iconNode}
    </>
  ) : (
    <>
      {iconNode}
      <span>{label}</span>
    </>
  );

  const ariaLabel = iconOnly ? label : undefined;
  const title = iconOnly ? label : undefined;

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
    spacing: spacing !== "normal" ? spacing : undefined,
    gap: gap !== "normal" ? gap : undefined,
    textCase: textCase !== "default" ? textCase : undefined,
    paint,
    segmentPosition,
    colorSecondary,
    size,
    disableMotion: disableMotion || undefined,
    disableGrow: disableGrow || undefined,
    disableColorChange: disableColorChange || undefined,
    disableIconMotion: disableIconMotion || undefined,
    drawIcon: showIcon && !disableIconMotion ? true : undefined,
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
