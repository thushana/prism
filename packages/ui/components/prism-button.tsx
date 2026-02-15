"use client";

/**
 * PrismButton: chainable appearance props.
 *
 * Variants: .plain | .icon
 * Icon position: .icon-left (default) | .icon-right
 * Appearances: .icon-only, .uppercase, .rectangle, .rectangle-rounded, .line, .background-no, .monochrome, .tight, .gap-no
 * Sizes: .small (75%) | .normal (100%) | .large (1.5x) | .large2x (2x)
 * Fonts: .font-sans | .font-serif | .font-mono
 * Animations: .animation-no | .animation-no-grow | .animation-no-color-change (hover scale via GSAP) | .animation-icons (default) | .animation-icons-no (no icon draw-in)
 * States: .inverted | .disabled (33% opacity, no interaction) | .toggled (locks hover state)
 */

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { gsap } from "gsap";
import { colorSpectrum, type ColorName } from "../styles/color-spectrum";

function colorToKebab(color: ColorName): string {
  return color.replace(/([A-Z])/g, "-$1").toLowerCase();
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

const BASE_PADDING_V = 8;
const BASE_PADDING_H = 14;
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
  /** .icon-left (default) | .icon-right — icon position */
  iconPosition?: "left" | "right";
  /** .icon-only — show only icon, label as alt/hover (aria-label, title) */
  iconOnly?: boolean;
  /** .uppercase — render label in uppercase */
  uppercase?: boolean;
  /** .shape-rectangle — 90° corners (border-radius 0) */
  rectangle?: boolean;
  /** .shape-rectangle-rounded — slight curve (border-radius 6px) */
  rectangleRounded?: boolean;
  /** .shape-line-bottom — only bottom line (no full border) */
  line?: boolean;
  /** .shape-line-no — no border at all */
  lineNo?: boolean;
  /** .color-background (default) | .color-background-light | .color-background-dark | .color-background-solid | .color-background-no | .color-monochrome | .color-gradient-* */
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
  /** @deprecated use colorVariant="background-no" */
  backgroundNo?: boolean;
  /** @deprecated use colorVariant="monochrome" */
  monochrome?: boolean;
  /** .tight — cut internal padding by 50% */
  tight?: boolean;
  /** .gap-no — no exterior margin; use with segmentPosition so only first/last have left/right edges */
  gapNo?: boolean;
  /** When gapNo: "first" = radius on left only, "last" = right only, "middle" = no horizontal radius */
  segmentPosition?: "first" | "middle" | "last";
  /** Size: .small (75%), .normal (100%), .large (1.5x), .large2x (2x) */
  size?: PrismButtonSize;
  /** Font: sans (Satoshi), serif (Sentient), mono (system mono) */
  font?: "sans" | "serif" | "mono";
  /** .animation-no — disable all animations */
  animationNo?: boolean;
  /** .animation-no-grow — disable grow/scale animation only */
  animationNoGrow?: boolean;
  /** .animation-no-color-change — disable color change on hover */
  animationNoColorChange?: boolean;
  /** .animation-icons-no — disable icon stroke draw-in (default is .animation-icons = draw-in on) */
  animationIconsNo?: boolean;
  /** .inverted — swap background and foreground colors */
  inverted?: boolean;
  /** .disabled — 33% opacity, no animation/hover/click */
  disabled?: boolean;
  /** .toggled — locks the hover/clicked state permanently */
  toggled?: boolean;
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
  uppercase = false,
  rectangle = false,
  rectangleRounded = false,
  line = false,
  lineNo = false,
  colorVariant,
  colorSecondary,
  backgroundNo = false,
  monochrome = false,
  tight = false,
  gapNo = false,
  segmentPosition,
  size = "normal",
  font = "sans",
  animationNo = false,
  animationNoGrow = false,
  animationNoColorChange = false,
  animationIconsNo = false,
  inverted = false,
  disabled = false,
  toggled = false,
  asSpan = false,
  className = "",
  ...rest
}: PrismButtonProps &
  (React.ComponentProps<"button"> | React.ComponentProps<"span">)) {
  const [hovered, setHovered] = React.useState(false);
  const rootRef = React.useRef<HTMLButtonElement | HTMLSpanElement>(null);
  const iconDrawDoneRef = React.useRef(false);

  // Determine effective hover state: toggled locks hover state, disabled disables it
  const effectiveHovered = disabled ? false : toggled ? true : hovered;

  // GSAP hover scale when shouldGrow; otherwise CSS handles transform or none
  const shouldGrow = !animationNo && !animationNoGrow && !line && !toggled;
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

  const kebab = colorToKebab(color);
  const effectiveBackgroundNo =
    colorVariant === "background-no" || (colorVariant == null && backgroundNo);
  const effectiveMonochrome =
    colorVariant === "monochrome" || (colorVariant == null && monochrome);
  const isGradient =
    colorVariant === "gradient-sideways" ||
    colorVariant === "gradient-up" ||
    colorVariant === "gradient-angle";
  const isBackgroundSolid = colorVariant === "background-solid";

  const secondColor: ColorName = colorSecondary ?? nextColorInSpectrum(color);
  const kebab2 = colorToKebab(secondColor);

  const gradientDir =
    colorVariant === "gradient-sideways"
      ? "to right"
      : colorVariant === "gradient-up"
        ? "to top"
        : colorVariant === "gradient-angle"
          ? "135deg"
          : "to right";
  const backgroundShade = colorVariant === "background-dark" ? "dark" : "light";
  const gradientBgLight = `linear-gradient(${gradientDir}, var(--color-${kebab}-100), var(--color-${kebab2}-100))`;
  const gradientBgDark = `linear-gradient(${gradientDir}, var(--color-${kebab}-800), var(--color-${kebab2}-800))`;
  const gradientBorder = gradientBgDark;
  const gradientBg =
    backgroundShade === "dark" ? gradientBgDark : gradientBgLight;
  const gradientHoverBg =
    backgroundShade === "dark" ? gradientBgLight : gradientBgDark;

  // Base colors (can be inverted)
  const baseBg = effectiveMonochrome
    ? "#ffffff"
    : isGradient
      ? gradientBg
      : backgroundShade === "dark"
        ? `var(--color-${kebab}-800)`
        : `var(--color-${kebab}-100)`;
  const baseFg = effectiveMonochrome
    ? "#000000"
    : backgroundShade === "dark"
      ? `var(--color-${kebab}-100)`
      : `var(--color-${kebab}-800)`;
  const baseHoverBg = effectiveMonochrome
    ? "#000000"
    : isGradient
      ? gradientHoverBg
      : backgroundShade === "dark"
        ? `var(--color-${kebab}-100)`
        : `var(--color-${kebab}-800)`;
  const baseHoverFg = effectiveMonochrome
    ? "#ffffff"
    : backgroundShade === "dark"
      ? `var(--color-${kebab}-800)`
      : `var(--color-${kebab}-100)`;

  // Apply inversion if requested (inversion applies to solid colors; gradients stay as-is for now)
  const bgVar = inverted && !isGradient ? baseFg : baseBg;
  const fgVar = inverted && !isGradient ? baseBg : baseFg;
  const bgHoverVar = inverted && !isGradient ? baseHoverFg : baseHoverBg;
  const fgHoverVar = inverted && !isGradient ? baseHoverBg : baseHoverFg;

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
  const tightMultiplier = tight ? 0.5 : 1;
  const paddingV = Math.round(BASE_PADDING_V * scaleFactor * tightMultiplier);
  const paddingH = Math.round(BASE_PADDING_H * scaleFactor * tightMultiplier);
  const fontSizePx = Math.round(BASE_FONT_SIZE * scaleFactor);
  const iconSize = Math.round(BASE_ICON_SIZE * scaleFactor);
  const gap = Math.round(6 * scaleFactor);
  const BASE_BORDER = 3;
  const strokeWidth = Math.max(2, Math.round(BASE_BORDER * scaleFactor));
  const hasFullBorder = !lineNo && !line;
  const borderWidth = hasFullBorder ? strokeWidth : 0;

  let baseRadius: number = 9999;
  if (rectangleRounded) baseRadius = 6;
  else if (rectangle) baseRadius = 0;
  // rounded = pill (default when no rectangle/rectangleRounded)

  // When gapNo + segmentPosition: only first/last get left/right edges; middle gets 0
  const borderRadiusValue: number | string =
    gapNo && segmentPosition === "first"
      ? `${baseRadius}px 0 0 ${baseRadius}px`
      : gapNo && segmentPosition === "last"
        ? `0 ${baseRadius}px ${baseRadius}px 0`
        : gapNo && segmentPosition === "middle"
          ? 0
          : baseRadius;

  // Apply color changes only if not disabled by animationNoColorChange
  const shouldChangeColor = !animationNo && !animationNoColorChange;

  // .color-background-solid: outline and background match (same solid or same gradient)
  const borderColorVar = isBackgroundSolid
    ? shouldChangeColor && effectiveHovered
      ? bgHoverVar
      : bgVar
    : shouldChangeColor && effectiveHovered
      ? bgHoverVar
      : fgVar;
  const borderSolidColor =
    isGradient && line
      ? `var(--color-${kebab}-800)`
      : typeof borderColorVar === "string"
        ? borderColorVar
        : undefined;
  const segmentBorders = gapNo && segmentPosition && hasFullBorder;
  const segmentBorderColor =
    segmentBorders &&
    typeof borderSolidColor === "string" &&
    !borderSolidColor.startsWith("linear-gradient")
      ? borderSolidColor
      : segmentBorders
        ? `var(--color-${kebab}-800)`
        : undefined;
  const borderStyle: React.CSSProperties = lineNo
    ? { border: "none" }
    : line
      ? {
          border: "none",
          borderBottomWidth: strokeWidth,
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
          ? { border: `${strokeWidth}px solid transparent` }
          : hasFullBorder && isGradient
            ? {
                /* Contrasting border (800) vs fill (100) */
                border: `${strokeWidth}px solid transparent`,
                backgroundImage: `${gradientBg}, ${gradientBorder}`,
                backgroundSize: "100% 100%, 100% 100%",
                backgroundOrigin: "padding-box, border-box",
                backgroundClip: "padding-box, border-box",
                backgroundPosition: "0 0, 0 0",
                backgroundRepeat: "no-repeat",
              }
            : {
                border: `${borderWidth}px solid`,
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

  const resolvedBg = effectiveBackgroundNo
    ? "transparent"
    : shouldChangeColor && effectiveHovered
      ? bgHoverVar
      : bgVar;
  const useGradientBorderLayers = hasFullBorder && isGradient;
  const paddingStyle = `${paddingV}px ${paddingH}px`;
  /* Gradient: .color-background-solid = same gradient fill and border; else border contrasts (800) */
  const resolvedGradient =
    shouldChangeColor && effectiveHovered ? gradientHoverBg : gradientBg;
  const gradientFillStyle: React.CSSProperties = useGradientBorderLayers
    ? isBackgroundSolid
      ? {
          border: `${strokeWidth}px solid transparent`,
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
              ? `${bgHoverVar}, ${gradientBorder}`
              : `${gradientBg}, ${gradientBorder}`,
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
      : typeof resolvedBg === "string" &&
          resolvedBg.startsWith("linear-gradient")
        ? { background: resolvedBg }
        : { backgroundColor: resolvedBg }),
    fontFamily,
    fontWeight: 800,
    fontSize: `${fontSizePx}px`,
    color: shouldChangeColor && effectiveHovered ? fgHoverVar : fgVar,
    cursor: asSpan || disabled ? "default" : "pointer",
    textTransform: uppercase ? "uppercase" : undefined,
    transition: transitionValue,
    transformOrigin: "center",
    transform: transformValue,
    willChange: shouldGrow ? "transform" : "auto",
    opacity: disabled ? 0.33 : 1,
    pointerEvents: disabled ? "none" : undefined,
    ...(gapNo && { margin: 0, lineHeight: 1 }),
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
    if (!disabled && !toggled) {
      requestAnimationFrame(() => setHovered(true));
    }
    if (asSpan)
      restSpan.onPointerEnter?.(e as React.PointerEvent<HTMLSpanElement>);
    else
      restButton.onPointerEnter?.(e as React.PointerEvent<HTMLButtonElement>);
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    if (!disabled && !toggled) {
      requestAnimationFrame(() => setHovered(false));
    }
    if (asSpan)
      restSpan.onPointerLeave?.(e as React.PointerEvent<HTMLSpanElement>);
    else
      restButton.onPointerLeave?.(e as React.PointerEvent<HTMLButtonElement>);
  };

  const dataAttrs = {
    "data-variant": variant,
    "data-icon-position": iconPosition !== "left" ? iconPosition : undefined,
    "data-uppercase": uppercase || undefined,
    "data-icon-only": iconOnly || undefined,
    "data-rectangle": rectangle || undefined,
    "data-rectangle-rounded": rectangleRounded || undefined,
    "data-line": line || undefined,
    "data-line-no": lineNo || undefined,
    "data-segment-position": segmentPosition,
    "data-color-variant": colorVariant,
    "data-color-secondary": colorSecondary,
    "data-background-no": backgroundNo || undefined,
    "data-monochrome": monochrome || undefined,
    "data-tight": tight || undefined,
    "data-gap-no": gapNo || undefined,
    "data-size": size !== "normal" ? size : undefined,
    "data-animation-no": animationNo || undefined,
    "data-animation-no-grow": animationNoGrow || undefined,
    "data-animation-no-color-change": animationNoColorChange || undefined,
    "data-animation-icons": (showIcon && !animationIconsNo) || undefined,
    "data-animation-icons-no": animationIconsNo || undefined,
    "data-inverted": inverted || undefined,
    "data-disabled": disabled || undefined,
    "data-toggled": toggled || undefined,
  };

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
