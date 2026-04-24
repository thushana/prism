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

/** Space under the shell header before the first in-demo heading (`AdminPageShell` already renders the page `h1`). */
const PRISM_COLOR_PICKER_DEMO_PAGE_TOP_PAD = "pt-8";
/** Space above each in-demo section heading after prior content. */
const PRISM_COLOR_PICKER_DEMO_SECTION_TOP_PAD = "pt-10";
/** Tight gap from section heading to the control or block directly below. */
const PRISM_COLOR_PICKER_DEMO_HEADING_TO_BODY = "mb-3";
/** Combined utility for in-demo `h2` titles (spacing + weight). */
const PRISM_COLOR_PICKER_DEMO_SECTION_HEADING_CLASS = `${PRISM_COLOR_PICKER_DEMO_HEADING_TO_BODY} font-bold`;
/** Root wrapper: bottom margin for shell + top pad before first heading. */
const PRISM_COLOR_PICKER_DEMO_ROOT_CLASS = `mb-6 ${PRISM_COLOR_PICKER_DEMO_PAGE_TOP_PAD}`;

/**
 * Admin playground for {@link PrismColorPicker}.
 *
 * The route title from `AdminPageShell` is the document `h1`; Customize / Example / Code Sample are
 * sibling `h2`s for in-page sections (no skipped heading levels).
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
      <div className={PRISM_COLOR_PICKER_DEMO_ROOT_CLASS}>
        <PrismTypography
          role="title"
          size="small"
          as="h2"
          font="sans"
          className={PRISM_COLOR_PICKER_DEMO_SECTION_HEADING_CLASS}
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

        <div className={PRISM_COLOR_PICKER_DEMO_SECTION_TOP_PAD}>
          <PrismTypography
            role="title"
            size="small"
            as="h2"
            font="sans"
            className={PRISM_COLOR_PICKER_DEMO_SECTION_HEADING_CLASS}
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

        <div className={PRISM_COLOR_PICKER_DEMO_SECTION_TOP_PAD}>
          <PrismTypography
            role="title"
            size="small"
            as="h2"
            font="sans"
            className={PRISM_COLOR_PICKER_DEMO_SECTION_HEADING_CLASS}
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
