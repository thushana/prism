/**
 * PrismColor — palette registry, ColorLoop, syntax helpers, CSS var resolution.
 * Default palette maps to generated `colors.css` (`--color-{family}-{shade}`).
 * Tailwind palette uses prefixed vars: `--color-tailwind-{family}-{shade}`.
 */

import { colorHexValues, type ColorName } from "./color-values";
import {
  tailwindColorValues,
  type TailwindPaletteFamily,
} from "./tailwind-color-values";

/** Fallback when lookup fails — neutral gray (not a chroma hue) so bugs are visible without implying “red error”. */
const PRISM_HEX_FALLBACK = "#737373";

function warnPrismHexFallback(reason: string, detail?: unknown): void {
  try {
    const env = (
      globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }
    ).process?.env?.NODE_ENV;
    if (env === "development") {
      console.warn(`[PrismColor.hex] ${reason}`, detail ?? "");
    }
  } catch {
    /* ignore */
  }
}

/** Same order as {@link PRISM_DEFAULT_COLOR_LOOP} — camelCase for `ColorName` / button props. */
export const PRISM_DEFAULT_COLOR_NAMES: readonly ColorName[] = [
  "red",
  "pink",
  "purple",
  "deepPurple",
  "indigo",
  "blue",
  "lightBlue",
  "cyan",
  "teal",
  "green",
  "lightGreen",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deepOrange",
  "brown",
  "blueGrey",
  "grey",
] as const;

export function getPrismDefaultColorNameForIndex(index: number): ColorName {
  const ring = PRISM_DEFAULT_COLOR_NAMES;
  return ring[((index % ring.length) + ring.length) % ring.length]!;
}

export function nextPrismDefaultColorName(color: ColorName): ColorName {
  const ring = PRISM_DEFAULT_COLOR_NAMES;
  const i = ring.indexOf(color);
  const base = i === -1 ? ring.indexOf("blue") : i;
  return ring[(base + 1) % ring.length]!;
}

// ─── public types ─────────────────────────────────────────────────────────────

/** Kebab-case family key for the active palette. */
export type PrismSwatchKey = string;

/**
 * Registered palettes. `"default"` is Material-derived (`colors.css`).
 * `"tailwind"` uses `--color-tailwind-*` (requires generated `tailwind-colors.css` when used).
 */
export type PrismPaletteId = "default" | "tailwind" | (string & {});

/** Material numeric ramp + accent keys (see `color-values.ts`). Tailwind ramps use numeric shades only. */
export type PrismDefaultPaletteShadeKey =
  | number
  | "a100"
  | "a200"
  | "a400"
  | "a700";

export type PrismColorSpec = {
  palette?: PrismPaletteId;
  swatchPrimary?: PrismSwatchKey;
  swatchSecondary?: PrismSwatchKey;
  swatchTertiary?: PrismSwatchKey;
  shade?: PrismDefaultPaletteShadeKey;
  tier?: "full" | "soft" | "mono";
  semanticText?:
    | "primary"
    | "primaryForeground"
    | "secondaryForeground"
    | "destructive"
    | "accentForeground"
    | "cardForeground";
  surface?: {
    blur?: "none" | "light" | "strong";
    dropShadow?: "none" | "soft" | "medium";
    elevated?: boolean;
  };
  gradient?: {
    swatches: PrismSwatchKey[];
    direction: "horizontal" | "vertical" | "angled";
    shade?: number | { light: number; dark: number };
  };
  /** `center` defaults to {@link PrismColorSpec.swatchPrimary} in consumers when omitted. */
  colorLoop?: {
    center?: PrismSwatchKey;
    range?: number;
  };
};

export type PartialPrismColorSpec = Partial<PrismColorSpec>;

// ─── palette: default (Material-derived) loop ───────────────────────────────

export const PRISM_DEFAULT_COLOR_LOOP: readonly PrismSwatchKey[] = [
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "blue-grey",
  "grey",
] as const;

/** Tailwind v3 family order (kebab-case). Pair with generated `tailwind-colors.css`. */
export const PRISM_TAILWIND_COLOR_LOOP: readonly PrismSwatchKey[] = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

