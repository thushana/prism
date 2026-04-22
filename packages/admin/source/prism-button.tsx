"use client";

import {
  getDefaultPrismButtonPresetNames,
  getPrismDefaultColorNameForIndex,
  PrismButton,
  PrismTypography,
} from "@ui";
import type { ColorName, PrismButtonPaint, PrismButtonSize } from "@ui";
import {
  Calendar,
  Copy as CopyGlyph,
  Download,
  Filter,
  Link,
  Lock,
  Mail,
  Map,
  MapPin,
  Pause,
  Pencil,
  Play,
  Plus,
  Save,
  Search,
  Send,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@utilities";

const ACTION_BUTTONS: {
  color: ColorName;
  label: string;
  icon: LucideIcon;
  /** Lucide component name for pasted JSX (`icon={Download}`). */
  iconJsxName: string;
}[] = [
  { color: "red", label: "Download", icon: Download, iconJsxName: "Download" },
  { color: "pink", label: "Email", icon: Mail, iconJsxName: "Mail" },
  { color: "purple", label: "Route", icon: MapPin, iconJsxName: "MapPin" },
  { color: "deepPurple", label: "Share", icon: Share2, iconJsxName: "Share2" },
  { color: "indigo", label: "Save", icon: Save, iconJsxName: "Save" },
  { color: "blue", label: "Add", icon: Plus, iconJsxName: "Plus" },
  { color: "lightBlue", label: "Edit", icon: Pencil, iconJsxName: "Pencil" },
  { color: "cyan", label: "Delete", icon: Trash2, iconJsxName: "Trash2" },
  { color: "teal", label: "Send", icon: Send, iconJsxName: "Send" },
  { color: "green", label: "Copy", icon: CopyGlyph, iconJsxName: "Copy" },
  { color: "lightGreen", label: "Link", icon: Link, iconJsxName: "Link" },
  { color: "lime", label: "Play", icon: Play, iconJsxName: "Play" },
  { color: "yellow", label: "Pause", icon: Pause, iconJsxName: "Pause" },
  { color: "amber", label: "Search", icon: Search, iconJsxName: "Search" },
  { color: "orange", label: "Filter", icon: Filter, iconJsxName: "Filter" },
  {
    color: "deepOrange",
    label: "Calendar",
    icon: Calendar,
    iconJsxName: "Calendar",
  },
  { color: "brown", label: "Map", icon: Map, iconJsxName: "Map" },
  { color: "grey", label: "Lock", icon: Lock, iconJsxName: "Lock" },
  { color: "blueGrey", label: "Star", icon: Star, iconJsxName: "Star" },
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
  | "spacingNormal"
  | "spacingTight"
  | "gapNormal"
  | "gapNone"
  | "paintBackground"
  | "paintBackgroundLight"
  | "paintBackgroundDark"
  | "paintBackgroundSolid"
  | "paintBackgroundNone"
  | "paintMonochrome"
  | "paintGradientSideways"
  | "paintGradientUp"
  | "paintGradientAngle"
  | "sizeSmall"
  | "sizeMedium"
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
  spacingNormal: "normal",
  spacingTight: "tight",
  gapNormal: "normal",
  gapNone: "none",
  paintBackground: "background",
  paintBackgroundLight: "backgroundLight",
  paintBackgroundDark: "backgroundDark",
  paintBackgroundSolid: "backgroundSolid",
  paintBackgroundNone: "backgroundNone",
  paintMonochrome: "monochrome",
  paintGradientSideways: "gradientSideways",
  paintGradientUp: "gradientUp",
  paintGradientAngle: "gradientAngle",
  sizeSmall: "small",
  sizeMedium: "medium",
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
  ["spacingNormal", "spacingTight"],
  ["gapNormal", "gapNone"],
  [
    "paintBackground",
    "paintBackgroundLight",
    "paintBackgroundDark",
    "paintBackgroundSolid",
    "paintBackgroundNone",
    "paintMonochrome",
    "paintGradientSideways",
    "paintGradientUp",
    "paintGradientAngle",
  ],
  ["sizeSmall", "sizeMedium", "sizeLarge", "sizeHuge", "sizeGigantic"],
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
      "spacingNormal",
      "spacingTight",
      "gapNormal",
      "gapNone",
    ],
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
      "paintGradientSideways",
      "paintGradientUp",
      "paintGradientAngle",
    ],
  },
  {
    heading: "Size",
    keys: ["sizeSmall", "sizeMedium", "sizeLarge", "sizeHuge", "sizeGigantic"],
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
      <PrismTypography role="label" size="small" as="code" className="mb-2 block">
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
function usePresetColors(): Record<string, ColorName> {
  return useState(() => {
    const names = getDefaultPrismButtonPresetNames();
    return Object.fromEntries(
      names.map((name, i) => [name, getPrismDefaultColorNameForIndex(i)])
    ) as Record<string, ColorName>;
  })[0];
}

const SNIPPET_SAMPLE_ACTION = ACTION_BUTTONS[0];

function escapeJsxDoubleQuotedString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Spread props for `PrismButton` from customize checkboxes (single source for preview + JSX snippet). */
function buildButtonDemoSpreadProps(selected: Set<AppearanceKey>): {
  variant: "plain" | "icon";
  iconOnly?: boolean;
  iconPosition: "left" | "right";
  shape?: "pill" | "rectangle" | "rectangleRounded";
  line?: "full" | "bottom" | "none";
  spacing?: "normal" | "tight";
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
          : selected.has("sizeMedium")
            ? "medium"
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
  const spacing: "normal" | "tight" | undefined = selected.has("spacingTight")
    ? "tight"
    : selected.has("spacingNormal")
      ? "normal"
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
  if (selected.has("paintGradientAngle")) paint = "gradientAngle";
  else if (selected.has("paintGradientUp")) paint = "gradientUp";
  else if (selected.has("paintGradientSideways")) paint = "gradientSideways";
  else if (selected.has("paintMonochrome")) paint = "monochrome";
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
    spacing: spacing && spacing !== "normal" ? spacing : undefined,
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

/** Single-line JSX for the customize strip (sample row + current toggles). */
function formatPrismButtonDemoSnippet(
  sample: (typeof ACTION_BUTTONS)[number],
  p: {
    variant: "plain" | "icon";
    iconOnly?: boolean;
    iconPosition: "left" | "right";
    shape?: "pill" | "rectangle" | "rectangleRounded";
    line?: "full" | "bottom" | "none";
    spacing?: "normal" | "tight";
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
  }
): string {
  const parts: string[] = [];
  parts.push(`color="${escapeJsxDoubleQuotedString(sample.color)}"`);
  parts.push(`label="${escapeJsxDoubleQuotedString(sample.label)}"`);
  parts.push(`variant="${p.variant}"`);
  if (p.variant === "icon") {
    parts.push(`icon={${sample.iconJsxName}}`);
  }
  if (p.iconPosition === "right") {
    parts.push('iconPosition="right"');
  }
  if (p.iconOnly) parts.push("iconOnly");
  if (p.shape) parts.push(`shape="${p.shape}"`);
  if (p.line) parts.push(`line="${p.line}"`);
  if (p.spacing) parts.push(`spacing="${p.spacing}"`);
  if (p.gap) parts.push(`gap="${p.gap}"`);
  if (p.textCase) parts.push(`textCase="${p.textCase}"`);
  if (p.paint) {
    parts.push(`paint="${escapeJsxDoubleQuotedString(p.paint)}"`);
  }
  if (p.size) parts.push(`size="${p.size}"`);
  if (p.font && p.font !== "sans") parts.push(`font="${p.font}"`);
  if (p.disableMotion) parts.push("disableMotion");
  if (p.disableGrow) parts.push("disableGrow");
  if (p.disableColorChange) parts.push("disableColorChange");
  if (p.disableIconMotion) parts.push("disableIconMotion");
  if (p.inverted) parts.push("inverted");
  if (p.disabled) parts.push("disabled");
  if (p.toggled) parts.push("toggled");
  if (p.segmentPosition) {
    parts.push(`segmentPosition="${p.segmentPosition}"`);
  }
  return "<PrismButton " + parts.join(" ") + " />";
}

/**
 * Multi-select appearance toggles + live action strip (used on /admin/prism/components/prism-button).
 * Preset shortcuts and static variant rows live in {@link ButtonVariantsMatrix}.
 */
function ButtonCustomizerSection() {
  const [selected, setSelected] = useState<Set<AppearanceKey>>(new Set());
  const [animationKey, setAnimationKey] = useState(0);
  const [copyToast, setCopyToast] = useState<{
    title: string;
    detail?: string;
    isError?: boolean;
  } | null>(null);
  const copyToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const replayAnimations = () => setAnimationKey((k) => k + 1);

  const showCopyToast = useCallback(
    (payload: { title: string; detail?: string; isError?: boolean }) => {
      if (copyToastTimeoutRef.current) {
        clearTimeout(copyToastTimeoutRef.current);
      }
      const trimmedDetail =
        payload.detail && payload.detail.length > 88
          ? payload.detail.slice(0, 85) + "..."
          : payload.detail;
      setCopyToast({
        title: payload.title,
        detail: trimmedDetail,
        isError: payload.isError,
      });
      copyToastTimeoutRef.current = setTimeout(() => {
        setCopyToast(null);
        copyToastTimeoutRef.current = null;
      }, 2800);
    },
    []
  );

  useEffect(
    () => () => {
      if (copyToastTimeoutRef.current) {
        clearTimeout(copyToastTimeoutRef.current);
      }
    },
    []
  );

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

  const { spreadProps, currentSampleSnippet } = useMemo(() => {
    const spreadProps = buildButtonDemoSpreadProps(selected);
    const segmentPosition =
      spreadProps.gap === "none" ? ("first" as const) : undefined;
    const currentSampleSnippet = formatPrismButtonDemoSnippet(
      SNIPPET_SAMPLE_ACTION,
      { ...spreadProps, segmentPosition }
    );
    return { spreadProps, currentSampleSnippet };
  }, [selected]);

  const handleCopySampleSnippet = async () => {
    try {
      await navigator.clipboard.writeText(currentSampleSnippet);
      showCopyToast({
        title: "Copied to clipboard",
        detail: currentSampleSnippet,
      });
    } catch {
      showCopyToast({
        title: "Could not copy",
        detail:
          "Your browser may block clipboard access outside a secure context.",
        isError: true,
      });
    }
  };

  const copyToastPortal =
    copyToast && typeof document !== "undefined"
      ? createPortal(
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-none fixed bottom-8 left-1/2 z-99999 max-w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border px-4 py-3 shadow-lg",
              copyToast.isError
                ? "border-destructive/40 bg-destructive/10 text-foreground"
                : "border-border bg-popover text-popover-foreground shadow-md"
            )}
          >
            <PrismTypography
              role="title"
              size="medium"
              className="block"
              tone={copyToast.isError ? "destructive" : "inherit"}
            >
              {copyToast.title}
            </PrismTypography>
            {copyToast.detail ? (
              <PrismTypography
                role="body"
                size="small"
                tone="muted"
                font="mono"
                className="mt-1 block break-all"
              >
                {copyToast.detail}
              </PrismTypography>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
    <div className="mb-8">
      <h3 className="mb-2">Customize</h3>
      <PrismTypography role="body" size="medium" className="text-muted-foreground mb-4">
        Toggle options to preview them on the action strip below.{" "}
        <button
          type="button"
          onClick={replayAnimations}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline font-medium"
        >
          Replay animations
        </button>
      </PrismTypography>
      <div className="space-y-6">
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
            {CUSTOMIZER_COLUMNS.map(({ heading, keys }) => (
              <div key={heading} className="space-y-1">
                <PrismTypography role="overline" size="small">
                  {heading}
                </PrismTypography>
                {keys.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(key)}
                      onChange={() => toggle(key)}
                      className="rounded border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      tone="muted"
                      font="mono"
                    >
                      {OPTION_PROP_LABEL[key]}
                    </PrismTypography>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div className="mb-4 flex items-center gap-3">
            <PrismTypography role="label" size="medium" font="mono" tone="muted">
              {currentSampleSnippet}
            </PrismTypography>
            <button
              type="button"
              onClick={handleCopySampleSnippet}
              aria-label="Copy sample JSX to clipboard"
              title="Copy sample JSX"
              className="shrink-0 rounded-md border border-transparent p-2 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
            >
              <CopyGlyph className="size-4" aria-hidden />
            </button>
          </div>
          <div
            className={`flex flex-wrap items-center ${selected.has("gapNone") ? "gap-0" : "gap-3"}`}
          >
            {ACTION_BUTTONS.map(({ color, label, icon }, i) => (
              <PrismButton
                key={`${color}-${animationKey}`}
                color={color}
                label={label}
                icon={icon}
                asChild
                {...spreadProps}
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
    </div>
    {copyToastPortal}
    </>
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
            color={presetColors[presetName] ?? "blueGrey"}
            preset={presetName}
            label={presetName}
            iconOnly={false}
            asChild
          />
        ))}
      </Row>
      <Row title="plain">
        {ACTION_BUTTONS.map(({ color, label }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="plain"
            asChild
          />
        ))}
      </Row>
      <Row title="icon (add icon to plain)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            asChild
          />
        ))}
      </Row>
      <Row title="iconOnly (no text, alt/hover)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            iconOnly
            asChild
          />
        ))}
      </Row>
      <Row title="iconRight">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            iconPosition="right"
            asChild
          />
        ))}
      </Row>
      <Row title='textCase="uppercase"'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            textCase="uppercase"
            asChild
          />
        ))}
      </Row>
      <Row title='textCase="lowercase" (label in lowercase)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            textCase="lowercase"
            asChild
          />
        ))}
      </Row>
      <Row title='shape="rectangle" (90° corners)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            shape="rectangle"
            asChild
          />
        ))}
      </Row>
      <Row title='shape="rectangleRounded" (slight curve)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            shape="rectangleRounded"
            asChild
          />
        ))}
      </Row>
      <Row title='line="bottom" + shape="rectangle"'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
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
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            line="none"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="backgroundLight" (100 fill, default)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            paint="backgroundLight"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="backgroundDark" (800 fill)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            paint="backgroundDark"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="backgroundSolid" (outline matches fill)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            paint="backgroundSolid"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="backgroundNone" (no fill)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            paint="backgroundNone"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="monochrome"'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            paint="monochrome"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="gradientSideways" (L→R, next in palette)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            paint="gradientSideways"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="gradientUp"'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            paint="gradientUp"
            asChild
          />
        ))}
      </Row>
      <Row title='paint="gradientAngle" (45°)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            paint="gradientAngle"
            asChild
          />
        ))}
      </Row>
      <Row title='spacing="tight" (50% padding)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            spacing="tight"
            asChild
          />
        ))}
      </Row>
      <Row title='gap="none" (segment radius: first / middle / last)' disableGap>
        {ACTION_BUTTONS.map(({ color, label, icon }, i) => (
          <PrismButton
            key={color}
            color={color}
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
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="small"
            textCase="uppercase"
            asChild
          />
        ))}
      </Row>
      <Row title='size="medium" (100%)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="medium"
            asChild
          />
        ))}
      </Row>
      <Row title="sizeLarge (1.5×)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="large"
            asChild
          />
        ))}
      </Row>
      <Row title='size="huge" (2×)'>
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="huge"
            asChild
          />
        ))}
      </Row>
      <Row title="disableMotion">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            disableMotion
            asChild
          />
        ))}
      </Row>
      <Row title="disableGrow">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            disableGrow
            asChild
          />
        ))}
      </Row>
      <Row title="disableColorChange">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            disableColorChange
            asChild
          />
        ))}
      </Row>
      <Row title="icons (default draw-in)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            asChild
          />
        ))}
      </Row>
      <Row title="disableIconMotion">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            disableIconMotion
            asChild
          />
        ))}
      </Row>
      <Row title="inverted">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            inverted
            asChild
          />
        ))}
      </Row>
      <Row title="disabled (33% opacity, no interaction)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            disabled
            asChild
          />
        ))}
      </Row>
      <Row title="toggled (locked hover state, no scaling)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
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
    <>
      <ButtonCustomizerSection />
      <ButtonVariantsMatrix />
    </>
  );
}
