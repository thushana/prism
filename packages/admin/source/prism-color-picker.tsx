"use client";

import {
  PRISM_DEFAULT_COLOR_LOOP,
  PRISM_TAILWIND_COLOR_LOOP,
  PrismCodeBlock,
  PrismColorPicker,
  PrismTypography,
  prismColorPickerClipboardColorProp,
  type PartialPrismColorSpec,
  type PrismPaletteId,
  type PrismSwatchKey,
} from "@ui";
import { useMemo, useState } from "react";

function randomPalette(): PrismPaletteId {
  return Math.random() < 0.5 ? "default" : "tailwind";
}

function randomSwatchForPalette(palette: PrismPaletteId): PrismSwatchKey {
  const ring =
    palette === "tailwind" ? PRISM_TAILWIND_COLOR_LOOP : PRISM_DEFAULT_COLOR_LOOP;
  return ring[Math.floor(Math.random() * ring.length)]!;
}

function formatPickerSnippet(spec: PartialPrismColorSpec, p: {
  showColorCode: boolean;
  showCopyButton: boolean;
  disabled: boolean;
}): string {
  const lines: string[] = ["<PrismColorPicker"];
  for (const line of prismColorPickerClipboardColorProp(spec).split("\n")) {
    lines.push(`  ${line}`);
  }
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
  const [color, setColor] = useState<PartialPrismColorSpec>(() => {
    const palette = randomPalette();
    return {
      palette,
      swatchPrimary: randomSwatchForPalette(palette),
      shade: 500,
    };
  });
  const [showColorCode, setShowColorCode] = useState(false);
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const generatedUsage = useMemo(
    () =>
      formatPickerSnippet(color, {
        showColorCode,
        showCopyButton,
        disabled,
      }),
    [color, showColorCode, showCopyButton, disabled],
  );

  return (
    <>
      <div className="mb-6 pt-8">
        <PrismTypography
          role="title"
          size="small"
          as="h2"
          font="sans"
          className="mb-3 font-bold"
        >
          Customize
        </PrismTypography>

        <div className="flex flex-wrap gap-6">
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

        <div className="pt-10">
          <PrismTypography
            role="title"
            size="small"
            as="h2"
            font="sans"
            className="mb-3 font-bold"
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

        <div className="pt-10">
          <PrismTypography
            role="title"
            size="small"
            as="h2"
            font="sans"
            className="mb-3 font-bold"
          >
            Code Sample
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
