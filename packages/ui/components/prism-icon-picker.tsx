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
import { PrismIcon } from "./prism-icon";
import {
  PrismPickerPopover,
  usePickerPopupState,
} from "./prism-picker-popover";
import { PrismTypography } from "./prism-typography";

/** All Material Symbols Rounded ligature names shipped for the icon picker. */
export const PRISM_MATERIAL_ICONS_ROUND_NAMES =
  materialIconNames as readonly string[];

const PICKER_GRID_COLUMNS = 8;

export interface PrismIconPickerProps {
  onIconSelect: (name: string) => void;
  /** When set, the panel opens in a Radix popover anchored to this control. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function PrismIconPickerPanel({
  onPick,
  className,
}: {
  onPick: (name: string) => void;
  className?: string;
}): JSX.Element {
  const [search, setSearch] = useState("");

  const filteredNames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PRISM_MATERIAL_ICONS_ROUND_NAMES;
    return PRISM_MATERIAL_ICONS_ROUND_NAMES.filter((n) =>
      n.toLowerCase().includes(q)
    );
  }, [search]);

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
            {filteredNames.map((name) => (
              <button
                key={name}
                type="button"
                role="gridcell"
                title={name}
                className="flex aspect-square min-h-14 w-full items-center justify-center rounded-lg border border-transparent p-1 hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onPick(name)}
              >
                <PrismIcon name={name} size="medium" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Browse Material Symbols Rounded ligature names; optional popover trigger mirrors {@link PrismEmojiPicker}.
 */
export function PrismIconPicker({
  onIconSelect,
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
    <PrismIconPickerPanel onPick={handlePick} className={className} />
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
