"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

import { cn } from "@utilities";
import type { PrismSize } from "../source/prism-size";
import {
  PRISM_ICON_ENTRANCE_ROTATE_DEG,
  PRISM_ICON_GROW_PRESET_SCALES,
  PRISM_ICON_OCCASIONAL_JITTER_MS,
  PRISM_ICON_OCCASIONAL_MIN_MS,
  type PrismIconEntranceRotatePreset,
  type PrismIconGrowPreset,
  type PrismIconMotionPreset,
  type PrismIconMotionProps,
  prefersReducedMotion,
  resolvePrismMotionDurationSeconds,
  resolvePrismMotionEaseGsap,
} from "../source/prism-motion";
import {
  prismColorSpecToIconGlyphPaint,
  type PartialPrismColorSpec,
} from "../styles/prism-color";
import { resolveLucideIconByName } from "../source/prism-icon-lucide-resolve";
import {
  PRISM_LUCIDE_DRAW_SVG_SELECTOR,
  prismLucideStrokeDraw,
  prismLucideStrokeDrawReset,
} from "../source/prism-lucide-stroke-draw";

export type PrismIconStyle = "material" | "lucide";

/** Named size steps map to pixel `fontSize` / clamped `opsz` (20–48); aligns with `PrismButton` `size`. */
export type PrismIconSizeName = PrismSize;

/**
 * Named weight steps map to the Material Symbols **stroke thickness** axis (numeric ladder **100–700**).
 * In variable-font tables that axis is often tagged **`wght`** next to weight-like axes; we still call it **stroke** in UI copy so it is not confused with CSS **font-weight** on text.
 * These five names are a curated ladder; pass a number for any other axis value.
 */
export type PrismIconWeightName =
  | "light"
  | "thin"
  | "regular"
  | "bold"
  | "heavy";

/** Filled variant: **FILL** axis `1` when `"on"`. */
export type PrismIconFillMode = "on" | "off";

export type {
  PrismIconEntranceRotatePreset,
  PrismIconGrowPreset,
  PrismIconMotionProps,
  PrismIconMotionPreset,
};

/** Single source of truth for {@link PrismIcon} when optional props are omitted. */
export const PRISM_ICON_DEFAULTS: {
  iconStyle: PrismIconStyle;
  size: PrismIconSizeName;
  weight: PrismIconWeightName;
  fill: PrismIconFillMode;
} = {
  iconStyle: "material",
  size: "regular",
  weight: "regular",
  fill: "off",
};

export interface PrismIconProps {
  /**
   * Icon library for `name`: Material Symbols ligature (`material`) or Lucide id (`lucide`, kebab-case or PascalCase).
   * @default {@link PRISM_ICON_DEFAULTS.iconStyle} (`"material"`)
   */
  iconStyle?: PrismIconStyle;
  name: string;
  className?: string;
  /**
   * Named step or raw pixel size for layout-driven cases (still clamps **opsz** to 20–48).
   * @default {@link PRISM_ICON_DEFAULTS.size} (`"regular"`)
   */
  size?: PrismIconSizeName | number;
  /**
   * Named step (`light` … `heavy` → **100 / 200 / 400 / 600 / 700** on the symbol stroke axis) or any integer **100–700**
   * (use a number for steps between named values, e.g. **300**).
   * @default {@link PRISM_ICON_DEFAULTS.weight} (`"regular"`)
   */
  weight?: PrismIconWeightName | number;
  /** @default {@link PRISM_ICON_DEFAULTS.fill} (`"off"`) */
  fill?: PrismIconFillMode;
  /**
   * Same shape as other Prism `color` props; resolved by `prismColorSpecToIconGlyphPaint`:
   * solid `color`, or **`gradient.swatches`** → resolved `linear-gradient` + background-clip text
   * (light ramp; glyphs cannot use `color: linear-gradient(...)`).
   *
   * When omitted, no glyph `color` / gradient is set inline — the symbol inherits **`color`**
   * from CSS (typically the parent text color, e.g. `text-foreground`), not a fixed black hex.
   */
  color?: PartialPrismColorSpec;
  /** GSAP motion on the icon root; `draw: "stroke"` applies only when {@link iconStyle} is `"lucide"`. */
  motion?: PrismIconMotionProps;
}

