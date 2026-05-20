import { gsap } from "gsap";

/** Geometry nodes Lucide stroke-draw can animate (paths, lines, etc.). */
export const PRISM_LUCIDE_DRAW_SVG_SELECTOR =
  "svg path, svg line, svg polyline, svg polygon, svg circle, svg ellipse, svg rect";

/**
 * Safe wrapper for {@link SVGGeometryElement.getTotalLength} — returns null when the
 * node is not rendered (e.g. ancestor `overflow: hidden` + zero width) instead of throwing.
 */
export function prismLucideStrokeLength(
  node: SVGGeometryElement
): number | null {
  try {
    const len = node.getTotalLength();
    if (!Number.isFinite(len) || len <= 0) return null;
    return len;
  } catch {
    return null;
  }
}

export type PrismLucideStrokeDrawResult = "drawn" | "retry" | "none";

/**
 * Measure Lucide SVG strokes and run GSAP dash-offset draw-in.
 * `retry` when nodes exist but are not yet measurable (defer with rAF).
 */
export function prismLucideStrokeDraw(
  root: HTMLElement,
  options: {
    durationSec: number;
    ease?: string;
    onComplete?: () => void;
  }
): PrismLucideStrokeDrawResult {
  const nodes = root.querySelectorAll<SVGGeometryElement>(
    PRISM_LUCIDE_DRAW_SVG_SELECTOR
  );
  const drawable: SVGGeometryElement[] = [];

  nodes.forEach((node) => {
    const len = prismLucideStrokeLength(node);
    if (len === null) return;
    drawable.push(node);
    node.style.strokeDasharray = String(len);
    node.style.strokeDashoffset = String(len);
  });

  if (drawable.length === 0) {
    return nodes.length > 0 ? "retry" : "none";
  }

  gsap.to(drawable, {
    strokeDashoffset: 0,
    duration: options.durationSec,
    stagger: 0.03,
    ease: options.ease ?? "power2.out",
    overwrite: true,
    onComplete: options.onComplete,
  });

  return "drawn";
}

/** Clear inline dash styles after motion cleanup. */
export function prismLucideStrokeDrawReset(root: HTMLElement): void {
  root
    .querySelectorAll<SVGGeometryElement>(PRISM_LUCIDE_DRAW_SVG_SELECTOR)
    .forEach((node) => {
      node.style.strokeDasharray = "";
      node.style.strokeDashoffset = "";
    });
}
