"use client";

import { cn } from "@utilities";
import {
  useCallback,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import materialIconNames from "../source/material-icons-round-names.json";
import {
  filterMaterialNamesWithLucideMatch,
  resolveLucideIdByName,
} from "../source/prism-icon-lucide-resolve";
import type { PrismIconStyle } from "./prism-icon";
import { PrismIcon } from "./prism-icon";
import {
  PrismPickerPopover,
  usePickerPopupState,
} from "./prism-picker-popover";
import { PrismTypography } from "./prism-typography";

/** All Material Symbols Rounded ligature names shipped for the icon picker. */
export const PRISM_MATERIAL_ICONS_ROUND_NAMES =
  materialIconNames as readonly string[];

/** Picker subset: Material ligatures that also resolve in Lucide. */
const PICKER_LUCIDE_COMPATIBLE_NAMES = filterMaterialNamesWithLucideMatch(
  PRISM_MATERIAL_ICONS_ROUND_NAMES
);

const PICKER_GRID_COLUMNS = 8;

export interface PrismIconPickerProps {
  onIconSelect: (name: string) => void;
  /**
   * `material` — full ligature grid rendered as Material glyphs.
   * `lucide` — ligatures with a Lucide match only; preview uses Lucide ids.
   * @default `"material"`
   */
  iconStyle?: PrismIconStyle;
  /** When set, the panel opens in a Radix popover anchored to this control. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function PrismIconPickerPanel({
  onPick,
  iconStyle = "material",
  className,
}: {
  onPick: (name: string) => void;
  iconStyle?: PrismIconStyle;
  className?: string;
}): JSX.Element {
  const [search, setSearch] = useState("");

  const catalogNames = useMemo(
    () =>
      iconStyle === "lucide"
        ? PICKER_LUCIDE_COMPATIBLE_NAMES
        : PRISM_MATERIAL_ICONS_ROUND_NAMES,
    [iconStyle]
  );

  const filteredNames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogNames;
    return catalogNames.filter((n) => n.toLowerCase().includes(q));
  }, [search, catalogNames]);

  return (
    <div
      className={cn(
        "flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-3 overflow-hidden",
        className
      )}
    >
      <div className="shrink-0">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter ligature name…"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Search icon names"
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground shadow-sm",
            "appearance-none outline-none transition-[color,box-shadow,border-color]",
            "focus:border-ring focus:shadow-none focus:outline-none",
            "focus-visible:border-ring focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          )}
        />
      </div>
      <PrismTypography
        role="label"
        size="small"
        color={{ semanticText: "muted" }}
        className="shrink-0 font-mono uppercase tracking-wide"
      >
        {filteredNames.length.toLocaleString()} icon
        {filteredNames.length === 1 ? "" : "s"}
      </PrismTypography>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-md border border-border bg-muted/20 p-3"
        role="grid"
        aria-label="Icon grid"
      >
        {filteredNames.length === 0 ? (
          <PrismTypography
            role="body"
            size="small"
            color={{ semanticText: "muted" }}
            className="p-3"
          >
            No matching icons.
          </PrismTypography>
        ) : (
          <div
            className="w-full gap-2"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${PICKER_GRID_COLUMNS}, minmax(0, 1fr))`,
            }}
          >
            {filteredNames.map((pickerName) => {
              const lucideId =
                iconStyle === "lucide"
                  ? resolveLucideIdByName(pickerName)
                  : null;
              const displayName =
                iconStyle === "lucide" ? (lucideId ?? pickerName) : pickerName;
              return (
                <button
                  key={pickerName}
                  type="button"
                  role="gridcell"
                  title={displayName}
                  className="flex aspect-square min-h-14 w-full items-center justify-center rounded-lg border border-transparent p-1 hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onPick(pickerName)}
                >
                  <PrismIcon
                    name={displayName}
                    iconStyle={iconStyle}
                    size="regular"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Browse Material Symbols Rounded ligatures (`PRISM_MATERIAL_ICONS_ROUND_NAMES`).
 * `iconStyle="lucide"` limits the grid to ligatures with a Lucide match; `onIconSelect`
 * still receives the **picker ligature** (resolve with `resolveLucideIdByName` when needed).
 */
export function PrismIconPicker({
  onIconSelect,
  iconStyle = "material",
  trigger,
  open,
  onOpenChange,
  className,
}: PrismIconPickerProps): JSX.Element {
  const popup = usePickerPopupState(trigger, open, onOpenChange);

  const handlePick = useCallback(
    (name: string) => {
      onIconSelect(name);
      if (popup.usePopover) popup.close();
    },
    [onIconSelect, popup]
  );

  const panel = (
    <PrismIconPickerPanel
      onPick={handlePick}
      iconStyle={iconStyle}
      className={className}
    />
  );

  if (trigger == null) {
    return panel;
  }

  return (
    <PrismPickerPopover
      trigger={trigger}
      open={popup.open}
      onOpenChange={popup.setOpen}
    >
      {panel}
    </PrismPickerPopover>
  );
}