const PALETTE_LOOPS: Record<string, readonly PrismSwatchKey[]> = {
  default: PRISM_DEFAULT_COLOR_LOOP,
  tailwind: PRISM_TAILWIND_COLOR_LOOP,
};

function resolvePaletteId(raw: PrismPaletteId | undefined): PrismPaletteId {
  const p = raw ?? "default";
  if (p !== "default" && p !== "tailwind") {
    return "default";
  }
  return p;
}

function loopFor(palette: PrismPaletteId): readonly PrismSwatchKey[] {
  const p = resolvePaletteId(palette);
  return PALETTE_LOOPS[p as "default" | "tailwind"] ?? PRISM_DEFAULT_COLOR_LOOP;
}

function cssVarForFamilyShade(
  palette: PrismPaletteId,
  family: PrismSwatchKey,
  shade: number,
): string {
  const p = resolvePaletteId(palette);
  if (p === "default") {
    return `var(--color-${family}-${shade})`;
  }
  return `var(--color-${p}-${family}-${shade})`;
}

/** `slug` is `family-shade` (e.g. `grey-600`, `blue-grey-500`). */
function cssVarForSlug(palette: PrismPaletteId, familyShadeSlug: string): string {
  const p = resolvePaletteId(palette);
  if (p === "default") {
    return `var(--color-${familyShadeSlug})`;
  }
  return `var(--color-${p}-${familyShadeSlug})`;
}

export type TokenStyle = { light: string; dark: string };

type TokenKind =
  | "keyword"
  | "string"
  | "comment"
  | "tag"
  | "property"
  | "number"
  | "punct"
  | "brace"
  | "plain";

export type SyntaxPaletteMap = Record<Exclude<TokenKind, "plain">, TokenStyle>;

const TOKEN_KINDS_NO_PLAIN: Exclude<TokenKind, "plain">[] = [
  "keyword",
  "string",
  "comment",
  "tag",
  "property",
  "number",
  "punct",
  "brace",
];

/**
 * Parse `{family}-{shade}` (e.g. `slate-500`, `blue-grey-400`). Shade must be numeric (Tailwind + Material ramps).
 */
function parseFamilyNumericShadeSlug(slug: string): {
  family: PrismSwatchKey;
  shade: number;
} | null {
  const m = slug.match(/^(.*)-(\d+)$/);
  if (!m) return null;
  return { family: m[1]!, shade: parseInt(m[2]!, 10) };
}

function pairSlug(
  palette: PrismPaletteId,
  lightSlug: string,
  darkSlug: string,
  resolvedSyntaxColors: boolean,
): TokenStyle {
  if (resolvedSyntaxColors) {
    const a = parseFamilyNumericShadeSlug(lightSlug);
    const b = parseFamilyNumericShadeSlug(darkSlug);
    if (a && b) {
      return {
        light: PrismColor.hex({
          palette,
          family: a.family,
          shade: a.shade,
        }),
        dark: PrismColor.hex({
          palette,
          family: b.family,
          shade: b.shade,
        }),
      };
    }
  }
  return {
    light: cssVarForSlug(palette, lightSlug),
    dark: cssVarForSlug(palette, darkSlug),
  };
}

/** Neutral ramp for monochrome syntax branch (Material `grey` vs Tailwind `gray`). */
function neutralRampFamily(palette: PrismPaletteId): PrismSwatchKey {
  return palette === "tailwind" ? "gray" : "grey";
}

/** Comment tokens: Material uses blue-grey; Tailwind uses slate (no blue-grey family). */
function syntaxCommentPair(
  palette: PrismPaletteId,
  resolvedSyntaxColors: boolean,
): TokenStyle {
  if (palette === "tailwind") {
    return pairSlug(palette, "slate-500", "slate-400", resolvedSyntaxColors);
  }
  return pairSlug(
    palette,
    "blue-grey-500",
    "blue-grey-400",
    resolvedSyntaxColors,
  );
}

