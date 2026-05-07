"use client";

import { cn } from "@utilities";
import type { EmojiMartData } from "@emoji-mart/data";
import emojiMartData from "@emoji-mart/data";
import emojiMartEn from "@emoji-mart/data/i18n/en.json";
import { useCallback, useMemo, useState, type JSX } from "react";
import { PrismEmoji, type PrismEmojiStyle } from "./prism-emoji";
import { PrismTypography } from "./prism-typography";

const DATA = emojiMartData as EmojiMartData;

/** Larger than {@link PrismEmoji}’s `gigantic` (64px); numeric `size` is supported on {@link PrismEmoji}. */
const PICKER_GRID_COLUMNS = 5;
const PICKER_CELL_EMOJI_PX = 80;

export type PrismEmojiPickerPreview =
  | "native"
  | "googleNotoColor"
  | "googleNotoAnimated";

export interface PrismEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  /** How grid cells render Noto vs native. Default `native` avoids loading many CDN assets at once. */
  defaultPreview?: PrismEmojiPickerPreview;
  className?: string;
}

function previewToEmojiStyle(preview: PrismEmojiPickerPreview): PrismEmojiStyle {
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

function emojiIdMatchesQuery(data: EmojiMartData, id: string, query: string): boolean {
  const q = query
    .trim()
    .toLowerCase()
    .replace(/:/g, " ");
  if (!q) return true;
  const e = data.emojis[id];
  if (!e) return false;
  const tokens = q.split(/\s+/).filter(Boolean);
  const aliasKeys = Object.entries(data.aliases)
    .filter(([, target]) => target === id)
    .map(([k]) => k);
  const hay = [
    id,
    e.name,
    ...e.keywords,
    ...aliasKeys,
    ...(e.emoticons ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

const PREVIEW_OPTIONS: {
  id: PrismEmojiPickerPreview;
  label: string;
}[] = [
  { id: "native", label: "native" },
  { id: "googleNotoColor", label: "google · color" },
  { id: "googleNotoAnimated", label: "google · animated" },
];

function categoryTitle(categoryId: string): string {
  const cat = emojiMartEn.categories as Record<string, string>;
  return cat[categoryId] ?? categoryId;
}

/**
 * Full emoji browser backed by **`@emoji-mart/data`** (Unicode / emoji-datasource derived;
 * upgrade the package for fresher emoji lists). Supports previewing **native**, **Google Noto
 * color (PNG)**, and **Google Noto animated (GIF)** in grid cells via {@link PrismEmoji}.
 */
export function PrismEmojiPicker({
  onEmojiSelect,
  defaultPreview = "native",
  className,
}: PrismEmojiPickerProps): JSX.Element {
  const [preview, setPreview] = useState<PrismEmojiPickerPreview>(defaultPreview);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(
    () => DATA.categories[0]?.id ?? "people"
  );
  const emojiStyle = previewToEmojiStyle(preview);

  const emojiIds = useMemo(() => {
    const q = search.trim();
    if (q) {
      return Object.keys(DATA.emojis).filter((id) => emojiIdMatchesQuery(DATA, id, q));
    }
    const cat = DATA.categories.find((c) => c.id === activeCategoryId);
    return cat?.emojis ?? [];
  }, [search, activeCategoryId]);

  const handlePick = useCallback(
    (emojiId: string) => {
      const skin = DATA.emojis[emojiId]?.skins[0];
      const char = skin?.native;
      if (char) onEmojiSelect(char);
    },
    [onEmojiSelect]
  );

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden",
        className
      )}
    >
      <div className="shrink-0">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, keyword, or :shortcode:…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className="flex flex-wrap gap-2">
          {PREVIEW_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPreview(id)}
              className={cn(
                "rounded-md border px-2 py-1 font-mono text-sm transition-colors",
                preview === id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {search.trim() === "" ? (
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-border pb-2">
          {DATA.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategoryId(c.id)}
              className={cn(
                "shrink-0 rounded-md border px-2 py-1 font-mono text-xs transition-colors",
                activeCategoryId === c.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted/50"
              )}
            >
              {categoryTitle(c.id)}
            </button>
          ))}
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
                  className="flex aspect-square min-h-22 w-full items-center justify-center rounded-lg border border-transparent p-1.5 hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => handlePick(emojiId)}
                >
                  {char ? (
                    <PrismEmoji
                      emoji={char}
                      emojiStyle={emojiStyle}
                      size={PICKER_CELL_EMOJI_PX}
                      animationMode="loop"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <PrismTypography
        role="body"
        size="small"
        color={{ semanticText: "muted" }}
        className="shrink-0"
      >
        Emoji list from{" "}
        <span className="font-mono">@emoji-mart/data</span> (Emoji Mart / emoji-datasource).
        Animated preview loads GIFs from the Noto CDN — use sparingly on slow networks.
      </PrismTypography>
    </div>
  );
}
