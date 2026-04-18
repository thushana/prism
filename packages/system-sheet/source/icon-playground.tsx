"use client";

import { PrismIcon, PrismTypography } from "@ui";
import type {
  PrismIconFillMode,
  PrismIconProps,
  PrismIconSizeName,
  PrismIconWeightName,
} from "@ui";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Copy } from "lucide-react";
import iconNames from "./material-icons-round-names.json";

/** Checkbox keys for the icon admin playground (mutually exclusive within each group). */
type IconPlaygroundAppearanceKey =
  | "sizeSmall"
  | "sizeMedium"
  | "sizeLarge"
  | "sizeExtraLarge"
  | "weightThin"
  | "weightMedium"
  | "weightThick"
  | "weightHeavy"
  | "fillFalse"
  | "fillTrue";

const ICON_PLAYGROUND_EXCLUSIVE_KEY_GROUPS: IconPlaygroundAppearanceKey[][] = [
  ["sizeSmall", "sizeMedium", "sizeLarge", "sizeExtraLarge"],
  ["weightThin", "weightMedium", "weightThick", "weightHeavy"],
  ["fillFalse", "fillTrue"],
];

/** Checkbox labels next to each option (matches string tokens in `PrismIcon` props). */
const ICON_PLAYGROUND_DISPLAY_LABEL: Record<
  IconPlaygroundAppearanceKey,
  string
> = {
  sizeSmall: "small",
  sizeMedium: "medium",
  sizeLarge: "large",
  sizeExtraLarge: "extra-large",
  weightThin: "thin",
  weightMedium: "medium",
  weightThick: "thick",
  weightHeavy: "heavy",
  fillFalse: "off",
  fillTrue: "on",
};

const ICON_PLAYGROUND_CUSTOMIZER_COLUMNS: {
  heading: string;
  keys: IconPlaygroundAppearanceKey[];
}[] = [
  {
    heading: "Size",
    keys: ["sizeSmall", "sizeMedium", "sizeLarge", "sizeExtraLarge"],
  },
  {
    heading: "Weight",
    keys: ["weightThin", "weightMedium", "weightThick", "weightHeavy"],
  },
  { heading: "Fill", keys: ["fillFalse", "fillTrue"] },
];

function initialIconPlaygroundSelection(): Set<IconPlaygroundAppearanceKey> {
  return new Set([
    "sizeMedium",
    "weightMedium",
    "fillFalse",
  ] as IconPlaygroundAppearanceKey[]);
}

function resolveIconPlaygroundProps(
  selected: Set<IconPlaygroundAppearanceKey>
): Pick<PrismIconProps, "size" | "weight" | "fill"> {
  const size: PrismIconSizeName = selected.has("sizeExtraLarge")
    ? "extraLarge"
    : selected.has("sizeLarge")
      ? "large"
      : selected.has("sizeSmall")
        ? "small"
        : "medium";
  const weight: PrismIconWeightName = selected.has("weightHeavy")
    ? "heavy"
    : selected.has("weightThick")
      ? "thick"
      : selected.has("weightThin")
        ? "thin"
        : "medium";
  const fill: PrismIconFillMode = selected.has("fillTrue") ? "on" : "off";
  return { size, weight, fill };
}

function escapeIconNameForJsxAttribute(iconName: string): string {
  return iconName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function fillModeForSnippet(fill: PrismIconProps["fill"] | undefined): string {
  if (fill === true || fill === "on") return "on";
  return "off";
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
  if (weight === undefined) return 'weight="medium"';
  if (typeof weight === "number") return "weight={" + weight + "}";
  return 'weight="' + weight + '"';
}

function formatPrismIconSnippet(
  name: string,
  props: Pick<PrismIconProps, "size" | "weight" | "fill">
): string {
  return (
    "<PrismIcon " +
    'name="' +
    escapeIconNameForJsxAttribute(name) +
    '" ' +
    formatSizeAttributeForSnippet(props.size) +
    " " +
    formatWeightAttributeForSnippet(props.weight) +
    ' fill="' +
    fillModeForSnippet(props.fill) +
    '" />'
  );
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
      categorySectionHeading: categorySectionHeadingFromSortKey(categorySortKey),
      iconNameList: names,
    }));
}

const PREVIEW_ICON_NAMES = ["home", "star", "favorite", "settings"] as const;

const IconCell = memo(function IconCell({
  name,
  iconProps,
  onCopied,
}: {
  name: string;
  iconProps: Pick<PrismIconProps, "size" | "weight" | "fill">;
  onCopied: (snippet: string) => void;
}) {
  const handleCopyIconSnippet = useCallback(async () => {
    const snippet = formatPrismIconSnippet(name, iconProps);
    try {
      await navigator.clipboard.writeText(snippet);
      onCopied(snippet);
    } catch {
      onCopied("");
    }
  }, [name, iconProps, onCopied]);

  return (
    <button
      type="button"
      onClick={handleCopyIconSnippet}
      title={name + " \u2014 click to copy JSX"}
      className="flex aspect-square min-h-10 w-full items-center justify-center rounded-md border border-transparent text-foreground hover:border-border hover:bg-muted/60"
    >
      <PrismIcon name={name} {...iconProps} />
    </button>
  );
});

