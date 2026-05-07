"use client";

import { cn } from "@utilities";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { PrismSize } from "../source/prism-size";
import {
  prismColorSpecToHex,
  prismColorSpecToIconGlyphPaint,
  type PartialPrismColorSpec,
} from "../styles/prism-color";

/** Named size steps match {@link PRISM_ICON_SIZE_NAME_TO_PX} in `prism-icon.tsx` (20 / 24 / 28 / 48 / 64). */
export type PrismEmojiStyle =
  | "native"
  | "googleNotoColor"
  | "googleNotoAnimated";

/**
 * GIF rasters cannot be frame-scrubbed in `<img>`. Non-`loop` modes swap between
 * static **PNG** (idle) and **GIF** (motion) to approximate the behavior.
 */
export type PrismEmojiAnimationMode =
  | "loop"
  | "once"
  | "hover"
  | "occasionally";

/**
 * Base URL without trailing slash. In TimeTraveler, default
 * `/noto-emoji/latest` is served by `app/noto-emoji/[...path]/route.ts`.
 * Override with `NEXT_PUBLIC_NOTO_EMOJI_CDN_BASE` to hit gstatic directly.
 */
export function getNotoEmojiCdnBase(): string {
  try {
    const fromEnv =
      typeof process !== "undefined" && process.env.NEXT_PUBLIC_NOTO_EMOJI_CDN_BASE
        ? String(process.env.NEXT_PUBLIC_NOTO_EMOJI_CDN_BASE).trim()
        : "";
    if (fromEnv.length > 0) {
      return fromEnv.replace(/\/$/, "");
    }
  } catch {
    /* env not available (e.g. some test runners) */
  }
  return "https://fonts.gstatic.com/s/e/notoemoji/latest";
}

const PRISM_EMOJI_SIZE_NAME_TO_PX: Record<PrismSize, number> = {
  small: 20,
  medium: 24,
  large: 28,
  huge: 48,
  gigantic: 64,
};

const PRISM_EMOJI_DEFAULTS: {
  emojiStyle: PrismEmojiStyle;
  size: PrismSize | "inherit" | number;
  animationMode: PrismEmojiAnimationMode;
  colorDesaturate: boolean;
} = {
  emojiStyle: "googleNotoColor",
  size: "inherit",
  animationMode: "loop",
  colorDesaturate: true,
};

export type PrismEmojiSize = PrismSize | "inherit" | number;

const PRISM_EMOJI_BURST_MS = 3200;

const NOTO_EMOJI_CDN_RASTER_PX = 512 as const;

function notoAssetUrl(key: string, ext: "png" | "gif"): string {
  return `${getNotoEmojiCdnBase()}/${key}/${NOTO_EMOJI_CDN_RASTER_PX}.${ext}`;
}

function resolvePrismEmojiDisplayPx(
  size: PrismEmojiProps["size"] | undefined
): number {
  if (size === undefined || size === "inherit") {
    return PRISM_EMOJI_SIZE_NAME_TO_PX.medium;
  }
  if (typeof size === "number") return size;
  return PRISM_EMOJI_SIZE_NAME_TO_PX[size];
}

function rootSizeStyle(size: PrismEmojiProps["size"] | undefined): CSSProperties {
  if (size === "inherit") {
    return {
      width: "1em",
      height: "1em",
      /** Native emoji is text — match glyph size to the em box. */
      fontSize: "1em",
      verticalAlign: "-0.15em",
    };
  }
  const px = resolvePrismEmojiDisplayPx(
    size === undefined ? PRISM_EMOJI_DEFAULTS.size : size
  );
  return {
    width: px,
    height: px,
    /** Native path renders a character; without this, inherited ~16px text sits in a large px box. */
    fontSize: px,
    verticalAlign: "-0.15em",
  };
}

