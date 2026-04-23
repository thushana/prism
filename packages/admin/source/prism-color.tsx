"use client";

import {
  PrismBadge,
  PrismCodeBlock,
  PrismColor,
  PrismColorPicker,
  PrismIcon,
  PrismTypography,
  PRISM_COLOR_PALETTE_MATERIAL_SHADE_ORDER,
  PRISM_COLOR_PALETTE_TAILWIND_SHADE_ORDER,
  PRISM_DEFAULT_COLOR_LOOP,
  type PrismPaletteId,
  type PrismSwatchKey,
} from "@ui";
import type { JSX } from "react";
import { useMemo, useState } from "react";

const PALETTE_OPTIONS: { value: PrismPaletteId; label: string }[] = [
  { value: "default", label: "default (Material CSS vars)" },
  { value: "tailwind", label: "tailwind (prefixed --color-tailwind-*)" },
];

const GRADIENT_DIRECTIONS = [
  { value: "horizontal" as const, label: "horizontal" },
  { value: "vertical" as const, label: "vertical" },
  { value: "angled" as const, label: "angled (135deg)" },
];

const INPUT_CLASS =
  "box-border h-10 w-full max-w-xs rounded-md border border-input bg-background px-4 py-0 text-sm font-mono leading-10";
const SELECT_CLASS = `${INPUT_CLASS} appearance-none pr-10`;

/** Material numeric ramp only — `linearStrings` single-shade mode uses one number and derives the dark pair. */
const MATERIAL_NUMERIC_SHADE_OPTIONS = PRISM_COLOR_PALETTE_MATERIAL_SHADE_ORDER.filter(
  (s) => typeof s === "number",
) as readonly number[];

function gradientShadeSelectOptions(
  palette: PrismPaletteId,
): readonly number[] {
  return palette === "tailwind"
    ? PRISM_COLOR_PALETTE_TAILWIND_SHADE_ORDER
    : MATERIAL_NUMERIC_SHADE_OPTIONS;
}

function colorLoopChips(
  palette: PrismPaletteId,
  center: PrismSwatchKey,
  range: number,
): { offset: number; family: PrismSwatchKey }[] {
  const out: { offset: number; family: PrismSwatchKey }[] = [];
  for (let o = -range; o <= range; o++) {
    out.push({
      offset: o,
      family: PrismColor.Loop.step(palette, center, o),
    });
  }
  return out;
}