/** Punctuation: grey-600 ramp vs zinc for tailwind. */
function syntaxPunctPair(
  palette: PrismPaletteId,
  resolvedSyntaxColors: boolean,
): TokenStyle {
  if (palette === "tailwind") {
    return pairSlug(palette, "zinc-600", "zinc-400", resolvedSyntaxColors);
  }
  return pairSlug(palette, "grey-600", "grey-400", resolvedSyntaxColors);
}

function pairFamilyShades(
  palette: PrismPaletteId,
  family: PrismSwatchKey,
  lightShade: number,
  darkShade: number,
  resolvedSyntaxColors: boolean,
): TokenStyle {
  if (resolvedSyntaxColors) {
    return {
      light: PrismColor.hex({ palette, family, shade: lightShade }),
      dark: PrismColor.hex({ palette, family, shade: darkShade }),
    };
  }
  return {
    light: cssVarForFamilyShade(palette, family, lightShade),
    dark: cssVarForFamilyShade(palette, family, darkShade),
  };
}

/** Material palette starts at 50; lighten further with 50% `white` (CSS keyword). */
function veilHalfWhite(base: string): string {
  return `color-mix(in srgb, ${base} 50%, white)`;
}

function normalizeSwatch(
  palette: PrismPaletteId,
  raw: string | undefined,
): PrismSwatchKey {
  let s = (raw ?? "blue")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  const p = resolvePaletteId(palette);
  if (p === "tailwind" && s === "grey") {
    s = "gray";
  }
  const ring = loopFor(palette);
  return ring.includes(s) ? s : "blue";
}

function ringFamilyAtOffset(
  palette: PrismPaletteId,
  primary: PrismSwatchKey,
  offset: number,
): PrismSwatchKey {
  const ring = loopFor(palette);
  const i = ring.indexOf(primary);
  const base = i === -1 ? ring.indexOf("blue") : i;
  const n = ring.length;
  const j = (base + offset) % n;
  return ring[(j + n) % n]!;
}

/** Hard max for `colorLoop.range`: **⌊ring length / 2⌋** (same cap as {@link clampPrismColorLoopRange}). */
export function maxPrismColorLoopRange(palette: PrismPaletteId): number {
  return Math.floor(loopFor(resolvePaletteId(palette)).length / 2);
}

/**
 * Upper bound for ColorLoop `range` inside the {@link PrismColorPicker} UI (self-activated when the
 * committed `range > 0`). Wider rings remain valid on `PartialPrismColorSpec` / {@link PrismCodeBlock}
 * up to {@link maxPrismColorLoopRange}.
 */
export const PRISM_COLOR_LOOP_RANGE_MAX_IN_PICKER = 2;

/** Slider / UI ceiling for the picker: `min(ring max, {@link PRISM_COLOR_LOOP_RANGE_MAX_IN_PICKER})`. */
export function maxPrismColorLoopRangeForPicker(palette: PrismPaletteId): number {
  return Math.min(
    maxPrismColorLoopRange(palette),
    PRISM_COLOR_LOOP_RANGE_MAX_IN_PICKER,
  );
}

/**
 * Clamps `colorLoop.range` to the palette ring: default **2** when `range` is omitted, hard max
 * **{@link maxPrismColorLoopRange}**, minimum **0**. Same rule as {@link resolveCodeBlockColor}.
 */
export function clampPrismColorLoopRange(
  palette: PrismPaletteId,
  range: number | undefined,
): number {
  const maxR = maxPrismColorLoopRange(palette);
  const r = range ?? 2;
  return Math.max(0, Math.min(maxR, Math.floor(r)));
}

/**
 * Like {@link clampPrismColorLoopRange}, then capped at {@link PRISM_COLOR_LOOP_RANGE_MAX_IN_PICKER} for picker UX.
 */
export function clampPrismColorLoopRangeForPicker(
  palette: PrismPaletteId,
  range: number | undefined,
): number {
  return Math.min(
    clampPrismColorLoopRange(palette, range),
    PRISM_COLOR_LOOP_RANGE_MAX_IN_PICKER,
  );
}

