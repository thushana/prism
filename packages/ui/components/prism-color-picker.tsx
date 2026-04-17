"use client";

import * as React from "react";
import { cn } from "@utilities";

import { colorHexValues, type ColorName } from "../styles/color-values";
import { colorSpectrum } from "../styles/color-spectrum";

const MATERIAL_SHADE_ORDER = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, "a100", "a200", "a400", "a700",
] as const;

type MaterialShadeKey = (typeof MATERIAL_SHADE_ORDER)[number];

export function materialColorDisplayName(colorName: ColorName): string {
  const withSpaces = colorName.replace(/([A-Z])/g, " $1").trim();
  return withSpaces
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeHexString(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return withHash.toLowerCase();
}

function shadeDisplayLabel(shade: MaterialShadeKey): string {
  if (typeof shade === "number") return String(shade);
  return shade.replace("a", "A");
}

export function findMaterialSwatchForHex(
  hex: string
): { colorName: ColorName; shade: MaterialShadeKey; hex: string } | null {
  const normalized = normalizeHexString(hex);
  if (!normalized || normalized.length < 4) return null;
  for (const colorName of colorSpectrum) {
    const shades = colorHexValues[colorName];
    for (const shade of MATERIAL_SHADE_ORDER) {
      const value = shades[shade];
      if (value && normalizeHexString(value) === normalized) {
        return { colorName, shade, hex: value };
      }
    }
  }
  return null;
}

function swatchDescription(
  colorName: ColorName,
  shade: MaterialShadeKey,
  hexNormalized: string
): string {
  return `${materialColorDisplayName(colorName)} ${shadeDisplayLabel(shade)} — ${hexNormalized}`;
}

export type PrismColorPickerProps = {
  label: string;
  selectedColorHex: string;
  onSelectedColorChange: (hex: string) => void;
  id?: string;
  isDisabled?: boolean;
};

export function PrismColorPicker({
  label,
  selectedColorHex,
  onSelectedColorChange,
  id,
  isDisabled = false,
}: PrismColorPickerProps) {
  const generatedId = React.useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const panelId = `${triggerId}-panel`;
  const [isOpen, setIsOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const normalizedSelected = React.useMemo(
    () => normalizeHexString(selectedColorHex),
    [selectedColorHex]
  );

  React.useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = React.useCallback(
    (hex: string) => {
      onSelectedColorChange(hex);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onSelectedColorChange]
  );

  const SWATCH_SIZE = "1.5rem";
  const gridTemplateColumns = `repeat(19, ${SWATCH_SIZE})`;
  const gridAutoRows = SWATCH_SIZE;

  return (
    <div ref={rootRef} className="relative">
      <label
        htmlFor={triggerId}
        className="mb-2 block cursor-pointer text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        disabled={isDisabled}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDisabled && "pointer-events-none opacity-50"
        )}
      >
        <span
          className="size-8 shrink-0 rounded border border-border shadow-sm"
          style={{ backgroundColor: normalizedSelected || "#ccc" }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
          {normalizedSelected || "—"}
        </span>
        <span className="shrink-0 text-muted-foreground" aria-hidden>
          {isOpen ? "▴" : "▾"}
        </span>
      </button>

      {isOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          className="absolute left-0 top-full z-50 mt-1 max-h-[min(70vh,32rem)] overflow-x-auto overflow-y-auto rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div
            className="grid gap-px bg-border p-px"
            style={{ gridTemplateColumns, gridAutoRows }}
          >
            {MATERIAL_SHADE_ORDER.map((shade) =>
              colorSpectrum.map((colorName) => {
                const hex = colorHexValues[colorName][shade];
                if (!hex) {
                  return (
                    <div
                      key={`${colorName}-${String(shade)}`}
                      className="bg-muted/20"
                      aria-hidden
                    />
                  );
                }
                const normalizedHex = normalizeHexString(hex);
                const isSelected = normalizedSelected === normalizedHex;
                const description = swatchDescription(colorName, shade, normalizedHex);
                return (
                  <button
                    key={`${colorName}-${String(shade)}`}
                    type="button"
                    title={description}
                    aria-label={description}
                    style={{ backgroundColor: hex }}
                    onClick={() => handleSelect(hex)}
                    className={cn(
                      "border border-transparent transition-transform hover:z-10 hover:scale-110 hover:border-foreground/40 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                      isSelected && "z-10 ring-2 ring-ring ring-offset-1 ring-offset-background"
                    )}
                  />
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