/** Google Noto paths use lowercase hex segments joined with `_` (hyphens 404). */
export function normalizeCodepointSequenceKey(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed
    .split(/[\s,_-]+/u)
    .map((p) => p.replace(/^U\+/gi, ""))
    .filter(Boolean);
  if (
    parts.length === 0 ||
    !parts.every((p) => /^[0-9a-f]{2,8}$/i.test(p))
  ) {
    return null;
  }
  return parts.map((p) => p.toLowerCase()).join("_");
}

function codepointKeyToEmoji(key: string): string | null {
  try {
    const nums = key.split("_").map((h) => parseInt(h, 16));
    if (nums.some((n) => Number.isNaN(n))) return null;
    return String.fromCodePoint(...nums);
  } catch {
    return null;
  }
}

/** Public for admin/debug: first grapheme cluster → Noto CDN path segment. */
export function emojiToCodepointKey(emoji: string): string | null {
  const trimmed = emoji.trim();
  if (!trimmed) return null;

  const segmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;

  const firstCluster = segmenter
    ? [...segmenter.segment(trimmed)][0]?.segment
    : trimmed;

  if (!firstCluster) return null;

  const codepoints: number[] = [];
  for (let i = 0; i < firstCluster.length; ) {
    const cp = firstCluster.codePointAt(i);
    if (cp === undefined) break;
    codepoints.push(cp);
    i += cp > 0xffff ? 2 : 1;
  }
  if (codepoints.length === 0) return null;
  return codepoints.map((cp) => cp.toString(16)).join("_");
}

/** CDN URL for a resolved key (admin / debugging). CDN `latest` uses 512-only rasters. */
export function buildNotoEmojiRasterUrl(
  key: string,
  _displayPx: number,
  ext: "webp" | "gif" | "png"
): string {
  return `${getNotoEmojiCdnBase()}/${key}/${NOTO_EMOJI_CDN_RASTER_PX}.${ext}`;
}

export const PRISM_EMOJI_DEFAULT_STYLE = PRISM_EMOJI_DEFAULTS.emojiStyle;

export interface PrismEmojiProps {
  emoji?: string;
  codepoint?: string;
  /** @default {@link PRISM_EMOJI_DEFAULTS.emojiStyle} */
  emojiStyle?: PrismEmojiStyle;
  size?: PrismEmojiSize;
  /**
   * How motion is shown when a GIF exists. `loop` plays the GIF for both Noto styles.
   * Other modes alternate PNG/GIF (GIF cannot be seeked in `<img>`).
   * @default {@link PRISM_EMOJI_DEFAULTS.animationMode}
   */
  animationMode?: PrismEmojiAnimationMode;
  /**
   * Same {@link PartialPrismColorSpec} shape as {@link PrismIconProps.color}.
   * Raster is painted as a filtered `background-image` (when needed), then a multiply layer
   * tinted with the PNG alpha mask so letterboxing stays clear. Ignored for `native`.
   */
  color?: PartialPrismColorSpec;
  /**
   * Reserved for future use; has no effect with the current `luminosity`-blend colour
   * implementation (luminosity blend already discards source hue/saturation).
   * @default {@link PRISM_EMOJI_DEFAULTS.colorDesaturate}
   */
  colorDesaturate?: boolean;
  className?: string;
  title?: string;
  style?: CSSProperties;
}

/** Parses `#RRGGBB` / `#RGB` → [r, g, b] in 0–1 range. */
function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace(/^#/, "");
  if (h.length === 6) {
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }
  if (h.length === 3) {
    return [
      parseInt(h[0]! + h[0], 16) / 255,
      parseInt(h[1]! + h[1], 16) / 255,
      parseInt(h[2]! + h[2], 16) / 255,
    ];
  }
  return null;
}

type ResolvedColorPaint =
  | {
      kind: "solid";
      hex: string;
      rgb: [number, number, number];
      /**
       * Shade 800 of the same palette family — used as the duotone shadow stop so
       * dark emoji areas map to a proper dark palette colour rather than muddy near-black.
       */
      shadowRgb: [number, number, number] | null;
      /**
       * Shade 100 of the same palette family — used as the duotone highlight stop.
       */
      highlightRgb: [number, number, number] | null;
    }
  | { kind: "gradient"; css: string };