export type ResolvedCodeBlockColor = {
  palette: PrismPaletteId;
  primary: PrismSwatchKey;
  colorLoopRange: number;
};

/**
 * Resolves props relevant to PrismCodeBlock: palette, anchor family, colorLoop budget.
 */
export function resolveCodeBlockColor(
  spec: PartialPrismColorSpec | undefined,
): ResolvedCodeBlockColor {
  const palette = resolvePaletteId(spec?.palette);
  const anchor = normalizeSwatch(
    palette,
    spec?.swatchPrimary ?? spec?.colorLoop?.center,
  );
  const range = clampPrismColorLoopRange(palette, spec?.colorLoop?.range);
  return { palette, primary: anchor, colorLoopRange: range };
}

function buildSyntaxTokenMap(
  palette: PrismPaletteId,
  primary: PrismSwatchKey,
  range: number,
): SyntaxPaletteMap {
  /** Tailwind `--color-tailwind-*` theme keys are often omitted from CSS when unused; use literal oklch/hex. */
  const resolvedSyntaxColors = palette === "tailwind";

  const oneUp =
    range >= 1 ? ringFamilyAtOffset(palette, primary, 1) : primary;
  const oneDown =
    range >= 1 ? ringFamilyAtOffset(palette, primary, -1) : primary;
  const twoDown =
    range >= 2 ? ringFamilyAtOffset(palette, primary, -2) : oneDown;

  if (primary === "grey" || primary === "gray") {
    const g = neutralRampFamily(palette);
    return {
      keyword: pairFamilyShades(palette, g, 800, 300, resolvedSyntaxColors),
      string: pairFamilyShades(palette, g, 700, 400, resolvedSyntaxColors),
      comment: syntaxCommentPair(palette, resolvedSyntaxColors),
      tag: pairFamilyShades(palette, g, 800, 300, resolvedSyntaxColors),
      property: pairFamilyShades(palette, g, 700, 400, resolvedSyntaxColors),
      number: pairFamilyShades(palette, g, 700, 400, resolvedSyntaxColors),
      punct: pairFamilyShades(palette, g, 600, 400, resolvedSyntaxColors),
      brace: pairFamilyShades(palette, g, 900, 300, resolvedSyntaxColors),
    };
  }

  return {
    keyword: pairFamilyShades(palette, primary, 800, 300, resolvedSyntaxColors),
    string: pairFamilyShades(palette, oneUp, 800, 300, resolvedSyntaxColors),
    comment: syntaxCommentPair(palette, resolvedSyntaxColors),
    tag: pairFamilyShades(palette, primary, 700, 400, resolvedSyntaxColors),
    property: pairFamilyShades(palette, oneDown, 700, 400, resolvedSyntaxColors),
    number: pairFamilyShades(palette, twoDown, 900, 200, resolvedSyntaxColors),
    punct: syntaxPunctPair(palette, resolvedSyntaxColors),
    brace: pairFamilyShades(palette, primary, 900, 300, resolvedSyntaxColors),
  };
}

function panelFillFor(
  palette: PrismPaletteId,
  syntaxFamily: PrismSwatchKey,
  panelMode: "card" | "transparent",
): { light: string; dark: string } {
  if (panelMode === "transparent") {
    return { light: "transparent", dark: "transparent" };
  }
  const resolvedSyntaxColors = palette === "tailwind";

  if (syntaxFamily === "grey" || syntaxFamily === "gray") {
    const g = neutralRampFamily(palette);
    if (resolvedSyntaxColors) {
      const lightBase = PrismColor.hex({ palette, family: g, shade: 100 });
      const darkBase = PrismColor.hex({ palette, family: g, shade: 900 });
      return {
        light: veilHalfWhite(lightBase),
        dark: darkBase,
      };
    }
    return {
      light: veilHalfWhite(cssVarForFamilyShade(palette, g, 100)),
      dark: cssVarForFamilyShade(palette, g, 900),
    };
  }
  if (resolvedSyntaxColors) {
    const lightBase = PrismColor.hex({ palette, family: syntaxFamily, shade: 50 });
    const darkBase = PrismColor.hex({ palette, family: syntaxFamily, shade: 900 });
    return {
      light: veilHalfWhite(lightBase),
      dark: darkBase,
    };
  }
  return {
    light: veilHalfWhite(cssVarForFamilyShade(palette, syntaxFamily, 50)),
    dark: cssVarForFamilyShade(palette, syntaxFamily, 900),
  };
}

