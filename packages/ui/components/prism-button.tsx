"use client";

/**
 * PrismButton: chainable appearance props.
 *
 * Variants: .plain | .icon
 * Icon position: .iconLeft (default) | .iconRight
 * Appearances: .iconOnly, .typeUppercase, .typeLowercase, .shapeRectangle, .shapeRectangleRounded, .shapeLineBottom, .shapeLineNo, .colorBackgroundNo, .colorMonochrome, .shapeTight, .shapeGapNo
 * Sizes: .sizeSmall (75%) | .sizeNormal (100%) | .sizeLarge (1.5x) | .sizeLarge2x (2x)
 * Fonts: .fontSans | .fontSerif | .fontMono
 * Animations: .animationNo | .animationNoGrow | .animationNoColorChange (hover scale via GSAP) | .animationIcons (default) | .animationIconsNo (no icon draw-in)
 * States: .stateInverted | .stateDisabled (33% opacity, no interaction) | .stateToggled (locks hover state)
 */

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { gsap } from "gsap";
import { colorSpectrum, type ColorName } from "../styles/color-spectrum";

function colorToKebab(color: ColorName): string {
  return color.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/** camelCase → kebab-case for data-* attributes (DOM convention). */
function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

/** Build data-* record from camelCase prop names; omit undefined/false. DOM stays kebab-case. */
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

/** Next color in MUI palette order (wraps after blueGrey to red) */
function nextColorInSpectrum(color: ColorName): ColorName {
  const i = colorSpectrum.indexOf(color);
  return colorSpectrum[(i + 1) % colorSpectrum.length];
}

/** Variant: .plain = no icon, .icon = with Lucide icon */
export type PrismButtonVariant = "plain" | "icon";

/** Size scale: small 75%, normal 100%, large 1.5x, large2x 2x. Padding, font, icon, and line/border width scale with size. */
export type PrismButtonSize = "small" | "normal" | "large" | "large2x";

const SIZE_SCALE: Record<PrismButtonSize, number> = {
  small: 0.75,
  normal: 1,
  large: 1.5,
  large2x: 2,
};

const BASE_PADDING_VERTICAL = 8;
const BASE_PADDING_HORIZONTAL = 14;
const BASE_FONT_SIZE = 14; // px
const BASE_ICON_SIZE = 18;

/** Selector for stroked SVG geometry used by icon draw-in (Lucide uses path, line, polyline, etc.). */
const DRAW_SVG_SELECTOR =
  "svg path, svg line, svg polyline, svg polygon, svg circle, svg ellipse, svg rect";

export interface PrismButtonProps {
  /** Palette color name (100 fill, 800 border/text); ignored when monochrome */
  color: ColorName;
  /** Button label (hidden when iconOnly; used for aria-label/title) */
  label: string;
  /** .plain = no icon, .icon = with icon (requires icon prop) */
  variant?: PrismButtonVariant;
  /** Lucide icon component; used when variant is "icon" */
  icon?: LucideIcon;
  /** .iconLeft (default) | .iconRight — icon position */
  iconPosition?: "left" | "right";
  /** .iconOnly — show only icon, label as alt/hover (aria-label, title) */
  iconOnly?: boolean;
  /** .typeUppercase — render label in uppercase */
  typeUppercase?: boolean;
  /** .typeLowercase — render label in lowercase */
  typeLowercase?: boolean;
  /** .shapeRectangle — 90° corners (border-radius 0) */
  shapeRectangle?: boolean;
  /** .shapeRectangleRounded — slight curve (border-radius 6px) */
  shapeRectangleRounded?: boolean;
  /** .shapeLineBottom — only bottom line (no full border) */
  shapeLineBottom?: boolean;
  /** .shapeLineNo — no border at all */
  shapeLineNo?: boolean;
  /** .colorBackground (default) | .colorBackgroundLight | .colorBackgroundDark | .colorBackgroundSolid | .colorBackgroundNo | .colorMonochrome | .colorGradient* */
  colorVariant?:
    | "background"
    | "background-light"
    | "background-dark"
    | "background-solid"
    | "background-no"
    | "monochrome"
    | "gradient-sideways"
    | "gradient-up"
    | "gradient-angle";
  /** Second color for gradients; if omitted, uses next color in MUI palette */
  colorSecondary?: ColorName;
  /** .shapeTight — cut internal padding by 50% */
  shapeTight?: boolean;
  /** .shapeGapNo — no exterior margin; use with segmentPosition so only first/last have left/right edges */
  shapeGapNo?: boolean;
  /** When shapeGapNo: "first" = radius on left only, "last" = right only, "middle" = no horizontal radius */
  segmentPosition?: "first" | "middle" | "last";
  /** Size: .sizeSmall (75%), .sizeNormal (100%), .sizeLarge (1.5x), .sizeLarge2x (2x) */
  size?: PrismButtonSize;
  /** Font: sans (Satoshi), serif (Sentient), mono (system mono) */
  font?: "sans" | "serif" | "mono";
  /** .animationNo — disable all animations */
  animationNo?: boolean;
  /** .animationNoGrow — disable grow/scale animation only */
  animationNoGrow?: boolean;
  /** .animationNoColorChange — disable color change on hover */
  animationNoColorChange?: boolean;
  /** .animationIconsNo — disable icon stroke draw-in (default is .animationIcons = draw-in on) */
  animationIconsNo?: boolean;
  /** .stateInverted — swap background and foreground colors */
  stateInverted?: boolean;
  /** .stateDisabled — 33% opacity, no animation/hover/click */
  stateDisabled?: boolean;
  /** .stateToggled — locks the hover/clicked state permanently */
  stateToggled?: boolean;
  /** Render as span for display-only (e.g. in style guide) */
  asSpan?: boolean;
  className?: string;
}

/** CSS transition for color/border (GSAP owns scale) */
const COLOR_TRANSITION =
  "background-color 0.25s ease-in-out, border-color 0.25s ease-in-out, color 0.25s ease-in-out";

/**
 * Prism button: chainable appearances with animation controls and state modifiers.
 */
export function PrismButton({
  color,
  label,
  variant = "icon",
  icon: IconComponent,
  iconPosition = "left",
  iconOnly = false,
  typeUppercase = false,
  typeLowercase = false,
  shapeRectangle = false,
  shapeRectangleRounded = false,
  shapeLineBottom = false,
  shapeLineNo = false,
  colorVariant,
  colorSecondary,
  shapeTight = false,
  shapeGapNo = false,
  segmentPosition,
  size = "normal",
  font = "sans",
  animationNo = false,
  animationNoGrow = false,
  animationNoColorChange = false,
  animationIconsNo = false,
  stateInverted = false,
  stateDisabled = false,
  stateToggled = false,
  asSpan = false,
  className = "",
  ...rest
}: PrismButtonProps &
  (React.ComponentProps<"button"> | React.ComponentProps<"span">)) {
  const [hovered, setHovered] = React.useState(false);
  const rootRef = React.useRef<HTMLButtonElement | HTMLSpanElement>(null);
  const iconDrawDoneRef = React.useRef(false);

  // Determine effective hover state: stateToggled locks hover state, stateDisabled disables it
  const effectiveHovered = stateDisabled
    ? false
    : stateToggled
      ? true
      : hovered;

  // GSAP hover scale when shouldGrow; otherwise CSS handles transform or none
  const shouldGrow =
    !animationNo && !animationNoGrow && !shapeLineBottom && !stateToggled;
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
  const isBackgroundNo = colorVariant === "background-no";
  const isMonochrome = colorVariant === "monochrome";
  const isGradient =
    colorVariant === "gradient-sideways" ||
    colorVariant === "gradient-up" ||
    colorVariant === "gradient-angle";
  const isBackgroundSolid = colorVariant === "background-solid";

  const secondColor: ColorName = colorSecondary ?? nextColorInSpectrum(color);
  const secondaryColorKebab = colorToKebab(secondColor);

  const gradientDir =
    colorVariant === "gradient-sideways"
      ? "to right"
      : colorVariant === "gradient-up"
        ? "to top"
        : colorVariant === "gradient-angle"
          ? "135deg"
          : "to right";
  const backgroundShade = colorVariant === "background-dark" ? "dark" : "light";
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

  // Base colors (can be inverted)
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

  // Apply inversion if requested (inversion applies to solid colors; gradients stay as-is for now)
  const backgroundValue =
    stateInverted && !isGradient ? baseForeground : baseBackground;
  const foregroundValue =
    stateInverted && !isGradient ? baseBackground : baseForeground;
  const hoverBackgroundValue =
    stateInverted && !isGradient ? baseHoverForeground : baseHoverBackground;
  const hoverForegroundValue =
    stateInverted && !isGradient ? baseHoverBackground : baseHoverForeground;

  const showIcon = (variant === "icon" && IconComponent) || iconOnly;

  // Icon stroke draw-in (DrawSVG-style via strokeDashoffset), once per mount when icon is shown.
  const shouldDrawIcon = showIcon && !animationNo && !animationIconsNo;
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
  const tightMultiplier = shapeTight ? 0.5 : 1;
  const paddingV = Math.round(
    BASE_PADDING_VERTICAL * scaleFactor * tightMultiplier
  );
  const paddingH = Math.round(
    BASE_PADDING_HORIZONTAL * scaleFactor * tightMultiplier
  );
  const fontSizePx = Math.round(BASE_FONT_SIZE * scaleFactor);
  const iconSize = Math.round(BASE_ICON_SIZE * scaleFactor);
  const gap = Math.round(6 * scaleFactor);
  const BASE_BORDER = 3;
  const strokeWidth = Math.max(2, Math.round(BASE_BORDER * scaleFactor));
  const hasFullBorder = !shapeLineNo && !shapeLineBottom;
  const borderWidth = hasFullBorder ? strokeWidth : 0;

  let baseRadius: number = 9999;
  if (shapeRectangleRounded) baseRadius = 6;
  else if (shapeRectangle) baseRadius = 0;
  // rounded = pill (default when no shapeRectangle/shapeRectangleRounded)

  // When shapeGapNo + segmentPosition: only first/last get left/right edges; middle gets 0
  const borderRadiusValue: number | string =
    shapeGapNo && segmentPosition === "first"
      ? `${baseRadius}px 0 0 ${baseRadius}px`
      : shapeGapNo && segmentPosition === "last"
        ? `0 ${baseRadius}px ${baseRadius}px 0`
        : shapeGapNo && segmentPosition === "middle"
          ? 0
          : baseRadius;

  // Apply color changes only if not disabled by animationNoColorChange
  const shouldChangeColor = !animationNo && !animationNoColorChange;

  // .colorBackgroundSolid: outline and background match (same solid or same gradient)
  const borderColorValue = isBackgroundSolid
    ? shouldChangeColor && effectiveHovered
      ? hoverBackgroundValue
      : backgroundValue
    : shouldChangeColor && effectiveHovered
      ? hoverBackgroundValue
      : foregroundValue;
  const borderSolidColor =
    isGradient && shapeLineBottom
      ? `var(--color-${primaryColorKebab}-800)`
      : typeof borderColorValue === "string"
        ? borderColorValue
        : undefined;
  const segmentBorders = shapeGapNo && segmentPosition && hasFullBorder;
  const segmentBorderColor =
    segmentBorders &&
    typeof borderSolidColor === "string" &&
    !borderSolidColor.startsWith("linear-gradient")
      ? borderSolidColor
      : segmentBorders
        ? `var(--color-${primaryColorKebab}-800)`
        : undefined;
  const borderStyle: React.CSSProperties = shapeLineNo
    ? { borderWidth: 0, borderStyle: "none" }
    : shapeLineBottom
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
            const color = segmentBorderColor ?? "currentColor";
            const showLeft = segmentPosition === "first";
            const showRight = segmentPosition === "last";
            return {
              borderLeftWidth: showLeft ? strokeWidth : 0,
              borderLeftStyle: "solid",
              borderLeftColor: showLeft ? color : "transparent",
              borderRightWidth: showRight ? strokeWidth : 0,
              borderRightStyle: "solid",
              borderRightColor: showRight ? color : "transparent",
              borderTopWidth: strokeWidth,
              borderTopStyle: "solid",
              borderTopColor: color,
              borderBottomWidth: strokeWidth,
              borderBottomStyle: "solid",
              borderBottomColor: color,
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
                /* Contrasting border (800) vs fill (100) */
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

  // Transform: GSAP owns scale when shouldGrow; no scale otherwise
  const transformValue = undefined;

  // Transition: GSAP owns scale; CSS handles color/border only
  const transitionValue = animationNo ? "none" : COLOR_TRANSITION;

  const resolvedBackground = isBackgroundNo
    ? "transparent"
    : shouldChangeColor && effectiveHovered
      ? hoverBackgroundValue
      : backgroundValue;
  const useGradientBorderLayers = hasFullBorder && isGradient;
  const paddingStyle = `${paddingV}px ${paddingH}px`;
  /* Gradient: .colorBackgroundSolid = same gradient fill and border; else border contrasts (800) */
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
    gap,
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
    cursor: asSpan || stateDisabled ? "default" : "pointer",
    textTransform: typeUppercase
      ? "uppercase"
      : typeLowercase
        ? "lowercase"
        : undefined,
    transition: transitionValue,
    transformOrigin: "center",
    transform: transformValue,
    willChange: shouldGrow ? "transform" : "auto",
    opacity: stateDisabled ? 0.33 : 1,
    pointerEvents: stateDisabled ? "none" : undefined,
    ...(shapeGapNo && {
      margin: 0,
      lineHeight: 1,
      // Overlap non-first segments by 1px to avoid sub-pixel gap from flex rounding
      ...(segmentPosition && segmentPosition !== "first" && { marginLeft: -1 }),
    }),
  };

  const iconNode =
    showIcon && IconComponent ? (
      <span style={{ display: "inline-flex", color: "inherit" }}>
        <IconComponent size={iconSize} strokeWidth={2.5} />
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
    if (!stateDisabled && !stateToggled) {
      requestAnimationFrame(() => setHovered(true));
    }
    if (asSpan)
      restSpan.onPointerEnter?.(e as React.PointerEvent<HTMLSpanElement>);
    else
      restButton.onPointerEnter?.(e as React.PointerEvent<HTMLButtonElement>);
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    if (!stateDisabled && !stateToggled) {
      requestAnimationFrame(() => setHovered(false));
    }
    if (asSpan)
      restSpan.onPointerLeave?.(e as React.PointerEvent<HTMLSpanElement>);
    else
      restButton.onPointerLeave?.(e as React.PointerEvent<HTMLButtonElement>);
  };

  // One name everywhere: props = canonical names, data attrs same. Size/color derived from value props.
  const dataAttrs = toDataAttrs({
    variant,
    iconPosition: iconPosition !== "left" ? iconPosition : undefined,
    typeUppercase: typeUppercase || undefined,
    typeLowercase: typeLowercase || undefined,
    iconOnly: iconOnly || undefined,
    shapeRectangle: shapeRectangle || undefined,
    shapeRectangleRounded: shapeRectangleRounded || undefined,
    shapeLineBottom: shapeLineBottom || undefined,
    shapeLineNo: shapeLineNo || undefined,
    segmentPosition,
    colorBackground: colorVariant === "background" || undefined,
    colorBackgroundLight: colorVariant === "background-light" || undefined,
    colorBackgroundDark: colorVariant === "background-dark" || undefined,
    colorBackgroundSolid: colorVariant === "background-solid" || undefined,
    colorBackgroundNo: colorVariant === "background-no" || undefined,
    colorMonochrome: colorVariant === "monochrome" || undefined,
    colorGradientSideways: colorVariant === "gradient-sideways" || undefined,
    colorGradientUp: colorVariant === "gradient-up" || undefined,
    colorGradientAngle: colorVariant === "gradient-angle" || undefined,
    colorSecondary,
    shapeTight: shapeTight || undefined,
    shapeGapNo: shapeGapNo || undefined,
    sizeSmall: size === "small" || undefined,
    sizeNormal: size === "normal" || undefined,
    sizeLarge: size === "large" || undefined,
    sizeLarge2x: size === "large2x" || undefined,
    animationNo: animationNo || undefined,
    animationNoGrow: animationNoGrow || undefined,
    animationNoColorChange: animationNoColorChange || undefined,
    animationIcons: showIcon && !animationIconsNo ? true : undefined,
    animationIconsNo: animationIconsNo || undefined,
    stateInverted: stateInverted || undefined,
    stateDisabled: stateDisabled || undefined,
    stateToggled: stateToggled || undefined,
  });

  const { className: _omit, ...restSpanSafe } =
    rest as React.ComponentProps<"span">;
  const { className: _omitBtn, ...restButtonSafe } =
    rest as React.ComponentProps<"button">;

  if (asSpan) {
    return (
      <span
        ref={rootRef as React.RefObject<HTMLSpanElement>}
        className={className}
        style={style}
        title={title}
        aria-label={ariaLabel}
        {...dataAttrs}
        {...restSpanSafe}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      ref={rootRef as React.RefObject<HTMLButtonElement>}
      type="button"
      disabled={stateDisabled}
      className={className}
      style={style}
      title={title}
      aria-label={ariaLabel}
      {...dataAttrs}
      {...restButtonSafe}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {content}
    </button>
  );
}
