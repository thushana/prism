"use client";

import {
  PrismCodeBlock,
  PrismTypography,
  type PartialPrismColorSpec,
} from "@ui";
import {
  PrismEmblem,
  type PrismEmblemEmojiLibrary,
  type PrismEmblemMode,
} from "@ui/pickers";
import { useMemo, useState, type JSX } from "react";

const MODE_OPTIONS: PrismEmblemMode[] = ["icon", "emoji", "color"];

const EMOJI_LIBRARY_OPTIONS: {
  id: PrismEmblemEmojiLibrary;
  label: string;
}[] = [
  { id: "native", label: "native" },
  { id: "googleNotoColor", label: "google · color" },
  { id: "googleNotoAnimated", label: "google · animated" },
];

/**
 * Admin playground for {@link PrismEmblem} at `/admin/prism/components/prism-emblem`.
 */
export function PrismEmblemDemo(): JSX.Element {
  const [modes, setModes] = useState<PrismEmblemMode[]>(["icon", "color"]);
  const [emojiLibrary, setEmojiLibrary] =
    useState<PrismEmblemEmojiLibrary>("native");
  const [icon, setIcon] = useState("domain");
  const [emoji, setEmoji] = useState("🏛");
  const [color, setColor] = useState<PartialPrismColorSpec>({
    palette: "default",
    swatchPrimary: "blue",
    shade: 500,
  });

  const showEmoji = modes.includes("emoji");

  const snippet = useMemo(() => {
    const modeList = modes.map((mode) => `"${mode}"`).join(", ");
    const lines = [
      "<PrismEmblem",
      `  modes={[${modeList}]}`,
      `  icon="${icon}"`,
      `  emoji="${emoji}"`,
    ];
    if (showEmoji && emojiLibrary !== "native") {
      lines.push(`  emojiLibrary="${emojiLibrary}"`);
    }
    lines.push(
      '  color={{ palette: "default", swatchPrimary: "blue", shade: 500 }}',
      "  onIconChange={setIcon}",
      "  onEmojiChange={setEmoji}",
      "  onColorChange={setColor}",
      "/>",
      ""
    );
    return lines.join("\n");
  }, [modes, icon, emoji, emojiLibrary, showEmoji]);

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <PrismTypography role="title" size="large" fontWeight={700}>
          PrismEmblem
        </PrismTypography>
        <PrismTypography role="body" color={{ semanticText: "muted" }}>
          One button opens a single tool for glyph (icon and/or emoji) and
          optional color. Pass only the modes each call site needs. Set{" "}
          <code>emojiLibrary</code> at setup to choose the panel’s emoji set.
        </PrismTypography>
      </div>

      <div className="grid gap-3">
        <PrismTypography role="overline" size="small">
          Modes
        </PrismTypography>
        <div className="flex flex-wrap gap-3">
          {MODE_OPTIONS.map((mode) => {
            const checked = modes.includes(mode);
            return (
              <label key={mode} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={checked}
                  onChange={(event) => {
                    setModes((previous) => {
                      if (event.target.checked) {
                        return MODE_OPTIONS.filter(
                          (option) =>
                            option === mode || previous.includes(option)
                        );
                      }
                      return previous.filter((option) => option !== mode);
                    });
                  }}
                />
                <span>{mode}</span>
              </label>
            );
          })}
        </div>
      </div>

      {showEmoji ? (
        <div className="grid gap-3">
          <PrismTypography role="overline" size="small">
            Emoji library
          </PrismTypography>
          <div className="flex flex-wrap gap-3">
            {EMOJI_LIBRARY_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="prism-emblem-emoji-library"
                  className="size-4 border-border"
                  checked={emojiLibrary === option.id}
                  onChange={() => setEmojiLibrary(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <PrismEmblem
        modes={modes}
        icon={icon}
        emoji={emoji}
        color={color}
        emojiLibrary={emojiLibrary}
        onIconChange={setIcon}
        onEmojiChange={setEmoji}
        onColorChange={setColor}
      />

      <PrismCodeBlock>{snippet}</PrismCodeBlock>
    </div>
  );
}