function resolveColorPaint(
  spec: PartialPrismColorSpec | undefined
): ResolvedColorPaint | undefined {
  if (!spec || Object.keys(spec).length === 0) return undefined;
  const paint = prismColorSpecToIconGlyphPaint(spec);
  if (!paint) return undefined;
  if ("gradient" in paint) return { kind: "gradient", css: paint.gradient };
  const rgb = hexToRgb(paint.solid);
  if (!rgb) return undefined;
  // Derive shadow (shade 800) and highlight (shade 100) from the same palette family.
  const shadowRgb = hexToRgb(prismColorSpecToHex({ ...spec, shade: 800 }));
  const highlightRgb = hexToRgb(prismColorSpecToHex({ ...spec, shade: 100 }));
  return { kind: "solid", hex: paint.solid, rgb, shadowRgb, highlightRgb };
}

/**
 * Builds a single 4×5 SVG `feColorMatrix` values string that desaturates a
 * pixel then maps its luminance to the target colour — in one matrix pass.
 * Alpha is preserved so transparent pixels (letterbox) stay transparent.
 */
function buildColorizeMatrix(
  r: number,
  g: number,
  b: number,
  desaturate: boolean
): string {
  const f = (n: number) => n.toFixed(5);
  if (desaturate) {
    // Combined: luminance-weight channels then scale by target colour.
    return [
      `${f(r * 0.2126)} ${f(r * 0.7152)} ${f(r * 0.0722)} 0 0`,
      `${f(g * 0.2126)} ${f(g * 0.7152)} ${f(g * 0.0722)} 0 0`,
      `${f(b * 0.2126)} ${f(b * 0.7152)} ${f(b * 0.0722)} 0 0`,
      "0 0 0 1 0",
    ].join(" ");
  }
  // Multiply each channel by the corresponding target fraction.
  return [`${f(r)} 0 0 0 0`, `0 ${f(g)} 0 0 0`, `0 0 ${f(b)} 0 0`, "0 0 0 1 0"].join(
    " "
  );
}

function maskStyleForPngUrl(pngUrl: string): CSSProperties {
  return {
    maskImage: `url("${pngUrl}")`,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskImage: `url("${pngUrl}")`,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
  };
}

function clearOccasionTimers(ref: {
  current: { w?: number; e?: number };
}) {
  const { w, e } = ref.current;
  if (w !== undefined) window.clearTimeout(w);
  if (e !== undefined) window.clearTimeout(e);
  ref.current = {};
}

/**
 * Inline-safe emoji: native system glyph, or Google Noto PNG/GIF from CDN or proxy.
 */
