"use client";

import { useMemo, useState, type JSX, type ReactNode } from "react";
import {
  PrismButton,
  PrismCodeBlock,
  PrismColorPicker,
  PrismSelect,
  PrismTypography,
  type PartialPrismColorSpec,
  type PrismButtonPaint,
  type PrismButtonSize,
  type PrismButtonSpacing,
  type PrismSelectProps,
  type PrismSwatchKey,
} from "@ui";
import { RefreshCw, RotateCcw } from "lucide-react";
import {
  PrismPlaygroundOptionColumn,
  PrismPlaygroundOptionLabel,
} from "./playground-option-label";

/** Spectrum swatches — Prism’s demo “lorem ipsum” (colors / rainbow / loop). */
const SPECTRUM_SELECTS: {
  swatchPrimary: PrismSwatchKey;
  title: string;
}[] = [
  { swatchPrimary: "red", title: "Hue" },
  { swatchPrimary: "pink", title: "Tint" },
  { swatchPrimary: "purple", title: "Tone" },
  { swatchPrimary: "deep-purple", title: "Shade" },
  { swatchPrimary: "indigo", title: "Loop" },
  { swatchPrimary: "blue", title: "Ring" },
  { swatchPrimary: "light-blue", title: "Arc" },
  { swatchPrimary: "cyan", title: "Band" },
  { swatchPrimary: "teal", title: "Wash" },
  { swatchPrimary: "green", title: "Field" },
  { swatchPrimary: "light-green", title: "Glow" },
  { swatchPrimary: "lime", title: "Spark" },
  { swatchPrimary: "yellow", title: "Flare" },
  { swatchPrimary: "amber", title: "Beam" },
  { swatchPrimary: "orange", title: "Burst" },
  { swatchPrimary: "deep-orange", title: "Blaze" },
  { swatchPrimary: "brown", title: "Earth" },
  { swatchPrimary: "grey", title: "Mist" },
  { swatchPrimary: "blue-grey", title: "Steel" },
];

/** Options list for demos — Material family names across the spectrum. */
const SPECTRUM_OPTIONS = [
  { value: "", label: "All" },
  ...SPECTRUM_SELECTS.map(({ swatchPrimary }) => ({
    value: swatchPrimary,
    label: swatchPrimary
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  })),
] as const;

type AppearanceKey =
  | "showTitle"
  | "iconLeft"
  | "iconRight"
  | "textCaseDefault"
  | "textCaseUppercase"
  | "textCaseLowercase"
  | "fontSans"
  | "fontSerif"
  | "fontMono"
  | "shapePill"
  | "shapeRectangle"
  | "shapeRectangleRounded"
  | "lineFull"
  | "lineBottom"
  | "lineNone"
  | "spacingTight"
  | "spacingCompact"
  | "spacingRegular"
  | "spacingComfortable"
  | "spacingAiry"
  | "gapNormal"
  | "gapNone"
  | "paintBackground"
  | "paintBackgroundLight"
  | "paintBackgroundDark"
  | "paintBackgroundSolid"
  | "paintBackgroundNone"
  | "paintMonochrome"
  | "sizeSmall"
  | "sizeRegular"
  | "sizeLarge"
  | "sizeHuge"
  | "sizeGigantic"
  | "disableMotion"
  | "disableGrow"
  | "disableColorChange"
  | "disableIconMotion"
  | "inverted"
  | "disabled";

const OPTION_PROP_LABEL: Record<AppearanceKey, string> = {
  showTitle: "title",
  iconLeft: "left",
  iconRight: "right",
  textCaseDefault: "default",
  textCaseUppercase: "uppercase",
  textCaseLowercase: "lowercase",
  fontSans: "sans",
  fontSerif: "serif",
  fontMono: "mono",
  shapePill: "pill",
  shapeRectangle: "rectangle",
  shapeRectangleRounded: "rectangleRounded",
  lineFull: "full",
  lineBottom: "bottom",
  lineNone: "none",
  spacingTight: "tight",
  spacingCompact: "compact",
  spacingRegular: "regular",
  spacingComfortable: "comfortable",
  spacingAiry: "airy",
  gapNormal: "normal",
  gapNone: "none",
  paintBackground: "background",
  paintBackgroundLight: "backgroundLight",
  paintBackgroundDark: "backgroundDark",
  paintBackgroundSolid: "backgroundSolid",
  paintBackgroundNone: "backgroundNone",
  paintMonochrome: "monochrome",
  sizeSmall: "small",
  sizeRegular: "regular",
  sizeLarge: "large",
  sizeHuge: "huge",
  sizeGigantic: "gigantic",
  disableMotion: "disableMotion",
  disableGrow: "disableGrow",
  disableColorChange: "disableColorChange",
  disableIconMotion: "disableIconMotion",
  inverted: "inverted",
  disabled: "disabled",
};

