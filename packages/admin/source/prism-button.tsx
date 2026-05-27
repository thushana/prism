"use client";

import {
  getDefaultPrismButtonPresetNames,
  getPrismDefaultColorNameForIndex,
  PrismButton,
  PrismCodeBlock,
  PrismColorPicker,
  PrismTypography,
} from "@ui";
import type {
  PartialPrismColorSpec,
  PrismButtonPaint,
  PrismButtonSize,
  PrismButtonSpacing,
  PrismSwatchKey,
} from "@ui";
import {
  Calendar,
  Copy as CopyGlyph,
  Download,
  Filter,
  Gem,
  Link,
  Lock,
  Mail,
  Map,
  MapPin,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PrismPlaygroundOptionColumn,
  PrismPlaygroundOptionLabel,
} from "./playground-option-label";

const ACTION_BUTTONS: {
  swatchPrimary: PrismSwatchKey;
  label: string;
  icon: LucideIcon;
  /** Lucide component name for pasted JSX (`icon={Download}`). */
  iconJsxName: string;
}[] = [
  {
    swatchPrimary: "red",
    label: "Download",
    icon: Download,
    iconJsxName: "Download",
  },
  { swatchPrimary: "pink", label: "Email", icon: Mail, iconJsxName: "Mail" },
  {
    swatchPrimary: "purple",
    label: "Route",
    icon: MapPin,
    iconJsxName: "MapPin",
  },
  {
    swatchPrimary: "deep-purple",
    label: "Share",
    icon: Share2,
    iconJsxName: "Share2",
  },
  { swatchPrimary: "indigo", label: "Save", icon: Save, iconJsxName: "Save" },
  { swatchPrimary: "blue", label: "Add", icon: Plus, iconJsxName: "Plus" },
  {
    swatchPrimary: "light-blue",
    label: "Edit",
    icon: Pencil,
    iconJsxName: "Pencil",
  },
  {
    swatchPrimary: "cyan",
    label: "Delete",
    icon: Trash2,
    iconJsxName: "Trash2",
  },
  { swatchPrimary: "teal", label: "Send", icon: Send, iconJsxName: "Send" },
  {
    swatchPrimary: "green",
    label: "Copy",
    icon: CopyGlyph,
    iconJsxName: "Copy",
  },
  {
    swatchPrimary: "light-green",
    label: "Link",
    icon: Link,
    iconJsxName: "Link",
  },
  { swatchPrimary: "lime", label: "Play", icon: Play, iconJsxName: "Play" },
  {
    swatchPrimary: "yellow",
    label: "Pause",
    icon: Pause,
    iconJsxName: "Pause",
  },
  {
    swatchPrimary: "amber",
    label: "Search",
    icon: Search,
    iconJsxName: "Search",
  },
  {
    swatchPrimary: "orange",
    label: "Filter",
    icon: Filter,
    iconJsxName: "Filter",
  },
  {
    swatchPrimary: "deep-orange",
    label: "Calendar",
    icon: Calendar,
    iconJsxName: "Calendar",
  },
  { swatchPrimary: "brown", label: "Map", icon: Map, iconJsxName: "Map" },
  { swatchPrimary: "grey", label: "Lock", icon: Lock, iconJsxName: "Lock" },
  {
    swatchPrimary: "blue-grey",
    label: "Star",
    icon: Star,
    iconJsxName: "Star",
  },
];

type AppearanceKey =
  | "icon"
  | "iconOnly"
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
  | "disabled"
  | "toggled";

const OPTION_PROP_LABEL: Record<AppearanceKey, string> = {
  icon: "icon",
  iconOnly: "iconOnly",
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
  toggled: "toggled",
};

const CUSTOMIZER_EXCLUSIVE_GROUPS: AppearanceKey[][] = [
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
  { heading: "Icon", keys: ["icon", "iconOnly", "iconLeft", "iconRight"] },
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
    keys: ["inverted", "disabled", "toggled"],
  },
];

