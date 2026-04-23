"use client";

import * as React from "react";
import { ChevronDown, Copy, Palette } from "lucide-react";
import { cn } from "@utilities";

import { colorHexValues, type ColorName } from "../styles/color-values";
import {
  approximateRelativeLuminanceFromCssColor,
  normalizePrismColorSpec,
  PrismColor,
  PRISM_TINTED_SURFACE_MAX_LUMA,
  prismColorSpecToHex,
  prismDefaultFamilyKebabToColorName,
  type PartialPrismColorSpec,
  type PrismDefaultPaletteShadeKey,
  type PrismPaletteId,
  type PrismSwatchKey,
} from "../styles/prism-color";
import { PrismButton } from "./prism-button";
import { PrismTypography } from "./prism-typography";

/** Matches {@link PrismButton} normal-size vertical padding (`BASE_PADDING_VERTICAL`). */
const PRISM_COLOR_PICKER_TRIGGER_PADDING_VERTICAL = 8;
/** Matches {@link PrismButton} normal-size horizontal padding (`BASE_PADDING_HORIZONTAL`). */
const PRISM_COLOR_PICKER_TRIGGER_PADDING_HORIZONTAL = 14;
/** Matches {@link PrismButton} normal-size flex gap (6 × size scale at `normal`). */
const PRISM_COLOR_PICKER_TRIGGER_GAP = 6;
/** Pill radius: same intent as PrismButton default `baseRadius` when not rectangle / rectangle-rounded. */
const PRISM_COLOR_PICKER_TRIGGER_BORDER_RADIUS_PILL = 9999;
/** Horizontal gap between the trigger and the copy control (pixels). */
const PRISM_COLOR_PICKER_LAYOUT_GAP = 8;
/** Extra space after the leading palette icon before the title (pixels). */
const PRISM_COLOR_PICKER_TITLE_INSET_AFTER_LEADING_ICON = 6;
/** Lucide stroke icons on the main trigger (aligned with PrismButton). */
const PRISM_COLOR_PICKER_ICON_SIZE = 22;
/** Copy control icon is ~⅔ of the trigger icon size (rounded). */
const PRISM_COLOR_PICKER_COPY_ICON_SIZE = Math.round(
  (PRISM_COLOR_PICKER_ICON_SIZE * 2) / 3,
);

const PRISM_COLOR_PICKER_DEFAULT_TRIGGER_ARIA_LABEL =
  "Select color from palette";

/** Built-in Material vs Tailwind switch (segmented control in the popover). */
const PRISM_COLOR_PICKER_PALETTE_TOGGLE: readonly {
  id: "default" | "tailwind";
  label: string;
}[] = [
  { id: "default", label: "Material" },
  { id: "tailwind", label: "Tailwind" },
];

/** Default (Material) palette: shade row order for the picker grid (includes accent keys). */
export const PRISM_COLOR_PALETTE_MATERIAL_SHADE_ORDER = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, "a100", "a200", "a400", "a700",
] as const;

type MaterialShadeKey =
  (typeof PRISM_COLOR_PALETTE_MATERIAL_SHADE_ORDER)[number];

/** Tailwind palette: numeric shade rows only (50–950, no accents). Matches `tailwind-color-values.ts`. */
export const PRISM_COLOR_PALETTE_TAILWIND_SHADE_ORDER = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

type TailwindNumericShade =
  (typeof PRISM_COLOR_PALETTE_TAILWIND_SHADE_ORDER)[number];

export type PrismColorPickerSwatch = {
  palette: PrismPaletteId;
  family: PrismSwatchKey;
  shade: MaterialShadeKey | TailwindNumericShade;
  hex: string;
};

