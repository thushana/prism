"use client";

import { cn } from "@utilities";
import {
  useCallback,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import type { PartialPrismColorSpec } from "../styles/prism-color";
import { PrismButton } from "./prism-button";
import { PrismColorPicker } from "./prism-color-picker";
import { PrismEmoji, type PrismEmojiStyle } from "./prism-emoji";
import {
  PrismEmojiPicker,
  type PrismEmojiPickerPreview,
} from "./prism-emoji-picker";
import { PrismIcon } from "./prism-icon";
import { PrismIconPicker } from "./prism-icon-picker";
import {
  PICKER_POPOVER_MAX_HEIGHT_CSS,
  PrismPickerPopover,
} from "./prism-picker-popover";
import { PrismTypography } from "./prism-typography";

export type PrismEmblemMode = "icon" | "emoji" | "color";
export type PrismEmblemGlyph = "icon" | "emoji";
/** Emoji render library for the panel + preview. Same values as {@link PrismEmojiPickerPreview}. */
export type PrismEmblemEmojiLibrary = PrismEmojiPickerPreview;

export type PrismEmblemProps = {
  /** Which sections to show inside the single tool. Empty array renders nothing. */
  modes: readonly PrismEmblemMode[];
  icon?: string;
  emoji?: string;
  color?: PartialPrismColorSpec;
  onIconChange?: (icon: string) => void;
  onEmojiChange?: (emoji: string) => void;
  onColorChange?: (color: PartialPrismColorSpec) => void;
  /**
   * When both icon and emoji modes are enabled, which glyph is active.
   * Uncontrolled when omitted (starts as icon if available, else emoji).
   */
  glyph?: PrismEmblemGlyph;
  defaultGlyph?: PrismEmblemGlyph;
  onGlyphChange?: (glyph: PrismEmblemGlyph) => void;
  /**
   * Emoji library for the panel at setup (`native` | `googleNotoColor` |
   * `googleNotoAnimated`). Sets the picker’s initial preview and how the
   * emblem preview renders. Default `native`.
   */
  emojiLibrary?: PrismEmblemEmojiLibrary;
  /** Optional custom trigger. Default is one button with the live emblem preview. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

function emojiLibraryToStyle(
  library: PrismEmblemEmojiLibrary
): PrismEmojiStyle {
  return library;
}

function hasMode(
  modes: readonly PrismEmblemMode[],
  mode: PrismEmblemMode
): boolean {
  return modes.includes(mode);
}

function EmblemPreview({
  glyph,
  icon,
  emoji,
  color,
  emojiStyle,
}: {
  glyph: PrismEmblemGlyph;
  icon: string;
  emoji: string;
  color?: PartialPrismColorSpec;
  emojiStyle: PrismEmojiStyle;
}) {
  if (glyph === "emoji") {
    return (
      <PrismEmoji
        emoji={emoji}
        size="regular"
        emojiStyle={emojiStyle}
        color={color}
      />
    );
  }
  return (
    <PrismIcon
      name={icon}
      size="regular"
      weight="regular"
      fill="off"
      color={color}
    />
  );
}

/**
 * One branding control: a single button that opens a tool for glyph (icon and/or
 * emoji) plus optional color. Import from `@ui/pickers`.
 */
export function PrismEmblem({
  modes,
  icon = "home",
  emoji = "🏛",
  color,
  onIconChange,
  onEmojiChange,
  onColorChange,
  glyph: glyphControlled,
  defaultGlyph,
  onGlyphChange,
  emojiLibrary = "native",
  trigger,
  open: openProp,
  onOpenChange,
  className,
}: PrismEmblemProps): JSX.Element | null {
  const showIcon = hasMode(modes, "icon");
  const showEmoji = hasMode(modes, "emoji");
  const showColor = hasMode(modes, "color");
  const showGlyphToggle = showIcon && showEmoji;
  const emojiStyle = emojiLibraryToStyle(emojiLibrary);

  const initialGlyph: PrismEmblemGlyph =
    defaultGlyph ?? (showIcon ? "icon" : "emoji");
  const [uncontrolledGlyph, setUncontrolledGlyph] =
    useState<PrismEmblemGlyph>(initialGlyph);
  const activeGlyph =
    glyphControlled ??
    (showGlyphToggle ? uncontrolledGlyph : showIcon ? "icon" : "emoji");

  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? Boolean(openProp) : internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (!controlled) setInternalOpen(next);
    },
    [controlled, onOpenChange]
  );

  function setGlyph(next: PrismEmblemGlyph) {
    onGlyphChange?.(next);
    if (glyphControlled === undefined) {
      setUncontrolledGlyph(next);
    }
  }

  /** Caption next to preview — never the emoji character itself (that doubles the glyph). */
  const previewCaption = useMemo(() => {
    if (activeGlyph === "emoji" && showEmoji) return "Emoji";
    return icon;
  }, [activeGlyph, icon, showEmoji]);

  if (!showIcon && !showEmoji && !showColor) {
    return null;
  }

  const preview = (
    <EmblemPreview
      glyph={activeGlyph}
      icon={icon}
      emoji={emoji}
      color={color}
      emojiStyle={emojiStyle}
    />
  );

  const defaultTrigger = (
    <PrismButton
      type="button"
      variant="plain"
      shape="rectangleRounded"
      line="full"
      paint="backgroundNone"
      iconOnly
      label="Choose emblem"
      leadingSlot={preview}
      aria-haspopup="dialog"
      aria-expanded={open}
    />
  );

  const panel = (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden",
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border pb-2">
        {preview}
        <PrismTypography
          role="label"
          size="small"
          color={{ semanticText: "muted" }}
          className="min-w-0 truncate"
        >
          {previewCaption}
        </PrismTypography>
      </div>

      {/* Color first so it stays visible above the tall glyph browser. */}
      {showColor && onColorChange ? (
        <div className="grid shrink-0 gap-2">
          <PrismTypography role="overline" size="small">
            Color
          </PrismTypography>
          <PrismColorPicker
            color={color ?? {}}
            onColorChange={onColorChange}
            shape="rectangleRounded"
          />
        </div>
      ) : null}

      {showGlyphToggle ? (
        <div className="flex shrink-0 gap-1">
          <PrismButton
            type="button"
            variant="plain"
            shape="rectangleRounded"
            line={activeGlyph === "icon" ? "full" : "none"}
            paint={activeGlyph === "icon" ? "background" : "backgroundNone"}
            materialSymbol="category"
            label="Icon"
            onClick={() => setGlyph("icon")}
          />
          <PrismButton
            type="button"
            variant="plain"
            shape="rectangleRounded"
            line={activeGlyph === "emoji" ? "full" : "none"}
            paint={activeGlyph === "emoji" ? "background" : "backgroundNone"}
            materialSymbol="mood"
            label="Emoji"
            onClick={() => setGlyph("emoji")}
          />
        </div>
      ) : null}

      {activeGlyph === "icon" && showIcon && onIconChange ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <PrismIconPicker onIconSelect={onIconChange} />
        </div>
      ) : null}

      {activeGlyph === "emoji" && showEmoji && onEmojiChange ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <PrismEmojiPicker
            onEmojiSelect={onEmojiChange}
            defaultPreview={emojiLibrary}
          />
        </div>
      ) : null}
    </div>
  );

  const showGlyphBrowser =
    (activeGlyph === "icon" && showIcon && Boolean(onIconChange)) ||
    (activeGlyph === "emoji" && showEmoji && Boolean(onEmojiChange));

  return (
    <PrismPickerPopover
      trigger={trigger ?? defaultTrigger}
      open={open}
      onOpenChange={setOpen}
      contentStyle={
        showGlyphBrowser
          ? {
              height: PICKER_POPOVER_MAX_HEIGHT_CSS,
              maxHeight: PICKER_POPOVER_MAX_HEIGHT_CSS,
            }
          : { height: "auto" }
      }
    >
      {panel}
    </PrismPickerPopover>
  );
}