function Row({
  title,
  children,
  disableGap,
}: {
  title: string;
  children: React.ReactNode;
  disableGap?: boolean;
}) {
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
      <div
        className={`flex flex-wrap items-center ${disableGap ? "gap-0" : "gap-3"}`}
      >
        {children}
      </div>
    </div>
  );
}

/** Deterministic color per preset (by index) so SSR and client markup match. */
function usePresetColors(): Record<string, PrismSwatchKey> {
  return useState(() => {
    const names = getDefaultPrismButtonPresetNames();
    return Object.fromEntries(
      names.map((name, i) => {
        const colorName = getPrismDefaultColorNameForIndex(i);
        const kebab = colorName.replace(/([A-Z])/g, "-$1").toLowerCase();
        return [name, kebab];
      })
    ) as Record<string, PrismSwatchKey>;
  })[0];
}

const DEFAULT_GROUP_PICKER_COLOR: PartialPrismColorSpec = {
  palette: "default",
  swatchPrimary: "red",
};

/** Live preview row: label + Gem icon; snippet matches this control. */
const CUSTOMIZER_PREVIEW_SAMPLE = {
  label: "Prism",
  icon: Gem,
  iconJsxName: "Gem",
} as const;

function escapeJsxDoubleQuotedString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatColorPropSpec(spec: PartialPrismColorSpec): string[] {
  const palette = spec.palette ?? "default";
  const primary = spec.swatchPrimary ?? "blue-grey";
  const g = spec.gradient;

  const lines: string[] = [`    palette: "${palette}",`];
  lines.push(`    swatchPrimary: "${primary}",`);
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

/** Spread props for `PrismButton` from customize checkboxes (single source for preview + JSX snippet). */
function buildButtonDemoSpreadProps(selected: Set<AppearanceKey>): {
  variant: "plain" | "icon";
  iconOnly?: boolean;
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
  toggled?: boolean;
} {
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
  const needsIcon =
    selected.has("icon") ||
    selected.has("iconOnly") ||
    selected.has("iconLeft") ||
    selected.has("iconRight");
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

  const iconPosition: "left" | "right" = selected.has("iconRight")
    ? "right"
    : "left";
  return {
    variant: needsIcon ? ("icon" as const) : ("plain" as const),
    iconOnly: selected.has("iconOnly") || undefined,
    iconPosition,
    shape: shape && shape !== "pill" ? shape : undefined,
    line: line && line !== "full" ? line : undefined,
    spacing: spacing && spacing !== "regular" ? spacing : undefined,
    gap: gap && gap !== "normal" ? gap : undefined,
    textCase: textCase && textCase !== "default" ? textCase : undefined,
    paint,
    size,
    font,
    disableMotion: selected.has("disableMotion") || undefined,
    disableGrow: selected.has("disableGrow") || undefined,
    disableColorChange: selected.has("disableColorChange") || undefined,
    disableIconMotion: selected.has("disableIconMotion") || undefined,
    inverted: selected.has("inverted") || undefined,
    disabled: selected.has("disabled") || undefined,
    toggled: selected.has("toggled") || undefined,
  };
}

/** Multi-line JSX for the customize preview + current toggles. */
function formatPrismButtonDemoSnippet(
  sample: { label: string; iconJsxName: string },
  p: {
    variant: "plain" | "icon";
    iconOnly?: boolean;
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
    toggled?: boolean;
    segmentPosition?: "first" | "middle" | "last";
    color: PartialPrismColorSpec;
  }
): string {
  const lines: string[] = ["<PrismButton"];
  lines.push("  color={{");
  for (const l of formatColorPropSpec(p.color)) lines.push(l);
  lines.push("  }}");
  lines.push(`  label="${escapeJsxDoubleQuotedString(sample.label)}"`);
  lines.push(`  variant="${p.variant}"`);
  if (p.variant === "icon") lines.push(`  icon={${sample.iconJsxName}}`);
  if (p.iconPosition === "right") lines.push('  iconPosition="right"');
  if (p.iconOnly) lines.push("  iconOnly");
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
  if (p.toggled) lines.push("  toggled");
  if (p.segmentPosition) lines.push(`  segmentPosition="${p.segmentPosition}"`);
  lines.push("/>");
  return lines.join("\n");
}

/**
 * Multi-select appearance toggles + live action strip (used on /admin/prism/components/prism-button).
 * Preset shortcuts and static variant rows live in {@link ButtonVariantsMatrix}.
 */
function ButtonCustomizerSection() {
  const [selected, setSelected] = useState<Set<AppearanceKey>>(new Set());
  const [animationKey, setAnimationKey] = useState(0);
  const [groupColorMode, setGroupColorMode] = useState<"rainbow" | "unified">(
    "rainbow"
  );
  const [pickedColor, setPickedColor] = useState<PartialPrismColorSpec>(
    () => DEFAULT_GROUP_PICKER_COLOR
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

  const {
    prismSpreadProps,
    previewColor,
    previewSpreadProps,
    currentSampleSnippet,
  } = useMemo(() => {
    const prismSpreadProps = buildButtonDemoSpreadProps(selected);
    const segmentPosition =
      prismSpreadProps.gap === "none" ? ("first" as const) : undefined;
    const previewColor =
      groupColorMode === "unified"
        ? { ...pickedColor }
        : {
            palette: "default" as const,
            swatchPrimary: "deep-purple" as const,
          };
    const previewSpreadProps = {
      ...prismSpreadProps,
      variant: "icon" as const,
    };
    const currentSampleSnippet = formatPrismButtonDemoSnippet(
      CUSTOMIZER_PREVIEW_SAMPLE,
      {
        ...previewSpreadProps,
        segmentPosition,
        color: previewColor,
      }
    );
    return {
      prismSpreadProps,
      previewColor,
      previewSpreadProps,
      currentSampleSnippet,
    };
  }, [selected, pickedColor, groupColorMode]);

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
              Single button
            </PrismTypography>
            <div
              className={`flex min-h-12 flex-wrap items-center ${selected.has("gapNone") ? "gap-0" : "gap-3"}`}
            >
              <PrismButton
                key={`preview-${animationKey}`}
                color={previewColor}
                label={CUSTOMIZER_PREVIEW_SAMPLE.label}
                icon={CUSTOMIZER_PREVIEW_SAMPLE.icon}
                asChild
                {...previewSpreadProps}
                segmentPosition={
                  prismSpreadProps.gap === "none" ? "first" : undefined
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PrismTypography role="overline" size="small" className="mr-auto">
                Group buttons
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
                aria-label="Reset group buttons to rainbow palette"
              />
            </div>
            <div
              className={`flex flex-wrap items-center ${selected.has("gapNone") ? "gap-0" : "gap-3"}`}
            >
              {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }, i) => (
                <PrismButton
                  key={`${swatchPrimary}-${animationKey}`}
                  color={
                    groupColorMode === "unified"
                      ? { ...pickedColor }
                      : { palette: "default", swatchPrimary }
                  }
                  label={label}
                  icon={icon}
                  asChild
                  {...prismSpreadProps}
                  segmentPosition={
                    selected.has("gapNone")
                      ? i === 0
                        ? "first"
                        : i === ACTION_BUTTONS.length - 1
                          ? "last"
                          : "middle"
                      : undefined
                  }
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

/** List of all PrismButton variant rows for the PrismButton demo. */
function ButtonVariantsMatrix({
  className,
}: {
  className?: string;
} = {}) {
  const presetNames = getDefaultPrismButtonPresetNames();
  const presetColors = usePresetColors();

  return (
    <div className={className ?? "space-y-6"}>
      <Row title="Presets (preset=…)">
        {presetNames.map((presetName) => (
          <PrismButton
            key={presetName}
            color={{
              palette: "default",
              swatchPrimary: presetColors[presetName] ?? "blue-grey",
            }}
            preset={presetName}
            label={presetName}
            iconOnly={false}
            asChild
          />
        ))}
      </Row>
      <Row title="plain">
        {ACTION_BUTTONS.map(({ swatchPrimary, label }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="plain"
            asChild
          />
        ))}
      </Row>
      <Row title="icon (add icon to plain)">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            asChild
          />
        ))}
      </Row>
      <Row title="iconOnly (no text, alt/hover)">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            iconOnly
            asChild
          />
        ))}
      </Row>
      <Row title="iconRight">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            iconPosition="right"
            asChild
          />
        ))}
      </Row>
      <Row title='textCase="uppercase"'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            textCase="uppercase"
            asChild
          />
        ))}
      </Row>
      <Row title='textCase="lowercase" (label in lowercase)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            textCase="lowercase"
            asChild
          />
        ))}
      </Row>
      <Row title='shape="rectangle" (90° corners)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            shape="rectangle"
            asChild
          />
        ))}
      </Row>
      <Row title='shape="rectangleRounded" (slight curve)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            shape="rectangleRounded"
            asChild
          />
        ))}
      </Row>
      <Row title='line="bottom" + shape="rectangle"'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            line="bottom"
            shape="rectangle"
            asChild
          />
        ))}
      </Row>
      <Row title='line="none" (no border)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            line="none"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="backgroundLight" (100 fill, default)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            paint="backgroundLight"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="backgroundDark" (800 fill)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            paint="backgroundDark"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="backgroundSolid" (outline matches fill)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            paint="backgroundSolid"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="backgroundNone" (no fill)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            paint="backgroundNone"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="monochrome"'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            paint="monochrome"
            asChild
          />
        ))}
      </Row>
      <Row title="spacing ladder (same names as PrismDivider: tight → airy)">
        {(["tight", "compact", "regular", "comfortable", "airy"] as const).map(
          (s) => (
            <PrismButton
              key={s}
              color={{ palette: "default", swatchPrimary: "blue-grey" }}
              label={s}
              variant="icon"
              icon={Gem}
              spacing={s}
              asChild
            />
          )
        )}
      </Row>
      <Row
        title='gap="none" (segment radius: first / middle / last)'
        disableGap
      >
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }, i) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            gap="none"
            segmentPosition={
              i === 0
                ? "first"
                : i === ACTION_BUTTONS.length - 1
                  ? "last"
                  : "middle"
            }
            asChild
          />
        ))}
      </Row>
      <Row title='size="small" + textCase="uppercase" (75%)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            size="small"
            textCase="uppercase"
            asChild
          />
        ))}
      </Row>
      <Row title='size="regular" (100%)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            size="regular"
            asChild
          />
        ))}
      </Row>
      <Row title="sizeLarge (1.5×)">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            size="large"
            asChild
          />
        ))}
      </Row>
      <Row title='size="huge" (2×)'>
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            size="huge"
            asChild
          />
        ))}
      </Row>
      <Row title="disableMotion">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            disableMotion
            asChild
          />
        ))}
      </Row>
      <Row title="disableGrow">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            disableGrow
            asChild
          />
        ))}
      </Row>
      <Row title="disableColorChange">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            disableColorChange
            asChild
          />
        ))}
      </Row>
      <Row title="icons (default draw-in)">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            asChild
          />
        ))}
      </Row>
      <Row title="disableIconMotion">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            disableIconMotion
            asChild
          />
        ))}
      </Row>
      <Row title="inverted">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            inverted
            asChild
          />
        ))}
      </Row>
      <Row title="disabled (33% opacity, no interaction)">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            disabled
            asChild
          />
        ))}
      </Row>
      <Row title="toggled (locked hover state, no scaling)">
        {ACTION_BUTTONS.map(({ swatchPrimary, label, icon }) => (
          <PrismButton
            key={swatchPrimary}
            color={{ palette: "default", swatchPrimary }}
            label={label}
            variant="icon"
            icon={icon}
            toggled
            asChild
          />
        ))}
      </Row>
    </div>
  );
}

/** Preset controls plus full variant matrix for PrismButton (admin + `/sheets/buttons`). */
export function PrismButtonDemo() {
  return (
    <div className="space-y-10">
      <ButtonCustomizerSection />
      <ButtonVariantsMatrix />
    </div>
  );
}
