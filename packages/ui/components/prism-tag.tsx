"use client";

/**
 * PrismTag: opinionated chip built on {@link PrismButton}.
 * Light fill (100) + strong label (800), no border. In `editable` mode, hover
 * or focus reveals a trailing close control that calls `onRemove`.
 */

import * as React from "react";
import type { PartialPrismColorSpec } from "../styles/prism-color";
import { PrismButton } from "./prism-button";
import { PrismIcon } from "./prism-icon";

/** Match PrismButton small + compact: `round(14 * 0.75 * 0.65)`. */
const TAG_PADDING_RIGHT = 7;
/** Room for the close glyph inside the right padding when revealed. */
const TAG_PADDING_RIGHT_WITH_REMOVE = 18;
const REMOVE_SIZE_PX = 12;

const CHIP_TRANSITION = "padding-right 200ms cubic-bezier(0.4,0,0.2,1)";
const REMOVE_TRANSITION =
  "width 200ms cubic-bezier(0.4,0,0.2,1), opacity 160ms cubic-bezier(0.4,0,0.2,1)";

type PrismTagBaseProps = {
  label: string;
  color?: PartialPrismColorSpec;
  /** Emoji / custom glyph before the label. Wins over `materialSymbol` when set. */
  leadingSlot?: React.ReactNode;
  materialSymbol?: string;
  disabled?: boolean;
  className?: string;
};

export type PrismTagProps = PrismTagBaseProps &
  (
    | { editable?: false; onRemove?: undefined }
    | {
        /** Hover/focus reveals a trailing close control. */
        editable: true;
        onRemove: () => void;
      }
  );

/**
 * Colored label chip. Pass `editable` + `onRemove` for hover/focus-to-dismiss.
 */
export function PrismTag({
  label,
  color,
  leadingSlot,
  materialSymbol,
  editable = false,
  onRemove,
  disabled = false,
  className,
}: PrismTagProps): React.JSX.Element {
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const canRemove = Boolean(editable && onRemove && !disabled);
  const showRemove = canRemove && (hovered || focused);

  const removeControl = canRemove ? (
    <button
      type="button"
      aria-label={`Remove ${label}`}
      disabled={disabled}
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onRemove?.();
      }}
      style={{
        position: "absolute",
        right: 4,
        top: "50%",
        transform: "translateY(-50%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: showRemove ? REMOVE_SIZE_PX : 0,
        opacity: showRemove ? 1 : 0,
        overflow: "hidden",
        padding: 0,
        border: "none",
        background: "transparent",
        color: "inherit",
        cursor: disabled ? "default" : "pointer",
        lineHeight: 0,
        // Keep focusable even when visually collapsed.
        pointerEvents: "auto",
        transition: REMOVE_TRANSITION,
      }}
    >
      <PrismIcon
        name="close"
        size={REMOVE_SIZE_PX}
        weight="regular"
        fill="off"
      />
    </button>
  ) : null;

  return (
    <PrismButton
      asChild
      type="button"
      variant={materialSymbol && !leadingSlot ? "icon" : "plain"}
      shape="rectangleRounded"
      line="none"
      paint="backgroundLight"
      spacing="compact"
      size="small"
      disableGrow
      disableMotion
      disableColorChange
      disableIconMotion
      color={color}
      label={label}
      labelMaxWidth="none"
      materialSymbol={leadingSlot ? undefined : materialSymbol}
      leadingSlot={leadingSlot}
      trailingSlot={removeControl}
      disabled={disabled}
      className={className}
      style={
        canRemove
          ? {
              position: "relative",
              // Always set both states — never clear paddingRight (collapses to 0).
              paddingRight: showRemove
                ? TAG_PADDING_RIGHT_WITH_REMOVE
                : TAG_PADDING_RIGHT,
              transition: CHIP_TRANSITION,
            }
          : undefined
      }
      onPointerEnter={() => {
        if (!disabled) setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    />
  );
}
