"use client";

import {
  PRISM_META_CHIP_OUTLINE_CLASS,
  PrismCodeBlock,
  PrismColor,
  PrismColorPicker,
  PrismTypography,
  clampPrismColorLoopRange,
  PRISM_DEFAULT_COLOR_LOOP,
  type PartialPrismColorSpec,
  type PrismPaletteId,
  type PrismSwatchKey,
} from "@ui";
import { cn } from "@utilities";
import type { JSX } from "react";
import { useMemo, useState } from "react";

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

/** Readable label on arbitrary CSS color from {@link PrismColor.hex}. */
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
 * Merges picker emissions into committed spec. When `next` omits `gradient`, clear any previous
 * `gradient` so it does not stick across updates.
 */
function mergePartialPrismPickerSpec(
  prev: PartialPrismColorSpec,
  next: PartialPrismColorSpec,
): PartialPrismColorSpec {
  const nextHasGradient = Object.prototype.hasOwnProperty.call(next, "gradient");
  const base = nextHasGradient
    ? { ...prev, ...next }
    : (() => {
        const { gradient: _drop, ...restPrev } = prev;
        return { ...restPrev, ...next };
      })();
  if (
    Object.prototype.hasOwnProperty.call(base, "gradient") &&
    base.gradient === undefined
  ) {
    const { gradient: _g, ...rest } = base;
    return rest;
  }
  return base;
}

const CHECKBOX_ROW_CLASS =
  "flex cursor-pointer flex-wrap items-center gap-x-6 gap-y-3";

/**
 * Admin: PrismColor — one picker drives the full {@link PartialPrismColorSpec}; previews show
 * ColorLoop, {@link PrismColor.gradient.linearStrings}, and {@link PrismCodeBlock} wiring.
 */