const CUSTOMIZER_EXCLUSIVE_GROUPS: AppearanceKey[][] = [
  ["iconLeft", "iconRight"],
  ["textCaseDefault", "textCaseUppercase", "textCaseLowercase"],
  ["shapePill", "shapeRectangle", "shapeRectangleRounded"],
  ["lineFull", "lineBottom", "lineNone"],
  [
    "spacingTight",
    "spacingCompact",
    "spacingRegular",
    "spacingComfortable",
    "spacingAiry",
  ],
  ["gapNormal", "gapNone"],
  [
    "paintBackground",
    "paintBackgroundLight",
    "paintBackgroundDark",
    "paintBackgroundSolid",
    "paintBackgroundNone",
    "paintMonochrome",
  ],
  ["sizeSmall", "sizeRegular", "sizeLarge", "sizeHuge", "sizeGigantic"],
  ["fontSans", "fontSerif", "fontMono"],
];

const CUSTOMIZER_COLUMNS: { heading: string; keys: AppearanceKey[] }[] = [
  { heading: "Title", keys: ["showTitle"] },
  { heading: "Icon", keys: ["iconLeft", "iconRight"] },
  {
    heading: "Type",
    keys: [
      "textCaseDefault",
      "textCaseUppercase",
      "textCaseLowercase",
      "fontSans",
      "fontSerif",
      "fontMono",
    ],
  },
  {
    heading: "Shape",
    keys: [
      "shapePill",
      "shapeRectangle",
      "shapeRectangleRounded",
      "lineFull",
      "lineBottom",
      "lineNone",
    ],
  },
  {
    heading: "Spacing",
    keys: [
      "spacingTight",
      "spacingCompact",
      "spacingRegular",
      "spacingComfortable",
      "spacingAiry",
    ],
  },
  {
    heading: "Gap",
    keys: ["gapNormal", "gapNone"],
  },
  {
    heading: "Paint",
    keys: [
      "paintBackground",
      "paintBackgroundLight",
      "paintBackgroundDark",
      "paintBackgroundSolid",
      "paintBackgroundNone",
      "paintMonochrome",
    ],
  },
  {
    heading: "Size",
    keys: ["sizeSmall", "sizeRegular", "sizeLarge", "sizeHuge", "sizeGigantic"],
  },
  {
    heading: "Animation",
    keys: [
      "disableMotion",
      "disableGrow",
      "disableColorChange",
      "disableIconMotion",
    ],
  },
  {
    heading: "States",
    keys: ["inverted", "disabled"],
  },
];

const DEFAULT_GROUP_PICKER_COLOR: PartialPrismColorSpec = {
  palette: "default",
  swatchPrimary: "red",
};

const DEFAULT_SELECTED = new Set<AppearanceKey>([
  "showTitle",
  "iconLeft",
  "shapeRectangleRounded",
  "lineFull",
  "spacingCompact",
  "paintBackgroundNone",
  "sizeRegular",
  "disableGrow",
]);

type SelectChromeProps = {
  showTitle: boolean;
  iconPosition: "left" | "right";
  shape?: "pill" | "rectangle" | "rectangleRounded";
  line?: "full" | "bottom" | "none";
  spacing?: PrismButtonSpacing;
  gap?: "normal" | "none";
  textCase?: "default" | "uppercase" | "lowercase";
  paint?: PrismButtonPaint;
  size?: PrismButtonSize;
  font?: "sans" | "serif" | "mono";
  disableMotion?: boolean;
  disableGrow?: boolean;
  disableColorChange?: boolean;
  disableIconMotion?: boolean;
  inverted?: boolean;
  disabled?: boolean;
};

