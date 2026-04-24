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
import type { JSX } from "react";
import { useMemo, useState } from "react";

function randomPalette(): PrismPaletteId {
  return Math.random() < 0.5 ? "default" : "tailwind";
}

function randomSwatchForPalette(palette: PrismPaletteId): PrismSwatchKey {
  const ring =
    palette === "tailwind" ? PRISM_TAILWIND_COLOR_LOOP : PRISM_DEFAULT_COLOR_LOOP;
  return ring[Math.floor(Math.random() * ring.length)]!;
}

function formatPickerSnippet(
  spec: PartialPrismColorSpec,
  p: {
    showColorCode: boolean;
    showCopyButton: boolean;
    disabled: boolean;
  },
): string {
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

/** Admin playground for {@link PrismColorPicker}; section layout matches other Prism component demos. */
export function PrismColorPickerDemo(): JSX.Element {
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
    <div className="space-y-10">
      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Example
        </PrismTypography>
        <PrismColorPicker
          color={color}
          onColorChange={setColor}
          showColorCode={showColorCode}
          showCopyButton={showCopyButton}
          disabled={disabled}
        />
      </section>

      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Customize
        </PrismTypography>
        <p className="text-sm text-muted-foreground">
          Toggle optional trigger chrome (<code className="font-mono text-foreground">showColorCode</code>,{" "}
          <code className="font-mono text-foreground">showCopyButton</code>) and{" "}
          <code className="font-mono text-foreground">disabled</code>.
        </p>
        <div className="flex flex-wrap items-center gap-6">
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
      </section>

      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Code sample
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
      </section>
    </div>
  );
}