export function PrismColorDemo(): JSX.Element {
  const [spec, setSpec] = useState<PartialPrismColorSpec>(() => ({
    palette: "default",
    swatchPrimary: "purple",
    shade: 500,
  }));
  const [showColorCode, setShowColorCode] = useState(false);
  const [showCopyButton, setShowCopyButton] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const palette = spec.palette ?? "default";
  const loopCenter = PrismColor.Loop.normalize(
    palette,
    spec.colorLoop?.center ?? spec.swatchPrimary ?? "purple",
  );
  const loopRange = clampPrismColorLoopRange(palette, spec.colorLoop?.range);

  const loopVisual = useMemo(
    () => colorLoopChips(palette, loopCenter, loopRange),
    [palette, loopCenter, loopRange],
  );

  const gradientPair = useMemo(() => {
    const g = spec.gradient;
    const swatches = g?.swatches;
    if (!g || !swatches?.length) return null;
    return PrismColor.gradient.linearStrings({
      palette,
      swatches,
      direction: g.direction ?? "horizontal",
      shade: g.shade ?? 500,
      stopResolution: "resolved",
    });
  }, [palette, spec.gradient]);

  const specJson = useMemo(
    () => JSON.stringify(spec, null, 2),
    [spec],
  );

  return (
    <div className="min-w-0 space-y-10">
      <header className="max-w-2xl space-y-2">
        <PrismTypography role="title" size="large" as="h2" className="font-bold">
          PrismColor
        </PrismTypography>
        <PrismTypography role="body" size="medium" tone="muted">
          Use a single <code className="font-mono text-foreground">PrismColorPicker</code> for
          palette, single swatch, ColorLoop range, and multi-stop gradients. Sections below read the
          committed <code className="font-mono text-foreground">PartialPrismColorSpec</code> — no
          duplicate ramp or direction controls on this page.
        </PrismTypography>
      </header>

      <section className="max-w-xl space-y-4">
        <PrismTypography role="overline" size="small" className="mb-1 block">
          PrismColorPicker
        </PrismTypography>
        <div className={CHECKBOX_ROW_CLASS}>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={showColorCode}
              onChange={() => setShowColorCode((v) => !v)}
              className="rounded border-input"
            />
            <PrismTypography role="label" size="medium" tone="muted" font="mono">
              showColorCode
            </PrismTypography>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={showCopyButton}
              onChange={() => setShowCopyButton((v) => !v)}
              className="rounded border-input"
            />
            <PrismTypography role="label" size="medium" tone="muted" font="mono">
              showCopyButton
            </PrismTypography>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={disabled}
              onChange={() => setDisabled((v) => !v)}
              className="rounded border-input"
            />
            <PrismTypography role="label" size="medium" tone="muted" font="mono">
              disabled
            </PrismTypography>
          </label>
        </div>
        <div key={palette} className="relative min-w-0">
          <PrismColorPicker
            color={spec}
            onColorChange={(next) =>
              setSpec((s) => mergePartialPrismPickerSpec(s, next))
            }
            showColorCode={showColorCode}
            showCopyButton={showCopyButton}
            disabled={disabled}
          />
        </div>
      </section>

      <section className="max-w-3xl space-y-3">
        <PrismTypography role="overline" size="small" className="mb-1 block">
          Committed spec
        </PrismTypography>
        <PrismTypography role="body" size="small" tone="muted" className="max-w-2xl">
          Live <code className="font-mono text-foreground">PartialPrismColorSpec</code> from the
          picker (includes <code className="font-mono text-foreground">colorLoop</code>,{" "}
          <code className="font-mono text-foreground">gradient</code>, etc. when set).
        </PrismTypography>
        <PrismCodeBlock
          className="font-mono"
          mode="card"
          language="json"
          disableLineNumbers
          color={spec}
        >
          {specJson}
        </PrismCodeBlock>
      </section>

      <section className="space-y-3">
        <PrismTypography role="title" size="small" as="h3" className="font-bold">
          ColorLoop ring
        </PrismTypography>
        <PrismTypography role="body" size="small" tone="muted" className="max-w-2xl">
          Chips use <code className="font-mono text-foreground">PrismColor.Loop.step</code> with
          center <code className="font-mono text-foreground">{loopCenter}</code> and range{" "}
          <code className="font-mono text-foreground">{loopRange}</code> (from{" "}
          <code className="font-mono text-foreground">clampPrismColorLoopRange</code>).
        </PrismTypography>
        <div className="flex flex-wrap gap-2">
          {loopVisual.map(({ offset, family }) => {
            const fill = PrismColor.hex({ palette, family, shade: 500 });
            const fg = foregroundForFill(fill);
            return (
              <span
                key={`${offset}-${family}`}
                title={`offset ${offset}`}
                className={cn(
                  PRISM_META_CHIP_OUTLINE_CLASS,
                  "rounded-md py-1 font-mono font-normal",
                )}
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
      </section>

      <section className="max-w-3xl space-y-4">
        <PrismTypography role="title" size="small" as="h3" className="font-bold">
          Gradient → PrismColor.gradient.linearStrings
        </PrismTypography>
        <PrismTypography role="body" size="small" tone="muted">
          When the picker commits a <code className="font-mono text-foreground">gradient</code>,
          previews call{" "}
          <code className="font-mono text-foreground">linearStrings</code> with{" "}
          <code className="font-mono text-foreground">
            {`stopResolution: "resolved"`}
          </code>{" "}
          so
          literal colors work in <code className="font-mono text-foreground">backgroundImage</code>{" "}
          without loading every CSS variable in admin.
        </PrismTypography>
        {gradientPair ? (
          <div className="flex min-w-0 flex-col gap-3">
            <div>
              <PrismTypography
                role="label"
                size="small"
                className="mb-1 block text-muted-foreground"
              >
                Light stops
              </PrismTypography>
              <div
                className="box-border w-full max-w-xl shrink-0 rounded-xl border border-border shadow-sm"
                role="presentation"
                style={{
                  height: "5rem",
                  minHeight: "5rem",
                  backgroundImage: gradientPair.light,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                }}
              />
            </div>
            <div>
              <PrismTypography
                role="label"
                size="small"
                className="mb-1 block text-muted-foreground"
              >
                Dark stops
              </PrismTypography>
              <div
                className="box-border w-full max-w-xl shrink-0 rounded-xl border border-border shadow-sm"
                role="presentation"
                style={{
                  height: "5rem",
                  minHeight: "5rem",
                  backgroundImage: gradientPair.dark,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                }}
              />
            </div>
          </div>
        ) : (
          <PrismTypography role="body" size="small" className="italic text-muted-foreground">
            Switch the picker to Gradient mode and add swatches to see paired light/dark ramps here.
          </PrismTypography>
        )}
      </section>

      <section className="max-w-3xl space-y-3">
        <PrismTypography role="title" size="small" as="h3" className="font-bold">
          PrismCodeBlock
        </PrismTypography>
        <PrismTypography role="body" size="small" tone="muted">
          Syntax highlighting uses the same committed spec on the{" "}
          <code className="font-mono text-foreground">color</code> prop.
        </PrismTypography>
        <PrismCodeBlock
          className="font-mono"
          mode="card"
          language="tsx"
          color={spec}
        >
          {`const Example = () => (
  <section className="p-4">
    <Button label="Save" />
  </section>
);`}
        </PrismCodeBlock>
      </section>

      <PrismTypography role="body" size="small" className="text-muted-foreground">
        Default Material loop: {PRISM_DEFAULT_COLOR_LOOP.length} families. Tailwind loop:{" "}
        {PrismColor.Loop.families("tailwind").length}.
      </PrismTypography>
    </div>
  );
}