function darkTokenRulesForInstance(
  instanceId: string,
  map: SyntaxPaletteMap,
): string {
  return TOKEN_KINDS_NO_PLAIN.map(
    (k) =>
      `.dark [data-slot="code-block"][data-prism-cb="${instanceId}"] [data-tk="${k}"] { color: ${map[k].dark} !important; }`,
  ).join("\n");
}

export const PRISM_CODE_BLOCK_BASE_CSS = `
[data-slot="code-block"] .prism-code-block-panel-fill { background: var(--pcb-fill); }
.dark [data-slot="code-block"] .prism-code-block-panel-fill { background: var(--pcb-fill-dark) !important; }
`;

function kebabToColorName(kebab: PrismSwatchKey): ColorName | null {
  const key = kebab.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  if (key in colorHexValues) {
    return key as ColorName;
  }
  return null;
}

/** Default palette only: maps kebab-case family (`deep-purple`) to generated {@link ColorName}. */
export function prismDefaultFamilyKebabToColorName(
  kebab: PrismSwatchKey,
): ColorName | null {
  return kebabToColorName(kebab);
}

function gradientDirectionCss(
  direction: "horizontal" | "vertical" | "angled",
): string {
  if (direction === "horizontal") return "to right";
  if (direction === "vertical") return "to bottom";
  return "135deg";
}

/** Normalized spec — defaults merged; swatches validated against the palette loop. */
export type NormalizedPrismColorSpec = {
  palette: PrismPaletteId;
  shade: PrismDefaultPaletteShadeKey;
  tier: "full" | "soft" | "mono";
  swatchPrimary?: PrismSwatchKey;
  swatchSecondary?: PrismSwatchKey;
  swatchTertiary?: PrismSwatchKey;
  semanticText?: PrismColorSpec["semanticText"];
  surface: Required<NonNullable<PrismColorSpec["surface"]>>;
  gradient?: PrismColorSpec["gradient"];
  colorLoop?: PrismColorSpec["colorLoop"];
};

export function normalizePrismColorSpec(
  partial: PartialPrismColorSpec | undefined,
): NormalizedPrismColorSpec {
  const palette = resolvePaletteId(partial?.palette);
  const shade: PrismDefaultPaletteShadeKey =
    partial?.shade !== undefined && partial?.shade !== null
      ? partial.shade
      : 500;
  const tier = partial?.tier ?? "full";
  const surface: NormalizedPrismColorSpec["surface"] = {
    blur: partial?.surface?.blur ?? "none",
    dropShadow: partial?.surface?.dropShadow ?? "none",
    elevated: partial?.surface?.elevated ?? false,
  };
  const ns = (s: PrismSwatchKey | undefined) =>
    s !== undefined ? normalizeSwatch(palette, s) : undefined;
  return {
    palette,
    shade,
    tier,
    swatchPrimary: ns(partial?.swatchPrimary),
    swatchSecondary: ns(partial?.swatchSecondary),
    swatchTertiary: ns(partial?.swatchTertiary),
    semanticText: partial?.semanticText,
    surface,
    gradient: partial?.gradient,
    colorLoop: partial?.colorLoop,
  };
}

// ─── WCAG luminance (shared: PrismColor.relativeLuminanceFromHex + CSS string approx.) ─

