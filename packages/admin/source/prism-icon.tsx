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
  PrismIconWeightName,
  PrismMotionDurationName,
  PrismMotionEasePreset,
  PrismMotionPlaybackMode,
} from "@ui";
import {
  Calendar,
  Camera,
  Car,
  Cake,
  Coffee,
  Compass,
  Gem,
  Globe,
  Heart,
  Home,
  LayoutGrid,
  Mail,
  Menu,
  Music,
  Search,
  Settings,
  Sparkles,
  Sun,
  Train,
  User,
  type LucideIcon,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { createPortal } from "react-dom";
import { PrismPlaygroundOptionLabel } from "./playground-option-label";

const ICON_MOTION_PLAYBACK_OPTIONS: {
  value: PrismMotionPlaybackMode;
  label: string;
}[] = [
  { value: "loop", label: "loop" },
  { value: "once", label: "once" },
  { value: "hover", label: "hover" },
  { value: "occasionally", label: "occasionally" },
];

const ICON_ANIMATION_OPTIONS: {
  value: PrismMotionPlaybackMode | null;
  label: string;
}[] = [
  { value: null, label: "none" },
  ...ICON_MOTION_PLAYBACK_OPTIONS,
];

const ICON_MOTION_EASE_OPTIONS: {
  value: PrismMotionEasePreset;
  label: string;
}[] = [
  { value: "none", label: "none" },
  { value: "in", label: "in" },
  { value: "out", label: "out" },
  { value: "bounce", label: "bounce" },
];

const ICON_MOTION_DURATION_OPTIONS: {
  value: PrismMotionDurationName;
  label: string;
}[] = [
  { value: "glacial", label: "glacial (5s)" },
  { value: "slow", label: "slow (2s)" },
  { value: "regular", label: "regular (1s)" },
  { value: "fast", label: "fast (0.5s)" },
  { value: "speedy", label: "speedy (0.25s)" },
];

const ICON_ENTRANCE_OPTIONS: {
  value: PrismIconMotionPreset;
  label: string;
}[] = [
  { value: "fadeScale", label: "fade on" },
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

const PRISM_ICON_PLAYGROUND_DEFAULT_ICON = "diamond";

/**
 * Material ligature name → closest **multi-path** Lucide stroke icon (playground + snippet names).
 * Prefer icons with multiple geometry nodes so the staggered stroke-dash draw reads (a single
 * closed path like Lucide `Diamond` traces as one continuous line — looks like just an outline
 * appearing, not "lines drawing in").
 */
const LUCIDE_STROKE_BY_MATERIAL: Record<
  string,
  { Icon: LucideIcon; importName: string }
> = {
  diamond: { Icon: Gem, importName: "Gem" },
  favorite: { Icon: Heart, importName: "Heart" },
  home: { Icon: Home, importName: "Home" },
  mail: { Icon: Mail, importName: "Mail" },
  menu: { Icon: Menu, importName: "Menu" },
  search: { Icon: Search, importName: "Search" },
  settings: { Icon: Settings, importName: "Settings" },
  star: { Icon: Sparkles, importName: "Sparkles" },
  person: { Icon: User, importName: "User" },
  calendar_today: { Icon: Calendar, importName: "Calendar" },
  camera_alt: { Icon: Camera, importName: "Camera" },
  directions_car: { Icon: Car, importName: "Car" },
  cake: { Icon: Cake, importName: "Cake" },
  local_cafe: { Icon: Coffee, importName: "Coffee" },
  explore: { Icon: Compass, importName: "Compass" },
  public: { Icon: Globe, importName: "Globe" },
  dashboard: { Icon: LayoutGrid, importName: "LayoutGrid" },
  music_note: { Icon: Music, importName: "Music" },
  wb_sunny: { Icon: Sun, importName: "Sun" },
  train: { Icon: Train, importName: "Train" },
};

/** Fallback Lucide icon for Material names we don't have a hand-picked mapping for. */
const LUCIDE_STROKE_FALLBACK: { Icon: LucideIcon; importName: string } = {
  Icon: Sparkles,
  importName: "Sparkles",
};

function lucideStrokeIconForMaterialName(name: string): LucideIcon {
  return LUCIDE_STROKE_BY_MATERIAL[name]?.Icon ?? LUCIDE_STROKE_FALLBACK.Icon;
}

function lucideStrokeImportNameForMaterial(name: string): string {
  return (
    LUCIDE_STROKE_BY_MATERIAL[name]?.importName ??
    LUCIDE_STROKE_FALLBACK.importName
  );
}
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

const ICON_DEMO_OPTION_COLUMNS: {
  heading: string;
  keys: IconDemoAppearanceKey[];
}[] = [
  {
    heading: "Size",
    keys: ["sizeSmall", "sizeRegular", "sizeLarge", "sizeHuge", "sizeGigantic"],
  },
  {
    heading: "Weight",
    keys: [
      "weightLight",
      "weightThin",
      "weightRegular",
      "weightBold",
      "weightHeavy",
    ],
  },
  { heading: "Fill", keys: ["fillFalse", "fillTrue"] },
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

function fillModeForSnippet(fill: PrismIconProps["fill"] | undefined): string {
  return fill === "on" ? "on" : "off";
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
  if (m.easeIn !== undefined && m.easeIn !== ICON_MOTION_SNIPPET_DEFAULTS.easeIn) {
    out.easeIn = m.easeIn;
  }
  if (m.grow !== undefined) {
    out.grow = m.grow;
  }
  if (
    m.entranceRotate !== undefined &&
    m.entranceRotate !== "none"
  ) {
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
function playgroundMotionPreviewKey(m: PrismIconMotionProps | undefined): string {
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
    disabled: m.disabled,
  });
}

function formatPrismIconSnippet(
  name: string,
  props: Pick<PrismIconProps, "size" | "weight" | "fill">,
  color?: PartialPrismColorSpec,
  motion?: PrismIconMotionProps,
  lucideStrokeImportName?: string
): string {
  const preamble =
    motion?.draw === "stroke" && lucideStrokeImportName
      ? `// import { ${lucideStrokeImportName} } from "lucide-react"\n\n`
      : "";
  const lines = [
    "<PrismIcon",
    `  name="${escapeIconNameForJsxAttribute(name)}"`,
    `  ${formatSizeAttributeForSnippet(props.size)}`,
    `  ${formatWeightAttributeForSnippet(props.weight)}`,
    `  fill="${fillModeForSnippet(props.fill)}"`,
  ];
  if (motion?.draw === "stroke" && lucideStrokeImportName) {
    lines.push(`  lucideStrokeIcon={${lucideStrokeImportName}}`);
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
  return preamble + lines.join("\n");
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
  name,
  iconProps,
  iconColor,
  iconMotion,
  onCopied,
}: {
  name: string;
  iconProps: Pick<PrismIconProps, "size" | "weight" | "fill">;
  iconColor?: PartialPrismColorSpec;
  iconMotion?: PrismIconMotionProps;
  onCopied: (snippet: string) => void;
}) {
  const handleCopyIconSnippet = useCallback(async () => {
    const snippet = formatPrismIconSnippet(
      name,
      iconProps,
      iconColor,
      iconMotion,
      iconMotion?.draw === "stroke"
        ? lucideStrokeImportNameForMaterial(name)
        : undefined
    );
    try {
      await navigator.clipboard.writeText(snippet);
      onCopied(snippet);
    } catch {
      onCopied("");
    }
  }, [name, iconProps, iconColor, iconMotion, onCopied]);

  return (
    <button
      type="button"
      onClick={handleCopyIconSnippet}
      title={name + " \u2014 click to copy JSX"}
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-transparent text-foreground hover:border-border hover:bg-muted/60"
    >
      {/*
        Icon Options is every Material name (~2k cells). Passing `motion` here used to rerun GSAP on
        every control change and stuttered the whole page — motion is shown in Customize + Example.
      */}
      <PrismIcon name={name} {...iconProps} color={iconColor} />
    </button>
  );
});

/**
 * Interactive icon demo + full Material Symbols Rounded name grid (ligature names for
 * {@link PrismIcon}). Served from `/admin/prism/components/prism-icon`.
 * Section layout: Customize (browse icons, color, axes) → Example → Code sample → Icon Options.
 */
export function PrismIconDemo(): JSX.Element {
  const [selectedAppearanceKeys, setSelectedAppearanceKeys] = useState(
    initialIconDemoSelection
  );
  const [exampleIconNames, setExampleIconNames] = useState<string[]>([
    PRISM_ICON_PLAYGROUND_DEFAULT_ICON,
  ]);
  const [lastSelectedIconName, setLastSelectedIconName] = useState<
    string | null
  >(PRISM_ICON_PLAYGROUND_DEFAULT_ICON);
  const [gridFilterQuery, setGridFilterQuery] = useState("");
  const [iconColor, setIconColor] = useState<PartialPrismColorSpec>({
    palette: "default",
    swatchPrimary: "indigo",
    shade: 500,
  });
  const [motionPlaybackOrOff, setMotionPlaybackOrOff] = useState<
    PrismMotionPlaybackMode | null
  >("once");
  const [motionDurationIn, setMotionDurationIn] =
    useState<PrismMotionDurationName>("regular");
  const [motionPresetIn, setMotionPresetIn] =
    useState<PrismIconMotionPreset>("fadeScale");
  const [motionGrow, setMotionGrow] = useState<PrismIconGrowPreset>("small");
  const [motionEntranceRotate, setMotionEntranceRotate] =
    useState<PrismIconEntranceRotatePreset>("none");
  const [motionEaseIn, setMotionEaseIn] =
    useState<PrismMotionEasePreset>("out");
  const [iconMotionDraw, setIconMotionDraw] = useState<"glyph" | "stroke">(
    "glyph"
  );
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
    if (iconMotionDraw === "stroke") {
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
    iconMotionDraw,
  ]);

  const motionOn = motionPlaybackOrOff !== null;
  const entranceTuningOn = motionOn && motionPresetIn === "fadeScale";

  /** Code sample reflects the last icon picked from Browse icons. */
  const snippetSourceName = lastSelectedIconName;

  const currentSampleSnippet = useMemo(() => {
    if (!snippetSourceName) {
      return "// Pick an icon with Browse icons above.";
    }
    return formatPrismIconSnippet(
      snippetSourceName,
      iconProps,
      iconColor,
      iconMotion,
      iconMotion?.draw === "stroke"
        ? lucideStrokeImportNameForMaterial(snippetSourceName)
        : undefined
    );
  }, [snippetSourceName, iconProps, iconColor, iconMotion]);

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

  const addIconByName = useCallback(
    (match: string) => {
      if (!PRISM_MATERIAL_ICONS_ROUND_NAMES.includes(match)) return;
      setLastSelectedIconName(match);
      setExampleIconNames((prev) =>
        prev.includes(match) ? prev : [...prev, match]
      );
      showTransientToast("Added to preview", match);
    },
    [showTransientToast]
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
              <PrismTypography role="overline" size="small" className="block">
                Icon picker
              </PrismTypography>
              <div className="flex min-w-0 flex-col items-start gap-2">
                <PrismIconPicker
                  trigger={
                    <PrismButton
                      type="button"
                      variant="icon"
                      icon={LayoutGrid}
                      label="Browse icons"
                      color={{ palette: "default", swatchPrimary: "indigo" }}
                    />
                  }
                  onIconSelect={(name) => addIconByName(name)}
                />
                {lastSelectedIconName ? (
                  <div className="flex min-w-0 w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <PrismIcon
                      key={`motion-preview:${lastSelectedIconName}:${playgroundMotionPreviewKey(iconMotion)}`}
                      name={lastSelectedIconName}
                      {...iconProps}
                      color={iconColor}
                      motion={iconMotion}
                      lucideStrokeIcon={
                        iconMotion?.draw === "stroke"
                          ? lucideStrokeIconForMaterialName(lastSelectedIconName)
                          : undefined
                      }
                    />
                    <PrismPlaygroundOptionLabel active className="min-w-0 truncate">
                      {lastSelectedIconName}
                    </PrismPlaygroundOptionLabel>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <PrismTypography role="overline" size="small" className="block">
                Icon color
              </PrismTypography>
              <PrismColorPicker
                color={iconColor}
                onColorChange={setIconColor}
                showCopyButton={false}
              />
            </div>

            {ICON_DEMO_OPTION_COLUMNS.map(({ heading, keys }) => (
              <div key={heading} className="min-w-0 space-y-1.5">
                <PrismTypography role="overline" size="small" className="block">
                  {heading}
                </PrismTypography>
                {keys.map((appearanceKey) => (
                  <label
                    key={appearanceKey}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAppearanceKeys.has(appearanceKey)}
                      onChange={() => handleToggleAppearanceKey(appearanceKey)}
                      className="rounded border-input"
                    />
                    <PrismPlaygroundOptionLabel
                      active={selectedAppearanceKeys.has(appearanceKey)}
                    >
                      {ICON_DEMO_DISPLAY_LABEL[appearanceKey]}
                    </PrismPlaygroundOptionLabel>
                  </label>
                ))}
              </div>
            ))}

            </div>

            <div className="border-t border-border" aria-hidden />

            <div className="grid w-full min-w-0 grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-5">
            <fieldset className="min-w-0 space-y-1.5">
              <legend className="mb-2">
                <PrismTypography role="overline" size="small">
                  Animation
                </PrismTypography>
              </legend>
              {ICON_ANIMATION_OPTIONS.map(({ value, label }) => (
                <label
                  key={value === null ? "off" : value}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="prism-icon-animation"
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
              {motionOn ? (
                <div className="mt-4 space-y-1.5 border-t border-border pt-4">
                  <PrismTypography
                    role="overline"
                    size="small"
                    className="block"
                  >
                    Draw
                  </PrismTypography>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="prism-icon-motion-draw"
                      value="glyph"
                      checked={iconMotionDraw === "glyph"}
                      onChange={() => setIconMotionDraw("glyph")}
                      className="border-input"
                    />
                    <PrismPlaygroundOptionLabel
                      active={iconMotionDraw === "glyph"}
                    >
                      glyph
                    </PrismPlaygroundOptionLabel>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="prism-icon-motion-draw"
                      value="stroke"
                      checked={iconMotionDraw === "stroke"}
                      onChange={() => setIconMotionDraw("stroke")}
                      className="border-input"
                    />
                    <PrismPlaygroundOptionLabel
                      active={iconMotionDraw === "stroke"}
                    >
                      lines
                    </PrismPlaygroundOptionLabel>
                  </label>
                </div>
              ) : null}
            </fieldset>

            <fieldset
              className={
                motionOn ? "min-w-0 space-y-1.5" : "min-w-0 space-y-1.5 opacity-40"
              }
            >
              <legend className="mb-2">
                <PrismTypography role="overline" size="small">
                  Duration in
                </PrismTypography>
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
                motionOn ? "min-w-0 space-y-1.5" : "min-w-0 space-y-1.5 opacity-40"
              }
            >
              <legend className="mb-2">
                <PrismTypography role="overline" size="small">
                  Ease
                </PrismTypography>
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
                <PrismTypography role="overline" size="small">
                  Fade
                </PrismTypography>
              </legend>
              {ICON_ENTRANCE_OPTIONS.map(({ value, label }) => (
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
                    name="prism-icon-motion-entrance"
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
                  ? "min-w-0 space-y-4"
                  : "min-w-0 space-y-4 opacity-40"
              }
            >
              <div className="space-y-1.5">
                <legend>
                  <PrismTypography role="overline" size="small" className="block">
                    Grow
                  </PrismTypography>
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
                      <span className="font-mono font-normal">({rangeLabel})</span>
                    </PrismPlaygroundOptionLabel>
                  </label>
                ))}
              </div>

              <div className="space-y-1.5">
                <PrismTypography role="overline" size="small" className="block">
                  Rotate
                </PrismTypography>
                {ICON_ENTRANCE_ROTATE_OPTIONS.map(({ value, label, rangeLabel }) => (
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
                      name="prism-icon-motion-rotate"
                      value={value}
                      checked={motionEntranceRotate === value}
                      onChange={() => setMotionEntranceRotate(value)}
                      disabled={!entranceTuningOn}
                      className="border-input"
                    />
                    <PrismPlaygroundOptionLabel
                      active={motionEntranceRotate === value && entranceTuningOn}
                    >
                      {label}{" "}
                      <span className="font-mono font-normal">({rangeLabel})</span>
                    </PrismPlaygroundOptionLabel>
                  </label>
                ))}
              </div>
            </fieldset>
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
                  key={`motion-preview:${previewName}:${playgroundMotionPreviewKey(iconMotion)}`}
                  name={previewName}
                  {...iconProps}
                  color={iconColor}
                  motion={iconMotion}
                  lucideStrokeIcon={
                    iconMotion?.draw === "stroke"
                      ? lucideStrokeIconForMaterialName(previewName)
                      : undefined
                  }
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
                        name={iconName}
                        iconProps={iconProps}
                        iconColor={iconColor}
                        iconMotion={iconMotion}
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
