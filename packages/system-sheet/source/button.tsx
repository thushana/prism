"use client";

import {
  getColorForIndex,
  getDefaultPrismButtonPresetNames,
  PrismButton,
  PrismTypography,
} from "@ui";
import type { ColorName, PrismButtonSize } from "@ui";
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
  | "typeUppercase"
  | "typeLowercase"
  | "rectangle"
  | "rectangleRounded"
  | "lineNo"
  | "lineBottom"
  | "colorBackground"
  | "colorBackgroundLight"
  | "colorBackgroundDark"
  | "colorBackgroundSolid"
  | "colorBackgroundNo"
  | "colorMonochrome"
  | "colorGradientSideways"
  | "colorGradientUp"
  | "colorGradientAngle"
  | "tight"
  | "gapNo"
  | "sizeSmall"
  | "sizeNormal"
  | "sizeLarge"
  | "sizeLarge2x"
  | "fontSans"
  | "fontSerif"
  | "fontMono"
  | "noMotion"
  | "noGrow"
  | "noColorChange"
  | "icons"
  | "iconsNo"
  | "inverted"
  | "disabled"
  | "toggled";

/**
 * Checkbox labels: same pattern as `ICON_PLAYGROUND_DISPLAY_LABEL` on PrismIcon
 * — bare tokens (enum values, short words), not `prop="…"` or `.chain` notation.
 */
const OPTION_PROP_LABEL: Record<AppearanceKey, string> = {
  icon: "icon",
  iconOnly: "iconOnly",
  iconLeft: "left",
  iconRight: "right",
  typeUppercase: "uppercase",
  typeLowercase: "lowercase",
  fontSans: "sans",
  fontSerif: "serif",
  fontMono: "mono",
  rectangle: "rectangle",
  rectangleRounded: "rectangleRounded",
  lineNo: "lineNo",
  lineBottom: "lineBottom",
  tight: "tight",
  gapNo: "gapNo",
  colorBackground: "background",
  colorBackgroundLight: "background-light",
  colorBackgroundDark: "background-dark",
  colorBackgroundSolid: "background-solid",
  colorBackgroundNo: "background-no",
  colorMonochrome: "monochrome",
  colorGradientSideways: "gradient-sideways",
  colorGradientUp: "gradient-up",
  colorGradientAngle: "gradient-angle",
  sizeSmall: "small",
  sizeNormal: "normal",
  sizeLarge: "large",
  sizeLarge2x: "large2x",
  noMotion: "noMotion",
  noGrow: "noGrow",
  noColorChange: "noColorChange",
  icons: "draw-in (default)",
  iconsNo: "iconsNo",
  inverted: "inverted",
  disabled: "disabled",
  toggled: "toggled",
};

const CUSTOMIZER_COLUMNS: { heading: string; keys: AppearanceKey[] }[] = [
  { heading: "Icon", keys: ["icon", "iconOnly", "iconLeft", "iconRight"] },
  {
    heading: "Type",
    keys: [
      "typeUppercase",
      "typeLowercase",
      "fontSans",
      "fontSerif",
      "fontMono",
    ],
  },
  {
    heading: "Shape",
    keys: [
      "rectangle",
      "rectangleRounded",
      "lineNo",
      "lineBottom",
      "tight",
      "gapNo",
    ],
  },
  {
    heading: "Coloring",
    keys: [
      "colorBackground",
      "colorBackgroundLight",
      "colorBackgroundDark",
      "colorBackgroundSolid",
      "colorBackgroundNo",
      "colorMonochrome",
      "colorGradientSideways",
      "colorGradientUp",
      "colorGradientAngle",
    ],
  },
  {
    heading: "Size",
    keys: ["sizeSmall", "sizeNormal", "sizeLarge", "sizeLarge2x"],
  },
  {
    heading: "Animation",
    keys: [
      "noMotion",
      "noGrow",
      "noColorChange",
      "icons",
      "iconsNo",
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
  noGap,
}: {
  title: string;
  children: React.ReactNode;
  noGap?: boolean;
}) {
  return (
    <div className="pb-12">
      <PrismTypography role="label" size="small" as="code" className="mb-2 block">
        {title}
      </PrismTypography>
      <div
        className={`flex flex-wrap items-center ${noGap ? "gap-0" : "gap-3"}`}
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
      names.map((name, i) => [name, getColorForIndex(i)])
    ) as Record<string, ColorName>;
  })[0];
}

const SNIPPET_SAMPLE_ACTION = ACTION_BUTTONS[0];

