"use client";

import * as Popover from "@radix-ui/react-popover";
import { cn } from "@utilities";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useState } from "react";

/**
 * Controlled / uncontrolled open state for Radix popovers wrapping picker panels.
 * When `trigger` is absent callers render the panel inline (no popover).
 */
export function usePickerPopupState(
  trigger: ReactNode | undefined,
  openProp: boolean | undefined,
  onOpenChange?: (open: boolean) => void
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined;
  const effectiveOpen = controlled ? openProp : internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (!controlled) setInternalOpen(next);
    },
    [controlled, onOpenChange]
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  return {
    usePopover: trigger != null,
    open: effectiveOpen,
    setOpen,
    close,
  };
}

/** Inline only so Radix `style` merge cannot drop caps; values mirror intended Tailwind scale. */
const PICKER_POPOVER_WIDTH_CSS = "min(32rem, calc(100vw - 1.5rem))";
const PICKER_POPOVER_MAX_HEIGHT_CSS = "min(42rem, calc(100dvh - 2rem))";

/**
 * Width/max-height enforced via inline styles so they can't be defeated by
 * tailwind-merge or Radix. No fixed `height`: panel grows with chrome until it
 * hits the cap; inner grids scroll. Optional `contentStyle` overrides maxHeight only.
 */
const POPOVER_BASE_STYLE: CSSProperties = {
  zIndex: 2147483000,
  boxSizing: "border-box",
  width: PICKER_POPOVER_WIDTH_CSS,
  minWidth: PICKER_POPOVER_WIDTH_CSS,
  maxWidth: PICKER_POPOVER_WIDTH_CSS,
  maxHeight: PICKER_POPOVER_MAX_HEIGHT_CSS,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

const POPOVER_CONTENT_CLASS =
  "rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none";

const POPOVER_FIT_CONTENT_STYLE: CSSProperties = {
  zIndex: 2147483000,
  boxSizing: "border-box",
  width: "max-content",
  minWidth: "auto",
  maxWidth: PICKER_POPOVER_WIDTH_CSS,
  maxHeight: PICKER_POPOVER_MAX_HEIGHT_CSS,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

export function PrismPickerPopover({
  trigger,
  children,
  open,
  onOpenChange,
  contentClassName,
  contentStyle,
  fitContent = false,
}: {
  trigger: ReactNode;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentClassName?: string;
  /** Caller may override only height/maxHeight; width is locked unless `fitContent`. */
  contentStyle?: Pick<CSSProperties, "height" | "maxHeight">;
  /** Shrink popover width to the widest menu item instead of the default picker width. */
  fitContent?: boolean;
}) {
  const mergedStyle: CSSProperties = {
    ...(fitContent ? POPOVER_FIT_CONTENT_STYLE : POPOVER_BASE_STYLE),
    ...(contentStyle ?? {}),
  };
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className={cn(POPOVER_CONTENT_CLASS, contentClassName)}
          style={mergedStyle}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
