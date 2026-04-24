"use client";

import {
  PrismButton,
  PrismCodeBlock,
  PrismColorPicker,
  PrismIcon,
  PrismTypography,
  prismColorPickerClipboardColorProp,
} from "@ui";
import type {
  PartialPrismColorSpec,
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
import type { JSX } from "react";
import { createPortal } from "react-dom";
import iconNames from "./material-icons-round-names.json";

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
  [
    "weightLight",
    "weightThin",
    "weightRegular",
    "weightBold",
    "weightHeavy",
  ],
  ["fillFalse", "fillTrue"],
];

/** Checkbox labels next to each option (matches string tokens in `PrismIcon` props). */
const ICON_DEMO_DISPLAY_LABEL: Record<
  IconDemoAppearanceKey,
  string
> = {
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
  selected: Set<IconDemoAppearanceKey>,
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
  color?: PartialPrismColorSpec,
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
      categorySectionHeading: categorySectionHeadingFromSortKey(categorySortKey),
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
 * Section layout: Customize (add names, color, axes) → Example → Code sample → Icon Options.
 */
export function PrismIconDemo(): JSX.Element {
  const names = iconNames as string[];
  const [selectedAppearanceKeys, setSelectedAppearanceKeys] = useState(
    initialIconDemoSelection,
  );
  const [exampleIconNames, setExampleIconNames] = useState<string[]>([
    "home",
    "star",
    "favorite",
    "settings",
  ]);
  const [addIconDraft, setAddIconDraft] = useState("");
  const [addComboboxFocused, setAddComboboxFocused] = useState(false);
  const addComboboxBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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
    null,
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
      if (addComboboxBlurTimeoutRef.current) {
        clearTimeout(addComboboxBlurTimeoutRef.current);
      }
    },
    [],
  );

  const iconProps = useMemo(
    () => resolveIconDemoProps(selectedAppearanceKeys),
    [selectedAppearanceKeys],
  );

  const sampleIconName = exampleIconNames[0] ?? "home";

  const currentSampleSnippet = useMemo(
    () => formatPrismIconSnippet(sampleIconName, iconProps, iconColor),
    [sampleIconName, iconProps, iconColor],
  );

  const filteredGridIconNames = useMemo(() => {
    const query = gridFilterQuery.trim().toLowerCase();
    if (!query) return names;
    return names.filter((n) => n.toLowerCase().includes(query));
  }, [names, gridFilterQuery]);

  const iconNameSections = useMemo(
    () => buildIconNameSections(filteredGridIconNames),
    [filteredGridIconNames],
  );

  const addIconSuggestions = useMemo(() => {
    const q = addIconDraft.trim().toLowerCase();
    if (q.length === 0) return [];
    return names.filter((n) => n.toLowerCase().includes(q)).slice(0, 50);
  }, [names, addIconDraft]);

  const openAddCombobox = useCallback(() => {
    if (addComboboxBlurTimeoutRef.current) {
      clearTimeout(addComboboxBlurTimeoutRef.current);
      addComboboxBlurTimeoutRef.current = null;
    }
    setAddComboboxFocused(true);
  }, []);

  const scheduleCloseAddCombobox = useCallback(() => {
    if (addComboboxBlurTimeoutRef.current) {
      clearTimeout(addComboboxBlurTimeoutRef.current);
    }
    addComboboxBlurTimeoutRef.current = setTimeout(() => {
      setAddComboboxFocused(false);
      addComboboxBlurTimeoutRef.current = null;
    }, 200);
  }, []);

  const addIconByName = useCallback(
    (match: string) => {
      if (!names.includes(match)) return;
      setExampleIconNames((prev) =>
        prev.includes(match) ? prev : [...prev, match],
      );
      setAddIconDraft("");
      setAddComboboxFocused(false);
      showTransientToast("Added to preview", match);
    },
    [names, showTransientToast],
  );

  const handleToggleAppearanceKey = (key: IconDemoAppearanceKey) => {
    setSelectedAppearanceKeys((previous) => {
      const next = new Set(previous);
      const exclusiveGroup = ICON_DEMO_EXCLUSIVE_KEY_GROUPS.find((g) =>
        g.includes(key),
      );
      if (exclusiveGroup) {
        for (const k of exclusiveGroup) next.delete(k);
      }
      next.add(key);
      return next;
    });
  };

  const handleAddIconToExample = useCallback(() => {
    const raw = addIconDraft.trim();
    const q = raw.toLowerCase();
    if (!q) return;
    const exact = names.find((n) => n.toLowerCase() === q);
    const match = exact ?? names.find((n) => n.toLowerCase().includes(q));
    if (!match) {
      showTransientToast(
        "No matching icon",
        `No ligature name equals or contains "${raw}".`,
      );
      return;
    }
    addIconByName(match);
  }, [addIconDraft, names, addIconByName, showTransientToast]);

  const handleIconCopied = useCallback(
    (snippet: string) => {
      if (!snippet) return;
      showTransientToast("Copied to clipboard", snippet);
    },
    [showTransientToast],
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
      <div className="space-y-10">
        <section className="space-y-4">
          <PrismTypography role="title" size="large" font="sans" as="h2">
            Customize
          </PrismTypography>

          <form
            className="flex max-w-2xl flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddIconToExample();
            }}
          >
            <label className="relative block min-w-48 flex-1 cursor-text space-y-1">
              <PrismTypography role="overline" size="small" className="block">
                Add to preview
              </PrismTypography>
              <input
                id="prism-icon-demo-add-name"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={addComboboxFocused && addIconSuggestions.length > 0}
                aria-controls="prism-icon-add-suggestions"
                value={addIconDraft}
                onChange={(e) => setAddIconDraft(e.target.value)}
                onFocus={openAddCombobox}
                onBlur={scheduleCloseAddCombobox}
                placeholder="Type to search ligature names…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoComplete="off"
              />
              {addComboboxFocused && addIconSuggestions.length > 0 ? (
                <ul
                  id="prism-icon-add-suggestions"
                  role="listbox"
                  className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
                >
                  {addIconSuggestions.map((n) => (
                    <li key={n} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addIconByName(n);
                        }}
                      >
                        {n}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </label>
            <PrismButton
              type="submit"
              variant="plain"
              color="blue"
              label="Add"
              size="small"
              shape="rectangleRounded"
            />
          </form>

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
                        onChange={() => handleToggleAppearanceKey(appearanceKey)}
                        className="rounded border-input"
                      />
                      <PrismTypography
                        role="label"
                        size="medium"
                        tone="muted"
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
            <PrismTypography role="body" size="medium" tone="muted">
              Add at least one icon name in Customize.
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
            tone="muted"
            className="block uppercase"
            font="mono"
          >
            Showing {filteredGridIconNames.length.toLocaleString()} of{" "}
            {names.length.toLocaleString()}
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
              ),
            )}
          </div>
        </section>
      </div>
      {copyToastPortal}
    </>
  );
}