export function PrismEmoji({
  emoji,
  codepoint,
  emojiStyle = PRISM_EMOJI_DEFAULTS.emojiStyle,
  size = PRISM_EMOJI_DEFAULTS.size,
  animationMode = PRISM_EMOJI_DEFAULTS.animationMode,
  color,
  colorDesaturate = PRISM_EMOJI_DEFAULTS.colorDesaturate,
  className,
  title,
  style,
}: PrismEmojiProps) {
  const key = useMemo(() => {
    if (emoji !== undefined && emoji.trim() !== "") {
      return emojiToCodepointKey(emoji);
    }
    if (codepoint !== undefined && codepoint.trim() !== "") {
      return normalizeCodepointSequenceKey(codepoint);
    }
    return null;
  }, [emoji, codepoint]);

  const fallbackChar = useMemo(() => {
    if (emoji !== undefined && emoji.trim() !== "") {
      return emoji.trim();
    }
    if (key) {
      return codepointKeyToEmoji(key) ?? "�";
    }
    return "�";
  }, [emoji, key]);

  const [assetBroken, setAssetBroken] = useState(false);
  const loadGenerationRef = useRef(0);

  const [burst, setBurst] = useState(false);
  const [hover, setHover] = useState(false);
  const occasionTimersRef = useRef<{ w?: number; e?: number }>({});
  /** Bumped when `animationMode` / `key` / `emojiStyle` changes so timers and bursts reset. */
  const animationEpochRef = useRef(0);

  useEffect(() => {
    loadGenerationRef.current += 1;
    setAssetBroken(false);
    return () => {
      loadGenerationRef.current += 1;
    };
  }, [key, emojiStyle, size]);

  useEffect(() => {
    animationEpochRef.current += 1;
    setBurst(false);
    setHover(false);
    clearOccasionTimers(occasionTimersRef);
  }, [animationMode, key, emojiStyle]);

  useEffect(() => {
    if (animationMode !== "once" || !key || emojiStyle !== "googleNotoAnimated") return;
    const epoch = animationEpochRef.current;
    setBurst(true);
    const t = window.setTimeout(() => {
      if (animationEpochRef.current !== epoch) return;
      setBurst(false);
    }, PRISM_EMOJI_BURST_MS);
    return () => window.clearTimeout(t);
  }, [animationMode, key, emojiStyle]);

  useEffect(() => {
    if (animationMode !== "occasionally" || emojiStyle !== "googleNotoAnimated" || !key) {
      return;
    }
    const epochAtStart = animationEpochRef.current;
    const plan = () => {
      if (animationEpochRef.current !== epochAtStart) return;
      clearOccasionTimers(occasionTimersRef);
      occasionTimersRef.current.w = window.setTimeout(() => {
        if (animationEpochRef.current !== epochAtStart) return;
        setBurst(true);
        occasionTimersRef.current.e = window.setTimeout(() => {
          if (animationEpochRef.current !== epochAtStart) return;
          setBurst(false);
          plan();
        }, PRISM_EMOJI_BURST_MS);
      }, 5000 + Math.random() * 5000);
    };
    plan();
    return () => {
      clearOccasionTimers(occasionTimersRef);
    };
  }, [animationMode, key, emojiStyle]);

  const handleImgError = useCallback(() => {
    const generationWhenError = loadGenerationRef.current;
    queueMicrotask(() => {
      if (loadGenerationRef.current !== generationWhenError) {
        return;
      }
      setAssetBroken(true);
    });
  }, []);

  const boxStyle = useMemo(
    () => ({
      ...rootSizeStyle(size),
      ...style,
    }),
    [size, style]
  );

  const colorPaint = useMemo(
    () => (emojiStyle !== "native" ? resolveColorPaint(color) : undefined),
    [color, emojiStyle]
  );
  const applyColor = Boolean(colorPaint);
  /** Stable SVG filter ID — colons in React's useId output are not valid XML IDs. */
  const rawFilterId = useId();
  const colorFilterId = `pef${rawFilterId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const showGif = useMemo(() => {
    // Only googleNotoAnimated has a GIF to show.
    if (!key || emojiStyle !== "googleNotoAnimated") return false;
    if (animationMode === "loop") return true;
    if (animationMode === "hover") return hover;
    if (animationMode === "once" || animationMode === "occasionally") return burst;
    return false;
  }, [key, emojiStyle, animationMode, hover, burst]);

  const pngUrl = key ? notoAssetUrl(key, "png") : "";
  const gifUrl = key ? notoAssetUrl(key, "gif") : "";
  const rasterSrc = showGif ? gifUrl : pngUrl;

  const hoverHandlers = {
    onMouseEnter: () => { if (animationMode === "hover") setHover(true); },
    onMouseLeave: () => { if (animationMode === "hover") setHover(false); },
  };

  if (emojiStyle === "native" || !key || assetBroken) {
    return (
      <span
        className={cn("inline-block select-none leading-none", className)}
        style={boxStyle}
        title={title}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      >
        {fallbackChar}
      </span>
    );
  }

  /**
   * Color branch — solid colours use an inline SVG `feColorMatrix` filter applied
   * directly to the `<img>`.  The matrix desaturates then remaps to the target hue,
   * operating per pixel including animated GIF frames.  Transparent letterbox pixels
   * remain transparent — no overlay, no backdrop, no mask needed.
   *
   * Gradient colours fall back to a `mask-image` silhouette (PNG only; GIF without
   * mask so animation is not clipped, accepting a small tint halo).
   */
  if (applyColor && colorPaint) {
    if (colorPaint.kind === "solid") {
      const { rgb, shadowRgb, highlightRgb } = colorPaint;
      const f = (n: number) => n.toFixed(5);
      const useDuotone =
        colorDesaturate !== false && shadowRgb !== null && highlightRgb !== null;

      return (
        <span
          className={cn("relative inline-block shrink-0 overflow-hidden", className)}
          style={boxStyle}
          title={title}
          role={title ? "img" : undefined}
          aria-label={title}
          aria-hidden={title ? undefined : true}
          {...hoverHandlers}
        >
          <svg
            width="0"
            height="0"
            aria-hidden
            focusable="false"
            style={{ position: "absolute" }}
          >
            <defs>
              <filter id={colorFilterId} colorInterpolationFilters="sRGB">
                {useDuotone ? (
                  <>
                    {/* Desaturate to luminance then remap via palette-derived 3-stop table:
                        luminance 0 → shade 800 (shadow), 0.5 → chosen shade, 1 → shade 100 (highlight).
                        Keeps dark and light areas within the chosen palette family. */}
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                      <feFuncR
                        type="table"
                        tableValues={`${f(shadowRgb![0])} ${f(rgb[0])} ${f(highlightRgb![0])}`}
                      />
                      <feFuncG
                        type="table"
                        tableValues={`${f(shadowRgb![1])} ${f(rgb[1])} ${f(highlightRgb![1])}`}
                      />
                      <feFuncB
                        type="table"
                        tableValues={`${f(shadowRgb![2])} ${f(rgb[2])} ${f(highlightRgb![2])}`}
                      />
                    </feComponentTransfer>
                  </>
                ) : (
                  /* colorDesaturate={false}: simple per-channel multiply (no desaturation). */
                  <feColorMatrix
                    type="matrix"
                    values={buildColorizeMatrix(rgb[0], rgb[1], rgb[2], false)}
                  />
                )}
              </filter>
            </defs>
          </svg>
          <img
            key={rasterSrc}
            src={rasterSrc}
            alt=""
            decoding="async"
            loading="eager"
            draggable={false}
            onError={handleImgError}
            className="relative z-0 block size-full object-contain"
            style={{ filter: `url(#${colorFilterId})` }}
          />
        </span>
      );
    }

    // Gradient fallback: mask approach — flat gradient silhouette.
    return (
      <span
        className={cn("relative isolate inline-block shrink-0", className)}
        style={{
          ...boxStyle,
          backgroundImage: colorPaint.css,
          ...(showGif ? undefined : maskStyleForPngUrl(pngUrl)),
        }}
        title={title}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
        {...hoverHandlers}
      >
        <img
          key={rasterSrc}
          src={rasterSrc}
          alt=""
          decoding="async"
          loading="eager"
          draggable={false}
          onError={handleImgError}
          className="relative z-0 block size-full object-contain"
          style={{ mixBlendMode: "luminosity" }}
        />
      </span>
    );
  }

  return (
    <span
      className={cn("relative isolate inline-block shrink-0 overflow-hidden", className)}
      style={boxStyle}
      title={title}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...hoverHandlers}
    >
      <img
        key={rasterSrc}
        src={rasterSrc}
        alt=""
        decoding="async"
        loading="eager"
        draggable={false}
        onError={handleImgError}
        className="relative z-0 block size-full object-contain"
      />
    </span>
  );
}
