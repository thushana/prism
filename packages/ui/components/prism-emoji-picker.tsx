"use client";

import { cn } from "@utilities";
import type { EmojiMartData } from "@emoji-mart/data";
import emojiMartData from "@emoji-mart/data";
import emojiMartEn from "@emoji-mart/data/i18n/en.json";
import type { LucideIcon } from "lucide-react";
import {
  Clapperboard,
  Dumbbell,
  Flag,
  Leaf,
  MapPin,
  Package,
  Palette,
  Percent,
  Smartphone,
  Smile,
  Utensils,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { PrismButton } from "./prism-button";
import { PrismEmoji, type PrismEmojiStyle } from "./prism-emoji";
import { PrismPickerPopover, usePickerPopupState } from "./prism-picker-popover";
import { PrismTypography } from "./prism-typography";

const DATA = emojiMartData as EmojiMartData;

const ALIASES_BY_TARGET: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const [alias, target] of Object.entries(DATA.aliases)) {
    (out[target] ??= []).push(alias);
  }
  return out;
})();

/** Larger than {@link PrismEmoji}’s `gigantic` (64px); numeric `size` is supported on {@link PrismEmoji}. */
const PICKER_GRID_COLUMNS = 8;
const PICKER_CELL_EMOJI_PX = 48;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  people: Smile,
  nature: Leaf,
  foods: Utensils,
  activity: Dumbbell,
  places: MapPin,
  objects: Package,
  symbols: Percent,
  flags: Flag,
};

function segmentSlot(
  index: number,
  total: number
): "first" | "middle" | "last" | undefined {
  if (total <= 1) return undefined;
  if (index === 0) return "first";
  if (index === total - 1) return "last";
  return "middle";
}

export type PrismEmojiPickerPreview =
  | "native"
  | "googleNotoColor"
  | "googleNotoAnimated";

export interface PrismEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  /** When set, the panel opens in a Radix popover anchored to this control. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** How grid cells render Noto vs native. Default `native` avoids loading many CDN assets at once. */
  defaultPreview?: PrismEmojiPickerPreview;
  className?: string;
}

function previewToEmojiStyle(
  preview: PrismEmojiPickerPreview
): PrismEmojiStyle {
  switch (preview) {
    case "native":
      return "native";
    case "googleNotoColor":
      return "googleNotoColor";
    case "googleNotoAnimated":
      return "googleNotoAnimated";
    default:
      return "native";
  }
}

function emojiIdMatchesQuery(
  data: EmojiMartData,
  id: string,
  query: string
): boolean {
  const q = query.trim().toLowerCase().replace(/:/g, " ");
  if (!q) return true;
  const e = data.emojis[id];
  if (!e) return false;
  const tokens = q.split(/\s+/).filter(Boolean);
  const aliasKeys = ALIASES_BY_TARGET[id] ?? [];
  const hay = [id, e.name, ...e.keywords, ...aliasKeys, ...(e.emoticons ?? [])]
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

const PREVIEW_OPTIONS: {
  id: PrismEmojiPickerPreview;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "native", label: "native", icon: Smartphone },
  { id: "googleNotoColor", label: "google · color", icon: Palette },
  { id: "googleNotoAnimated", label: "google · animated", icon: Clapperboard },
];
const PREVIEW_COUNT = PREVIEW_OPTIONS.length;

function categoryTitle(categoryId: string): string {
  const cat = emojiMartEn.categories as Record<string, string>;
  return cat[categoryId] ?? categoryId;
}

