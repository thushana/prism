"use client";

import {
  PrismCodeBlock,
  PrismColor,
  PrismIcon,
  PrismTypography,
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
  const families = useMemo(
    () => [...PrismColor.Loop.families(palette)],
    [palette],
  );

  const maxLoopRange = Math.floor(families.length / 2);

  const [loopCenter, setLoopCenter] = useState<PrismSwatchKey>("purple");
  const [loopRange, setLoopRange] = useState(2);

  const [g1, setG1] = useState<PrismSwatchKey>("purple");
  const [g2, setG2] = useState<PrismSwatchKey>("pink");
  const [g3, setG3] = useState<PrismSwatchKey>("red");
  const [gradDir, setGradDir] =
    useState<(typeof GRADIENT_DIRECTIONS)[number]["value"]>("horizontal");
  const [gradShadeLight, setGradShadeLight] = useState(100);
  const [gradShadeDark, setGradShadeDark] = useState(800);

  const gradientPair = useMemo(
    () =>
      PrismColor.gradient.linearStrings({
        palette,
        swatches: [g1, g2, g3],
        direction: gradDir,
        shade: { light: gradShadeLight, dark: gradShadeDark },
        // Tailwind --color-tailwind-* theme keys are often tree-shaken from CSS unless a utility references them;
        // resolved stops (hex/oklch) keep inline previews working.
        stopResolution: palette === "tailwind" ? "resolved" : "cssVar",
      }),
    [palette, g1, g2, g3, gradDir, gradShadeLight, gradShadeDark],
  );

  const loopVisual = useMemo(
    () => colorLoopChips(palette, loopCenter, loopRange),
    [palette, loopCenter, loopRange],
  );

  const codeSample = useMemo(() => {
    const spec = `color={{
    palette: "${palette}",
    swatchPrimary: "${loopCenter}",
    colorLoop: { center: "${loopCenter}", range: ${loopRange} },
  }}`;
    return `<PrismCodeBlock
  language="tsx"
  mode="card"
${spec.split("\n").join("\n  ")}
>
  {\`const x = 1\`}
</PrismCodeBlock>`;
  }, [palette, loopCenter, loopRange]);

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

      <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div>
          <PrismTypography role="overline" size="small" className="mb-1 block">
            palette
          </PrismTypography>
          <div className="relative max-w-xs">
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

        <div>
          <PrismTypography role="overline" size="small" className="mb-1 block">
            ColorLoop center
          </PrismTypography>
          <div className="relative max-w-xs">
            <select
              className={SELECT_CLASS}
              value={loopCenter}
              onChange={(e) =>
                setLoopCenter(e.target.value as PrismSwatchKey)
              }
            >
              {families.map((f) => (
                <option key={f} value={f}>
                  {f}
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
            colorLoop.range (budget)
          </PrismTypography>
          <input
            type="range"
            min={0}
            max={maxLoopRange}
            value={Math.min(loopRange, maxLoopRange)}
            onChange={(e) => setLoopRange(Number(e.target.value))}
            className="max-w-xs"
          />
          <PrismTypography role="label" size="small" className="mt-1 font-mono text-muted-foreground">
            {loopRange}
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
            <span
              key={`${offset}-${family}`}
              title={`offset ${offset}`}
              className="rounded-md border border-border px-2 py-1 font-mono text-xs"
              style={{
                backgroundColor: fill,
                color: fg,
                textShadow:
                  fg === "#ffffff" ? "0 0 2px rgb(0 0 0 / 0.55)" : undefined,
              }}
            >
              {offset === 0 ? "center" : `${offset > 0 ? "+" : ""}${offset}`}:{" "}
              {family}
            </span>
          );
        })}
      </div>

      <PrismTypography role="title" size="small" as="h3" className="mb-3 font-bold">
        Gradient preview (multi-swatch)
      </PrismTypography>
      <div className="mb-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[g1, g2, g3].map((val, idx) => (
          <div key={idx}>
            <PrismTypography role="overline" size="small" className="mb-1 block">
              swatch {idx + 1}
            </PrismTypography>
            <div className="relative max-w-xs">
              <select
                className={SELECT_CLASS}
                value={val}
                onChange={(e) => {
                  const v = e.target.value as PrismSwatchKey;
                  if (idx === 0) setG1(v);
                  else if (idx === 1) setG2(v);
                  else setG3(v);
                }}
              >
                {families.map((f) => (
                  <option key={f} value={f}>
                    {f}
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
        ))}
        <div>
          <PrismTypography role="overline" size="small" className="mb-1 block">
            direction
          </PrismTypography>
          <div className="relative max-w-xs">
            <select
              className={SELECT_CLASS}
              value={gradDir}
              onChange={(e) =>
                setGradDir(e.target.value as typeof gradDir)
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
      <div className="mb-2 grid grid-cols-2 gap-4 sm:max-w-md">
        <div>
          <PrismTypography role="overline" size="small" className="mb-1 block">
            shade light
          </PrismTypography>
          <input
            type="number"
            className={INPUT_CLASS}
            value={gradShadeLight}
            onChange={(e) => setGradShadeLight(Number(e.target.value))}
            min={50}
            max={950}
            step={50}
          />
        </div>
        <div>
          <PrismTypography role="overline" size="small" className="mb-1 block">
            shade dark (gradient stop)
          </PrismTypography>
          <input
            type="number"
            className={INPUT_CLASS}
            value={gradShadeDark}
            onChange={(e) => setGradShadeDark(Number(e.target.value))}
            min={50}
            max={950}
            step={50}
          />
        </div>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div>
          <PrismTypography role="label" size="small" className="mb-1 block text-muted-foreground">
            linearStrings — light stops
          </PrismTypography>
          <div
            className="h-24 rounded-xl border border-border shadow-sm"
            style={{ backgroundImage: gradientPair.light }}
          />
        </div>
        <div>
          <PrismTypography role="label" size="small" className="mb-1 block text-muted-foreground">
            linearStrings — dark stops
          </PrismTypography>
          <div
            className="h-24 rounded-xl border border-border shadow-sm"
            style={{ backgroundImage: gradientPair.dark }}
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
            colorLoop: { center: loopCenter, range: loopRange },
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
