/**
 * Shared motion vocabulary for Prism UI: {@link PrismIconMotionProps.playback} modes,
 * {@link PrismEmoji} `animationMode`, and named GSAP/CSS duration steps (`durationIn`, …).
 */

export type PrismMotionPlaybackMode =
  | "loop"
  | "once"
  | "hover"
  | "occasionally";

/**
 * Same union as {@link PrismMotionPlaybackMode}; kept for emoji/Noto call sites and public API
 * stability.
 */
export type PrismEmojiAnimationMode = PrismMotionPlaybackMode;

export type PrismMotionDurationName =
  | "glacial"
  | "slow"
  | "regular"
  | "fast"
  | "speedy";

export const PRISM_MOTION_DURATION_SEC: Record<
  PrismMotionDurationName,
  number
> = {
  glacial: 5,
  slow: 2,
  regular: 1,
  fast: 0.5,
  speedy: 0.25,
};

export function resolvePrismMotionDurationSeconds(
  value: PrismMotionDurationName | number | undefined,
  defaultName: PrismMotionDurationName = "regular"
): number {
  if (value === undefined) return PRISM_MOTION_DURATION_SEC[defaultName];
  if (typeof value === "number" && Number.isFinite(value))
    return Math.max(0, value);
  return (
    PRISM_MOTION_DURATION_SEC[value as PrismMotionDurationName] ??
    PRISM_MOTION_DURATION_SEC[defaultName]
  );
}

/**
 * Curated entrance eases → GSAP `ease` strings. GSAP also accepts many built-ins (`elastic.out`,
 * `steps(12)`, etc.); this union is the small Prism vocabulary for icons.
 */
export type PrismMotionEasePreset = "none" | "in" | "out" | "bounce";

export const PRISM_MOTION_EASE_GSAP: Record<PrismMotionEasePreset, string> = {
  none: "none",
  in: "power2.in",
  out: "power2.out",
  bounce: "bounce.out",
};

/** Resolve {@link PrismIconMotionProps.easeIn} to a GSAP ease; default matches historical icon motion. */
export function resolvePrismMotionEaseGsap(
  preset?: PrismMotionEasePreset
): string {
  if (preset === undefined) return "power2.out";
  return PRISM_MOTION_EASE_GSAP[preset];
}

/** Material glyph entrance/exit presets. Lucide **stroke dash** draw-in uses {@link PrismIconMotionProps.draw} on {@link PrismIcon}. */
export type PrismIconMotionPreset = "fadeScale" | "none";

/** Curated shrink / grow range: entrance start scale and peak scale (loop · hover · bursts). */
export type PrismIconGrowPreset = "none" | "small" | "regular" | "large";

export const PRISM_ICON_GROW_PRESET_SCALES: Record<
  PrismIconGrowPreset,
  { scaleInFromPercent: number; scalePeakPercent: number }
> = {
  none: { scaleInFromPercent: 100, scalePeakPercent: 100 },
  small: { scaleInFromPercent: 90, scalePeakPercent: 110 },
  regular: { scaleInFromPercent: 85, scalePeakPercent: 125 },
  large: { scaleInFromPercent: 80, scalePeakPercent: 133 },
};

/** Curated entrance spin (degrees at the start of the in-tween, easing to 0). */
export type PrismIconEntranceRotatePreset = "none" | "small" | "full";

export const PRISM_ICON_ENTRANCE_ROTATE_DEG: Record<
  PrismIconEntranceRotatePreset,
  number
> = {
  none: 0,
  small: 10,
  full: 360,
};

export type PrismIconMotionProps = {
  /** @default `"once"` when a `motion` object is present */
  playback?: PrismMotionPlaybackMode;
  durationIn?: PrismMotionDurationName | number;
  durationOut?: PrismMotionDurationName | number;
  /**
   * **In pass** (same `durationIn`, same {@link easeIn}): opacity fades in together with **grow**
   * (scale) and **{@link entranceRotate}**. `"none"` skips that whole pass — **loop** / **hover** /
   * **occasionally** still use **grow** peaks.
   * (JSX prop name stays `presetIn` for compatibility.)
   */
  presetIn?: PrismIconMotionPreset;
  /**
   * `"stroke"` — animate Lucide path outlines in with stroke-dashoffset. Only applies when
   * {@link PrismIcon} `iconStyle` is `"lucide"` (use a Lucide `name`, e.g. `gem`).
   */
  draw?: "stroke";
  /**
   * Teardown **fade**: `"fadeScale"` fades opacity out when the `once` motion effect cleans up
   * (uses {@link durationOut} and {@link easeIn}). Ignored for other playback modes here.
   */
  presetOut?: PrismIconMotionPreset;
  /**
   * Shorthand scale range vs rest size (entrance start + pulse/hover peak). Used when
   * `scaleInFromPercent` / `scalePeakPercent` are omitted.
   */
  grow?: PrismIconGrowPreset;
  /**
   * Spin baked into the **in pass** with fade + grow. Numeric {@link rotateInDeg} wins when both
   * are set. No effect when {@link presetIn} is `"none"` (whole in pass skipped).
   */
  entranceRotate?: PrismIconEntranceRotatePreset;
  /**
   * Entrance scale start as **percent of rest size** (100 = no shrink). Default **92** when
   * `presetIn` is `"fadeScale"`; ignored when `presetIn` is `"none"`. Overrides {@link grow} for the
   * entrance start when set.
   */
  scaleInFromPercent?: number;
  /**
   * Peak scale as **percent of rest** for loop pulse, hover pop, and occasional bursts.
   * Default **106** when unset. Overrides {@link grow} for peak when set.
   */
  scalePeakPercent?: number;
  /** Degrees of rotation at entrance start; tweens to **0**. Ignored when `presetIn` is `"none"`. */
  rotateInDeg?: number;
  /**
   * Ease for the **in pass** (fade + grow + rotate), optional teardown fade, hover lift/return,
   * and occasional bursts. @default `"out"`. `"none"` maps to GSAP linear (`"none"`).
   */
  easeIn?: PrismMotionEasePreset;
  /** Opt out without removing the rest of `motion` */
  disabled?: boolean;
};

/** Same order of magnitude as Noto “occasionally” in {@link PrismEmoji}. */
export const PRISM_ICON_OCCASIONAL_MIN_MS = 5_000;
export const PRISM_ICON_OCCASIONAL_JITTER_MS = 5_000;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
