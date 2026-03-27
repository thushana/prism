"use client";

/**
 * PrismTypography: type scale + optional scroll-reveal (GSAP).
 *
 * **Zone** (what to split / animate): `.animationWhole` | `.animationLine` | `.animationWord` |
 * `.animationCharacter` — string/`number` children for line/word/character; other nodes fall back
 * to whole-block. Line/word/character splits use **GSAP SplitText** after mount (real wrapped lines,
 * words, and characters); whole-block uses the root element only.
 *
 * **Type** (how): `.animationFadeIn` (opacity) | `.animationMoveIn` (opacity + gentle shift up).
 * Pick one zone + one type; if a zone is set but neither type, fade-in is used.
 */

import {
  useEffect,
  useLayoutEffect,
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

gsap.registerPlugin(SplitText);

export const PRISM_TYPOGRAPHY_ROLES = [
  "display",
  "headline",
  "title",
  "body",
  "label",
  "overline",
] as const;

export const PRISM_TYPOGRAPHY_SIZES = ["large", "medium", "small"] as const;

export type PrismTypographyRole = (typeof PRISM_TYPOGRAPHY_ROLES)[number];
export type PrismTypographySize = (typeof PRISM_TYPOGRAPHY_SIZES)[number];

export type PrismTypographyFont = "sans" | "serif" | "mono";

/** Semantic text color → `text-*` utilities (shadcn-style tokens in globals.css). Extend when new text tokens exist. */
export type PrismTypographyColor =
  | "inherit"
  | "foreground"
  | "muted"
  | "primary"
  | "primaryForeground"
  | "secondaryForeground"
  | "destructive"
  | "accentForeground"
  | "cardForeground";

const TEXT_COLOR_CLASS: Record<PrismTypographyColor, string | undefined> = {
  inherit: undefined,
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  primaryForeground: "text-primary-foreground",
  secondaryForeground: "text-secondary-foreground",
  destructive: "text-destructive",
  accentForeground: "text-accent-foreground",
  cardForeground: "text-card-foreground",
};

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
  display: { large: "h1", medium: "h2", small: "h3" },
  /* large is h2 so a page can use display-large as the single top-level h1 without duplicate h1s. */
  headline: { large: "h2", medium: "h3", small: "h4" },
  title: { large: "h4", medium: "h5", small: "h6" },
  body: { large: "p", medium: "p", small: "p" },
  label: { large: "span", medium: "span", small: "span" },
  overline: { large: "span", medium: "span", small: "span" },
};

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

type AnimationZone = "whole" | "line" | "word" | "character";
type AnimationKind = "fadeIn" | "moveIn";

function isPlainText(children: ReactNode): children is string | number {
  return typeof children === "string" || typeof children === "number";
}

function splitTextTypeForZone(zone: AnimationZone): "lines" | "words" | "chars" | null {
  if (zone === "line") return "lines";
  if (zone === "word") return "words";
  if (zone === "character") return "chars";
  return null;
}