function parseHex6RgbChannels(hexInput: string): { r: number; g: number; b: number } | null {
  const n = hexInput.trim().toLowerCase();
  const withHash = n.startsWith("#") ? n : `#${n}`;
  const compact = withHash.slice(1);
  if (/^[0-9a-f]{6}$/i.test(compact)) {
    return {
      r: parseInt(compact.slice(0, 2), 16),
      g: parseInt(compact.slice(2, 4), 16),
      b: parseInt(compact.slice(4, 6), 16),
    };
  }
  if (/^[0-9a-f]{3}$/i.test(compact)) {
    return {
      r: parseInt(compact[0]! + compact[0]!, 16),
      g: parseInt(compact[1]! + compact[1]!, 16),
      b: parseInt(compact[2]! + compact[2]!, 16),
    };
  }
  return null;
}

function wcagRelativeLuminanceSrgb(rgb: { r: number; g: number; b: number }): number {
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b)
  );
}

// ─── PrismColor namespace ────────────────────────────────────────────────────

export const PrismColor = {
  Loop: {
    families(palette: PrismPaletteId = "default"): readonly PrismSwatchKey[] {
      return loopFor(palette);
    },
    normalize(palette: PrismPaletteId, raw: string | undefined): PrismSwatchKey {
      return normalizeSwatch(resolvePaletteId(palette), raw);
    },
    step(
      palette: PrismPaletteId,
      from: PrismSwatchKey,
      offset: number,
    ): PrismSwatchKey {
      return ringFamilyAtOffset(resolvePaletteId(palette), from, offset);
    },
  },

  /**
   * WCAG 2.x **relative luminance** (0–1) for `#rgb` / `#rrggbb`.
   * Invalid hex → `0.5`.
   */
  relativeLuminanceFromHex(hexColor: string): number {
    const rgb = parseHex6RgbChannels(hexColor);
    if (!rgb) return 0.5;
    return wcagRelativeLuminanceSrgb(rgb);
  },

  /**
   * CSS `var(...)` for a family + numeric shade.
   */
  var(opts: {
    palette?: PrismPaletteId;
    family: PrismSwatchKey;
    shade: number;
  }): string {
    const palette = resolvePaletteId(opts.palette);
    return cssVarForFamilyShade(palette, opts.family, opts.shade);
  },

  /**
   * Resolved color string: hex from `color-values.ts` (default) or `tailwind-color-values.ts` (tailwind, often oklch).
   * Tailwind palette accepts numeric shades only; default palette also accepts Material accent keys (`a100`…).
   */
  hex(opts: {
    palette?: PrismPaletteId;
    family: PrismSwatchKey;
    shade: PrismDefaultPaletteShadeKey;
  }): string {
    const palette = resolvePaletteId(opts.palette);
    if (palette === "tailwind") {
      if (typeof opts.shade !== "number") {
        warnPrismHexFallback("tailwind palette requires numeric shade", opts.shade);
        return PRISM_HEX_FALLBACK;
      }
      const fam = opts.family as TailwindPaletteFamily;
      const row = tailwindColorValues[fam];
      if (!row) {
        warnPrismHexFallback("unknown tailwind family", opts.family);
        return PRISM_HEX_FALLBACK;
      }
      const s = opts.shade as keyof typeof row;
      const hit = row[s];
      if (hit !== undefined) return hit;
      warnPrismHexFallback("unknown shade for family; using 500", {
        family: fam,
        shade: opts.shade,
      });
      return row[500];
    }
    const cn = kebabToColorName(opts.family);
    if (!cn) {
      warnPrismHexFallback("unknown default family", opts.family);
      return PRISM_HEX_FALLBACK;
    }
    const shades = colorHexValues[cn];
    if (!shades) {
      warnPrismHexFallback("no hex table for ColorName", cn);
      return PRISM_HEX_FALLBACK;
    }
    const s = opts.shade as keyof typeof shades;
    const hit = shades[s] as string | undefined;
    if (hit !== undefined) return hit;
    warnPrismHexFallback("unknown shade for family; using 600", {
      family: cn,
      shade: opts.shade,
    });
    return (shades[600] as string | undefined) ?? PRISM_HEX_FALLBACK;
  },

  /**
   * Resolved color at `index` in the palette ColorLoop (wraps).
   */
  hexAtIndex(opts: {
    palette?: PrismPaletteId;
    index: number;
    shade: number;
  }): string {
    const palette = resolvePaletteId(opts.palette);
    const ring = loopFor(palette);
    const familyKebab =
      ring[((opts.index % ring.length) + ring.length) % ring.length]!;
    return PrismColor.hex({
      palette,
      family: familyKebab,
      shade: opts.shade,
    });
  },

  syntax: {
    tokenStyles(spec: PartialPrismColorSpec | undefined): SyntaxPaletteMap {
      const r = resolveCodeBlockColor(spec);
      return buildSyntaxTokenMap(r.palette, r.primary, r.colorLoopRange);
    },
    /** Use with a {@link ResolvedCodeBlockColor} from {@link resolveCodeBlockColor} for stable memo deps. */
    tokenStylesFromResolved(resolved: ResolvedCodeBlockColor): SyntaxPaletteMap {
      return buildSyntaxTokenMap(
        resolved.palette,
        resolved.primary,
        resolved.colorLoopRange,
      );
    },
    panelFill(
      spec: PartialPrismColorSpec | undefined,
      mode: "card" | "transparent",
    ): { light: string; dark: string } {
      const r = resolveCodeBlockColor(spec);
      return panelFillFor(r.palette, r.primary, mode);
    },
    panelFillFromResolved(
      resolved: ResolvedCodeBlockColor,
      mode: "card" | "transparent",
    ): { light: string; dark: string } {
      return panelFillFor(resolved.palette, resolved.primary, mode);
    },
    darkTokenCss(instanceId: string, map: SyntaxPaletteMap): string {
      return darkTokenRulesForInstance(instanceId, map);
    },
    basePanelCss(): string {
      return PRISM_CODE_BLOCK_BASE_CSS;
    },
  },

  gradient: {
    /**
     * Multi-stop linear gradients for light / dark surfaces (paired shades).
     * Default numeric shade uses `dark = 900 - light` clamped to 50–900 when `shade` is a single number.
     */
    linearStrings(opts: {
      palette?: PrismPaletteId;
      swatches: PrismSwatchKey[];
      direction: "horizontal" | "vertical" | "angled";
      shade?: number | { light: number; dark: number };
      /**
       * `cssVar` — `var(--color-*)` stops (needs theme tokens in CSS). Prefer `resolved` when
       * inlined in `style=` and the bundle may omit unused `@theme` keys (common for Tailwind-prefixed vars).
       */
      stopResolution?: "cssVar" | "resolved";
    }): { light: string; dark: string } {
      const palette = resolvePaletteId(opts.palette);
      const resolution = opts.stopResolution ?? "cssVar";
      const dir = gradientDirectionCss(opts.direction);
      const swatches = opts.swatches;
      const n = swatches.length;
      if (n === 0) {
        return { light: "none", dark: "none" };
      }
      const pair =
        typeof opts.shade === "object" && opts.shade !== null
          ? opts.shade
          : (() => {
              const s = typeof opts.shade === "number" ? opts.shade : 500;
              return {
                light: s,
                dark: Math.min(900, Math.max(50, 900 - s)),
              };
            })();

      const build = (shadeNum: number): string => {
        const stops = swatches.map((fam, i) => {
          const pct = n === 1 ? 50 : (i / (n - 1)) * 100;
          const colorToken =
            resolution === "resolved"
              ? PrismColor.hex({ palette, family: fam, shade: shadeNum })
              : cssVarForFamilyShade(palette, fam, shadeNum);
          return `${colorToken} ${pct}%`;
        });
        return `linear-gradient(${dir}, ${stops.join(", ")})`;
      };

      return { light: build(pair.light), dark: build(pair.dark) };
    },
  },
} as const;