/** Readable label on arbitrary CSS color from {@link PrismColor.hex} (#hex or oklch). */
function foregroundForFill(cssColor: string): string {
  const t = cssColor.trim();
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (hexMatch) {
    const compact = hexMatch[1]!;
    const full =
      compact.length === 3
        ? compact
            .split("")
            .map((c) => c + c)
            .join("")
        : compact;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;
    const lin = (x: number) =>
      x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    const lum =
      0.2126 * lin(rs) + 0.7152 * lin(gs) + 0.0722 * lin(bs);
    return lum < 0.45 ? "#ffffff" : "#171717";
  }
  const oklch = /^oklch\(\s*([\d.]+)%/i.exec(t);
  if (oklch) {
    const lp = parseFloat(oklch[1]!);
    return lp > 62 ? "#171717" : "#ffffff";
  }
  return "#ffffff";
}

/**
 * Admin: PrismColor — ColorLoop, gradient builder, syntax via PrismCodeBlock, both palettes.
 */
export function PrismColorDemo(): JSX.Element {
  const [palette, setPalette] = useState<PrismPaletteId>("default");

  /** Library clamp: `range ?? 2`, capped at ⌊ring length / 2⌋ (not a hard max of 2). */
  const maxLoopRange = Math.floor(
    PrismColor.Loop.families(palette).length / 2,
  );

  const [loopCenter, setLoopCenter] = useState<PrismSwatchKey>("purple");
  const [loopRange, setLoopRange] = useState(2);
  const effectiveLoopRange = Math.min(loopRange, maxLoopRange);

  const [gradientStopFamilyFirst, setGradientStopFamilyFirst] =
    useState<PrismSwatchKey>("purple");
  const [gradientStopFamilySecond, setGradientStopFamilySecond] =
    useState<PrismSwatchKey>("pink");
  const [gradientStopFamilyThird, setGradientStopFamilyThird] =
    useState<PrismSwatchKey>("red");
  const [gradientDirection, setGradientDirection] =
    useState<(typeof GRADIENT_DIRECTIONS)[number]["value"]>("horizontal");
  /** Single ramp step: `linearStrings` builds light stops at this shade and dark stops at `900 − shade` (clamped). */
  const [gradientShade, setGradientShade] = useState(500);

  const gradientPair = useMemo(
    () =>
      PrismColor.gradient.linearStrings({
        palette,
        swatches: [
          gradientStopFamilyFirst,
          gradientStopFamilySecond,
          gradientStopFamilyThird,
        ],
        direction: gradientDirection,
        shade: gradientShade,
        // Inline `style={{ backgroundImage }}` must use literal colors: `var(--color-*)` is only valid when
        // the app’s CSS defines those tokens; this admin page may not load the full theme, so both palettes
        // use resolved #hex / oklch stops (see `linearStrings` JSDoc).
        stopResolution: "resolved",
      }),
    [
      palette,
      gradientStopFamilyFirst,
      gradientStopFamilySecond,
      gradientStopFamilyThird,
      gradientDirection,
      gradientShade,
    ],
  );

  const gradientDarkPairedShade = Math.min(
    900,
    Math.max(50, 900 - gradientShade),
  );

  const loopVisual = useMemo(
    () => colorLoopChips(palette, loopCenter, effectiveLoopRange),
    [palette, loopCenter, effectiveLoopRange],
  );

  const codeSample = useMemo(() => {
    const spec = `color={{
    palette: "${palette}",
    swatchPrimary: "${loopCenter}",
    colorLoop: { center: "${loopCenter}", range: ${effectiveLoopRange} },
  }}`;
    return `<PrismCodeBlock
  language="tsx"
  mode="card"
${spec.split("\n").join("\n  ")}
>
  {\`const x = 1\`}
</PrismCodeBlock>`;
  }, [palette, loopCenter, effectiveLoopRange]);

  return (
    // Remount controls when switching palette so invalid swatches (e.g. "purple" vs Tailwind-only names) reset.
    <div key={palette} className="mb-6 min-w-0">
      <PrismTypography role="title" size="large" as="h2" className="mb-4 font-bold">
        Customize
      </PrismTypography>
      <PrismTypography role="body" size="medium" className="mb-4 text-muted-foreground">
        Live ColorLoop offsets, gradient strings from{" "}
        <code className="font-mono text-foreground">PrismColor.gradient.linearStrings</code>,
        and syntax coloring with the same palette in a real{" "}
        <code className="font-mono text-foreground">PrismCodeBlock</code>.
      </PrismTypography>

      <div className="mb-6 flex min-w-0 max-w-md flex-col gap-4">
        <div>
          <PrismTypography role="overline" size="small" className="mb-1 block">
            palette
          </PrismTypography>
          <div className="relative">
            <select
              className={SELECT_CLASS}
              value={palette}
              onChange={(e) =>
                setPalette(e.target.value as PrismPaletteId)
              }
            >
              {PALETTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <PrismIcon
              name="expand_more"
              size={16}
              weight="regular"
              fill="off"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        <PrismColorPicker
          color={{ palette, swatchPrimary: loopCenter, shade: 500 }}
          onColorChange={(next) => {
            const f = next.swatchPrimary;
            if (f) setLoopCenter(PrismColor.Loop.normalize(palette, f));
          }}
        />

        <div>
          <PrismTypography role="overline" size="small" className="mb-1 block">
            ColorLoop range
          </PrismTypography>
          <input
            type="range"
            min={0}
            max={maxLoopRange}
            value={effectiveLoopRange}
            onChange={(e) => setLoopRange(Number(e.target.value))}
            className="w-full max-w-md"
            aria-valuemin={0}
            aria-valuemax={maxLoopRange}
            aria-valuenow={effectiveLoopRange}
          />
          <PrismTypography role="label" size="small" className="mt-1 font-mono text-muted-foreground">
            {effectiveLoopRange}
            <span className="font-sans text-muted-foreground"> / {maxLoopRange}</span>
            <span className="mt-0.5 block font-sans text-[11px] normal-case tracking-normal text-muted-foreground">
              Omit in props → defaults to 2; max is ⌊palette size / 2⌋.
            </span>
          </PrismTypography>
        </div>
      </div>

      <PrismTypography role="title" size="small" as="h3" className="mb-3 font-bold">
        ColorLoop visualization
      </PrismTypography>
      <div className="mb-8 flex flex-wrap gap-2">
        {loopVisual.map(({ offset, family }) => {
          const fill = PrismColor.hex({ palette, family, shade: 500 });
          const fg = foregroundForFill(fill);
          return (
            <PrismBadge
              key={`${offset}-${family}`}
              variant="outline"
              title={`offset ${offset}`}
              className="rounded-md border-border py-1 font-mono font-normal"
              style={{
                backgroundColor: fill,
                color: fg,
                textShadow:
                  fg === "#ffffff" ? "0 0 2px rgb(0 0 0 / 0.55)" : undefined,
              }}
            >
              {offset === 0 ? "center" : `${offset > 0 ? "+" : ""}${offset}`}:{" "}
              {family}
            </PrismBadge>
          );
        })}
      </div>

      <PrismTypography role="title" size="small" as="h3" className="mb-3 font-bold">
        Gradient preview (multi-swatch)
      </PrismTypography>
      <div className="mb-4 flex min-w-0 max-w-md flex-col gap-4">
        <PrismColorPicker
          color={{ palette, swatchPrimary: gradientStopFamilyFirst, shade: 500 }}
          onColorChange={(next) => {
            const f = next.swatchPrimary;
            if (f) setGradientStopFamilyFirst(PrismColor.Loop.normalize(palette, f));
          }}
        />
        <PrismColorPicker
          color={{ palette, swatchPrimary: gradientStopFamilySecond, shade: 500 }}
          onColorChange={(next) => {
            const f = next.swatchPrimary;
            if (f) setGradientStopFamilySecond(PrismColor.Loop.normalize(palette, f));
          }}
        />
        <PrismColorPicker
          color={{ palette, swatchPrimary: gradientStopFamilyThird, shade: 500 }}
          onColorChange={(next) => {
            const f = next.swatchPrimary;
            if (f) setGradientStopFamilyThird(PrismColor.Loop.normalize(palette, f));
          }}
        />
        <div>
          <PrismTypography role="overline" size="small" className="mb-1 block">
            Gradient shade (ramp step)
          </PrismTypography>
          <PrismTypography role="body" size="small" className="mb-2 text-muted-foreground">
            One step for both preview rows: light uses this shade on each stop; dark uses{" "}
            <code className="font-mono text-foreground">
              clamp(900 − shade, 50, 900)
            </code>{" "}
            (<code className="font-mono text-foreground">{gradientDarkPairedShade}</code> here) — same rule as{" "}
            <code className="font-mono text-foreground">PrismColor.gradient.linearStrings</code> with a numeric{" "}
            <code className="font-mono text-foreground">shade</code>.
          </PrismTypography>
          <div className="relative">
            <select
              className={SELECT_CLASS}
              value={gradientShade}
              onChange={(e) => setGradientShade(Number(e.target.value))}
            >
              {gradientShadeSelectOptions(palette).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <PrismIcon
              name="expand_more"
              size={16}
              weight="regular"
              fill="off"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>
        <div>
          <PrismTypography role="overline" size="small" className="mb-1 block">
            direction
          </PrismTypography>
          <div className="relative">
            <select
              className={SELECT_CLASS}
              value={gradientDirection}
              onChange={(e) =>
                setGradientDirection(
                  e.target.value as typeof gradientDirection,
                )
              }
            >
              {GRADIENT_DIRECTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <PrismIcon
              name="expand_more"
              size={16}
              weight="regular"
              fill="off"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>
      </div>
      <PrismTypography role="body" size="small" className="mb-2 max-w-xl text-muted-foreground">
        Previews apply <code className="font-mono text-foreground">background-image</code> from{" "}
        <code className="font-mono text-foreground">gradientPair.light</code> /{" "}
        <code className="font-mono text-foreground">.dark</code> so you can eyeball the gradient next to the
        controls.
      </PrismTypography>
      <div className="mb-6 flex min-w-0 flex-col gap-4">
        <div>
          <PrismTypography role="label" size="small" className="mb-1 block text-muted-foreground">
            Gradient preview — light stops
          </PrismTypography>
          <div
            className="box-border w-full max-w-xl shrink-0 rounded-xl border border-border shadow-sm"
            role="presentation"
            style={{
              height: "6rem",
              minHeight: "6rem",
              backgroundImage: gradientPair.light,
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
            }}
          />
        </div>
        <div>
          <PrismTypography role="label" size="small" className="mb-1 block text-muted-foreground">
            Gradient preview — dark stops
          </PrismTypography>
          <div
            className="box-border w-full max-w-xl shrink-0 rounded-xl border border-border shadow-sm"
            role="presentation"
            style={{
              height: "6rem",
              minHeight: "6rem",
              backgroundImage: gradientPair.dark,
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
            }}
          />
        </div>
      </div>

      <PrismTypography role="title" size="small" as="h3" className="mb-3 font-bold">
        Syntax preview (PrismCodeBlock)
      </PrismTypography>
      <div className="mb-8 max-w-3xl">
        <PrismCodeBlock
          className="font-mono"
          mode="card"
          language="tsx"
          color={{
            palette,
            swatchPrimary: loopCenter,
            colorLoop: { center: loopCenter, range: effectiveLoopRange },
          }}
        >
          {`const Example = () => (
  <section className="p-4">
    <Button label="Save" />
  </section>
);`}
        </PrismCodeBlock>
      </div>

      <PrismTypography role="title" size="small" as="h3" className="mb-3 font-bold">
        CodeBlock (copy)
      </PrismTypography>
      <PrismCodeBlock className="font-mono" mode="card" language="tsx">
        {codeSample}
      </PrismCodeBlock>

      <PrismTypography role="body" size="small" className="mt-6 text-muted-foreground">
        Default Material loop length: {PRISM_DEFAULT_COLOR_LOOP.length} families. Tailwind loop:{" "}
        {PrismColor.Loop.families("tailwind").length}.
      </PrismTypography>
    </div>
  );
}