function buildSelectDemoSpreadProps(
  selected: Set<AppearanceKey>
): SelectChromeProps {
  const size: PrismButtonSize | undefined = selected.has("sizeGigantic")
    ? "gigantic"
    : selected.has("sizeHuge")
      ? "huge"
      : selected.has("sizeLarge")
        ? "large"
        : selected.has("sizeSmall")
          ? "small"
          : selected.has("sizeRegular")
            ? "regular"
            : undefined;
  const font: "sans" | "serif" | "mono" | undefined = selected.has("fontMono")
    ? "mono"
    : selected.has("fontSerif")
      ? "serif"
      : selected.has("fontSans")
        ? "sans"
        : undefined;
  const shape: "pill" | "rectangle" | "rectangleRounded" | undefined =
    selected.has("shapeRectangleRounded")
      ? "rectangleRounded"
      : selected.has("shapeRectangle")
        ? "rectangle"
        : selected.has("shapePill")
          ? "pill"
          : undefined;
  const line: "full" | "bottom" | "none" | undefined = selected.has("lineNone")
    ? "none"
    : selected.has("lineBottom")
      ? "bottom"
      : selected.has("lineFull")
        ? "full"
        : undefined;
  const spacing: PrismButtonSpacing | undefined = selected.has("spacingTight")
    ? "tight"
    : selected.has("spacingCompact")
      ? "compact"
      : selected.has("spacingComfortable")
        ? "comfortable"
        : selected.has("spacingAiry")
          ? "airy"
          : selected.has("spacingRegular")
            ? "regular"
            : undefined;
  const gap: "normal" | "none" | undefined = selected.has("gapNone")
    ? "none"
    : selected.has("gapNormal")
      ? "normal"
      : undefined;
  const textCase: "default" | "uppercase" | "lowercase" | undefined =
    selected.has("textCaseUppercase")
      ? "uppercase"
      : selected.has("textCaseLowercase")
        ? "lowercase"
        : selected.has("textCaseDefault")
          ? "default"
          : undefined;
  let paint: PrismButtonPaint | undefined;
  if (selected.has("paintMonochrome")) paint = "monochrome";
  else if (selected.has("paintBackgroundNone")) paint = "backgroundNone";
  else if (selected.has("paintBackgroundSolid")) paint = "backgroundSolid";
  else if (selected.has("paintBackgroundDark")) paint = "backgroundDark";
  else if (selected.has("paintBackgroundLight")) paint = "backgroundLight";
  else if (selected.has("paintBackground")) paint = "background";

  return {
    showTitle: selected.has("showTitle"),
    iconPosition: selected.has("iconRight") ? "right" : "left",
    shape,
    line,
    spacing,
    gap,
    textCase,
    paint,
    size,
    font,
    disableMotion: selected.has("disableMotion") || undefined,
    disableGrow: selected.has("disableGrow") || undefined,
    disableColorChange: selected.has("disableColorChange") || undefined,
    disableIconMotion: selected.has("disableIconMotion") || undefined,
    inverted: selected.has("inverted") || undefined,
    disabled: selected.has("disabled") || undefined,
  };
}

function escapeJsxDoubleQuotedString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatColorPropSpec(spec: PartialPrismColorSpec): string[] {
  const palette = spec.palette ?? "default";
  const primary = spec.swatchPrimary ?? "blue-grey";
  const g = spec.gradient;
  const lines: string[] = [`    palette: "${palette}",`];
  lines.push(`    swatchPrimary: "${primary}",`);
  if (spec.shade !== undefined) {
    lines.push(`    shade: ${spec.shade},`);
  }
  if (g) {
    const direction = g.direction ?? "horizontal";
    if (Array.isArray(g.swatches) && g.swatches.length > 0) {
      lines.push(
        `    gradient: { direction: "${direction}", swatches: [${g.swatches
          .map((s) => `"${s}"`)
          .join(", ")}] },`
      );
    } else {
      lines.push(`    gradient: { direction: "${direction}" },`);
    }
  }
  return lines;
}

