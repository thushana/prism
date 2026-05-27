"use client";

import {
  PrismButton,
  PrismCodeBlock,
  PrismColorPicker,
  PrismIcon,
  PrismIconPicker,
  PrismTypography,
  PRISM_MATERIAL_ICONS_ROUND_NAMES,
  prismColorPickerClipboardColorProp,
  resolveLucideIdByName,
} from "@ui";
import type {
  PartialPrismColorSpec,
  PrismIconEntranceRotatePreset,
  PrismIconFillMode,
  PrismIconGrowPreset,
  PrismIconMotionProps,
  PrismIconMotionPreset,
  PrismIconProps,
  PrismIconSizeName,
  PrismIconStyle,
  PrismIconWeightName,
  PrismMotionDurationName,
  PrismMotionEasePreset,
  PrismMotionPlaybackMode,
} from "@ui";
import { LayoutGrid } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { createPortal } from "react-dom";
import {
  PlaygroundPropLegend,
  PrismPlaygroundOptionLabel,
} from "./playground-option-label";

const ICON_MOTION_PLAYBACK_OPTIONS: {
  value: PrismMotionPlaybackMode;
  label: string;
}[] = [
  { value: "loop", label: "loop" },
  { value: "once", label: "once" },
  { value: "hover", label: "hover" },
  { value: "occasionally", label: "occasionally" },
];

/** `null` = omit the `motion` prop entirely (not a `playback` value). */
const ICON_PLAYBACK_OPTIONS: {
  value: PrismMotionPlaybackMode | null;
  label: string;
}[] = [{ value: null, label: "(no motion)" }, ...ICON_MOTION_PLAYBACK_OPTIONS];

const ICON_MOTION_EASE_OPTIONS: {
  value: PrismMotionEasePreset;
  label: string;
}[] = [
  { value: "none", label: "none" },
  { value: "in", label: "in" },
  { value: "out", label: "out" },
  { value: "bounce", label: "bounce" },
];

const ICON_MOTION_DURATION_NAMES = [
  "glacial",
  "slow",
  "regular",
  "fast",
  "speedy",
] as const satisfies readonly PrismMotionDurationName[];

const ICON_MOTION_DURATION_OPTIONS = ICON_MOTION_DURATION_NAMES.map(
  (value) => ({ value, label: value })
);

const ICON_PRESET_IN_OPTIONS: {
  value: PrismIconMotionPreset;
  label: string;
}[] = [
  { value: "fadeScale", label: "fadeScale" },
  { value: "none", label: "none" },
];

const ICON_GROW_OPTIONS: {
  value: PrismIconGrowPreset;
  label: string;
  rangeLabel: string;
}[] = [
  { value: "none", label: "none", rangeLabel: "100%" },
  { value: "small", label: "small", rangeLabel: "90–110%" },
  { value: "regular", label: "regular", rangeLabel: "85–125%" },
  { value: "large", label: "large", rangeLabel: "80–133%" },
];

const ICON_ENTRANCE_ROTATE_OPTIONS: {
  value: PrismIconEntranceRotatePreset;
  label: string;
  rangeLabel: string;
}[] = [
  { value: "none", label: "none", rangeLabel: "0°" },
  { value: "small", label: "small", rangeLabel: "10°" },
  { value: "full", label: "full", rangeLabel: "360°" },
];

const PRISM_ICON_PLAYGROUND_DEFAULT_MATERIAL = "diamond";
const PRISM_ICON_PLAYGROUND_DEFAULT_LUCIDE = "gem";

const ICON_STYLE_OPTIONS: {
  value: PrismIconStyle;
  label: string;
}[] = [
  { value: "material", label: "material" },
  { value: "lucide", label: "lucide" },
];

const ICON_FILL_OPTIONS: {
  appearanceKey: "fillFalse" | "fillTrue";
  label: string;
}[] = [
  { appearanceKey: "fillFalse", label: "off" },
  { appearanceKey: "fillTrue", label: "on" },
];

type IconDemoAppearanceKey =
  | "sizeSmall"
  | "sizeRegular"
  | "sizeLarge"
  | "sizeHuge"
  | "sizeGigantic"
  | "weightLight"
  | "weightThin"
  | "weightRegular"
  | "weightBold"
  | "weightHeavy"
  | "fillFalse"
  | "fillTrue";

const ICON_DEMO_EXCLUSIVE_KEY_GROUPS: IconDemoAppearanceKey[][] = [
  ["sizeSmall", "sizeRegular", "sizeLarge", "sizeHuge", "sizeGigantic"],
  ["weightLight", "weightThin", "weightRegular", "weightBold", "weightHeavy"],
  ["fillFalse", "fillTrue"],
];

