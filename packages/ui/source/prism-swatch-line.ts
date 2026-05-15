import {
  normalizePrismColorSpec,
  PrismColor,
  type NormalizedPrismColorSpec,
  type PartialPrismColorSpec,
} from "../styles/prism-color";

const TAILWIND_SWATCH_SHADES = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

function snapToNearestTailwindShade(n: number): number {
  let best: number = 500;
  let bestDist = Infinity;
  for (const s of TAILWIND_SWATCH_SHADES) {
    const d = Math.abs(s - n);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}

function resolveSwatchBaseCss(
  normalized: NormalizedPrismColorSpec
): string | undefined {
  const family = normalized.swatchPrimary;
  if (!family) return undefined;
  const { palette, shade } = normalized;

  if (palette === "tailwind") {
    const n =
      typeof shade === "number" ? snapToNearestTailwindShade(shade) : 500;
    return PrismColor.var({ palette: "tailwind", family, shade: n });
  }

  const shadeKey = typeof shade === "number" ? String(shade) : shade;
  return `var(--color-${family}-${shadeKey})`;
}

/** Active {@link PartialPrismColorSpec} face (family + shade), e.g. `var(--color-indigo-500)`. */
export function resolvePrismSwatchLineCss(
  prismColor: PartialPrismColorSpec
): string | undefined {
  try {
    return resolveSwatchBaseCss(normalizePrismColorSpec(prismColor));
  } catch {
    return undefined;
  }
}

/** Softer rule: **100** tint of the picker family (Material ramp or Tailwind `100`). */
export function resolvePrismSwatchLineMuted100Css(
  prismColor: PartialPrismColorSpec
): string | undefined {
  try {
    const normalized = normalizePrismColorSpec(prismColor);
    const family = normalized.swatchPrimary;
    if (!family) return undefined;
    const palette = normalized.palette ?? "default";
    if (palette === "tailwind") {
      return PrismColor.var({ palette: "tailwind", family, shade: 100 });
    }
    return PrismColor.hex({ palette, family, shade: 100 });
  } catch {
    return undefined;
  }
}
