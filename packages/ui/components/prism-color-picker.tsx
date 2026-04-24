"use client";

import * as React from "react";
import { ChevronDown, Copy, Palette } from "lucide-react";
import { gsap } from "gsap";
import { cn } from "@utilities";

import {
  approximateRelativeLuminanceFromCssColor,
  clampPrismColorLoopRangeForPicker,
  maxPrismColorLoopRangeForPicker,
  normalizePrismColorSpec,
  PrismColor,
  PRISM_TINTED_SURFACE_MAX_LUMA,
  prismColorSpecToHex,
  type PartialPrismColorSpec,
  type PrismDefaultPaletteShadeKey,
  type PrismSwatchKey,
} from "../styles/prism-color";
import { PrismButton } from "./prism-button";
import {
  prismColorPickerClipboardColorProp,
  swatchPickerDisplayTitle,
} from "./prism-color-picker-clipboard";
import {
  findNearestPaletteSwatchForHex,
  findPaletteSwatchForHex,
  materialShadeLabelDisplay,
  normalizePickerColorToken,
  paletteFamilyDisplayTitle,
  resolvePickerCellHex,
  resolveTriggerForegroundHexadecimal,
  shadeOrderForPalette,
  type MaterialShadeKey,
  type PrismColorPickerSwatch,
  type TailwindNumericShade,
} from "./prism-color-picker-helpers";
import { PrismIcon } from "./prism-icon";
import { PrismTypography } from "./prism-typography";

/** Even padding on all sides of the trigger pill. */
const PRISM_COLOR_PICKER_TRIGGER_PADDING = 10;
/** Matches {@link PrismButton} normal-size flex gap (6 × size scale at `normal`). */
const PRISM_COLOR_PICKER_TRIGGER_GAP = 6;
/** Pill radius: same intent as PrismButton default `baseRadius` when not rectangle / rectangle-rounded. */
const PRISM_COLOR_PICKER_TRIGGER_BORDER_RADIUS_PILL = 9999;
/** Horizontal gap between the trigger and the copy control (pixels). */
const PRISM_COLOR_PICKER_LAYOUT_GAP = 8;
/** Lucide stroke icons on the main trigger (aligned with PrismButton). */
const PRISM_COLOR_PICKER_ICON_SIZE = 22;
/** Copy control icon is ~⅔ of the trigger icon size (rounded). */
const PRISM_COLOR_PICKER_COPY_ICON_SIZE = Math.round(
  (PRISM_COLOR_PICKER_ICON_SIZE * 2) / 3,
);
/**
 * Loop preview pills: same diameter as the Palette/Chevron icons so the trigger row cross-axis
 * is not taller than the closed picker’s normal state (flex `items-center` uses the tallest child).
 */
const PRISM_COLOR_PICKER_LOOP_PILL_PX = PRISM_COLOR_PICKER_ICON_SIZE;

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

const PRISM_COLOR_PICKER_LOOP_SURFACE_MODE: readonly {
  id: "single" | "gradient";
  label: string;
}[] = [
  { id: "single", label: "Single" },
  { id: "gradient", label: "Gradient" },
];

