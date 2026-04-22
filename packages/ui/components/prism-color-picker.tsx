"use client";

import * as React from "react";
import { ChevronDown, Copy, Palette } from "lucide-react";
import { cn } from "@utilities";

import { colorHexValues, type ColorName } from "../styles/color-values";
import {
  normalizePrismColorSpec,
  PrismColor,
  prismDefaultFamilyKebabToColorName,
  type PartialPrismColorSpec,
  type PrismDefaultPaletteShadeKey,
  type PrismPaletteId,
  type PrismSwatchKey,
} from "../styles/prism-color";
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

/** Clipboard text: `Display name / shade / selected token` (third segment is always the current selection). */
export function formatPrismColorPickerClipboardText(
  swatch: PrismColorPickerSwatch | null,
  selectedColorHex: string,
): string {
  const selectedNormalized = normalizePickerColorToken(selectedColorHex);
  if (!swatch) return selectedNormalized || "";
  const title = paletteFamilyDisplayTitle(swatch.palette, swatch.family).toUpperCase();
  const shadePart = materialShadeLabelDisplay(swatch.shade);
  if (!selectedNormalized) {
    return `${title} / ${shadePart}`;
  }
  return `${title} / ${shadePart} / ${selectedNormalized}`;
}

/** Same visible pattern as the trigger: `NAME • shade • token`. */
function swatchPickerDisplayTitle(swatch: PrismColorPickerSwatch): string {
  const normalized = normalizePickerColorToken(swatch.hex);
  return `${paletteFamilyDisplayTitle(swatch.palette, swatch.family).toUpperCase()} • ${materialShadeLabelDisplay(swatch.shade)} • ${normalized}`;
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

/** WCAG relative luminance 0–1 — works for `#rrggbb` inputs only; other syntax falls back to mid gray. */
function relativeLuminanceFromHexadecimal(hexadecimalColor: string): number {
  const rgb = hexadecimalColorToRgbChannels(hexadecimalColor);
  if (!rgb) return 0.5;
  const linearizeChannel = (channel: number) => {
    const x = channel / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const red = linearizeChannel(rgb.red);
  const green = linearizeChannel(rgb.green);
  const blue = linearizeChannel(rgb.blue);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function resolveTriggerForegroundHexadecimal(
  swatchForLabeling: PrismColorPickerSwatch | null,
  triggerBackgroundToken: string,
): string {
  const normalizedBackground =
    normalizeHexadecimalColorString(triggerBackgroundToken) || "#808080";
  const luminance = relativeLuminanceFromHexadecimal(normalizedBackground);

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
  /** Optional field caption; omit when the surrounding layout already describes the control. */
  label?: string;
  selectedColorHex: string;
  onSelectedColorChange: (selectedHexadecimalColor: string) => void;
  /** Palette + future PrismColor fields; only `palette` is read today. */
  color?: PartialPrismColorSpec;
  id?: string;
  disabled?: boolean;
};

export function PrismColorPicker({
  label,
  selectedColorHex,
  onSelectedColorChange,
  color: colorSpec,
  id,
  disabled = false,
}: PrismColorPickerProps) {
  const generatedId = React.useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const panelId = `${triggerId}-panel`;
  const copyControlId = `${triggerId}-copy`;
  const [isOpen, setIsOpen] = React.useState(false);
  const [hoverPreviewHexadecimal, setHoverPreviewHexadecimal] = React.useState<
    string | null
  >(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const paletteId = React.useMemo(
    () => normalizePrismColorSpec(colorSpec).palette,
    [colorSpec?.palette],
  );

  React.useEffect(() => {
    if (!isOpen) setHoverPreviewHexadecimal(null);
  }, [isOpen]);

  /** Committed value (grid selection ring, parent state, clipboard). */
  const normalizedActualSelectedToken = React.useMemo(
    () => normalizePickerColorToken(selectedColorHex),
    [selectedColorHex],
  );

  const selectedSwatchExact = React.useMemo(
    () => findPaletteSwatchForHex(paletteId, selectedColorHex),
    [paletteId, selectedColorHex],
  );

  const nearestSwatchForCommittedSelection = React.useMemo(
    () => findNearestPaletteSwatchForHex(paletteId, selectedColorHex),
    [paletteId, selectedColorHex],
  );

  const swatchForCommittedSelection =
    selectedSwatchExact ?? nearestSwatchForCommittedSelection;

  /** Hover preview drives the trigger until click commits or pointer leaves the swatch grid. */
  const hexadecimalForTriggerFace =
    hoverPreviewHexadecimal ?? selectedColorHex;

  const normalizedTokenForTriggerFace = React.useMemo(
    () => normalizePickerColorToken(hexadecimalForTriggerFace),
    [hexadecimalForTriggerFace],
  );

  const swatchForPresentationOnTriggerFace = React.useMemo(() => {
    const exact = findPaletteSwatchForHex(paletteId, hexadecimalForTriggerFace);
    return (
      exact ?? findNearestPaletteSwatchForHex(paletteId, hexadecimalForTriggerFace)
    );
  }, [paletteId, hexadecimalForTriggerFace]);

  const triggerBackgroundToken =
    normalizedTokenForTriggerFace || "#e5e5e5";
  const triggerForegroundHexadecimal = React.useMemo(
    () =>
      resolveTriggerForegroundHexadecimal(
        swatchForPresentationOnTriggerFace,
        triggerBackgroundToken,
      ),
    [swatchForPresentationOnTriggerFace, triggerBackgroundToken],
  );

  const clipboardColorText = React.useMemo(
    () =>
      formatPrismColorPickerClipboardText(
        swatchForCommittedSelection,
        selectedColorHex,
      ),
    [swatchForCommittedSelection, selectedColorHex],
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
    (swatchHexadecimalColor: string) => {
      setHoverPreviewHexadecimal(null);
      onSelectedColorChange(swatchHexadecimalColor);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onSelectedColorChange],
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
      setHoverPreviewHexadecimal(null);
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
      setHoverPreviewHexadecimal(null);
    },
    [],
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
  const triggerFaceTokenDisplayPart =
    normalizedTokenForTriggerFace || "—";

  const luminanceForRing =
    relativeLuminanceFromHexadecimal(
      normalizeHexadecimalColorString(triggerBackgroundToken) || "#aaaaaa",
    );
  const isDarkBackground =
    Number.isFinite(luminanceForRing) && luminanceForRing < 0.45;

  const triggerInlineStyle: React.CSSProperties = {
    backgroundColor: triggerBackgroundToken,
    color: triggerForegroundHexadecimal,
    padding: `${PRISM_COLOR_PICKER_TRIGGER_PADDING_VERTICAL}px ${PRISM_COLOR_PICKER_TRIGGER_PADDING_HORIZONTAL}px`,
    gap: PRISM_COLOR_PICKER_TRIGGER_GAP,
    borderRadius: PRISM_COLOR_PICKER_TRIGGER_BORDER_RADIUS_PILL,
  };

  return (
    <div ref={rootRef} className="relative">
      {label ? (
        <label htmlFor={triggerId} className="mb-2 block cursor-pointer">
          <PrismTypography role="label" size="small" font="sans" as="span">
            {label}
          </PrismTypography>
        </label>
      ) : null}
      <div
        className="flex items-stretch"
        style={{ gap: PRISM_COLOR_PICKER_LAYOUT_GAP }}
      >
        <button
          ref={triggerRef}
          type="button"
          id={triggerId}
          disabled={disabled}
          aria-label={
            label ? undefined : PRISM_COLOR_PICKER_DEFAULT_TRIGGER_ARIA_LABEL
          }
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
              {` • ${shadeDisplayPart} • ${triggerFaceTokenDisplayPart}`}
            </PrismTypography>
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

        <button
          type="button"
          id={copyControlId}
          disabled={disabled || !clipboardColorText}
          onClick={() => void handleCopyToClipboard()}
          title="Copy name / shade / color"
          aria-label="Copy color name, shade level, and value"
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
      </div>

      {isOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={label ?? panelAriaLabel}
          className="absolute left-0 top-full z-50 mt-1 w-max max-h-[min(70vh,32rem)] max-w-[calc(100vw-1.5rem)] overflow-x-auto overflow-y-auto rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div
            className="grid gap-px bg-border p-px"
            style={{ gridTemplateColumns, gridAutoRows }}
            onPointerLeave={handleSwatchGridPointerLeave}
          >
            {shadeRows.map((shade) =>
              families.map((family) => {
                const swatchHexadecimalColor = resolvePickerCellHex(
                  paletteId,
                  family,
                  shade,
                );
                if (!swatchHexadecimalColor) {
                  return (
                    <div
                      key={`${family}-${String(shade)}`}
                      className="bg-muted/20"
                      aria-hidden
                    />
                  );
                }
                const normalizedSwatchToken =
                  normalizePickerColorToken(swatchHexadecimalColor);
                const isSelected =
                  normalizedActualSelectedToken === normalizedSwatchToken;
                const pickerDisplayTitle = swatchPickerDisplayTitle({
                  palette: paletteId,
                  family,
                  shade: shade as PrismColorPickerSwatch["shade"],
                  hex: swatchHexadecimalColor,
                });
                return (
                  <button
                    key={`${family}-${String(shade)}`}
                    type="button"
                    title={pickerDisplayTitle}
                    aria-label={pickerDisplayTitle}
                    style={{ backgroundColor: swatchHexadecimalColor }}
                    onPointerEnter={() =>
                      setHoverPreviewHexadecimal(swatchHexadecimalColor)
                    }
                    onFocus={() =>
                      setHoverPreviewHexadecimal(swatchHexadecimalColor)
                    }
                    onBlur={handleSwatchButtonBlur}
                    onClick={() =>
                      handleSelectSwatch(swatchHexadecimalColor)
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
