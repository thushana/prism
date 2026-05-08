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
  PrismIconFillMode,
  PrismIconProps,
  PrismIconSizeName,
  PrismIconWeightName,
} from "@ui";
import { LayoutGrid } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { createPortal } from "react-dom";

/** Checkbox keys for the icon admin demo (mutually exclusive within each group). */
type IconDemoAppearanceKey =
  | "sizeSmall"
  | "sizeMedium"
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
  ["sizeSmall", "sizeMedium", "sizeLarge", "sizeHuge", "sizeGigantic"],
  ["weightLight", "weightThin", "weightRegular", "weightBold", "weightHeavy"],
  ["fillFalse", "fillTrue"],
];

/** Checkbox labels next to each option (matches string tokens in `PrismIcon` props). */
const ICON_DEMO_DISPLAY_LABEL: Record<IconDemoAppearanceKey, string> = {
  sizeSmall: "small",
  sizeMedium: "medium",
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
    keys: ["sizeSmall", "sizeMedium", "sizeLarge", "sizeHuge", "sizeGigantic"],
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
    "sizeMedium",
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
          : "medium";
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
  if (size === undefined) return 'size="medium"';
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

function formatPrismIconSnippet(
  name: string,
  props: Pick<PrismIconProps, "size" | "weight" | "fill">,
  color?: PartialPrismColorSpec
): string {
  const lines = [
    "<PrismIcon",
    `  name="${escapeIconNameForJsxAttribute(name)}"`,
    `  ${formatSizeAttributeForSnippet(props.size)}`,
    `  ${formatWeightAttributeForSnippet(props.weight)}`,
    `  fill="${fillModeForSnippet(props.fill)}"`,
  ];
  if (color && Object.keys(color).length > 0) {
    for (const line of prismColorPickerClipboardColorProp(color).split("\n")) {
      lines.push(`  ${line}`);
    }
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

function buildIconNameSections(iconNameList: string[]): IconNameSection[] {
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
  onCopied,
}: {
  name: string;
  iconProps: Pick<PrismIconProps, "size" | "weight" | "fill">;
  iconColor?: PartialPrismColorSpec;
  onCopied: (snippet: string) => void;
}) {
  const handleCopyIconSnippet = useCallback(async () => {
    const snippet = formatPrismIconSnippet(name, iconProps, iconColor);
    try {
      await navigator.clipboard.writeText(snippet);
      onCopied(snippet);
    } catch {
      onCopied("");
    }
  }, [name, iconProps, iconColor, onCopied]);

  return (
    <button
      type="button"
      onClick={handleCopyIconSnippet}
      title={name + " \u2014 click to copy JSX"}
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-transparent text-foreground hover:border-border hover:bg-muted/60"
    >
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
  const [exampleIconNames, setExampleIconNames] = useState<string[]>([]);
  const [lastSelectedIconName, setLastSelectedIconName] = useState<
    string | null
  >(null);
  const [gridFilterQuery, setGridFilterQuery] = useState("");
  const [iconColor, setIconColor] = useState<PartialPrismColorSpec>({
    palette: "default",
    swatchPrimary: "indigo",
    shade: 500,
  });
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

  /** Code sample reflects the last icon picked from Browse icons. */
  const snippetSourceName = lastSelectedIconName;

  const currentSampleSnippet = useMemo(() => {
    if (!snippetSourceName) {
      return "// Pick an icon with Browse icons above.";
    }
    return formatPrismIconSnippet(snippetSourceName, iconProps, iconColor);
  }, [snippetSourceName, iconProps, iconColor]);

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
            <PrismTypography role="label" size="medium" className="block">
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

          <div className="max-w-2xl space-y-3">
            <PrismTypography role="overline" size="small" className="block">
              Icon picker
            </PrismTypography>
            <div className="flex flex-wrap items-center gap-3">
              {lastSelectedIconName ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <PrismIcon
                    name={lastSelectedIconName}
                    {...iconProps}
                    color={iconColor}
                  />
                  <PrismTypography role="label" size="medium" font="mono">
                    {lastSelectedIconName}
                  </PrismTypography>
                </div>
              ) : null}
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
            </div>
          </div>

          <div className="max-w-xl space-y-2">
            <PrismTypography role="overline" size="small" className="block">
              Icon color
            </PrismTypography>
            <PrismColorPicker
              color={iconColor}
              onColorChange={setIconColor}
              showCopyButton={false}
            />
          </div>

          <div className="w-full overflow-x-auto pb-1">
            <div className="flex min-w-min flex-row flex-nowrap items-start gap-10">
              {ICON_DEMO_OPTION_COLUMNS.map(({ heading, keys }) => (
                <div key={heading} className="shrink-0 space-y-1">
                  <PrismTypography role="overline" size="small">
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
                        onChange={() =>
                          handleToggleAppearanceKey(appearanceKey)
                        }
                        className="rounded border-input"
                      />
                      <PrismTypography
                        role="label"
                        size="medium"
                        color={{ semanticText: "muted" }}
                        font="mono"
                      >
                        {ICON_DEMO_DISPLAY_LABEL[appearanceKey]}
                      </PrismTypography>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <PrismTypography role="title" size="large" font="sans" as="h2">
            Example
          </PrismTypography>
          {exampleIconNames.length === 0 ? (
            <PrismTypography
              role="body"
              size="medium"
              color={{ semanticText: "muted" }}
            >
              Use Browse icons to add examples.
            </PrismTypography>
          ) : (
            <div className="flex flex-wrap gap-6">
              {exampleIconNames.map((previewName) => (
                <PrismIcon
                  key={previewName}
                  name={previewName}
                  {...iconProps}
                  color={iconColor}
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
          <PrismTypography
            role="label"
            size="medium"
            color={{ semanticText: "muted" }}
            className="block uppercase"
            font="mono"
          >
            Showing {filteredGridIconNames.length.toLocaleString()} of{" "}
            {PRISM_MATERIAL_ICONS_ROUND_NAMES.length.toLocaleString()}
          </PrismTypography>
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
