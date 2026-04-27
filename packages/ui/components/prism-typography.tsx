"use client";

/**
 * PrismTypography: type scale + optional scroll-reveal (GSAP).
 *
 * **Zone:** `animationZone` — `whole` | `line` | `word` | `character` | `none`.
 * **Kind:** `animationKind` — `fadeIn` | `moveIn` | `none`. If zone is set and kind is `none`, fade-in is used (same as legacy “zone without type”).
 *
 * **Colour:** {@link PartialPrismColorSpec} via **`color`** only — resolved by {@link prismColorSpecToTypographyPaint}
 * (semantic `text-*` roles, palette hex, or gradient + background-clip). Omit **`color`** to inherit the cascade.
 * Gradient text disables line/word/character split animations (plain whole-text motion only if configured).
 */

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { cn } from "@utilities";
import type { PrismSize } from "../source/prism-size";
import {
  prismColorSpecToTypographyPaint,
  type PartialPrismColorSpec,
} from "../styles/prism-color";
import { prismTypographySentenceCaseFromIdentifier } from "./prism-typography-sentence-case";

export { prismTypographySentenceCaseFromIdentifier };

gsap.registerPlugin(SplitText);

export const PRISM_TYPOGRAPHY_ROLES = [
  "display",
  "headline",
  "title",
  "body",
  "label",
  "overline",
] as const;

export const PRISM_TYPOGRAPHY_SIZES = [
  "small",
  "medium",
  "large",
  "huge",
  "gigantic",
] as const satisfies readonly PrismSize[];

export type PrismTypographyRole = (typeof PRISM_TYPOGRAPHY_ROLES)[number];
export type PrismTypographySize = PrismSize;

export type PrismTypographyFont = "sans" | "serif" | "mono";

/** Named weight steps for {@link PrismTypographyProps.fontWeight} (maps to CSS numeric weight). */
export type PrismTypographyFontWeightPreset = "thin" | "bold" | "black";

export type PrismTypographyAnimationZone =
  | "whole"
  | "line"
  | "word"
  | "character"
  | "none";

export type PrismTypographyAnimationKind = "fadeIn" | "moveIn" | "none";

type PrismTypographyElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span";

const DEFAULT_ELEMENT: Record<
  PrismTypographyRole,
  Record<PrismTypographySize, PrismTypographyElement>
> = {
  display: {
    large: "h1",
    medium: "h2",
    small: "h3",
    huge: "h1",
    gigantic: "h1",
  },
  headline: {
    large: "h2",
    medium: "h3",
    small: "h4",
    huge: "h2",
    gigantic: "h1",
  },
  title: {
    large: "h4",
    medium: "h5",
    small: "h6",
    huge: "h3",
    gigantic: "h2",
  },
  body: {
    large: "p",
    medium: "p",
    small: "p",
    huge: "p",
    gigantic: "p",
  },
  label: {
    large: "span",
    medium: "span",
    small: "span",
    huge: "span",
    gigantic: "span",
  },
  overline: {
    large: "span",
    medium: "span",
    small: "span",
    huge: "span",
    gigantic: "span",
  },
};

type CapsAccentStyle = Pick<CSSProperties, "letterSpacing" | "fontWeight">;

/**
 * Open tracking + bold weight for {@link PRISM_TYPOGRAPHY_ROLES} `overline` only — merged into
 * `style` so it wins over `.typography-*`. Intentionally **not** applied to `label` (e.g. trigger
 * chips use `label` + `small` without changing footprint). Override with `style` when needed.
 */
function defaultCapsAccentStyle(
  role: PrismTypographyRole,
  size: PrismTypographySize
): CapsAccentStyle | undefined {
  if (role !== "overline") return undefined;
  return {
    letterSpacing: size === "small" ? "0.17em" : "0.1em",
    fontWeight: 700,
  };
}