function escapeJsxDoubleQuotedString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Spread props for `PrismButton` from customize checkboxes (single source for preview + JSX snippet). */
function buildButtonCustomizerSpreadProps(selected: Set<AppearanceKey>): {
  variant: "plain" | "icon";
  iconOnly?: boolean;
  iconPosition: "left" | "right";
  typeUppercase?: boolean;
  typeLowercase?: boolean;
  rectangle?: boolean;
  rectangleRounded?: boolean;
  lineBottom?: boolean;
  lineNo?: boolean;
  colorVariant?:
    | "background"
    | "background-light"
    | "background-dark"
    | "background-solid"
    | "background-no"
    | "monochrome"
    | "gradient-sideways"
    | "gradient-up"
    | "gradient-angle"
    | undefined;
  tight?: boolean;
  gapNo?: boolean;
  size?: PrismButtonSize;
  font?: "sans" | "serif" | "mono";
  noMotion?: boolean;
  noGrow?: boolean;
  noColorChange?: boolean;
  iconsNo?: boolean;
  inverted?: boolean;
  disabled?: boolean;
  toggled?: boolean;
} {
  const size: PrismButtonSize | undefined = selected.has("sizeLarge2x")
    ? "large2x"
    : selected.has("sizeLarge")
      ? "large"
      : selected.has("sizeNormal")
        ? "normal"
        : selected.has("sizeSmall")
          ? "small"
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
  const lineVariant = selected.has("lineNo")
    ? "no"
    : selected.has("lineBottom")
      ? "bottom"
      : "border";
  const iconPosition: "left" | "right" = selected.has("iconRight")
    ? "right"
    : "left";
  return {
    variant: needsIcon ? ("icon" as const) : ("plain" as const),
    iconOnly: selected.has("iconOnly") || undefined,
    iconPosition,
    typeUppercase: selected.has("typeUppercase")
      ? true
      : selected.has("typeLowercase")
        ? false
        : undefined,
    typeLowercase: selected.has("typeLowercase") || undefined,
    rectangle: selected.has("rectangle") || undefined,
    rectangleRounded: selected.has("rectangleRounded") || undefined,
    lineBottom: lineVariant === "bottom" || undefined,
    lineNo: lineVariant === "no" || undefined,
    colorVariant: (selected.has("colorGradientAngle")
      ? "gradient-angle"
      : selected.has("colorGradientUp")
        ? "gradient-up"
        : selected.has("colorGradientSideways")
          ? "gradient-sideways"
          : selected.has("colorMonochrome")
            ? "monochrome"
            : selected.has("colorBackgroundNo")
              ? "background-no"
              : selected.has("colorBackgroundDark")
                ? "background-dark"
                : selected.has("colorBackgroundLight")
                  ? "background-light"
                  : selected.has("colorBackgroundSolid")
                    ? "background-solid"
                    : selected.has("colorBackground")
                      ? "background"
                      : undefined) as
      | "background"
      | "background-light"
      | "background-dark"
      | "background-solid"
      | "background-no"
      | "monochrome"
      | "gradient-sideways"
      | "gradient-up"
      | "gradient-angle"
      | undefined,
    tight: selected.has("tight") || undefined,
    gapNo: selected.has("gapNo") || undefined,
    size,
    font,
    noMotion: selected.has("noMotion") || undefined,
    noGrow: selected.has("noGrow") || undefined,
    noColorChange:
      selected.has("noColorChange") || undefined,
    iconsNo: selected.has("iconsNo") || undefined,
    inverted: selected.has("inverted") || undefined,
    disabled: selected.has("disabled") || undefined,
    toggled: selected.has("toggled") || undefined,
  };
}