function targetsForSplit(
  zone: AnimationZone,
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

export type PrismTypographyProps = {
  role: PrismTypographyRole;
  /** Defaults to `"medium"`. */
  size?: PrismTypographySize;
  color?: PrismTypographyColor;
  font?: PrismTypographyFont;
  fontFamily?: string;
  /**
   * Override the rendered element for correct document outline (a11y / SEO). Defaults follow
   * `role` × `size`; use e.g. `as="h1"` for the lone page title or `as="h3"` when nesting under a
   * section heading so you do not duplicate or skip levels.
   */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Animate the full block as one unit (viewport once). */
  animationWhole?: boolean;
  /**
   * Split into lines and stagger (string/`number` children only; else whole). Uses GSAP SplitText
   * so lines follow layout/wrapping; `autoSplit` re-splits on resize.
   */
  animationLine?: boolean;
  /** Split into words and stagger (string/`number` children only; else whole). Uses GSAP SplitText. */
  animationWord?: boolean;
  /** Split into characters and stagger (string/`number` children only; else whole). Uses GSAP SplitText. */
  animationCharacter?: boolean;
  /** Opacity 0 → 1 only. */
  animationFadeIn?: boolean;
  /** Opacity + gentle upward shift. */
  animationMoveIn?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "color">;

function resolveAnimationZone(
  animationCharacter: boolean | undefined,
  animationWord: boolean | undefined,
  animationLine: boolean | undefined,
  animationWhole: boolean | undefined,
  children: ReactNode
): AnimationZone | null {
  const plain = isPlainText(children);
  if (animationCharacter) return plain ? "character" : "whole";
  if (animationWord) return plain ? "word" : "whole";
  if (animationLine) return plain ? "line" : "whole";
  if (animationWhole) return "whole";
  return null;
}

function resolveAnimationKind(
  animationFadeIn: boolean | undefined,
  animationMoveIn: boolean | undefined,
  hasZone: boolean
): AnimationKind | null {
  if (!hasZone) return null;
  if (animationMoveIn) return "moveIn";
  if (animationFadeIn) return "fadeIn";
  return "fadeIn";
}

function zoneMarkerClass(zone: AnimationZone | null): string | undefined {
  if (!zone) return undefined;
  if (zone === "character") return "animationCharacter";
  if (zone === "word") return "animationWord";
  if (zone === "line") return "animationLine";
  return "animationWhole";
}

function kindMarkerClass(kind: AnimationKind | null): string | undefined {
  if (!kind) return undefined;
  return kind === "moveIn" ? "animationMoveIn" : "animationFadeIn";
}

function yForZone(zone: AnimationZone, kind: AnimationKind): number {
  if (kind === "fadeIn") return 0;
  switch (zone) {
    /* whole + line share the same nudge today; split cases so they can diverge later. */
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

export function PrismTypography({
  role,
  size: sizeProp,
  color = "inherit",
  font = "sans",
  fontFamily,
  as,
  className,
  style,
  children,
  animationWhole,
  animationLine,
  animationWord,
  animationCharacter,
  animationFadeIn,
  animationMoveIn,
  ...rest
}: PrismTypographyProps): ReactElement {
  const size = sizeProp ?? "medium";
  const Comp = (as ?? DEFAULT_ELEMENT[role][size]) as ElementType;

  const animationZone = resolveAnimationZone(
    animationCharacter,
    animationWord,
    animationLine,
    animationWhole,
    children
  );
  const animationKind = resolveAnimationKind(
    animationFadeIn,
    animationMoveIn,
    animationZone !== null
  );
  const animationActive = animationZone !== null && animationKind !== null;

  const animationClass = cn(
    zoneMarkerClass(animationZone),
    kindMarkerClass(animationKind)
  );

  const innerRef = useRef<HTMLElement | null>(null);
  const playedRef = useRef(false);
  const ctxRef = useRef<gsap.Context | null>(null);
  const splitRef = useRef<SplitText | null>(null);

  useEffect(() => {
    playedRef.current = false;
  }, [animationZone, animationKind, children]);

  useLayoutEffect(() => {
    ctxRef.current?.revert();
    ctxRef.current = null;
    splitRef.current?.revert();
    splitRef.current = null;

    if (!animationActive || !animationZone || !animationKind || prefersReducedMotion()) return;

    const el = innerRef.current;
    if (!el) return;

    const y = yForZone(animationZone, animationKind);

    if (animationZone === "whole") {
      ctxRef.current = gsap.context(() => {
        gsap.set(el, y ? { opacity: 0, y } : { opacity: 0 });
      }, el);
      return () => {
        ctxRef.current?.revert();
        ctxRef.current = null;
      };
    }

    if (!isPlainText(children)) return;

    const splitType = splitTextTypeForZone(animationZone);
    if (!splitType) return;

    const split = SplitText.create(el, {
      type: splitType,
      autoSplit: true,
      aria: "auto",
      /* onSplit runs after autoSplit re-wraps; gsap.set stays here (not in gsap.context above) so new line/word/char nodes get the pre-reveal state without re-running the whole effect. */
      onSplit: (self) => {
        splitRef.current = self;
        if (playedRef.current) return;
        const nextTargets = targetsForSplit(animationZone, self);
        const yNext = yForZone(animationZone, animationKind);
        if (nextTargets.length)
          gsap.set(nextTargets, yNext ? { opacity: 0, y: yNext } : { opacity: 0 });
      },
    });
    splitRef.current = split;

    const targets = targetsForSplit(animationZone, split);
    ctxRef.current = gsap.context(() => {
      if (targets.length) gsap.set(targets, y ? { opacity: 0, y } : { opacity: 0 });
    }, el);

    return () => {
      ctxRef.current?.revert();
      ctxRef.current = null;
      splitRef.current?.revert();
      splitRef.current = null;
    };
  }, [animationActive, animationZone, animationKind, children]);

  useEffect(() => {
    if (!animationActive || !animationZone || !animationKind) return;

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
          const y = yForZone(animationZone, animationKind);

          if (animationZone === "whole") {
            gsap.fromTo(
              el,
              y ? { opacity: 0, y } : { opacity: 0 },
              {
                opacity: 1,
                ...(y ? { y: 0 } : {}),
                duration: DURATION_WHOLE,
                ease: EASE_OUT,
              }
            );
            return;
          }

          const split = splitRef.current;
          if (!split) return;

          const targets = targetsForSplit(animationZone, split);
          if (!targets.length) return;

          const stagger =
            animationZone === "line"
              ? STAGGER_LINE
              : animationZone === "word"
                ? STAGGER_WORD
                : STAGGER_CHAR;
          const duration =
            animationZone === "line"
              ? DURATION_LINE
              : animationZone === "word"
                ? DURATION_WORD
                : DURATION_CHAR;

          gsap.fromTo(
            targets,
            y ? { opacity: 0, y } : { opacity: 0 },
            {
              opacity: 1,
              ...(y ? { y: 0 } : {}),
              duration,
              stagger,
              ease: EASE_OUT,
            }
          );
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
  }, [animationActive, animationZone, animationKind, children]);

  const fontClass =
    fontFamily !== undefined && fontFamily !== ""
      ? undefined
      : font === "serif"
        ? "font-serif"
        : font === "mono"
          ? "font-mono"
          : undefined;

  const balanceWrap = { textWrap: "balance" } as CSSProperties;
  const mergedStyle =
    fontFamily !== undefined && fontFamily !== ""
      ? { ...balanceWrap, ...style, fontFamily }
      : { ...balanceWrap, ...style };

  const typographyClass = `typography-${role}-${size}`;

  return (
    <Comp
      ref={innerRef}
      className={cn(
        typographyClass,
        fontClass,
        TEXT_COLOR_CLASS[color],
        animationClass,
        className
      )}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </Comp>
  );
}