const PRISM_ICON_SIZE_NAME_TO_PX: Record<PrismIconSizeName, number> = {
  small: 20,
  regular: 24,
  large: 28,
  huge: 48,
  gigantic: 64,
};

/** Same numeric ladder as {@link PrismTypographyProps.fontWeight} named presets. */
export const PRISM_ICON_WEIGHT_NAME_TO_VALUE: Record<
  PrismIconWeightName,
  number
> = {
  light: 100,
  thin: 200,
  regular: 400,
  bold: 600,
  heavy: 700,
};

function resolvePrismIconSizePx(size: PrismIconProps["size"]): number {
  if (size === undefined)
    return PRISM_ICON_SIZE_NAME_TO_PX[PRISM_ICON_DEFAULTS.size];
  if (typeof size === "number") return size;
  return PRISM_ICON_SIZE_NAME_TO_PX[size];
}

function resolvePrismIconWeightValue(weight: PrismIconProps["weight"]): number {
  if (weight === undefined)
    return PRISM_ICON_WEIGHT_NAME_TO_VALUE[PRISM_ICON_DEFAULTS.weight];
  if (typeof weight === "number") {
    return Math.min(700, Math.max(100, Math.round(weight)));
  }
  return PRISM_ICON_WEIGHT_NAME_TO_VALUE[weight];
}

/**
 * Lucide `strokeWidth` in SVG user units. Ladder matches Material **wght** (regular ≈ 2.5 at
 * {@link PRISM_ICON_SIZE_NAME_TO_PX.regular}). Scaled by `sizePx` so the same `weight` reads
 * equally on screen at every named size — without this, Lucide strokes grow with `size` and
 * `light` on `huge` looks much heavier than `light` on `small`.
 */
export function resolvePrismIconLucideStrokeWidth(
  weight: PrismIconProps["weight"] | undefined,
  sizePx: number = PRISM_ICON_SIZE_NAME_TO_PX.regular
): number {
  const wght = resolvePrismIconWeightValue(weight);
  const strokeAtRegular = 1.65 + ((wght - 100) / 600) * 1.85;
  if (sizePx <= 0) return strokeAtRegular;
  return strokeAtRegular * (PRISM_ICON_SIZE_NAME_TO_PX.regular / sizePx);
}

function resolvePrismIconFill(fill: PrismIconProps["fill"]): boolean {
  if (fill === undefined) return PRISM_ICON_DEFAULTS.fill === "on";
  return fill === "on";
}

function defaultScaleInFrom(preset: PrismIconMotionPreset): number {
  return preset === "fadeScale" ? 0.92 : 1;
}

function resolveEntranceScale0(
  preset: PrismIconMotionPreset,
  m: PrismIconMotionProps
): number {
  if (preset === "none") return 1;
  if (m.scaleInFromPercent !== undefined) {
    return Math.max(0.05, m.scaleInFromPercent / 100);
  }
  if (m.grow !== undefined) {
    return Math.max(
      0.05,
      PRISM_ICON_GROW_PRESET_SCALES[m.grow].scaleInFromPercent / 100
    );
  }
  return defaultScaleInFrom(preset);
}

function resolvePeakScale(m: PrismIconMotionProps): number {
  if (m.scalePeakPercent !== undefined) {
    return Math.max(0.05, m.scalePeakPercent / 100);
  }
  if (m.grow !== undefined) {
    return Math.max(
      0.05,
      PRISM_ICON_GROW_PRESET_SCALES[m.grow].scalePeakPercent / 100
    );
  }
  return 1.06;
}