/**
 * Icon customizer + full Material Symbols Rounded name grid (ligature names for
 * {@link PrismIcon}). Used on `/admin/prism/components/prism-icon`.
 */
export function IconCustomizerPlayground() {
  const names = iconNames as string[];
  const [selectedAppearanceKeys, setSelectedAppearanceKeys] = useState(
    initialIconPlaygroundSelection
  );
  const [nameFilterQuery, setNameFilterQuery] = useState("");
  const [copyToast, setCopyToast] = useState<{
    title: string;
    detail?: string;
  } | null>(null);
  const copyToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const showCopyToast = useCallback((detail?: string) => {
    if (copyToastTimeoutRef.current) {
      clearTimeout(copyToastTimeoutRef.current);
    }
    const trimmedDetail =
      detail && detail.length > 88 ? detail.slice(0, 85) + "..." : detail;
    setCopyToast({
      title: "Copied to clipboard",
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
    () => resolveIconPlaygroundProps(selectedAppearanceKeys),
    [selectedAppearanceKeys]
  );

  const currentSampleSnippet = useMemo(
    () => formatPrismIconSnippet("home", iconProps),
    [iconProps]
  );

  const filteredIconNames = useMemo(() => {
    const query = nameFilterQuery.trim().toLowerCase();
    if (!query) return names;
    return names.filter((n) => n.toLowerCase().includes(query));
  }, [names, nameFilterQuery]);

  const iconNameSections = useMemo(
    () => buildIconNameSections(filteredIconNames),
    [filteredIconNames]
  );

  const handleToggleAppearanceKey = (key: IconPlaygroundAppearanceKey) => {
    setSelectedAppearanceKeys((previous) => {
      const next = new Set(previous);
      const exclusiveGroup = ICON_PLAYGROUND_EXCLUSIVE_KEY_GROUPS.find((g) =>
        g.includes(key)
      );
      if (exclusiveGroup) {
        for (const k of exclusiveGroup) next.delete(k);
      }
      next.add(key);
      return next;
    });
  };

  const handleCopySampleSnippet = async () => {
    await navigator.clipboard.writeText(currentSampleSnippet);
    showCopyToast(currentSampleSnippet);
  };

  const handleIconCopied = useCallback(
    (snippet: string) => {
      if (!snippet) return;
      showCopyToast(snippet);
    },
    [showCopyToast]
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
    <div className="mb-8 space-y-16">
      <div>
        <h3 className="mb-2">Customize</h3>
        <PrismTypography
          role="body"
          size="medium"
          color="muted"
          className="mb-4"
        >
          Toggle props to preview them on the strip and in the icon grid. Click
          any icon to copy its JSX.
        </PrismTypography>

        <div className="mb-4 w-full overflow-x-auto pb-1">
          <div className="flex min-w-min flex-row flex-nowrap items-start gap-10">
          {ICON_PLAYGROUND_CUSTOMIZER_COLUMNS.map(({ heading, keys }) => (
            <div key={heading} className="shrink-0 space-y-1">
              <PrismTypography role="overline" size="small">
                {heading}
              </PrismTypography>
              {keys.map((appearanceKey) => (
                <label
                  key={appearanceKey}
                  className="flex cursor-pointer items-center gap-1.5"
                >
                  <input
                    type="checkbox"
                    checked={selectedAppearanceKeys.has(appearanceKey)}
                    onChange={() => handleToggleAppearanceKey(appearanceKey)}
                    className="rounded border-input"
                  />
                  <PrismTypography role="label" size="medium" color="muted">
                    {ICON_PLAYGROUND_DISPLAY_LABEL[appearanceKey]}
                  </PrismTypography>
                </label>
              ))}
            </div>
          ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-6">
          {PREVIEW_ICON_NAMES.map((previewName) => (
            <PrismIcon key={previewName} name={previewName} {...iconProps} />
          ))}
        </div>

        <div className="flex items-center gap-3">
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
            <Copy className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div style={{ paddingTop: "2rem" }}>
        <div className="mb-4">
          <h3>All icon names</h3>
        </div>
        <input
          type="search"
          value={nameFilterQuery}
          onChange={(e) => setNameFilterQuery(e.target.value)}
          placeholder="Filter by name…"
          className="border-input mb-4 max-w-md rounded-md border bg-background px-3 py-2 text-sm"
          aria-label="Filter icons by name"
        />
        <PrismTypography
          role="label"
          size="medium"
          color="muted"
          className="mb-4 block uppercase"
        >
          Showing {filteredIconNames.length.toLocaleString()} of{" "}
          {names.length.toLocaleString()}
        </PrismTypography>
        <div>
          {iconNameSections.map(
            ({ categorySortKey, categorySectionHeading, iconNameList }) => (
              <div
                key={categorySortKey}
                style={{ marginBottom: "2.5rem", paddingTop: "1.25rem" }}
              >
                <PrismTypography
                  role="overline"
                  size="small"
                  className="mb-3 block"
                >
                  {categorySectionHeading}
                </PrismTypography>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(2.5rem, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {iconNameList.map((iconName) => (
                    <IconCell
                      key={iconName}
                      name={iconName}
                      iconProps={iconProps}
                      onCopied={handleIconCopied}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>

    </div>
    {copyToastPortal}
    </>
  );
}