export type PrismColorPickerProps = {
  /**
   * Single controlled model: {@link PartialPrismColorSpec}. Selection is `swatchPrimary` + `shade`
   * (+ `palette`); the resolved CSS color is always {@link prismColorSpecToHex}. Grid columns follow
   * {@link PrismColor.Loop.families} order — `swatchPrimary` does not reorder columns.
   *
   * **ColorLoop surface is self-activating:** the popover always shows Mode + a `0..max` range slider
   * (default `0`). The trigger shows ±range preview pills only when the committed `colorLoop.range > 0`.
   * Clipboard output (see {@link prismColorPickerClipboardColorProp}) emits `colorLoop` only when
   * `range > 0`.
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
  const [loopSurfaceMode, setLoopSurfaceMode] = React.useState<
    "single" | "gradient"
  >("single");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const loopPillsRowRef = React.useRef<HTMLSpanElement>(null);

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

  const pickerLoopRangeMax = React.useMemo(
    () => maxPrismColorLoopRangeForPicker(paletteId),
    [paletteId],
  );

  /**
   * Picker UI default is **0** — a spec without `colorLoop` (or without `range`) reads as 0 in the
   * slider and keeps the trigger pills hidden. We deliberately bypass {@link clampPrismColorLoopRange}
   * here because its library default is `2` (used by {@link PrismCodeBlock}), which would silently
   * activate the loop surface in plain-picker callers.
   */
  const pickerCommittedLoopRange = React.useMemo(() => {
    const r = colorSpec.colorLoop?.range;
    if (r === undefined) return 0;
    return clampPrismColorLoopRangeForPicker(paletteId, r);
  }, [colorSpec.colorLoop?.range, paletteId]);

  /** Trigger pills render only when the committed range resolves to > 0. Popover slider is always live. */
  const hasActiveColorLoop = pickerCommittedLoopRange > 0;

  React.useLayoutEffect(() => {
    const r = colorSpec.colorLoop?.range;
    if (r === undefined) return;
    const capped = clampPrismColorLoopRangeForPicker(paletteId, r);
    if (capped !== r) {
      onColorChange({
        ...colorSpec,
        colorLoop: {
          ...colorSpec.colorLoop,
          range: capped,
        },
      });
    }
  }, [colorSpec, onColorChange, paletteId]);

  const loopCenterFamily = React.useMemo(
    () =>
      normalizedColor.swatchPrimary ??
      PrismColor.Loop.normalize(paletteId, "blue"),
    [normalizedColor.swatchPrimary, paletteId],
  );

  const loopPreviewPaints = React.useMemo(() => {
    if (!hasActiveColorLoop || loopSurfaceMode !== "single") {
      return [] as { offset: number; paint: string; isCenter: boolean }[];
    }
    const shadeKey = normalizedColor.shade;
    const r = pickerCommittedLoopRange;
    const out: { offset: number; paint: string; isCenter: boolean }[] = [];
    for (let o = -r; o <= r; o++) {
      const family =
        o === 0
          ? loopCenterFamily
          : PrismColor.Loop.step(paletteId, loopCenterFamily, o);
      const paint = resolvePickerCellHex(
        paletteId,
        family,
        shadeKey as MaterialShadeKey | TailwindNumericShade,
      );
      if (!paint) continue;
      out.push({ offset: o, paint, isCenter: o === 0 });
    }
    return out;
  }, [
    hasActiveColorLoop,
    loopCenterFamily,
    loopSurfaceMode,
    normalizedColor.shade,
    paletteId,
    pickerCommittedLoopRange,
  ]);

  React.useLayoutEffect(() => {
    if (!hasActiveColorLoop || loopSurfaceMode !== "single") return;
    const root = loopPillsRowRef.current;
    if (!root) return;
    const pills = root.querySelectorAll("[data-loop-pill]");
    if (!pills.length) return;
    gsap.killTweensOf(pills);
    gsap.fromTo(
      pills,
      { opacity: 0, scale: 0.82 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.22,
        stagger: 0.04,
        ease: "power2.out",
      },
    );
  }, [
    hasActiveColorLoop,
    loopPreviewPaints,
    loopSurfaceMode,
    pickerCommittedLoopRange,
  ]);

  const handleColorLoopRangeSlider = React.useCallback(
    (nextRaw: number) => {
      if (disabled) return;
      const r = clampPrismColorLoopRangeForPicker(paletteId, nextRaw);
      onColorChange({
        ...colorSpec,
        colorLoop: {
          ...colorSpec.colorLoop,
          range: r,
        },
      });
    },
    [colorSpec, disabled, onColorChange, paletteId],
  );

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
        ...(colorSpec.colorLoop !== undefined
          ? {
              colorLoop: {
                ...colorSpec.colorLoop,
                range: clampPrismColorLoopRangeForPicker(
                  paletteId,
                  colorSpec.colorLoop?.range,
                ),
              },
            }
          : {}),
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
        ...(colorSpec.colorLoop !== undefined
          ? {
              colorLoop: {
                ...colorSpec.colorLoop,
                range: clampPrismColorLoopRangeForPicker(
                  next,
                  colorSpec.colorLoop?.range,
                ),
              },
            }
          : {}),
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
    padding: PRISM_COLOR_PICKER_TRIGGER_PADDING,
    gap: PRISM_COLOR_PICKER_TRIGGER_GAP,
    borderRadius: PRISM_COLOR_PICKER_TRIGGER_BORDER_RADIUS_PILL,
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className="flex min-w-0 items-stretch"
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
          <span className="inline-flex shrink-0 items-center text-current">
            <Palette
              size={PRISM_COLOR_PICKER_ICON_SIZE}
              strokeWidth={2}
              aria-hidden
            />
          </span>
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5">
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
          {hasActiveColorLoop &&
          loopSurfaceMode === "single" &&
          loopPreviewPaints.length > 0 ? (
            <span
              ref={loopPillsRowRef}
              className="ml-4 inline-flex shrink-0 items-center gap-1 text-current"
              style={{ height: PRISM_COLOR_PICKER_ICON_SIZE }}
              aria-label="ColorLoop ring preview"
            >
              <PrismIcon
                name="360"
                size={PRISM_COLOR_PICKER_ICON_SIZE}
                weight="regular"
                fill="off"
                className="shrink-0 leading-none text-current"
              />
              {loopPreviewPaints.map(({ offset, paint, isCenter }) => (
                <span
                  key={offset}
                  data-loop-pill
                  title={
                    isCenter
                      ? "ColorLoop center (selected)"
                      : `loop offset ${offset > 0 ? "+" : ""}${offset}`
                  }
                  className={cn(
                    "box-border shrink-0 rounded-full border-solid border-white",
                    isCenter ? "border-2" : "border",
                  )}
                  style={{
                    width: PRISM_COLOR_PICKER_LOOP_PILL_PX,
                    height: PRISM_COLOR_PICKER_LOOP_PILL_PX,
                    backgroundColor: paint,
                    boxShadow: isCenter
                      ? "inset 0 0 0 1px rgba(255,255,255,0.95)"
                      : undefined,
                  }}
                />
              ))}
            </span>
          ) : null}
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
          <div className="mb-2">
            <PrismTypography role="overline" size="small" className="mb-1 block">
              Mode
            </PrismTypography>
            <div
              role="radiogroup"
              aria-label="PrismColor surface mode"
              className="grid min-w-[min(100%,14rem)] grid-cols-2 gap-2"
            >
              {PRISM_COLOR_PICKER_LOOP_SURFACE_MODE.map((opt) => {
                const selected = loopSurfaceMode === opt.id;
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
                    onClick={() => setLoopSurfaceMode(opt.id)}
                  />
                );
              })}
            </div>
          </div>
          {loopSurfaceMode === "single" ? (
            <div className="mb-2 min-w-[min(100%,18rem)]">
              <PrismTypography role="overline" size="small" className="mb-1 block">
                ColorLoop range
              </PrismTypography>
              <input
                type="range"
                min={0}
                max={pickerLoopRangeMax}
                value={pickerCommittedLoopRange}
                disabled={disabled}
                onChange={(e) =>
                  handleColorLoopRangeSlider(Number(e.target.value))
                }
                className="mb-1 block h-2 w-full cursor-pointer accent-primary"
              />
              <PrismTypography
                role="label"
                size="small"
                font="mono"
                as="div"
                className="text-muted-foreground"
              >
                {pickerCommittedLoopRange}{" "}
                <span className="font-sans">
                  / {pickerLoopRangeMax}
                </span>
              </PrismTypography>
            </div>
          ) : (
            <div className="mb-2 max-w-sm">
              <PrismTypography
                role="body"
                size="small"
                className="text-muted-foreground"
              >
                Gradient uses the{" "}
                <code className="font-mono text-foreground">gradient</code>{" "}
                field on{" "}
                <code className="font-mono text-foreground">color</code> from
                the parent — not this swatch grid.
              </PrismTypography>
            </div>
          )}
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
