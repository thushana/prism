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

export type PrismColorSpec = {
  palette?: PrismPaletteId;
  swatchPrimary?: PrismSwatchKey;
  swatchSecondary?: PrismSwatchKey;
  swatchTertiary?: PrismSwatchKey;
  shade?: number;
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
  colorLoop?: {
    center: PrismSwatchKey;
    range: number;
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

function pairSlug(
  palette: PrismPaletteId,
  lightSlug: string,
  darkSlug: string,
): TokenStyle {
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
function syntaxCommentPair(palette: PrismPaletteId): TokenStyle {
  if (palette === "tailwind") {
    return pairSlug(palette, "slate-500", "slate-400");
  }
  return pairSlug(palette, "blue-grey-500", "blue-grey-400");
}

/** Punctuation: grey-600 ramp vs zinc for tailwind. */
function syntaxPunctPair(palette: PrismPaletteId): TokenStyle {
  if (palette === "tailwind") {
    return pairSlug(palette, "zinc-600", "zinc-400");
  }
  return pairSlug(palette, "grey-600", "grey-400");
}

function pairFamilyShades(
  palette: PrismPaletteId,
  family: PrismSwatchKey,
  lightShade: number,
  darkShade: number,
): TokenStyle {
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

function clampColorLoopRange(
  palette: PrismPaletteId,
  range: number | undefined,
): number {
  const ring = loopFor(palette);
  const maxR = Math.floor(ring.length / 2);
  const r = range ?? 2;
  return Math.max(0, Math.min(maxR, Math.floor(r)));
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
  const range = clampColorLoopRange(palette, spec?.colorLoop?.range);
  return { palette, primary: anchor, colorLoopRange: range };
}

function buildSyntaxTokenMap(
  palette: PrismPaletteId,
  primary: PrismSwatchKey,
  range: number,
): SyntaxPaletteMap {
  const oneUp =
    range >= 1 ? ringFamilyAtOffset(palette, primary, 1) : primary;
  const oneDown =
    range >= 1 ? ringFamilyAtOffset(palette, primary, -1) : primary;
  const twoDown =
    range >= 2 ? ringFamilyAtOffset(palette, primary, -2) : oneDown;

  if (primary === "grey" || primary === "gray") {
    const g = neutralRampFamily(palette);
    return {
      keyword: pairFamilyShades(palette, g, 800, 300),
      string: pairFamilyShades(palette, g, 700, 400),
      comment: syntaxCommentPair(palette),
      tag: pairFamilyShades(palette, g, 800, 300),
      property: pairFamilyShades(palette, g, 700, 400),
      number: pairFamilyShades(palette, g, 700, 400),
      punct: pairFamilyShades(palette, g, 600, 400),
      brace: pairFamilyShades(palette, g, 900, 300),
    };
  }

  return {
    keyword: pairFamilyShades(palette, primary, 800, 300),
    string: pairFamilyShades(palette, oneUp, 800, 300),
    comment: syntaxCommentPair(palette),
    tag: pairFamilyShades(palette, primary, 700, 400),
    property: pairFamilyShades(palette, oneDown, 700, 400),
    number: pairFamilyShades(palette, twoDown, 900, 200),
    punct: syntaxPunctPair(palette),
    brace: pairFamilyShades(palette, primary, 900, 300),
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
  if (syntaxFamily === "grey" || syntaxFamily === "gray") {
    const g = neutralRampFamily(palette);
    return {
      light: veilHalfWhite(cssVarForFamilyShade(palette, g, 100)),
      dark: cssVarForFamilyShade(palette, g, 900),
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
  shade: number;
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
  const shade =
    typeof partial?.shade === "number" && Number.isFinite(partial.shade)
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
   */
  hex(opts: {
    palette?: PrismPaletteId;
    family: PrismSwatchKey;
    shade: number;
  }): string {
    const palette = resolvePaletteId(opts.palette);
    if (palette === "tailwind") {
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
    }): { light: string; dark: string } {
      const palette = resolvePaletteId(opts.palette);
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
          return `${cssVarForFamilyShade(palette, fam, shadeNum)} ${pct}%`;
        });
        return `linear-gradient(${dir}, ${stops.join(", ")})`;
      };

      return { light: build(pair.light), dark: build(pair.dark) };
    },
  },
} as const;