/** Checkbox labels next to each option (matches string tokens in `PrismIcon` props). */
const ICON_DEMO_DISPLAY_LABEL: Record<IconDemoAppearanceKey, string> = {
  sizeSmall: "small",
  sizeRegular: "regular",
  sizeLarge: "large",
  sizeHuge: "huge",
  sizeGigantic: "gigantic",
  weightLight: "light",
  weightThin: "thin",
  weightRegular: "regular",
  weightBold: "bold",
  weightHeavy: "heavy",
  fillFalse: "off",
  fillTrue: "on",
};

/** Playground labels; `lines` maps to `motion.draw: "stroke"`. */
type IconMotionDrawMode = "glyph" | "lines";

const ICON_DRAW_MODE_OPTIONS: {
  value: IconMotionDrawMode;
  label: string;
}[] = [
  { value: "glyph", label: "glyph" },
  { value: "lines", label: "lines" },
];

const ICON_DEMO_OPTION_COLUMNS: {
  /** Matches {@link PrismIconProps} prop name. */
  prop: keyof Pick<PrismIconProps, "size" | "weight">;
  keys: IconDemoAppearanceKey[];
}[] = [
  {
    prop: "size",
    keys: ["sizeSmall", "sizeRegular", "sizeLarge", "sizeHuge", "sizeGigantic"],
  },
  {
    prop: "weight",
    keys: [
      "weightLight",
      "weightThin",
      "weightRegular",
      "weightBold",
      "weightHeavy",
    ],
  },
];

function initialIconDemoSelection(): Set<IconDemoAppearanceKey> {
  return new Set([
    "sizeRegular",
    "weightRegular",
    "fillFalse",
  ] as IconDemoAppearanceKey[]);
}

function resolveIconDemoProps(
  selected: Set<IconDemoAppearanceKey>
): Pick<PrismIconProps, "size" | "weight" | "fill"> {
  const size: PrismIconSizeName = selected.has("sizeGigantic")
    ? "gigantic"
    : selected.has("sizeHuge")
      ? "huge"
      : selected.has("sizeLarge")
        ? "large"
        : selected.has("sizeSmall")
          ? "small"
          : "regular";
  const weight: PrismIconWeightName = selected.has("weightHeavy")
    ? "heavy"
    : selected.has("weightBold")
      ? "bold"
      : selected.has("weightRegular")
        ? "regular"
        : selected.has("weightThin")
          ? "thin"
          : selected.has("weightLight")
            ? "light"
            : "regular";
  const fill: PrismIconFillMode = selected.has("fillTrue") ? "on" : "off";
  return { size, weight, fill };
}