const EASE_OUT = "power3.out";
const DURATION_WHOLE = 1;
const DURATION_LINE = 0.72;
const DURATION_WORD = 0.58;
const DURATION_CHAR = 0.42;
const STAGGER_LINE = {
  each: 0.11,
  from: "center" as const,
  ease: "sine.inOut",
};
const STAGGER_WORD = {
  each: 0.038,
  from: "random" as const,
  ease: "power1.inOut",
};
const STAGGER_CHAR = {
  each: 0.012,
  from: "random" as const,
  ease: "power1.inOut",
};
const IO_THRESHOLD = 0.12;
const IO_ROOT_MARGIN = "0px 0px -8% 0px";

type ResolvedAnimationZone = "whole" | "line" | "word" | "character";
type ResolvedAnimationKind = "fadeIn" | "moveIn";

function isPlainText(children: ReactNode): children is string | number {
  return typeof children === "string" || typeof children === "number";
}

function splitTextTypeForZone(
  zone: ResolvedAnimationZone
): "lines" | "words" | "chars" | null {
  if (zone === "line") return "lines";
  if (zone === "word") return "words";
  if (zone === "character") return "chars";
  return null;
}

function targetsForSplit(
  zone: ResolvedAnimationZone,
  split: SplitText
): Element[] {
  if (zone === "line") return split.lines;
  if (zone === "word") return split.words;
  if (zone === "character") return split.chars;
  return [];
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function resolveAnimationZone(
  zone: PrismTypographyAnimationZone | undefined,
  children: ReactNode
): ResolvedAnimationZone | null {
  if (!zone || zone === "none") return null;
  const plain = isPlainText(children);
  if (zone === "character") return plain ? "character" : "whole";
  if (zone === "word") return plain ? "word" : "whole";
  if (zone === "line") return plain ? "line" : "whole";
  if (zone === "whole") return "whole";
  return null;
}

function resolveAnimationKind(
  kind: PrismTypographyAnimationKind | undefined,
  hasZone: boolean
): ResolvedAnimationKind | null {
  if (!hasZone) return null;
  if (kind === "moveIn") return "moveIn";
  if (kind === "fadeIn") return "fadeIn";
  if (kind === "none" || kind === undefined) return "fadeIn";
  return "fadeIn";
}

function zoneMarkerClass(
  zone: ResolvedAnimationZone | null
): string | undefined {
  if (!zone) return undefined;
  if (zone === "character") return "animationCharacter";
  if (zone === "word") return "animationWord";
  if (zone === "line") return "animationLine";
  return "animationWhole";
}

function kindMarkerClass(
  kind: ResolvedAnimationKind | null
): string | undefined {
  if (!kind) return undefined;
  return kind === "moveIn" ? "animationMoveIn" : "animationFadeIn";
}

function resolveTypographyFontWeight(
  w: PrismTypographyFontWeightPreset | number | undefined
): number | undefined {
  if (w === undefined) return undefined;
  if (typeof w === "number") return w;
  if (w === "thin") return 200;
  if (w === "bold") return 700;
  if (w === "black") return 900;
  return undefined;
}

function yForZone(
  zone: ResolvedAnimationZone,
  kind: ResolvedAnimationKind
): number {
  if (kind === "fadeIn") return 0;
  switch (zone) {
    case "whole":
      return 10;
    case "line":
      return 10;
    case "word":
      return 7;
    case "character":
      return 5;
    default:
      return 0;
  }
}

export type PrismTypographyProps = {
  role: PrismTypographyRole;
  size?: PrismTypographySize;
  /**
   * Prism colour spec — semantic roles, palette hex, or gradient (see {@link prismColorSpecToTypographyPaint}).
   * Omit to inherit surrounding text colour.
   */
  color?: PartialPrismColorSpec;
  font?: PrismTypographyFont;
  fontFamily?: string;
  /** Overrides the role’s default weight from the type scale (and overline caps accent when set). */
  fontWeight?: PrismTypographyFontWeightPreset | number;
  italic?: boolean;
  /**
   * **`uppercase` \| `lowercase` \| `capitalize`** — same strings as CSS `text-transform`.
   * **`sentenceCase`** — not a CSS value: for **plain string / number `children`**, transforms the
   * text with {@link prismTypographySentenceCaseFromIdentifier} (camelCase → sentence case); pair
   * with **`role="overline"`** for ALL CAPS section titles from identifiers like `textAlign`.
   */
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "sentenceCase";
  textAlign?: "left" | "center" | "right" | "justify";
  /**
   * CSS `text-wrap`. When omitted, defaults to **`balance`** (historical PrismTypography behavior).
   */
  textWrap?: CSSProperties["textWrap"];
  animationZone?: PrismTypographyAnimationZone;
  animationKind?: PrismTypographyAnimationKind;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "color">;

export function PrismTypography({
  role,
  size: sizeProp,
  color: colorSpec,
  font = "sans",
  fontFamily,
  fontWeight: fontWeightProp,
  italic,
  textTransform: textTransformProp,
  textAlign: textAlignProp,
  textWrap: textWrapProp,
  as,
  className,
  style,
  children,
  animationZone: animationZoneProp,
  animationKind: animationKindProp,
  ...rest
}: PrismTypographyProps): ReactElement {
  const size = sizeProp ?? "medium";
  const Comp = (as ?? DEFAULT_ELEMENT[role][size]) as ElementType;

  const displayChildren =
    textTransformProp === "sentenceCase" && isPlainText(children)
      ? prismTypographySentenceCaseFromIdentifier(String(children))
      : children;

  const paint = useMemo(
    () => prismColorSpecToTypographyPaint(colorSpec),
    [colorSpec]
  );
  const needsGradientTextWrapper = paint.gradientClipStyle !== undefined;
  const hasSolidTypographyPaint =
    paint.solidStyle !== undefined && !needsGradientTextWrapper;

  const animationZoneBase = resolveAnimationZone(
    animationZoneProp,
    displayChildren
  );
  const animationZoneResolved = needsGradientTextWrapper
    ? null
    : animationZoneBase;
  const animationKindResolved = resolveAnimationKind(
    animationKindProp,
    animationZoneResolved !== null
  );
  const animationActive =
    animationZoneResolved !== null && animationKindResolved !== null;

  const animationClass = cn(
    zoneMarkerClass(animationZoneResolved),
    kindMarkerClass(animationKindResolved)
  );

  const innerRef = useRef<HTMLElement | null>(null);
  const playedRef = useRef(false);
  const ctxRef = useRef<gsap.Context | null>(null);
  const splitRef = useRef<SplitText | null>(null);

  useEffect(() => {
    playedRef.current = false;
  }, [animationZoneResolved, animationKindResolved, displayChildren]);

  useLayoutEffect(() => {
    ctxRef.current?.revert();
    ctxRef.current = null;
    splitRef.current?.revert();
    splitRef.current = null;

    if (
      !animationActive ||
      !animationZoneResolved ||
      !animationKindResolved ||
      prefersReducedMotion()
    )
      return;

    const el = innerRef.current;
    if (!el) return;

    const y = yForZone(animationZoneResolved, animationKindResolved);

    if (animationZoneResolved === "whole") {
      ctxRef.current = gsap.context(() => {
        gsap.set(el, y ? { opacity: 0, y } : { opacity: 0 });
      }, el);
      return () => {
        ctxRef.current?.revert();
        ctxRef.current = null;
      };
    }

    if (!isPlainText(displayChildren)) return;

    const splitType = splitTextTypeForZone(animationZoneResolved);
    if (!splitType) return;

    const split = SplitText.create(el, {
      type: splitType,
      autoSplit: true,
      aria: "auto",
      onSplit: (self) => {
        splitRef.current = self;
        if (playedRef.current) return;
        const nextTargets = targetsForSplit(animationZoneResolved, self);
        const yNext = yForZone(animationZoneResolved, animationKindResolved);
        if (nextTargets.length)
          gsap.set(
            nextTargets,
            yNext ? { opacity: 0, y: yNext } : { opacity: 0 }
          );
      },
    });
    splitRef.current = split;

    const targets = targetsForSplit(animationZoneResolved, split);
    ctxRef.current = gsap.context(() => {
      if (targets.length)
        gsap.set(targets, y ? { opacity: 0, y } : { opacity: 0 });
    }, el);

    return () => {
      ctxRef.current?.revert();
      ctxRef.current = null;
      splitRef.current?.revert();
      splitRef.current = null;
    };
  }, [
    animationActive,
    animationZoneResolved,
    animationKindResolved,
    displayChildren,
  ]);

  useEffect(() => {
    if (!animationActive || !animationZoneResolved || !animationKindResolved)
      return;

    const el = innerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || playedRef.current) return;
        if (prefersReducedMotion()) {
          playedRef.current = true;
          observer.disconnect();
          ctxRef.current?.revert();
          ctxRef.current = null;
          splitRef.current?.revert();
          splitRef.current = null;
          gsap.set(el, { opacity: 1, y: 0 });
          return;
        }

        playedRef.current = true;
        observer.disconnect();

        ctxRef.current?.revert();
        ctxRef.current = gsap.context(() => {
          const y = yForZone(animationZoneResolved, animationKindResolved);

          if (animationZoneResolved === "whole") {
            gsap.fromTo(el, y ? { opacity: 0, y } : { opacity: 0 }, {
              opacity: 1,
              ...(y ? { y: 0 } : {}),
              duration: DURATION_WHOLE,
              ease: EASE_OUT,
            });
            return;
          }

          const split = splitRef.current;
          if (!split) return;

          const targets = targetsForSplit(animationZoneResolved, split);
          if (!targets.length) return;

          const stagger =
            animationZoneResolved === "line"
              ? STAGGER_LINE
              : animationZoneResolved === "word"
                ? STAGGER_WORD
                : STAGGER_CHAR;
          const duration =
            animationZoneResolved === "line"
              ? DURATION_LINE
              : animationZoneResolved === "word"
                ? DURATION_WORD
                : DURATION_CHAR;

          gsap.fromTo(targets, y ? { opacity: 0, y } : { opacity: 0 }, {
            opacity: 1,
            ...(y ? { y: 0 } : {}),
            duration,
            stagger,
            ease: EASE_OUT,
          });
        }, el);
      },
      { threshold: IO_THRESHOLD, rootMargin: IO_ROOT_MARGIN }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, [
    animationActive,
    animationZoneResolved,
    animationKindResolved,
    displayChildren,
  ]);

  const fontClass =
    fontFamily !== undefined && fontFamily !== ""
      ? undefined
      : font === "serif"
        ? "font-serif"
        : font === "mono"
          ? "font-mono"
          : undefined;

  const capsAccent = defaultCapsAccentStyle(role, size);
  const resolvedFontWeight = resolveTypographyFontWeight(fontWeightProp);
  const explicitAxisStyle: CSSProperties = {
    ...(textWrapProp !== undefined
      ? { textWrap: textWrapProp }
      : ({ textWrap: "balance" } as CSSProperties)),
    ...(resolvedFontWeight !== undefined
      ? { fontWeight: resolvedFontWeight }
      : {}),
    ...(italic === true ? { fontStyle: "italic" as const } : {}),
    ...(textTransformProp !== undefined && textTransformProp !== "sentenceCase"
      ? { textTransform: textTransformProp }
      : {}),
    ...(textAlignProp !== undefined ? { textAlign: textAlignProp } : {}),
  };
  const solidFromPaint = hasSolidTypographyPaint ? paint.solidStyle : undefined;
  const mergedStyle =
    fontFamily !== undefined && fontFamily !== ""
      ? {
          ...(capsAccent ?? {}),
          ...explicitAxisStyle,
          ...solidFromPaint,
          ...style,
          fontFamily,
          ...(needsGradientTextWrapper ? { overflow: "visible" as const } : {}),
        }
      : {
          ...(capsAccent ?? {}),
          ...explicitAxisStyle,
          ...solidFromPaint,
          ...style,
          ...(needsGradientTextWrapper ? { overflow: "visible" as const } : {}),
        };

  const typographyClass = `typography-${role}-${size}`;

  const body = needsGradientTextWrapper ? (
    <span style={paint.gradientClipStyle as CSSProperties}>
      {displayChildren}
    </span>
  ) : (
    displayChildren
  );

  return (
    <Comp
      ref={innerRef}
      className={cn(
        typographyClass,
        fontClass,
        paint.semanticTextClass,
        animationClass,
        className
      )}
      style={mergedStyle}
      {...rest}
    >
      {body}
    </Comp>
  );
}