function formatPrismSelectDemoSnippet(
  p: SelectChromeProps & { color: PartialPrismColorSpec; title: string }
): string {
  const lines: string[] = ["<PrismSelect"];
  lines.push(`  title="${escapeJsxDoubleQuotedString(p.title)}"`);
  if (!p.showTitle) lines.push("  showTitle={false}");
  lines.push("  color={{");
  for (const l of formatColorPropSpec(p.color)) lines.push(l);
  lines.push("  }}");
  lines.push('  value=""');
  lines.push("  onValueChange={setValue}");
  lines.push("  options={SPECTRUM_OPTIONS}");
  if (p.iconPosition === "right") lines.push('  iconPosition="right"');
  if (p.shape) lines.push(`  shape="${p.shape}"`);
  if (p.line) lines.push(`  line="${p.line}"`);
  if (p.spacing) lines.push(`  spacing="${p.spacing}"`);
  if (p.gap) lines.push(`  gap="${p.gap}"`);
  if (p.textCase) lines.push(`  textCase="${p.textCase}"`);
  if (p.paint) lines.push(`  paint="${escapeJsxDoubleQuotedString(p.paint)}"`);
  if (p.size) lines.push(`  size="${p.size}"`);
  if (p.font && p.font !== "sans") lines.push(`  font="${p.font}"`);
  if (p.disableMotion) lines.push("  disableMotion");
  if (p.disableGrow) lines.push("  disableGrow");
  if (p.disableColorChange) lines.push("  disableColorChange");
  if (p.disableIconMotion) lines.push("  disableIconMotion");
  if (p.inverted) lines.push("  inverted");
  if (p.disabled) lines.push("  disabled");
  lines.push("/>");
  return lines.join("\n");
}

/** Uncontrolled {@link PrismSelect} for read-only matrix rows (own local value). */
function DemoSelect(props: Omit<PrismSelectProps, "value" | "onValueChange">) {
  const [value, setValue] = useState("");
  return <PrismSelect value={value} onValueChange={setValue} {...props} />;
}

/** One row of the static variants matrix: overline title + wrapped selects. */
function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pb-12">
      <PrismTypography
        role="overline"
        size="small"
        as="span"
        className="mb-2 block"
      >
        {title}
      </PrismTypography>
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </div>
  );
}