function escapeIconNameForJsxAttribute(iconName: string): string {
  return iconName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatSizeAttributeForSnippet(
  size: PrismIconProps["size"] | undefined
): string {
  if (size === undefined) return 'size="regular"';
  if (typeof size === "number") return "size={" + size + "}";
  return 'size="' + size + '"';
}

function formatWeightAttributeForSnippet(
  weight: PrismIconProps["weight"] | undefined
): string {
  if (weight === undefined) return 'weight="regular"';
  if (typeof weight === "number") return "weight={" + weight + "}";
  return 'weight="' + weight + '"';
}

function fillModeForSnippet(fill: PrismIconProps["fill"] | undefined): string {
  return fill === "on" ? "on" : "off";
}

function formatDurationInSnippet(
  value: PrismIconMotionProps["durationIn"]
): string {
  if (value === undefined) return "";
  if (typeof value === "number") return `{${value}}`;
  return `"${value}"`;
}

function formatMotionBlockSnippet(m: PrismIconMotionProps): string {
  const inner: string[] = [];
  if (m.playback !== undefined) {
    inner.push(`    playback: "${m.playback}",`);
  }
  if (m.durationIn !== undefined) {
    inner.push(`    durationIn: ${formatDurationInSnippet(m.durationIn)},`);
  }
  if (m.presetIn !== undefined) {
    inner.push(`    presetIn: "${m.presetIn}",`);
  }
  if (m.draw !== undefined) {
    inner.push(`    draw: "${m.draw}",`);
  }
  if (m.durationOut !== undefined) {
    inner.push(`    durationOut: ${formatDurationInSnippet(m.durationOut)},`);
  }
  if (m.presetOut !== undefined) {
    inner.push(`    presetOut: "${m.presetOut}",`);
  }
  if (m.grow !== undefined) {
    inner.push(`    grow: "${m.grow}",`);
  }
  if (m.entranceRotate !== undefined) {
    inner.push(`    entranceRotate: "${m.entranceRotate}",`);
  }
  if (m.easeIn !== undefined) {
    inner.push(`    easeIn: "${m.easeIn}",`);
  }
  if (m.scaleInFromPercent !== undefined) {
    inner.push(`    scaleInFromPercent: ${m.scaleInFromPercent},`);
  }
  if (m.scalePeakPercent !== undefined) {
    inner.push(`    scalePeakPercent: ${m.scalePeakPercent},`);
  }
  if (m.rotateInDeg !== undefined) {
    inner.push(`    rotateInDeg: ${m.rotateInDeg},`);
  }
  if (m.disabled === true) {
    inner.push(`    disabled: true,`);
  }
  if (inner.length === 0) return "";
  return ["  motion={{", ...inner, "  }}"].join("\n");
}

/** Snippet defaults: omit props that match these so copied JSX stays short. */
const ICON_MOTION_SNIPPET_DEFAULTS = {
  easeIn: "out" as const,
};

function trimIconMotionForSnippet(
  m: PrismIconMotionProps
): PrismIconMotionProps {
  const out: PrismIconMotionProps = {
    playback: m.playback,
    durationIn: m.durationIn,
    presetIn: m.presetIn,
    durationOut: m.durationOut,
    presetOut: m.presetOut,
    disabled: m.disabled,
  };
  if (
    m.easeIn !== undefined &&
    m.easeIn !== ICON_MOTION_SNIPPET_DEFAULTS.easeIn
  ) {
    out.easeIn = m.easeIn;
  }
  if (m.grow !== undefined) {
    out.grow = m.grow;
  }
  if (m.entranceRotate !== undefined && m.entranceRotate !== "none") {
    out.entranceRotate = m.entranceRotate;
  }
  if (m.scaleInFromPercent !== undefined) {
    out.scaleInFromPercent = m.scaleInFromPercent;
  }
  if (m.scalePeakPercent !== undefined) {
    out.scalePeakPercent = m.scalePeakPercent;
  }
  if (m.rotateInDeg !== undefined) {
    out.rotateInDeg = m.rotateInDeg;
  }
  if (m.draw !== undefined) {
    out.draw = m.draw;
  }
  return out;
}

/**
 * Stable fragment for React `key`s on motion previews: remount when tuning GSAP-driving props.
 * Inline transforms / opacity survive prop updates unless the node resets.
 */
function playgroundPreviewKey(
  iconStyle: PrismIconStyle,
  name: string,
  fill: PrismIconFillMode,
  m: PrismIconMotionProps | undefined,
  drawMode: IconMotionDrawMode
): string {
  return `${iconStyle}:${name}:${fill}:${playgroundMotionPreviewKey(m, drawMode)}`;
}

function playgroundMotionPreviewKey(
  m: PrismIconMotionProps | undefined,
  drawMode: IconMotionDrawMode
): string {
  if (!m) return "static";
  return JSON.stringify({
    playback: m.playback,
    durationIn: m.durationIn,
    durationOut: m.durationOut,
    presetIn: m.presetIn,
    presetOut: m.presetOut,
    grow: m.grow,
    entranceRotate: m.entranceRotate,
    easeIn: m.easeIn,
    scaleInFromPercent: m.scaleInFromPercent,
    scalePeakPercent: m.scalePeakPercent,
    rotateInDeg: m.rotateInDeg,
    draw: m.draw,
    drawMode,
    disabled: m.disabled,
  });
}

function formatPrismIconSnippet(
  name: string,
  iconStyle: PrismIconStyle,
  props: Pick<PrismIconProps, "size" | "weight" | "fill">,
  color?: PartialPrismColorSpec,
  motion?: PrismIconMotionProps
): string {
  const lines = [
    "<PrismIcon",
    `  name="${escapeIconNameForJsxAttribute(name)}"`,
  ];
  if (iconStyle === "lucide") {
    lines.push('  iconStyle="lucide"');
  }
  lines.push(
    `  ${formatSizeAttributeForSnippet(props.size)}`,
    `  ${formatWeightAttributeForSnippet(props.weight)}`
  );
  if (iconStyle === "material") {
    lines.push(`  fill="${fillModeForSnippet(props.fill)}"`);
  }
  if (color && Object.keys(color).length > 0) {
    for (const line of prismColorPickerClipboardColorProp(color).split("\n")) {
      lines.push(`  ${line}`);
    }
  }
  const motionBlock = motion
    ? formatMotionBlockSnippet(trimIconMotionForSnippet(motion))
    : "";
  if (motionBlock) {
    lines.push(motionBlock);
  }
  lines.push("/>", "");
  return lines.join("\n");
}

/**
 * Sort key so sections render in a stable order: numeric names, then
 * underscore families (`arrow_*`, …), then single-token names by first letter.
 */
function categorySortKeyForIconName(iconName: string): string {
  if (/^[0-9]/.test(iconName)) {
    return "0-numeric";
  }
  const underscoreIndex = iconName.indexOf("_");
  if (underscoreIndex > 0) {
    const family = iconName.slice(0, underscoreIndex);
    return "1-" + family;
  }
  const letter = iconName.charAt(0).toLowerCase();
  if (letter >= "a" && letter <= "z") {
    return "2-" + letter;
  }
  return "3-" + iconName.charAt(0);
}

function capitalizeFirstSegment(segment: string): string {
  if (!segment) return segment;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function categorySectionHeadingFromSortKey(sortKey: string): string {
  if (sortKey === "0-numeric") {
    return "Numeric";
  }
  if (sortKey.startsWith("1-")) {
    return capitalizeFirstSegment(sortKey.slice(2));
  }
  if (/^2-[a-z]$/.test(sortKey)) {
    const letter = sortKey.slice(2).toUpperCase();
    return "Single name \u2014 " + letter;
  }
  return "Other \u2014 " + sortKey.slice(2);
}

type IconNameSection = {
  categorySortKey: string;
  categorySectionHeading: string;
  iconNameList: string[];
};

function buildIconNameSections(
  iconNameList: readonly string[]
): IconNameSection[] {
  const bucketBySortKey = new Map<string, string[]>();
  for (const iconName of iconNameList) {
    const sortKey = categorySortKeyForIconName(iconName);
    const bucket = bucketBySortKey.get(sortKey) ?? [];
    bucket.push(iconName);
    bucketBySortKey.set(sortKey, bucket);
  }
  for (const bucket of bucketBySortKey.values()) {
    bucket.sort((a, b) => a.localeCompare(b));
  }
  return [...bucketBySortKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([categorySortKey, names]) => ({
      categorySortKey,
      categorySectionHeading:
        categorySectionHeadingFromSortKey(categorySortKey),
      iconNameList: names,
    }));
}

const IconCell = memo(function IconCell({
  pickerName,
  iconStyle,
  iconProps,
  iconColor,
  onCopied,
}: {
  /** Material ligature from the options grid. */
  pickerName: string;
  iconStyle: PrismIconStyle;
  iconProps: Pick<PrismIconProps, "size" | "weight" | "fill">;
  iconColor?: PartialPrismColorSpec;
  onCopied: (snippet: string) => void;
}) {
  const lucideId = resolveLucideIdByName(pickerName);
  const previewName = iconStyle === "lucide" ? (lucideId ?? null) : pickerName;
  const snippetName = iconStyle === "lucide" ? lucideId : pickerName;

  const handleCopyIconSnippet = useCallback(async () => {
    if (!snippetName) return;
    const snippet = formatPrismIconSnippet(
      snippetName,
      iconStyle,
      iconProps,
      iconColor
    );
    try {
      await navigator.clipboard.writeText(snippet);
      onCopied(snippet);
    } catch {
      onCopied("");
    }
  }, [snippetName, iconStyle, iconProps, iconColor, onCopied]);

  if (!previewName) return null;

  return (
    <button
      type="button"
      onClick={handleCopyIconSnippet}
      title={previewName + " \u2014 click to copy JSX"}
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-transparent text-foreground hover:border-border hover:bg-muted/60"
    >
      {/*
        Icon Options is every Material name (~2k cells). Passing `motion` here used to rerun GSAP on
        every control change and stuttered the whole page — motion is shown in Customize + Example.
      */}
      <PrismIcon
        name={previewName}
        iconStyle={iconStyle}
        {...iconProps}
        color={iconColor}
      />
    </button>
  );
});

/**
 * Interactive {@link PrismIcon} demo (Material + Lucide). Served from
 * `/admin/prism/components/prism-icon`.
 */
export function PrismIconDemo(): JSX.Element {
  const [selectedAppearanceKeys, setSelectedAppearanceKeys] = useState(
    initialIconDemoSelection
  );
  const [iconStyle, setIconStyle] = useState<PrismIconStyle>("material");
  const [materialIconName, setMaterialIconName] = useState(
    PRISM_ICON_PLAYGROUND_DEFAULT_MATERIAL
  );
  const [lucideIconName, setLucideIconName] = useState(
    PRISM_ICON_PLAYGROUND_DEFAULT_LUCIDE
  );
  const [exampleMaterialNames, setExampleMaterialNames] = useState<string[]>([
    PRISM_ICON_PLAYGROUND_DEFAULT_MATERIAL,
  ]);
  const [exampleLucideNames, setExampleLucideNames] = useState<string[]>([
    PRISM_ICON_PLAYGROUND_DEFAULT_LUCIDE,
  ]);
  const [gridFilterQuery, setGridFilterQuery] = useState("");
  const [iconColor, setIconColor] = useState<PartialPrismColorSpec>({
    palette: "default",
    swatchPrimary: "indigo",
    shade: 500,
  });
  const [motionPlaybackOrOff, setMotionPlaybackOrOff] =
    useState<PrismMotionPlaybackMode | null>("once");
  const [motionDurationIn, setMotionDurationIn] =
    useState<PrismMotionDurationName>("regular");
  const [motionPresetIn, setMotionPresetIn] =
    useState<PrismIconMotionPreset>("fadeScale");
  const [motionGrow, setMotionGrow] = useState<PrismIconGrowPreset>("small");
  const [motionEntranceRotate, setMotionEntranceRotate] =
    useState<PrismIconEntranceRotatePreset>("none");
  const [motionEaseIn, setMotionEaseIn] =
    useState<PrismMotionEasePreset>("out");
  const [motionDrawMode, setMotionDrawMode] =
    useState<IconMotionDrawMode>("glyph");
  const [copyToast, setCopyToast] = useState<{
    title: string;
    detail?: string;
  } | null>(null);
  const copyToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const showTransientToast = useCallback((title: string, detail?: string) => {
    if (copyToastTimeoutRef.current) {
      clearTimeout(copyToastTimeoutRef.current);
    }
    const trimmedDetail =
      detail && detail.length > 88 ? detail.slice(0, 85) + "..." : detail;
    setCopyToast({
      title,
      detail: trimmedDetail,
    });
    copyToastTimeoutRef.current = setTimeout(() => {
      setCopyToast(null);
      copyToastTimeoutRef.current = null;
    }, 2800);
  }, []);

  useEffect(
    () => () => {
      if (copyToastTimeoutRef.current) {
        clearTimeout(copyToastTimeoutRef.current);
      }
    },
    []
  );

  const iconProps = useMemo(
    () => resolveIconDemoProps(selectedAppearanceKeys),
    [selectedAppearanceKeys]
  );

  const iconMotion = useMemo((): PrismIconMotionProps | undefined => {
    if (motionPlaybackOrOff === null) return undefined;
    const motion: PrismIconMotionProps = {
      playback: motionPlaybackOrOff,
      durationIn: motionDurationIn,
      presetIn: motionPresetIn,
      easeIn: motionEaseIn,
      grow: motionGrow,
    };
    if (motionPresetIn === "fadeScale") {
      motion.entranceRotate = motionEntranceRotate;
    }
    if (motionDrawMode === "lines" && iconStyle === "lucide") {
      motion.draw = "stroke";
    }
    return motion;
  }, [
    motionPlaybackOrOff,
    motionDurationIn,
    motionPresetIn,
    motionEaseIn,
    motionGrow,
    motionEntranceRotate,
    motionDrawMode,
    iconStyle,
  ]);

  const motionOn = motionPlaybackOrOff !== null;
  const lucideStyleOn = iconStyle === "lucide";
  const entranceTuningOn = motionOn && motionPresetIn === "fadeScale";

  const previewIconName =
    iconStyle === "material"
      ? materialIconName || PRISM_ICON_PLAYGROUND_DEFAULT_MATERIAL
      : lucideIconName || PRISM_ICON_PLAYGROUND_DEFAULT_LUCIDE;

  const exampleIconNames =
    iconStyle === "material" ? exampleMaterialNames : exampleLucideNames;

  const currentSampleSnippet = useMemo(() => {
    return formatPrismIconSnippet(
      previewIconName,
      iconStyle,
      iconProps,
      iconColor,
      iconMotion
    );
  }, [previewIconName, iconStyle, iconProps, iconColor, iconMotion]);

  const filteredGridIconNames = useMemo(() => {
    const query = gridFilterQuery.trim().toLowerCase();
    if (!query) return PRISM_MATERIAL_ICONS_ROUND_NAMES;
    return PRISM_MATERIAL_ICONS_ROUND_NAMES.filter((n) =>
      n.toLowerCase().includes(query)
    );
  }, [gridFilterQuery]);

  const iconNameSections = useMemo(
    () => buildIconNameSections(filteredGridIconNames),
    [filteredGridIconNames]
  );

  const handleIconPicked = useCallback(
    (pickedLigature: string) => {
      if (!PRISM_MATERIAL_ICONS_ROUND_NAMES.includes(pickedLigature)) return;

      if (iconStyle === "material") {
        setMaterialIconName(pickedLigature);
        setExampleMaterialNames((prev) =>
          prev.includes(pickedLigature) ? prev : [...prev, pickedLigature]
        );
        showTransientToast("Added to preview", pickedLigature);
        return;
      }

      const lucideId = resolveLucideIdByName(pickedLigature);
      if (!lucideId) {
        showTransientToast(
          "No Lucide match",
          `${pickedLigature} has no Lucide equivalent in this picker`
        );
        return;
      }
      setLucideIconName(lucideId);
      setExampleLucideNames((prev) =>
        prev.includes(lucideId) ? prev : [...prev, lucideId]
      );
      showTransientToast("Added to preview", lucideId);
    },
    [iconStyle, showTransientToast]
  );

  const handleIconStyleChange = useCallback((style: PrismIconStyle) => {
    setIconStyle(style);
  }, []);

  const handleSelectFill = useCallback(
    (appearanceKey: "fillFalse" | "fillTrue") => {
      setSelectedAppearanceKeys((previous) => {
        const next = new Set(previous);
        next.delete("fillFalse");
        next.delete("fillTrue");
        next.add(appearanceKey);
        return next;
      });
    },
    []
  );

  const handleToggleAppearanceKey = (key: IconDemoAppearanceKey) => {
    setSelectedAppearanceKeys((previous) => {
      const next = new Set(previous);
      const exclusiveGroup = ICON_DEMO_EXCLUSIVE_KEY_GROUPS.find((g) =>
        g.includes(key)
      );
      if (exclusiveGroup) {
        for (const k of exclusiveGroup) next.delete(k);
      }
      next.add(key);
      return next;
    });
  };

  const handleIconCopied = useCallback(
    (snippet: string) => {
      if (!snippet) return;
      showTransientToast("Copied to clipboard", snippet);
    },
    [showTransientToast]
  );

  const copyToastPortal =
    copyToast && typeof document !== "undefined"
      ? createPortal(
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              left: "50%",
              bottom: "2rem",
              transform: "translateX(-50%)",
              zIndex: 99999,
              maxWidth: "min(36rem, calc(100vw - 2rem))",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              boxShadow:
                "0 10px 15px -3px rgb(0 0 0 / 0.12), 0 4px 6px -4px rgb(0 0 0 / 0.08)",
              pointerEvents: "none",
            }}
          >
            <PrismTypography role="label" size="regular" className="block">
              {copyToast.title}
            </PrismTypography>
            {copyToast.detail ? (
              <PrismTypography
                role="body"
                size="small"
                color={{ semanticText: "muted" }}
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
      <div className="space-y-10">
        <section className="space-y-4">
          <PrismTypography role="title" size="large" font="sans" as="h2">
            Customize
          </PrismTypography>

          <form
            className="w-full min-w-0 space-y-8"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid w-full min-w-0 grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-5">
              <div className="min-w-0 space-y-1.5">
                <PlaygroundPropLegend prop="name" />
                <div className="flex min-w-0 flex-col items-start gap-2">
                  <PrismIconPicker
                    iconStyle={iconStyle}
                    trigger={
                      <PrismButton
                        type="button"
                        variant="icon"
                        icon={LayoutGrid}
                        label="Browse icons"
                        color={{ palette: "default", swatchPrimary: "indigo" }}
                      />
                    }
                    onIconSelect={handleIconPicked}
                  />
                  <div className="flex max-w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <PrismIcon
                      key={playgroundPreviewKey(
                        iconStyle,
                        previewIconName,
                        iconProps.fill ?? "off",
                        iconMotion,
                        motionDrawMode
                      )}
                      name={previewIconName}
                      iconStyle={iconStyle}
                      {...iconProps}
                      color={iconColor}
                      motion={iconMotion}
                    />
                    <PrismPlaygroundOptionLabel
                      active
                      className="min-w-0 truncate"
                    >
                      {previewIconName}
                    </PrismPlaygroundOptionLabel>
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-1.5">
                <PlaygroundPropLegend prop="color" />
                <PrismColorPicker
                  color={iconColor}
                  onColorChange={setIconColor}
                  showCopyButton={false}
                />
              </div>

              {ICON_DEMO_OPTION_COLUMNS.map(({ prop, keys }) => (
                <fieldset key={prop} className="min-w-0 space-y-1.5">
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop={prop} />
                  </legend>
                  {keys.map((appearanceKey) => (
                    <label
                      key={appearanceKey}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAppearanceKeys.has(appearanceKey)}
                        onChange={() =>
                          handleToggleAppearanceKey(appearanceKey)
                        }
                        className="rounded border-input"
                      />
                      <PrismPlaygroundOptionLabel
                        active={selectedAppearanceKeys.has(appearanceKey)}
                      >
                        {ICON_DEMO_DISPLAY_LABEL[appearanceKey]}
                      </PrismPlaygroundOptionLabel>
                    </label>
                  ))}
                </fieldset>
              ))}

              <div className="min-w-0 space-y-6">
                <fieldset className="min-w-0 space-y-1.5">
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop="iconStyle" />
                  </legend>
                  {ICON_STYLE_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="prism-icon-style"
                        value={value}
                        checked={iconStyle === value}
                        onChange={() => handleIconStyleChange(value)}
                        className="border-input"
                      />
                      <PrismPlaygroundOptionLabel active={iconStyle === value}>
                        {label}
                      </PrismPlaygroundOptionLabel>
                    </label>
                  ))}
                </fieldset>

                <fieldset
                  className={
                    lucideStyleOn
                      ? "min-w-0 space-y-1.5 opacity-40"
                      : "min-w-0 space-y-1.5"
                  }
                >
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop="fill" />
                  </legend>
                  {ICON_FILL_OPTIONS.map(({ appearanceKey, label }) => (
                    <label
                      key={appearanceKey}
                      className={
                        lucideStyleOn
                          ? "flex cursor-not-allowed items-center gap-2"
                          : "flex cursor-pointer items-center gap-2"
                      }
                    >
                      <input
                        type="radio"
                        name="prism-icon-fill"
                        value={appearanceKey}
                        checked={selectedAppearanceKeys.has(appearanceKey)}
                        onChange={() => handleSelectFill(appearanceKey)}
                        disabled={lucideStyleOn}
                        className="border-input"
                      />
                      <PrismPlaygroundOptionLabel
                        active={
                          selectedAppearanceKeys.has(appearanceKey) &&
                          !lucideStyleOn
                        }
                      >
                        {label}
                      </PrismPlaygroundOptionLabel>
                    </label>
                  ))}
                </fieldset>
              </div>
            </div>

            <div className="border-t border-border" aria-hidden />

            <div className="min-w-0 space-y-4">
              <PlaygroundPropLegend prop="motion" className="mb-2" />
              <div className="grid w-full min-w-0 grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-5">
                <fieldset className="min-w-0 space-y-1.5">
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop="playback" />
                  </legend>
                  {ICON_PLAYBACK_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value === null ? "no-motion" : value}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="prism-icon-playback"
                        value={value === null ? "none" : value}
                        checked={
                          value === null
                            ? motionPlaybackOrOff === null
                            : motionPlaybackOrOff === value
                        }
                        onChange={() => setMotionPlaybackOrOff(value)}
                        className="border-input"
                      />
                      <PrismPlaygroundOptionLabel
                        active={
                          value === null
                            ? motionPlaybackOrOff === null
                            : motionPlaybackOrOff === value
                        }
                      >
                        {label}
                      </PrismPlaygroundOptionLabel>
                    </label>
                  ))}
                </fieldset>

                <fieldset className="min-w-0 space-y-1.5" disabled={!motionOn}>
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop="draw" />
                  </legend>
                  {ICON_DRAW_MODE_OPTIONS.map(({ value, label }) => {
                    const optionDisabled =
                      !motionOn || (value === "lines" && !lucideStyleOn);
                    return (
                      <label
                        key={value}
                        className={
                          optionDisabled
                            ? "flex cursor-not-allowed items-center gap-2"
                            : "flex cursor-pointer items-center gap-2"
                        }
                      >
                        <input
                          type="radio"
                          name="prism-icon-motion-draw"
                          value={value}
                          checked={motionDrawMode === value}
                          onChange={() => setMotionDrawMode(value)}
                          disabled={optionDisabled}
                          className="border-input"
                        />
                        <PrismPlaygroundOptionLabel
                          active={motionDrawMode === value}
                          color={
                            optionDisabled
                              ? { semanticText: "muted" }
                              : undefined
                          }
                        >
                          {label}
                        </PrismPlaygroundOptionLabel>
                      </label>
                    );
                  })}
                </fieldset>

                <fieldset
                  className={
                    motionOn
                      ? "min-w-0 space-y-1.5"
                      : "min-w-0 space-y-1.5 opacity-40"
                  }
                >
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop="durationIn" />
                  </legend>
                  {ICON_MOTION_DURATION_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={
                        motionOn
                          ? "flex cursor-pointer items-center gap-2"
                          : "flex cursor-not-allowed items-center gap-2"
                      }
                    >
                      <input
                        type="radio"
                        name="prism-icon-motion-duration-in"
                        value={value}
                        checked={motionDurationIn === value}
                        onChange={() => setMotionDurationIn(value)}
                        disabled={!motionOn}
                        className="border-input"
                      />
                      <PrismPlaygroundOptionLabel
                        active={motionDurationIn === value && motionOn}
                      >
                        {label}
                      </PrismPlaygroundOptionLabel>
                    </label>
                  ))}
                </fieldset>

                <fieldset
                  className={
                    motionOn
                      ? "min-w-0 space-y-1.5"
                      : "min-w-0 space-y-1.5 opacity-40"
                  }
                >
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop="easeIn" />
                  </legend>
                  {ICON_MOTION_EASE_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={
                        motionOn
                          ? "flex cursor-pointer items-center gap-2"
                          : "flex cursor-not-allowed items-center gap-2"
                      }
                    >
                      <input
                        type="radio"
                        name="prism-icon-motion-ease-in"
                        value={value}
                        checked={motionEaseIn === value}
                        onChange={() => setMotionEaseIn(value)}
                        disabled={!motionOn}
                        className="border-input"
                      />
                      <PrismPlaygroundOptionLabel
                        active={motionEaseIn === value && motionOn}
                      >
                        {label}
                      </PrismPlaygroundOptionLabel>
                    </label>
                  ))}
                </fieldset>

                <fieldset
                  className={
                    motionOn
                      ? "min-w-0 space-y-1.5"
                      : "min-w-0 space-y-1.5 opacity-40"
                  }
                >
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop="presetIn" />
                  </legend>
                  {ICON_PRESET_IN_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={
                        motionOn
                          ? "flex cursor-pointer items-center gap-2"
                          : "flex cursor-not-allowed items-center gap-2"
                      }
                    >
                      <input
                        type="radio"
                        name="prism-icon-preset-in"
                        value={value}
                        checked={motionPresetIn === value}
                        onChange={() => setMotionPresetIn(value)}
                        disabled={!motionOn}
                        className="border-input"
                      />
                      <PrismPlaygroundOptionLabel
                        active={motionPresetIn === value && motionOn}
                      >
                        {label}
                      </PrismPlaygroundOptionLabel>
                    </label>
                  ))}
                </fieldset>

                <fieldset
                  className={
                    motionOn
                      ? "min-w-0 space-y-1.5"
                      : "min-w-0 space-y-1.5 opacity-40"
                  }
                >
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop="grow" />
                  </legend>
                  {ICON_GROW_OPTIONS.map(({ value, label, rangeLabel }) => (
                    <label
                      key={value}
                      className={
                        motionOn
                          ? "flex cursor-pointer items-center gap-2"
                          : "flex cursor-not-allowed items-center gap-2"
                      }
                    >
                      <input
                        type="radio"
                        name="prism-icon-motion-grow"
                        value={value}
                        checked={motionGrow === value}
                        onChange={() => setMotionGrow(value)}
                        disabled={!motionOn}
                        className="border-input"
                      />
                      <PrismPlaygroundOptionLabel
                        active={motionGrow === value && motionOn}
                      >
                        {label}{" "}
                        <span className="font-mono font-normal">
                          ({rangeLabel})
                        </span>
                      </PrismPlaygroundOptionLabel>
                    </label>
                  ))}
                </fieldset>

                <fieldset
                  className={
                    entranceTuningOn
                      ? "min-w-0 space-y-1.5"
                      : "min-w-0 space-y-1.5 opacity-40"
                  }
                >
                  <legend className="mb-2">
                    <PlaygroundPropLegend prop="entranceRotate" />
                  </legend>
                  {ICON_ENTRANCE_ROTATE_OPTIONS.map(
                    ({ value, label, rangeLabel }) => (
                      <label
                        key={value}
                        className={
                          entranceTuningOn
                            ? "flex cursor-pointer items-center gap-2"
                            : "flex cursor-not-allowed items-center gap-2"
                        }
                      >
                        <input
                          type="radio"
                          name="prism-icon-entrance-rotate"
                          value={value}
                          checked={motionEntranceRotate === value}
                          onChange={() => setMotionEntranceRotate(value)}
                          disabled={!entranceTuningOn}
                          className="border-input"
                        />
                        <PrismPlaygroundOptionLabel
                          active={
                            motionEntranceRotate === value && entranceTuningOn
                          }
                        >
                          {label}{" "}
                          <span className="font-mono font-normal">
                            ({rangeLabel})
                          </span>
                        </PrismPlaygroundOptionLabel>
                      </label>
                    )
                  )}
                </fieldset>
              </div>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <PrismTypography role="title" size="large" font="sans" as="h2">
            Example
          </PrismTypography>
          {exampleIconNames.length === 0 ? (
            <PrismTypography
              role="body"
              size="regular"
              color={{ semanticText: "muted" }}
            >
              Use Browse icons to add examples.
            </PrismTypography>
          ) : (
            <div className="flex flex-wrap gap-6">
              {exampleIconNames.map((previewName) => (
                <PrismIcon
                  key={playgroundPreviewKey(
                    iconStyle,
                    previewName,
                    iconProps.fill ?? "off",
                    iconMotion,
                    motionDrawMode
                  )}
                  name={previewName}
                  iconStyle={iconStyle}
                  {...iconProps}
                  color={iconColor}
                  motion={iconMotion}
                />
              ))}
            </div>
          )}
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
            {currentSampleSnippet}
          </PrismCodeBlock>
        </section>

        <section className="space-y-4">
          <PrismTypography role="title" size="large" font="sans" as="h2">
            Icon Options
          </PrismTypography>
          <input
            type="search"
            value={gridFilterQuery}
            onChange={(e) => setGridFilterQuery(e.target.value)}
            placeholder="Filter grid by name…"
            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter Icon Options grid"
          />
          <PrismPlaygroundOptionLabel
            active={false}
            className="block uppercase"
          >
            Showing {filteredGridIconNames.length.toLocaleString()} of{" "}
            {PRISM_MATERIAL_ICONS_ROUND_NAMES.length.toLocaleString()}
          </PrismPlaygroundOptionLabel>
          <div className="space-y-10">
            {iconNameSections.map(
              ({ categorySortKey, categorySectionHeading, iconNameList }) => (
                <div key={categorySortKey} className="space-y-3">
                  <PrismTypography
                    role="overline"
                    size="small"
                    className="block"
                  >
                    {categorySectionHeading}
                  </PrismTypography>
                  <div className="flex flex-wrap gap-2">
                    {iconNameList.map((iconName) => (
                      <IconCell
                        key={iconName}
                        pickerName={iconName}
                        iconStyle={iconStyle}
                        iconProps={iconProps}
                        iconColor={iconColor}
                        onCopied={handleIconCopied}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
      {copyToastPortal}
    </>
  );
}