/**
 * Resolved CSS `<color>` for a partial Prism spec (picker + surfaces): `palette` +
 * `swatchPrimary` + `shade` via {@link PrismColor.hex}.
 */
export function prismColorSpecToHex(spec: PartialPrismColorSpec | undefined): string {
  const n = normalizePrismColorSpec(spec);
  const palette = n.palette;
  const family =
    n.swatchPrimary ?? PrismColor.Loop.normalize(palette, "blue");
  const shadePart: PrismDefaultPaletteShadeKey =
    spec?.shade !== undefined && spec?.shade !== null ? spec.shade : n.shade;
  return PrismColor.hex({
    palette,
    family,
    shade: shadePart,
  });
}

/**
 * Resolves {@link PartialPrismColorSpec} for a **font glyph** (e.g. {@link PrismIcon}):
 * either a solid CSS `<color>` or a resolved `linear-gradient(...)` for use with
 * `background-clip: text` / transparent fill (glyphs cannot use `color: linear-gradient(...)`).
 */
function shadeForIconGradientStops(
  gradientShade: number | { light: number; dark: number } | undefined,
  normalizedShade: PrismDefaultPaletteShadeKey,
): number | { light: number; dark: number } {
  if (gradientShade !== undefined) return gradientShade;
  return typeof normalizedShade === "number" ? normalizedShade : 500;
}