/** Single-line JSX for the customize strip (sample row + current toggles). */
function formatPrismButtonCustomizerSnippet(
  sample: (typeof ACTION_BUTTONS)[number],
  p: {
    variant: "plain" | "icon";
    iconOnly?: boolean;
    iconPosition: "left" | "right";
    typeUppercase?: boolean;
    typeLowercase?: boolean;
    rectangle?: boolean;
    rectangleRounded?: boolean;
    lineBottom?: boolean;
    lineNo?: boolean;
    colorVariant?:
      | "background"
      | "background-light"
      | "background-dark"
      | "background-solid"
      | "background-no"
      | "monochrome"
      | "gradient-sideways"
      | "gradient-up"
      | "gradient-angle"
      | undefined;
    tight?: boolean;
    gapNo?: boolean;
    size?: PrismButtonSize;
    font?: "sans" | "serif" | "mono";
    noMotion?: boolean;
    noGrow?: boolean;
    noColorChange?: boolean;
    iconsNo?: boolean;
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
  if (p.typeUppercase) parts.push("typeUppercase");
  if (p.typeLowercase) parts.push("typeLowercase");
  if (p.rectangle) parts.push("rectangle");
  if (p.rectangleRounded) parts.push("rectangleRounded");
  if (p.lineBottom) parts.push("lineBottom");
  if (p.lineNo) parts.push("lineNo");
  if (p.colorVariant) {
    parts.push(`colorVariant="${escapeJsxDoubleQuotedString(p.colorVariant)}"`);
  }
  if (p.tight) parts.push("tight");
  if (p.gapNo) parts.push("gapNo");
  if (p.size) parts.push(`size="${p.size}"`);
  if (p.font && p.font !== "sans") parts.push(`font="${p.font}"`);
  if (p.noMotion) parts.push("noMotion");
  if (p.noGrow) parts.push("noGrow");
  if (p.noColorChange) parts.push("noColorChange");
  if (p.iconsNo) parts.push("iconsNo");
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
 * Preset shortcuts and static variant rows live in {@link ButtonVariantsList}.
 */
export function ButtonCustomizerPlayground() {
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
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const { spreadProps, currentSampleSnippet } = useMemo(() => {
    const spreadProps = buildButtonCustomizerSpreadProps(selected);
    const segmentPosition = spreadProps.gapNo
      ? ("first" as const)
      : undefined;
    const currentSampleSnippet = formatPrismButtonCustomizerSnippet(
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
              color={copyToast.isError ? "destructive" : undefined}
            >
              {copyToast.title}
            </PrismTypography>
            {copyToast.detail ? (
              <PrismTypography
                role="body"
                size="small"
                color="muted"
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
                      color="muted"
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
            <PrismTypography role="label" size="medium" font="mono" color="muted">
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
            className={`flex flex-wrap items-center ${selected.has("gapNo") ? "gap-0" : "gap-3"}`}
          >
            {ACTION_BUTTONS.map(({ color, label, icon }, i) => (
              <PrismButton
                key={`${color}-${animationKey}`}
                color={color}
                label={label}
                icon={icon}
                asSpan
                {...spreadProps}
                segmentPosition={
                  selected.has("gapNo")
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

/** List of all PrismButton variant rows for use on /admin/prism/components/prism-button */
export function ButtonVariantsList({
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
            asSpan
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
            asSpan
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
            asSpan
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
            asSpan
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
            asSpan
          />
        ))}
      </Row>
      <Row title="typeUppercase">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            typeUppercase
            asSpan
          />
        ))}
      </Row>
      <Row title="typeLowercase (label in lowercase)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            typeLowercase
            asSpan
          />
        ))}
      </Row>
      <Row title="rectangle (90° corners)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            rectangle
            asSpan
          />
        ))}
      </Row>
      <Row title="rectangleRounded (slight curve)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            rectangleRounded
            asSpan
          />
        ))}
      </Row>
      <Row title="lineBottom + rectangle">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            lineBottom
            rectangle
            asSpan
          />
        ))}
      </Row>
      <Row title="lineNo (no border)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            lineNo
            asSpan
          />
        ))}
      </Row>
      <Row title="colorBackgroundLight (100 fill, default)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="background-light"
            asSpan
          />
        ))}
      </Row>
      <Row title="colorBackgroundDark (800 fill)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="background-dark"
            asSpan
          />
        ))}
      </Row>
      <Row title="colorBackgroundSolid (outline matches fill)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="background-solid"
            asSpan
          />
        ))}
      </Row>
      <Row title="colorBackgroundNo (no fill)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="background-no"
            asSpan
          />
        ))}
      </Row>
      <Row title="colorMonochrome">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="monochrome"
            asSpan
          />
        ))}
      </Row>
      <Row title="colorGradientSideways (L→R, next in palette)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="gradient-sideways"
            asSpan
          />
        ))}
      </Row>
      <Row title="colorGradientUp">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="gradient-up"
            asSpan
          />
        ))}
      </Row>
      <Row title="colorGradientAngle (45°)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="gradient-angle"
            asSpan
          />
        ))}
      </Row>
      <Row title="tight (50% padding)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            tight
            asSpan
          />
        ))}
      </Row>
      <Row title="gapNo (segment radius: first / middle / last)" noGap>
        {ACTION_BUTTONS.map(({ color, label, icon }, i) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            gapNo
            segmentPosition={
              i === 0
                ? "first"
                : i === ACTION_BUTTONS.length - 1
                  ? "last"
                  : "middle"
            }
            asSpan
          />
        ))}
      </Row>
      <Row title="sizeSmall + typeUppercase (75%)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="small"
            typeUppercase
            asSpan
          />
        ))}
      </Row>
      <Row title="sizeNormal (100%)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="normal"
            asSpan
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
            asSpan
          />
        ))}
      </Row>
      <Row title="sizeLarge2x (2×)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="large2x"
            asSpan
          />
        ))}
      </Row>
      <Row title="noMotion">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            noMotion
            asSpan
          />
        ))}
      </Row>
      <Row title="noGrow">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            noGrow
            asSpan
          />
        ))}
      </Row>
      <Row title="noColorChange">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            noColorChange
            asSpan
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
            asSpan
          />
        ))}
      </Row>
      <Row title="iconsNo">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            iconsNo
            asSpan
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
            asSpan
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
            asSpan
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
            asSpan
          />
        ))}
      </Row>
    </div>
  );
}