function resolveRotateInDeg(m: PrismIconMotionProps): number {
  if (m.rotateInDeg !== undefined) return m.rotateInDeg;
  const preset: PrismIconEntranceRotatePreset = m.entranceRotate ?? "none";
  return PRISM_ICON_ENTRANCE_ROTATE_DEG[preset];
}

/**
 * Match {@link PrismButton} Lucide stroke-draw: measure every matched geometry node, set dash,
 * then tween — not embedded in a parent timeline (reliable with nested `svg` paths).
 */
function runStrokeDrawGsap(
  root: HTMLElement,
  durationSec: number,
  ease: string,
  /** Fires after the last staggered segment finishes (or immediately if there are no paths). */
  onComplete?: () => void
): void {
  const result = prismLucideStrokeDraw(root, {
    durationSec,
    ease,
    onComplete,
  });
  if (result === "none") onComplete?.();
}

function resetStrokeDashInline(root: HTMLElement): void {
  prismLucideStrokeDrawReset(root);
}

function runIconEntranceFromTo(
  el: HTMLElement,
  presetIn: PrismIconMotionPreset,
  durationSec: number,
  m: PrismIconMotionProps,
  onComplete?: () => void
): void {
  const easeGsap = resolvePrismMotionEaseGsap(m.easeIn);
  if (presetIn === "none") {
    gsap.set(el, { opacity: 1, scale: 1, rotation: 0 });
    onComplete?.();
    return;
  }
  const scale0 = resolveEntranceScale0(presetIn, m);
  const rotate0 = resolveRotateInDeg(m);
  gsap.fromTo(
    el,
    { opacity: 0, scale: scale0, rotation: rotate0 },
    {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: durationSec,
      ease: easeGsap,
      onComplete,
    }
  );
}

type PrismLucideIconGlyphProps = {
  icon: LucideIcon;
  sizePx: number;
  weight: PrismIconProps["weight"];
  filled: boolean;
  glyphPaint: ReturnType<typeof prismColorSpecToIconGlyphPaint> | undefined;
};

/** Renders a resolved Lucide icon; keeps lookup out of {@link PrismIcon} JSX (static-components). */
function PrismLucideIconGlyph({
  icon: Icon,
  sizePx,
  weight,
  filled,
  glyphPaint,
}: PrismLucideIconGlyphProps) {
  return (
    <span style={{ display: "inline-flex", color: "inherit" }}>
      <Icon
        size={sizePx}
        strokeWidth={resolvePrismIconLucideStrokeWidth(weight, sizePx)}
        fill={filled ? "currentColor" : "none"}
        className={cn(
          "shrink-0",
          !(glyphPaint && "solid" in glyphPaint) ? "text-foreground" : undefined
        )}
        {...(glyphPaint && "solid" in glyphPaint
          ? { color: glyphPaint.solid }
          : {})}
        aria-hidden
      />
    </span>
  );
}