export function materialColorDisplayName(colorName: ColorName): string {
  const withSpaces = colorName.replace(/([A-Z])/g, " $1").trim();
  return withSpaces
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Display title for a palette family key (Material uses ColorName formatting; Tailwind uses title-case segments). */
export function paletteFamilyDisplayTitle(
  palette: PrismPaletteId,
  familyKebab: PrismSwatchKey,
): string {
  if (palette === "tailwind") {
    return familyKebab.split("-").map(capitalizeWord).join(" ");
  }
  const cn = prismDefaultFamilyKebabToColorName(familyKebab);
  return cn ? materialColorDisplayName(cn) : capitalizeWord(familyKebab);
}

function normalizeHexadecimalColorString(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return withHash.toLowerCase();
}

/** Stable comparison for picker cells (#hex or CSS color strings such as oklch). */
function normalizePickerColorToken(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function materialShadeLabelDisplay(
  shade: MaterialShadeKey | TailwindNumericShade,
): string {
  if (typeof shade === "number") return String(shade);
  return shade.replace("a", "A");
}

function resolvePickerCellHex(
  palette: PrismPaletteId,
  family: PrismSwatchKey,
  shade: MaterialShadeKey | TailwindNumericShade,
): string | null {
  if (palette === "tailwind") {
    if (typeof shade !== "number") return null;
    return PrismColor.hex({ palette: "tailwind", family, shade });
  }
  return PrismColor.hex({
    palette: "default",
    family,
    shade: shade as PrismDefaultPaletteShadeKey,
  });
}

function shadeOrderForPalette(
  palette: PrismPaletteId,
): readonly (MaterialShadeKey | TailwindNumericShade)[] {
  return palette === "tailwind"
    ? PRISM_COLOR_PALETTE_TAILWIND_SHADE_ORDER
    : PRISM_COLOR_PALETTE_MATERIAL_SHADE_ORDER;
}

/**
 * Finds an exact palette swatch whose resolved color string matches `hexadecimalColor`
 * (hex or CSS color syntax such as oklch).
 */
export function findPaletteSwatchForHex(
  palette: PrismPaletteId,
  hexadecimalColor: string,
): PrismColorPickerSwatch | null {
  const normalizedInput = normalizePickerColorToken(hexadecimalColor);
  if (!normalizedInput) return null;

  const families = PrismColor.Loop.families(palette);
  const shades = shadeOrderForPalette(palette);

  for (const shade of shades) {
    for (const family of families) {
      const hex = resolvePickerCellHex(palette, family, shade);
      if (!hex) continue;
      if (normalizePickerColorToken(hex) === normalizedInput) {
        return { palette, family, shade, hex };
      }
    }
  }
  return null;
}

/**
 * Same as {@link findPaletteSwatchForHex} for the default Material palette only (backward compatible shape).
 */
export function findMaterialSwatchForHex(
  hexadecimalColor: string,
): { colorName: ColorName; shade: MaterialShadeKey; hex: string } | null {
  const r = findPaletteSwatchForHex("default", hexadecimalColor);
  if (!r || r.palette !== "default") return null;
  const cn = prismDefaultFamilyKebabToColorName(r.family);
  if (!cn) return null;
  return {
    colorName: cn,
    shade: r.shade as MaterialShadeKey,
    hex: r.hex,
  };
}

/** Swatch used for labels + the resolved CSS token for that face (committed value, hover preview, or cell hex). */
export type PrismColorPickerColorFace = {
  swatch: PrismColorPickerSwatch | null;
  token: string;
};

/** `FAMILY • shade • token` — trigger strip (with token when shown), grid cell titles, tooltips. */
export function prismColorPickerDisplayBullets(
  face: PrismColorPickerColorFace,
): string {
  const t = normalizePickerColorToken(face.token);
  if (!face.swatch) {
    return t || "—";
  }
  const family = paletteFamilyDisplayTitle(
    face.swatch.palette,
    face.swatch.family,
  ).toUpperCase();
  const shade = materialShadeLabelDisplay(face.swatch.shade);
  if (!t) {
    return `${family} • ${shade}`;
  }
  return `${family} • ${shade} • ${t}`;
}

function sanitizeSingleLineJsComment(body: string): string {
  return body.trim().replace(/\s+/g, " ").replace(/\*\//g, "*\\/");
}

/**
 * Clipboard text: a pasteable JSX `color={{ … }}` block (same shape as {@link PartialPrismColorSpec}).
 * Omits `palette` when `"default"`. Trailing `//` comment is {@link prismColorSpecToHex} for that spec
 * (hex or e.g. `oklch(...)` for Tailwind literals).
 */
export function prismColorPickerClipboardColorProp(
  partial: PartialPrismColorSpec | undefined,
): string {
  const n = normalizePrismColorSpec(partial);
  const family =
    n.swatchPrimary ?? PrismColor.Loop.normalize(n.palette, "blue");
  const resolved = sanitizeSingleLineJsComment(prismColorSpecToHex(partial));

  const lines: string[] = ["color={{"];
  if (n.palette !== "default") {
    lines.push(`  palette: ${JSON.stringify(n.palette)},`);
  }
  lines.push(
    `  swatchPrimary: ${JSON.stringify(family)}, // ${resolved || "—"}`,
  );
  const shadeLit =
    typeof n.shade === "string" ? JSON.stringify(n.shade) : String(n.shade);
  lines.push(`  shade: ${shadeLit},`);
  lines.push("}}");
  return lines.join("\n");
}

function swatchPickerDisplayTitle(swatch: PrismColorPickerSwatch): string {
  return prismColorPickerDisplayBullets({ swatch, token: swatch.hex });
}

function hexadecimalColorToRgbChannels(
  hexadecimalColor: string,
): { red: number; green: number; blue: number } | null {
  const normalized = normalizeHexadecimalColorString(hexadecimalColor);
  const compact = normalized.slice(1);
  if (compact.length === 3) {
    return {
      red: parseInt(compact[0]! + compact[0]!, 16),
      green: parseInt(compact[1]! + compact[1]!, 16),
      blue: parseInt(compact[2]! + compact[2]!, 16),
    };
  }
  if (compact.length === 6) {
    return {
      red: parseInt(compact.slice(0, 2), 16),
      green: parseInt(compact.slice(2, 4), 16),
      blue: parseInt(compact.slice(4, 6), 16),
    };
  }
  return null;
}

/**
 * Closest palette swatch in **default Material** space when the value is not exact (RGB distance on #hex cells).
 * Tailwind palette does not implement nearest-match (return null); use exact {@link findPaletteSwatchForHex}.
 */
export function findNearestPaletteSwatchForHex(
  palette: PrismPaletteId,
  hexadecimalColor: string,
): PrismColorPickerSwatch | null {
  const exact = findPaletteSwatchForHex(palette, hexadecimalColor);
  if (exact) return exact;
  if (palette !== "default") return null;

  const targetRgb = hexadecimalColorToRgbChannels(hexadecimalColor);
  if (!targetRgb) return null;

  let bestDistanceSquared = Number.POSITIVE_INFINITY;
  let bestSwatch: PrismColorPickerSwatch | undefined;

  const families = PrismColor.Loop.families("default");
  const shades = shadeOrderForPalette("default");

  for (const shade of shades) {
    for (const family of families) {
      const hex = resolvePickerCellHex("default", family, shade);
      if (!hex) continue;
      const rgb = hexadecimalColorToRgbChannels(hex);
      if (!rgb) continue;
      const distanceSquared =
        (targetRgb.red - rgb.red) ** 2 +
        (targetRgb.green - rgb.green) ** 2 +
        (targetRgb.blue - rgb.blue) ** 2;
      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestSwatch = { palette: "default", family, shade: shade as MaterialShadeKey, hex };
      }
    }
  }

  return bestSwatch ?? null;
}

export function findNearestMaterialSwatchForHexadecimal(
  hexadecimalColor: string,
): { colorName: ColorName; shade: MaterialShadeKey; hex: string } | null {
  const r = findNearestPaletteSwatchForHex("default", hexadecimalColor);
  if (!r) return null;
  const cn = prismDefaultFamilyKebabToColorName(r.family);
  if (!cn) return null;
  return {
    colorName: cn,
    shade: r.shade as MaterialShadeKey,
    hex: r.hex,
  };
}

function resolveTriggerForegroundHexadecimal(
  swatchForLabeling: PrismColorPickerSwatch | null,
  triggerBackgroundToken: string,
): string {
  const normalizedBackground =
    normalizeHexadecimalColorString(triggerBackgroundToken) || "#808080";
  const luminance = PrismColor.relativeLuminanceFromHex(normalizedBackground);

  if (swatchForLabeling && swatchForLabeling.palette === "default") {
    const cn = prismDefaultFamilyKebabToColorName(swatchForLabeling.family);
    if (cn) {
      const shades = colorHexValues[cn];
      if (luminance < 0.45) {
        return shades[100] ?? shades[50] ?? shades.a100 ?? "#ffffff";
      }
      return shades[900] ?? shades[800] ?? shades.a700 ?? "#171717";
    }
  }

  return luminance < 0.45 ? "#ffffff" : "#171717";
}

export type PrismColorPickerProps = {
  /**
   * Single controlled model: {@link PartialPrismColorSpec}. Selection is `swatchPrimary` + `shade`
   * (+ `palette`); the resolved CSS color is always {@link prismColorSpecToHex}. Grid columns follow
   * {@link PrismColor.Loop.families} order — `swatchPrimary` does not reorder columns.
   */
  color: PartialPrismColorSpec;
  onColorChange: (next: PartialPrismColorSpec) => void;
  /**
   * When true, appends ` • {token}` inside the **trigger** (the main closed pill that opens the palette).
   * Copy uses {@link prismColorPickerClipboardColorProp} on the **committed** spec.
   */
  showColorCode?: boolean;
  /** When true, shows the copy control beside the trigger (clipboard: `color={{ … }}` + resolved token comment). */
  showCopyButton?: boolean;
  id?: string;
  disabled?: boolean;
};

export function PrismColorPicker({
  color: colorSpec,
  onColorChange,
  showColorCode = false,
  showCopyButton = false,
  id,
  disabled = false,
}: PrismColorPickerProps) {
  const generatedId = React.useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const panelId = `${triggerId}-panel`;
  const copyControlId = `${triggerId}-copy`;
  const [isOpen, setIsOpen] = React.useState(false);
  const [hoverPreviewPaint, setHoverPreviewPaint] = React.useState<
    string | null
  >(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const normalizedColor = React.useMemo(
    () => normalizePrismColorSpec(colorSpec),
    [colorSpec],
  );
  const paletteId = normalizedColor.palette;

  React.useEffect(() => {
    if (!isOpen) setHoverPreviewPaint(null);
  }, [isOpen]);

  /** Resolved CSS `<color>` from committed `color` (hex, `oklch(...)`, etc.). */
  const resolvedPaintFromSpec = React.useMemo(
    () => prismColorSpecToHex(colorSpec),
    [colorSpec],
  );

  /** Normalized committed paint string (grid selection ring vs cell tokens). */
  const normalizedCommittedPaintToken = React.useMemo(
    () => normalizePickerColorToken(resolvedPaintFromSpec),
    [resolvedPaintFromSpec],
  );

  /** Hover preview drives the trigger until click commits or pointer leaves the swatch grid. */
  const paintOnTriggerFace = hoverPreviewPaint ?? resolvedPaintFromSpec;

  const normalizedPaintOnTrigger = React.useMemo(
    () => normalizePickerColorToken(paintOnTriggerFace),
    [paintOnTriggerFace],
  );

  const swatchForPresentationOnTriggerFace = React.useMemo(() => {
    const exact = findPaletteSwatchForHex(paletteId, paintOnTriggerFace);
    return (
      exact ?? findNearestPaletteSwatchForHex(paletteId, paintOnTriggerFace)
    );
  }, [paletteId, paintOnTriggerFace]);

  const triggerBackgroundToken =
    normalizedPaintOnTrigger || "#e5e5e5";
  const triggerForegroundFallback = React.useMemo(
    () =>
      resolveTriggerForegroundHexadecimal(
        swatchForPresentationOnTriggerFace,
        triggerBackgroundToken,
      ),
    [swatchForPresentationOnTriggerFace, triggerBackgroundToken],
  );

  /**
   * Same rule for default + Tailwind: when the trigger face reads as dark (by approximate luminance),
   * trigger text uses the swatch family at shade 100 — not numeric shade alone (Tailwind vs Material differ).
   */
  const triggerTextColor = React.useMemo(() => {
    const sw = swatchForPresentationOnTriggerFace;
    if (
      sw &&
      approximateRelativeLuminanceFromCssColor(triggerBackgroundToken) <
        PRISM_TINTED_SURFACE_MAX_LUMA
    ) {
      return PrismColor.hex({
        palette: paletteId,
        family: sw.family,
        shade: 100,
      });
    }
    return triggerForegroundFallback;
  }, [
    swatchForPresentationOnTriggerFace,
    paletteId,
    triggerBackgroundToken,
    triggerForegroundFallback,
  ]);

  const clipboardColorText = React.useMemo(
    () => prismColorPickerClipboardColorProp(colorSpec),
    [colorSpec],
  );

  const handleCopyToClipboard = React.useCallback(async () => {
    if (!clipboardColorText || disabled) return;
    try {
      await navigator.clipboard.writeText(clipboardColorText);
    } catch {
      /* ignore */
    }
  }, [clipboardColorText, disabled]);

  React.useEffect(() => {
    if (!isOpen) return;
    function handlePointerDownOutside(event: PointerEvent) {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setIsOpen(false);
    }
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDownOutside);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  const handleSelectSwatch = React.useCallback(
    (
      family: PrismSwatchKey,
      shadeKey: MaterialShadeKey | TailwindNumericShade,
    ) => {
      setHoverPreviewPaint(null);
      const nextFamily = PrismColor.Loop.normalize(paletteId, family);
      onColorChange({
        ...colorSpec,
        palette: paletteId,
        swatchPrimary: nextFamily,
        shade: shadeKey as PrismDefaultPaletteShadeKey,
      });
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [colorSpec, onColorChange, paletteId],
  );

  const handleSwatchGridPointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const relatedTarget = event.relatedTarget;
      if (
        relatedTarget instanceof Node &&
        event.currentTarget.contains(relatedTarget)
      ) {
        return;
      }
      setHoverPreviewPaint(null);
    },
    [],
  );

  const handleSwatchButtonBlur = React.useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      const relatedTarget = event.relatedTarget;
      const grid = event.currentTarget.parentElement;
      if (
        relatedTarget instanceof Node &&
        grid !== null &&
        grid.contains(relatedTarget)
      ) {
        return;
      }
      setHoverPreviewPaint(null);
    },
    [],
  );

  const togglePaletteKey: "default" | "tailwind" =
    paletteId === "tailwind" ? "tailwind" : "default";

  const handlePaletteToggle = React.useCallback(
    (next: "default" | "tailwind") => {
      if (disabled || next === togglePaletteKey) return;
      const prevFam =
        normalizedColor.swatchPrimary ??
        PrismColor.Loop.normalize(paletteId, "blue");
      const family = PrismColor.Loop.normalize(next, prevFam);
      let shade: PrismDefaultPaletteShadeKey =
        colorSpec?.shade ?? normalizedColor.shade;
      if (next === "tailwind" && typeof shade !== "number") {
        shade = 500;
      }
      onColorChange({
        ...colorSpec,
        palette: next,
        swatchPrimary: family,
        shade,
      });
    },
    [
      colorSpec,
      disabled,
      normalizedColor.shade,
      normalizedColor.swatchPrimary,
      onColorChange,
      paletteId,
      togglePaletteKey,
    ],
  );

  const MATERIAL_SWATCH_CELL_SIZE = "1.5rem";
  const families = React.useMemo(
    () => [...PrismColor.Loop.families(paletteId)],
    [paletteId],
  );
  const shadeRows = shadeOrderForPalette(paletteId);
  const gridTemplateColumns = `repeat(${families.length}, ${MATERIAL_SWATCH_CELL_SIZE})`;
  const gridAutoRows = MATERIAL_SWATCH_CELL_SIZE;

  const panelAriaLabel =
    paletteId === "tailwind"
      ? "Tailwind color palette"
      : "Material color palette";

  const familyTitleText = swatchForPresentationOnTriggerFace
    ? paletteFamilyDisplayTitle(
        swatchForPresentationOnTriggerFace.palette,
        swatchForPresentationOnTriggerFace.family,
      ).toUpperCase()
    : "—";
  const shadeDisplayPart = swatchForPresentationOnTriggerFace
    ? materialShadeLabelDisplay(swatchForPresentationOnTriggerFace.shade)
    : "—";

  const isDarkBackground =
    approximateRelativeLuminanceFromCssColor(triggerBackgroundToken) <
    PRISM_TINTED_SURFACE_MAX_LUMA;

  const triggerInlineStyle: React.CSSProperties = {
    backgroundColor: triggerBackgroundToken,
    color: triggerTextColor,
    padding: `${PRISM_COLOR_PICKER_TRIGGER_PADDING_VERTICAL}px ${PRISM_COLOR_PICKER_TRIGGER_PADDING_HORIZONTAL}px`,
    gap: PRISM_COLOR_PICKER_TRIGGER_GAP,
    borderRadius: PRISM_COLOR_PICKER_TRIGGER_BORDER_RADIUS_PILL,
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className="flex items-stretch"
        style={{ gap: PRISM_COLOR_PICKER_LAYOUT_GAP }}
      >
        <button
          ref={triggerRef}
          type="button"
          id={triggerId}
          disabled={disabled}
          aria-label={`${PRISM_COLOR_PICKER_DEFAULT_TRIGGER_ARIA_LABEL}${
            normalizedPaintOnTrigger
              ? `. ${normalizedPaintOnTrigger}`
              : ""
          }`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
          style={triggerInlineStyle}
          className={cn(
            "flex min-w-0 flex-1 items-center text-left shadow-sm",
            isDarkBackground
              ? "ring-1 ring-inset ring-white/20"
              : "ring-1 ring-inset ring-black/12",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <span
            className="inline-flex shrink-0 items-center text-current"
            style={{
              marginRight: PRISM_COLOR_PICKER_TITLE_INSET_AFTER_LEADING_ICON,
            }}
          >
            <Palette
              size={PRISM_COLOR_PICKER_ICON_SIZE}
              strokeWidth={2}
              aria-hidden
            />
          </span>
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1 gap-y-0.5">
            <PrismTypography
              role="body"
              size="small"
              font="sans"
              as="span"
              className="min-w-0 truncate font-bold uppercase tracking-wide text-current"
            >
              {familyTitleText}
            </PrismTypography>
            <PrismTypography
              role="body"
              size="small"
              font="mono"
              as="span"
              className="shrink-0 tracking-tight text-current"
            >
              {` • ${shadeDisplayPart}`}
            </PrismTypography>
            {showColorCode && normalizedPaintOnTrigger ? (
              <PrismTypography
                role="body"
                size="small"
                font="mono"
                as="span"
                className="min-w-0 max-w-[min(12rem,45%)] shrink truncate text-current"
                title={normalizedPaintOnTrigger}
              >
                {` • ${normalizedPaintOnTrigger}`}
              </PrismTypography>
            ) : null}
          </span>
          <ChevronDown
            size={PRISM_COLOR_PICKER_ICON_SIZE}
            strokeWidth={2}
            aria-hidden
            className={cn(
              "shrink-0 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {showCopyButton ? (
          <button
            type="button"
            id={copyControlId}
            disabled={disabled || !clipboardColorText}
            onClick={() => void handleCopyToClipboard()}
            title={clipboardColorText ? `Copy: ${clipboardColorText}` : undefined}
            aria-label={
              clipboardColorText
                ? `Copy ${clipboardColorText}`
                : "Copy color"
            }
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-1 text-muted-foreground shadow-none",
              "transition-colors hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            <Copy
              size={PRISM_COLOR_PICKER_COPY_ICON_SIZE}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={panelAriaLabel}
          className="absolute left-0 top-full z-50 mt-1 w-max max-h-[min(70vh,32rem)] max-w-[calc(100vw-1.5rem)] overflow-x-auto overflow-y-auto rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div
            role="radiogroup"
            aria-label="Palette source"
            className="mb-2 grid min-w-[min(100%,14rem)] grid-cols-2 gap-2"
          >
            {PRISM_COLOR_PICKER_PALETTE_TOGGLE.map((opt) => {
              const selected = togglePaletteKey === opt.id;
              return (
                <PrismButton
                  key={opt.id}
                  color="red"
                  label={opt.label}
                  variant="plain"
                  shape="rectangle"
                  line="bottom"
                  spacing="tight"
                  paint="monochrome"
                  disableGrow
                  toggled={selected}
                  disabled={disabled}
                  onClick={() => handlePaletteToggle(opt.id)}
                />
              );
            })}
          </div>
          <div
            className="grid gap-px bg-border p-px"
            style={{ gridTemplateColumns, gridAutoRows }}
            onPointerLeave={handleSwatchGridPointerLeave}
          >
            {shadeRows.map((shadeKey) =>
              families.map((family) => {
                const cellResolvedPaint = resolvePickerCellHex(
                  paletteId,
                  family,
                  shadeKey,
                );
                if (!cellResolvedPaint) {
                  return (
                    <div
                      key={`${family}-${String(shadeKey)}`}
                      className="bg-muted/20"
                      aria-hidden
                    />
                  );
                }
                const normalizedSwatchToken =
                  normalizePickerColorToken(cellResolvedPaint);
                const isSelected =
                  normalizedCommittedPaintToken === normalizedSwatchToken;
                const pickerDisplayTitle = swatchPickerDisplayTitle({
                  palette: paletteId,
                  family,
                  shade: shadeKey as PrismColorPickerSwatch["shade"],
                  hex: cellResolvedPaint,
                });
                return (
                  <button
                    key={`${family}-${String(shadeKey)}`}
                    type="button"
                    title={pickerDisplayTitle}
                    aria-label={pickerDisplayTitle}
                    style={{ backgroundColor: cellResolvedPaint }}
                    onPointerEnter={() =>
                      setHoverPreviewPaint(cellResolvedPaint)
                    }
                    onFocus={() =>
                      setHoverPreviewPaint(cellResolvedPaint)
                    }
                    onBlur={handleSwatchButtonBlur}
                    onClick={() =>
                      handleSelectSwatch(family, shadeKey)
                    }
                    className={cn(
                      "border border-transparent transition-transform hover:z-10 hover:scale-110 hover:border-foreground/40 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                      isSelected &&
                        "z-10 ring-2 ring-ring ring-offset-1 ring-offset-background",
                    )}
                  />
                );
              }),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