/** Static reference matrix — every {@link PrismSelect} chrome axis, one row each (mirrors PrismButton's). */
function SelectVariantsMatrix() {
  return (
    <div className="space-y-6">
      <Row title='shape="pill"'>
        {SPECTRUM_SELECTS.map(({ swatchPrimary, title }) => (
          <DemoSelect
            key={swatchPrimary}
            title={title}
            color={{ palette: "default", swatchPrimary }}
            options={SPECTRUM_OPTIONS}
            shape="pill"
          />
        ))}
      </Row>
      <Row title='shape="rectangle"'>
        {SPECTRUM_SELECTS.map(({ swatchPrimary, title }) => (
          <DemoSelect
            key={swatchPrimary}
            title={title}
            color={{ palette: "default", swatchPrimary }}
            options={SPECTRUM_OPTIONS}
            shape="rectangle"
          />
        ))}
      </Row>
      <Row title='shape="rectangleRounded" (default)'>
        {SPECTRUM_SELECTS.map(({ swatchPrimary, title }) => (
          <DemoSelect
            key={swatchPrimary}
            title={title}
            color={{ palette: "default", swatchPrimary }}
            options={SPECTRUM_OPTIONS}
          />
        ))}
      </Row>
      <Row title='line="bottom"'>
        {SPECTRUM_SELECTS.map(({ swatchPrimary, title }) => (
          <DemoSelect
            key={swatchPrimary}
            title={title}
            color={{ palette: "default", swatchPrimary }}
            options={SPECTRUM_OPTIONS}
            line="bottom"
          />
        ))}
      </Row>
      <Row title='line="none" (no border)'>
        {SPECTRUM_SELECTS.map(({ swatchPrimary, title }) => (
          <DemoSelect
            key={swatchPrimary}
            title={title}
            color={{ palette: "default", swatchPrimary }}
            options={SPECTRUM_OPTIONS}
            line="none"
          />
        ))}
      </Row>
      {(
        [
          "background",
          "backgroundLight",
          "backgroundDark",
          "backgroundSolid",
          "backgroundNone",
          "monochrome",
        ] as const
      ).map((paint) => (
        <Row key={paint} title={`paint="${paint}"`}>
          {SPECTRUM_SELECTS.map(({ swatchPrimary, title }) => (
            <DemoSelect
              key={swatchPrimary}
              title={title}
              color={{ palette: "default", swatchPrimary }}
              options={SPECTRUM_OPTIONS}
              paint={paint}
            />
          ))}
        </Row>
      ))}
      <Row title="spacing ladder (tight → airy)">
        {(["tight", "compact", "regular", "comfortable", "airy"] as const).map(
          (spacing) => (
            <DemoSelect
              key={spacing}
              title={spacing}
              color={{ palette: "default", swatchPrimary: "blue-grey" }}
              options={SPECTRUM_OPTIONS}
              spacing={spacing}
            />
          )
        )}
      </Row>
      <Row title='size="small" … "gigantic"'>
        {(["small", "regular", "large", "huge", "gigantic"] as const).map(
          (size) => (
            <DemoSelect
              key={size}
              title={size}
              color={{ palette: "default", swatchPrimary: "blue-grey" }}
              options={SPECTRUM_OPTIONS}
              size={size}
            />
          )
        )}
      </Row>
      <Row title="showTitle={false} (control-only)">
        {SPECTRUM_SELECTS.slice(0, 6).map(({ swatchPrimary, title }) => (
          <DemoSelect
            key={swatchPrimary}
            title={title}
            color={{ palette: "default", swatchPrimary }}
            options={SPECTRUM_OPTIONS}
            showTitle={false}
          />
        ))}
      </Row>
      <Row title="disabled">
        {SPECTRUM_SELECTS.slice(0, 6).map(({ swatchPrimary, title }) => (
          <DemoSelect
            key={swatchPrimary}
            title={title}
            color={{ palette: "default", swatchPrimary }}
            options={SPECTRUM_OPTIONS}
            disabled
          />
        ))}
      </Row>
    </div>
  );
}

/**
 * Customize section for `/admin/prism/components/prism-select` — mirrors PrismButton
 * (color picker, rainbow spectrum group, exclusive chrome toggles).
 */
