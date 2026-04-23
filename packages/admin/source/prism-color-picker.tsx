"use client";

import {
  PRISM_DEFAULT_COLOR_LOOP,
  PRISM_TAILWIND_COLOR_LOOP,
  PrismCodeBlock,
  PrismColor,
  PrismColorPicker,
  PrismIcon,
  PrismTypography,
  type PartialPrismColorSpec,
  type PrismPaletteId,
  type PrismSwatchKey,
} from "@ui";
import { useLayoutEffect, useMemo, useState } from "react";

const CUSTOMIZER_INPUT_CLASS =
  "box-border h-10 w-full max-w-xs rounded-md border border-input bg-background px-4 py-0 text-sm font-mono leading-10";

const CUSTOMIZER_SELECT_CLASS = `${CUSTOMIZER_INPUT_CLASS} appearance-none pr-10`;

function familiesForPalette(palette: PrismPaletteId): readonly PrismSwatchKey[] {
  return palette === "tailwind"
    ? PRISM_TAILWIND_COLOR_LOOP
    : PRISM_DEFAULT_COLOR_LOOP;
}

function randomPalette(): PrismPaletteId {
  return Math.random() < 0.5 ? "default" : "tailwind";
}

function randomSwatchForPalette(palette: PrismPaletteId): PrismSwatchKey {
  const ring = familiesForPalette(palette);
  return ring[Math.floor(Math.random() * ring.length)]!;
}

function mergeSpec(
  base: PartialPrismColorSpec,
  patch: PartialPrismColorSpec,
): PartialPrismColorSpec {
  return { ...base, ...patch };
}

function formatPickerSnippet(spec: PartialPrismColorSpec, p: {
  showColorCode: boolean;
  showCopyButton: boolean;
  disabled: boolean;
}): string {
  const lines: string[] = ["<PrismColorPicker"];

  const pal = spec.palette ?? "default";
  const fam = spec.swatchPrimary ?? "purple";

  lines.push("  color={{");
  if (pal !== "default") {
    lines.push(`    palette: "${pal}",`);
  }
  lines.push(`    swatchPrimary: "${fam}",`);
  if (spec.shade !== undefined) {
    const s = spec.shade;
    lines.push(
      `    shade: ${typeof s === "string" ? JSON.stringify(s) : s},`,
    );
  }
  lines.push("  }}");

  lines.push("  onColorChange={setColor}");
  if (p.showColorCode) lines.push("  showColorCode");
  if (p.showCopyButton) lines.push("  showCopyButton");
  if (p.disabled) lines.push("  disabled");
  lines.push("/>");
  return `${lines.join("\n")}\n`;
}

/**
 * Admin playground for {@link PrismColorPicker} — layout matches {@link PrismCodeBlockDemo}.
 */
export function PrismColorPickerDemo(): React.JSX.Element {
  const [color, setColor] = useState<PartialPrismColorSpec>({
    palette: "default",
    swatchPrimary: "purple",
    shade: 500,
  });
  const [showColorCode, setShowColorCode] = useState(false);
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useLayoutEffect(() => {
    const p = randomPalette();
    const fam = randomSwatchForPalette(p);
    setColor({
      palette: p,
      swatchPrimary: fam,
      shade: 500,
    });
  }, []);

  const palette = color.palette ?? "default";
  const swatchPrimary = color.swatchPrimary ?? "purple";

  const applySwatchChange = (fam: PrismSwatchKey) => {
    const normalized = PrismColor.Loop.normalize(palette, fam);
    setColor((prev) =>
      mergeSpec(prev, {
        swatchPrimary: normalized,
        shade: prev.shade ?? 500,
      }),
    );
  };

  const generatedUsage = useMemo(
    () =>
      formatPickerSnippet(color, {
        showColorCode,
        showCopyButton,
        disabled,
      }),
    [color, showColorCode, showCopyButton, disabled],
  );

  const swatchOptions = [...familiesForPalette(palette)];

  return (
    <>
      <div className="mb-6">
        <PrismTypography
          role="title"
          size="large"
          as="h3"
          font="sans"
          className="mb-2 font-bold"
        >
          Customize
        </PrismTypography>

        <div className="mb-4 min-w-0 max-w-xs">
          <PrismTypography role="overline" size="small" font="sans" className="mb-1 block">
            swatchPrimary
          </PrismTypography>
          <div className="relative">
            <select
              className={CUSTOMIZER_SELECT_CLASS}
              value={swatchPrimary}
              onChange={(e) =>
                applySwatchChange(e.target.value as PrismSwatchKey)
              }
            >
              {swatchOptions.map((fam) => (
                <option key={fam} value={fam}>
                  {fam}
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

        <div className="mb-6 flex flex-wrap gap-6">
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

        <div className="mb-5">
          <PrismTypography
            role="title"
            size="small"
            as="h2"
            font="sans"
            className="mb-4 font-bold"
          >
            Example
          </PrismTypography>
          <PrismColorPicker
            color={color}
            onColorChange={setColor}
            showColorCode={showColorCode}
            showCopyButton={showCopyButton}
            disabled={disabled}
          />
        </div>

        <div className="mt-8">
          <PrismTypography
            role="title"
            size="small"
            as="h2"
            font="sans"
            className="mb-4 font-bold"
          >
            PrismColorPicker
          </PrismTypography>
          <PrismCodeBlock
            className="font-mono"
            mode="card"
            disableLineNumbers={false}
            disableLanguageLabel={false}
            color={{ swatchPrimary: "grey" }}
            language="tsx"
          >
            {generatedUsage}
          </PrismCodeBlock>
        </div>
      </div>
    </>
  );
}