export function prismColorSpecToIconGlyphPaint(
  spec: PartialPrismColorSpec | undefined,
): { solid: string } | { gradient: string } | undefined {
  if (!spec || Object.keys(spec).length === 0) return undefined;
  const g = spec.gradient;
  if (g && Array.isArray(g.swatches) && g.swatches.length > 0) {
    const n = normalizePrismColorSpec(spec);
    const palette = n.palette;
    const normalizedSwatches = g.swatches.map((s) =>
      PrismColor.Loop.normalize(palette, s),
    );
    const shadeForStops = shadeForIconGradientStops(g.shade, n.shade);
    const { light } = PrismColor.gradient.linearStrings({
      palette,
      swatches: normalizedSwatches,
      direction: g.direction ?? "horizontal",
      shade: shadeForStops,
      stopResolution: "resolved",
    });
    if (light === "none") {
      return { solid: prismColorSpecToHex(spec) };
    }
    return { gradient: light };
  }
  return { solid: prismColorSpecToHex(spec) };
}

// ─── shared surface / label contrast (default + tailwind) ───────────────────

/**
 * Surfaces with approximate luminance **below** this use the label family at **shade 100**
 * for on-surface text (same threshold for `#hex` and `oklch(...)`).
 * Matches the picker’s historical “dark face” boundary (~0.45).
 */
export const PRISM_TINTED_SURFACE_MAX_LUMA = 0.45;

/**
 * Approximate **0–1** relative luminance for CSS `<color>` strings in inline styles (`#hex`, `oklch(...)`).
 * Hex values use {@link PrismColor.relativeLuminanceFromHex}. `transparent` is treated as light. Unknown syntax → `0.5`.
 */
export function approximateRelativeLuminanceFromCssColor(css: string): number {
  const t = css.trim().toLowerCase();
  if (!t || t === "transparent") return 0.98;
  if (t.includes("color-mix")) return 0.62;
  if (parseHex6RgbChannels(t) !== null) {
    return PrismColor.relativeLuminanceFromHex(t);
  }
  const oklch = /^oklch\(\s*([\d.]+)%/i.exec(css);
  if (oklch) {
    const lp = parseFloat(oklch[1]!);
    return Math.min(1, Math.max(0, lp / 100));
  }
  return 0.5;
}

/**
 * Label / gutter text on a **filled** surface: one rule for both palettes—
 * dark enough surfaces → `labelFamily` @ **100**; lighter surfaces → neutral **700**.
 */
export function prismLabelOnFilledSurface(opts: {
  palette: PrismPaletteId;
  surfaceCss: string;
  labelFamily: PrismSwatchKey;
}): string {
  const palette = resolvePaletteId(opts.palette);
  if (
    approximateRelativeLuminanceFromCssColor(opts.surfaceCss) <
    PRISM_TINTED_SURFACE_MAX_LUMA
  ) {
    return PrismColor.hex({
      palette,
      family: opts.labelFamily,
      shade: 100,
    });
  }
  const neutral = palette === "tailwind" ? "zinc" : "grey";
  return PrismColor.hex({ palette, family: neutral, shade: 700 });
}