function SelectCustomizerSection(): JSX.Element {
  const [selected, setSelected] = useState<Set<AppearanceKey>>(
    () => new Set(DEFAULT_SELECTED)
  );
  const [animationKey, setAnimationKey] = useState(0);
  const [groupColorMode, setGroupColorMode] = useState<"rainbow" | "unified">(
    "rainbow"
  );
  const [pickedColor, setPickedColor] = useState<PartialPrismColorSpec>(
    () => DEFAULT_GROUP_PICKER_COLOR
  );
  const [previewValue, setPreviewValue] = useState("");
  const [spectrumValues, setSpectrumValues] = useState<Record<string, string>>(
    () => Object.fromEntries(SPECTRUM_SELECTS.map((s) => [s.swatchPrimary, ""]))
  );

  const replayAnimations = () => setAnimationKey((k) => k + 1);

  const resetGroupToRainbow = () => {
    setGroupColorMode("rainbow");
    setPickedColor(DEFAULT_GROUP_PICKER_COLOR);
  };

  const toggle = (key: AppearanceKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const exclusiveGroup = CUSTOMIZER_EXCLUSIVE_GROUPS.find((g) =>
        g.includes(key)
      );
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (exclusiveGroup) {
          for (const k of exclusiveGroup) next.delete(k);
        }
        next.add(key);
      }
      return next;
    });
  };

  const { chromeProps, previewColor, currentSampleSnippet } = useMemo(() => {
    const chromeProps = buildSelectDemoSpreadProps(selected);
    const previewColor =
      groupColorMode === "unified"
        ? { ...pickedColor }
        : {
            palette: "default" as const,
            swatchPrimary: "deep-purple" as const,
          };
    const currentSampleSnippet = formatPrismSelectDemoSnippet({
      ...chromeProps,
      color: previewColor,
      title: "Spectrum",
    });
    return { chromeProps, previewColor, currentSampleSnippet };
  }, [selected, pickedColor, groupColorMode]);

  const { showTitle, ...selectChrome } = chromeProps;

  return (
    <div className="relative isolate space-y-10">
      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Customize
        </PrismTypography>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-1">
            <PrismTypography role="overline" size="small">
              COLOR
            </PrismTypography>
            <PrismColorPicker
              color={pickedColor}
              onColorChange={(next) => {
                setPickedColor(next);
                setGroupColorMode("unified");
              }}
            />
          </div>
          {CUSTOMIZER_COLUMNS.map(({ heading, keys }) => (
            <PrismPlaygroundOptionColumn key={heading} title={heading}>
              {keys.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-1.5"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => toggle(key)}
                    className="rounded border-input"
                  />
                  <PrismPlaygroundOptionLabel active={selected.has(key)}>
                    {OPTION_PROP_LABEL[key]}
                  </PrismPlaygroundOptionLabel>
                </label>
              ))}
            </PrismPlaygroundOptionColumn>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <PrismTypography role="title" size="large" font="sans" as="h2">
            Example
          </PrismTypography>
          <PrismButton
            type="button"
            color={{ palette: "default", swatchPrimary: "grey" }}
            label="Replay animations"
            variant="icon"
            icon={RefreshCw}
            iconOnly
            line="none"
            paint="backgroundNone"
            size="small"
            onClick={replayAnimations}
            title="Replay animations"
            aria-label="Replay animations"
          />
        </div>
        <div className="space-y-8 rounded-lg border border-border bg-muted/20 px-6 py-6">
          <div className="space-y-2">
            <PrismTypography role="overline" size="small" className="block">
              Single select
            </PrismTypography>
            <div
              key={`preview-${animationKey}`}
              className="flex min-h-12 flex-wrap items-end gap-3"
            >
              <PrismSelect
                title="Spectrum"
                showTitle={showTitle}
                color={previewColor}
                value={previewValue}
                onValueChange={setPreviewValue}
                options={[...SPECTRUM_OPTIONS]}
                {...selectChrome}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PrismTypography role="overline" size="small" className="mr-auto">
                Spectrum group
              </PrismTypography>
              <PrismButton
                type="button"
                color={{ palette: "default", swatchPrimary: "grey" }}
                label="Rainbow palette"
                variant="icon"
                icon={RotateCcw}
                iconOnly
                line="none"
                paint="backgroundNone"
                onClick={resetGroupToRainbow}
                title="Reset to rainbow palette"
                aria-label="Reset group selects to rainbow palette"
              />
            </div>
            <div
              key={`group-${animationKey}`}
              className="flex flex-wrap items-end gap-3"
            >
              {SPECTRUM_SELECTS.map(({ swatchPrimary, title }) => (
                <PrismSelect
                  key={swatchPrimary}
                  title={title}
                  showTitle={showTitle}
                  color={
                    groupColorMode === "unified"
                      ? { ...pickedColor }
                      : { palette: "default", swatchPrimary }
                  }
                  value={spectrumValues[swatchPrimary] ?? ""}
                  onValueChange={(next) => {
                    setSpectrumValues((previous) => ({
                      ...previous,
                      [swatchPrimary]: next,
                    }));
                  }}
                  options={[...SPECTRUM_OPTIONS]}
                  {...selectChrome}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Code sample
        </PrismTypography>
        <PrismCodeBlock
          className="font-mono"
          mode="card"
          language="tsx"
          disableLineNumbers={false}
          disableLanguageLabel={false}
          color={{ palette: "default", swatchPrimary: "grey" }}
        >
          {currentSampleSnippet}
        </PrismCodeBlock>
      </section>
    </div>
  );
}

/** Customize playground plus full variant matrix for PrismSelect (admin + `/sheets/selects`). */
export function PrismSelectDemo(): JSX.Element {
  return (
    <div className="space-y-10">
      <SelectCustomizerSection />
      <SelectVariantsMatrix />
    </div>
  );
}