export function PrismIcon({
  name,
  className,
  iconStyle = PRISM_ICON_DEFAULTS.iconStyle,
  size = PRISM_ICON_DEFAULTS.size,
  weight = PRISM_ICON_DEFAULTS.weight,
  fill = PRISM_ICON_DEFAULTS.fill,
  color: colorSpec,
  motion: motionProp,
}: PrismIconProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const epochRef = useRef(0);

  const useLucide = iconStyle === "lucide";

  const lucideIcon = useLucide ? resolveLucideIconByName(name) : null;

  const strokeDraw = Boolean(
    useLucide &&
    lucideIcon &&
    motionProp &&
    !motionProp.disabled &&
    motionProp.draw === "stroke"
  );

  const sizePx = resolvePrismIconSizePx(size);
  const weightValue = resolvePrismIconWeightValue(weight);
  const filled = resolvePrismIconFill(fill);
  const opsz = Math.min(48, Math.max(20, sizePx));
  const glyphPaint =
    colorSpec !== undefined &&
    colorSpec !== null &&
    Object.keys(colorSpec).length > 0
      ? prismColorSpecToIconGlyphPaint(colorSpec)
      : undefined;

  const gradientClipStyle =
    glyphPaint && "gradient" in glyphPaint
      ? {
          display: "inline-block" as const,
          backgroundImage: glyphPaint.gradient,
          backgroundRepeat: "no-repeat" as const,
          backgroundSize: "100% 100%" as const,
          color: "transparent",
          WebkitBackgroundClip: "text" as const,
          backgroundClip: "text" as const,
          WebkitTextFillColor: "transparent" as const,
        }
      : {};

  const solidStyle =
    glyphPaint && "solid" in glyphPaint ? { color: glyphPaint.solid } : {};

  useEffect(() => {
    const m = motionProp;
    const el = rootRef.current;
    if (!m || m.disabled || !el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, scale: 1, rotation: 0 });
      if (strokeDraw) resetStrokeDashInline(el);
      return;
    }

    epochRef.current += 1;
    const epoch = epochRef.current;
    const done = () => epochRef.current !== epoch;

    const killAllTweens = () => {
      gsap.killTweensOf(el);
      if (strokeDraw) {
        const stroked = el.querySelectorAll<SVGGeometryElement>(
          PRISM_LUCIDE_DRAW_SVG_SELECTOR
        );
        gsap.killTweensOf(stroked);
      }
    };

    let cancelled = false;
    let innerCleanup: (() => void) | undefined;

    const run = () => {
      if (cancelled || done()) return;
      killAllTweens();

      const playback = m.playback ?? "once";
      const presetIn = m.presetIn ?? "fadeScale";
      const durIn = resolvePrismMotionDurationSeconds(
        m.durationIn ?? "regular"
      );
      const easeIn = resolvePrismMotionEaseGsap(m.easeIn);

      if (playback === "once") {
        if (strokeDraw) runStrokeDrawGsap(el, durIn, easeIn);
        runIconEntranceFromTo(el, presetIn, durIn, m);
        innerCleanup = () => {
          if (done()) return;
          if (m.presetOut === "fadeScale") {
            const outDur = resolvePrismMotionDurationSeconds(
              m.durationOut ?? "speedy"
            );
            killAllTweens();
            gsap.to(el, {
              opacity: 0,
              duration: outDur,
              ease: resolvePrismMotionEaseGsap(m.easeIn),
            });
          } else {
            killAllTweens();
          }
        };
        return;
      }

      if (playback === "loop") {
        const pulseDur = Math.max(
          0.15,
          resolvePrismMotionDurationSeconds(m.durationIn ?? "regular") * 0.35
        );
        const peak = resolvePeakScale(m);
        const startPulse = () => {
          if (done()) return;
          gsap.to(el, {
            scale: peak,
            duration: pulseDur,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        };
        if (presetIn !== "none") {
          let entranceDone = false;
          let strokeDone = !strokeDraw;
          const tryStartPulse = () => {
            if (done() || !entranceDone || !strokeDone) return;
            startPulse();
          };
          if (strokeDraw) {
            runStrokeDrawGsap(el, durIn, easeIn, () => {
              strokeDone = true;
              tryStartPulse();
            });
          }
          runIconEntranceFromTo(el, presetIn, durIn, m, () => {
            entranceDone = true;
            tryStartPulse();
          });
        } else {
          gsap.set(el, { opacity: 1, scale: 1, rotation: 0 });
          if (strokeDraw) {
            runStrokeDrawGsap(el, durIn, easeIn, () => {
              if (done()) return;
              startPulse();
            });
          } else {
            startPulse();
          }
        }
        innerCleanup = () => {
          killAllTweens();
        };
        return;
      }

      if (playback === "hover") {
        gsap.set(el, { opacity: 1, scale: 1, rotation: 0 });
        if (strokeDraw) runStrokeDrawGsap(el, durIn, easeIn);
        if (presetIn !== "none") {
          runIconEntranceFromTo(el, presetIn, durIn, m);
        }
        const durHover = resolvePrismMotionDurationSeconds(
          m.durationIn ?? "fast"
        );
        const peak = resolvePeakScale(m);
        const hoverEase = resolvePrismMotionEaseGsap(m.easeIn);
        const onEnter = () => {
          gsap.to(el, {
            scale: peak,
            duration: durHover,
            ease: hoverEase,
            overwrite: true,
          });
        };
        const onLeave = () => {
          gsap.to(el, {
            scale: 1,
            duration: resolvePrismMotionDurationSeconds("speedy"),
            ease: hoverEase,
            overwrite: true,
          });
        };
        el.addEventListener("pointerenter", onEnter);
        el.addEventListener("pointerleave", onLeave);
        innerCleanup = () => {
          el.removeEventListener("pointerenter", onEnter);
          el.removeEventListener("pointerleave", onLeave);
          killAllTweens();
        };
        return;
      }

      if (playback === "occasionally") {
        gsap.set(el, { opacity: 1, scale: 1, rotation: 0 });
        if (strokeDraw) runStrokeDrawGsap(el, durIn, easeIn);
        if (presetIn !== "none") {
          runIconEntranceFromTo(el, presetIn, durIn, m);
        }
        let timeoutId: number | undefined;
        const peak = resolvePeakScale(m);
        const burstEase = resolvePrismMotionEaseGsap(m.easeIn);
        const burst = () => {
          if (done()) return;
          gsap
            .timeline()
            .to(el, { scale: peak, duration: 0.12, ease: burstEase })
            .to(el, { scale: 1, duration: 0.2, ease: burstEase });
        };
        const schedule = () => {
          if (done()) return;
          const delay =
            PRISM_ICON_OCCASIONAL_MIN_MS +
            Math.random() * PRISM_ICON_OCCASIONAL_JITTER_MS;
          timeoutId = window.setTimeout(() => {
            if (done()) return;
            burst();
            schedule();
          }, delay);
        };
        schedule();
        innerCleanup = () => {
          if (timeoutId !== undefined) window.clearTimeout(timeoutId);
          killAllTweens();
        };
        return;
      }

      innerCleanup = () => {
        killAllTweens();
      };
    };

    let rafId = 0;
    if (strokeDraw) {
      rafId = requestAnimationFrame(run);
    } else {
      run();
    }

    return () => {
      cancelled = true;
      if (strokeDraw) cancelAnimationFrame(rafId);
      innerCleanup?.();
    };
  }, [name, motionProp, strokeDraw, lucideIcon]);

  if (useLucide && !lucideIcon) {
    const nodeEnv = (
      globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }
    ).process?.env?.NODE_ENV;
    if (nodeEnv !== "production") {
      console.warn(
        `[PrismIcon] No Lucide icon for name "${name}". Use a Lucide id (e.g. gem, layout-grid).`
      );
    }
    return null;
  }

  return (
    <span
      ref={rootRef}
      className={cn(
        useLucide
          ? "inline-flex items-center justify-center"
          : "material-symbols-rounded",
        className
      )}
      style={{
        ...(useLucide
          ? { transformOrigin: "center" }
          : {
              fontSize: `${sizePx}px`,
              fontFeatureSettings: '"liga" 1',
              fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weightValue}, 'GRAD' 0, 'opsz' ${opsz}`,
              transformOrigin: "center",
              ...solidStyle,
              ...gradientClipStyle,
            }),
      }}
    >
      {useLucide && lucideIcon ? (
        <PrismLucideIconGlyph
          icon={lucideIcon}
          sizePx={sizePx}
          weight={weight}
          filled={filled}
          glyphPaint={glyphPaint}
        />
      ) : (
        name
      )}
    </span>
  );
}