function PrismEmojiPickerPanel({
  defaultPreview,
  onPick,
  className,
}: {
  defaultPreview: PrismEmojiPickerPreview;
  onPick: (emoji: string) => void;
  className?: string;
}): JSX.Element {
  const [preview, setPreview] =
    useState<PrismEmojiPickerPreview>(defaultPreview);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(
    () => DATA.categories[0]?.id ?? "people"
  );
  const emojiStyle = previewToEmojiStyle(preview);
  const catCount = DATA.categories.length;

  const emojiIds = useMemo(() => {
    const q = search.trim();
    if (q) {
      return Object.keys(DATA.emojis).filter((id) =>
        emojiIdMatchesQuery(DATA, id, q)
      );
    }
    const cat = DATA.categories.find((c) => c.id === activeCategoryId);
    return cat?.emojis ?? [];
  }, [search, activeCategoryId]);

  const handlePick = useCallback(
    (emoji: string) => onPick(emoji),
    [onPick]
  );

  return (
    <div
      className={cn(
        "flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-3 overflow-hidden",
        className
      )}
    >
      <div className="shrink-0">
        <input
          type="text"
          role="searchbox"
          enterKeyHint="search"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, keyword, or :shortcode:…"
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground shadow-sm",
            "appearance-none outline-none transition-[color,box-shadow,border-color]",
            "focus:border-ring focus:shadow-none focus:outline-none",
            "focus-visible:border-ring focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          )}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search emojis"
        />
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        <PrismTypography role="overline" size="small" className="block">
          Preview as
        </PrismTypography>
        <div className="flex min-w-0 w-full max-w-full flex-wrap gap-0">
          {PREVIEW_OPTIONS.map(({ id, label, icon: PreviewIcon }, index) => (
            <PrismButton
              key={id}
              type="button"
              label={label}
              variant="icon"
              icon={PreviewIcon}
              line="none"
              gap="none"
              paint="backgroundNone"
              size="medium"
              shape="rectangleRounded"
              color={{ palette: "default", swatchPrimary: "blue" }}
              segmentPosition={segmentSlot(index, PREVIEW_COUNT)}
              toggled={preview === id}
              className="max-w-full shrink min-w-0 normal-case!"
              onClick={() => setPreview(id)}
            />
          ))}
        </div>
      </div>

      {search.trim() === "" ? (
        <div
          className="flex min-h-0 min-w-0 w-full max-w-full shrink-0 flex-nowrap gap-0 overflow-x-auto overscroll-x-contain pb-0.5"
          role="toolbar"
          aria-label="Emoji categories"
        >
          {DATA.categories.map((c, index) => {
            const Icon = CATEGORY_ICONS[c.id] ?? Smile;
            const slot = segmentSlot(index, catCount);
            return (
              <PrismButton
                key={c.id}
                type="button"
                label={categoryTitle(c.id)}
                variant="icon"
                icon={Icon}
                iconOnly
                line="none"
                gap="none"
                paint="backgroundNone"
                size="medium"
                shape="rectangleRounded"
                color={{ palette: "default", swatchPrimary: "blue" }}
                segmentPosition={slot}
                toggled={activeCategoryId === c.id}
                className="shrink-0"
                onClick={() => setActiveCategoryId(c.id)}
              />
            );
          })}
        </div>
      ) : (
        <PrismTypography
          role="body"
          size="small"
          color={{ semanticText: "muted" }}
          className="shrink-0"
        >
          Search results ({emojiIds.length})
        </PrismTypography>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-md border border-border bg-muted/20 p-3"
        role="grid"
        aria-label="Emoji grid"
      >
        {emojiIds.length === 0 ? (
          <PrismTypography
            role="body"
            size="small"
            color={{ semanticText: "muted" }}
            className="p-3"
          >
            No matching emoji.
          </PrismTypography>
        ) : (
          <div
            className="w-full gap-2"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${PICKER_GRID_COLUMNS}, minmax(0, 1fr))`,
            }}
          >
            {emojiIds.map((emojiId) => {
              const skin = DATA.emojis[emojiId]?.skins[0];
              const char = skin?.native ?? "";
              return (
                <button
                  key={emojiId}
                  type="button"
                  role="gridcell"
                  title={DATA.emojis[emojiId]?.name ?? emojiId}
                  className="flex aspect-square min-h-14 w-full items-center justify-center rounded-lg border border-transparent p-1 hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    if (char) handlePick(char);
                  }}
                >
                  {char ? (
                    <PrismEmoji
                      emoji={char}
                      emojiStyle={emojiStyle}
                      size={PICKER_CELL_EMOJI_PX}
                      animationMode="loop"
                      staticAnimatedFallbackMuted={
                        preview === "googleNotoAnimated"
                      }
                    />
                  ) : null}
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
 * Full emoji browser backed by **`@emoji-mart/data`** (Unicode / emoji-datasource derived;
 * upgrade the package for fresher emoji lists). Supports previewing **native**, **Google Noto
 * color (PNG)**, and **Google Noto animated (GIF)** in grid cells via {@link PrismEmoji}.
 *
 * Pass **`trigger`** to open the browser in a floating popover; omit it for an inline panel.
 */
export function PrismEmojiPicker({
  onEmojiSelect,
  trigger,
  open,
  onOpenChange,
  defaultPreview = "native",
  className,
}: PrismEmojiPickerProps): JSX.Element {
  const popup = usePickerPopupState(trigger, open, onOpenChange);

  const handlePick = useCallback(
    (emoji: string) => {
      onEmojiSelect(emoji);
      if (popup.usePopover) popup.close();
    },
    [onEmojiSelect, popup]
  );

  const panel = (
    <PrismEmojiPickerPanel
      defaultPreview={defaultPreview}
      onPick={handlePick}
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
