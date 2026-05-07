"use client";

import {
  PrismButton,
  PrismCodeBlock,
  PrismColorPicker,
  PrismEmoji,
  PrismEmojiPicker,
  PrismTypography,
  buildNotoEmojiRasterUrl,
  emojiToCodepointKey,
  normalizeCodepointSequenceKey,
  prismColorPickerClipboardColorProp,
  type PartialPrismColorSpec,
  type PrismEmojiAnimationMode,
  type PrismEmojiProps,
  type PrismEmojiSize,
  type PrismEmojiStyle,
} from "@ui";
import { useMemo, useRef, useState, type JSX } from "react";

const STYLE_OPTIONS: { value: PrismEmojiStyle; label: string }[] = [
  { value: "native", label: "native" },
  { value: "googleNotoColor", label: "noto — color" },
  { value: "googleNotoAnimated", label: "noto — animated" },
];

const ANIMATION_OPTIONS: { value: PrismEmojiAnimationMode; label: string }[] =
  [
    { value: "loop", label: "loop" },
    { value: "once", label: "once" },
    { value: "hover", label: "hover" },
    { value: "occasionally", label: "occasionally" },
  ];

const SIZE_OPTIONS: PrismEmojiSize[] = [
  "small",
  "medium",
  "large",
  "huge",
  "gigantic",
  "inherit",
];

function escapeForJsxString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatEmojiSnippet(
  props: Pick<
    PrismEmojiProps,
    | "emoji"
    | "codepoint"
    | "emojiStyle"
    | "size"
    | "animationMode"
    | "color"
  >
): string {
  const lines = ["<PrismEmoji"];
  if (props.emoji !== undefined && props.emoji.trim() !== "") {
    lines.push(`  emoji="${escapeForJsxString(props.emoji.trim())}"`);
  }
  if (
    props.codepoint !== undefined &&
    props.codepoint.trim() !== "" &&
    (props.emoji === undefined || props.emoji.trim() === "")
  ) {
    lines.push(`  codepoint="${escapeForJsxString(props.codepoint.trim())}"`);
  }
  if (props.emojiStyle !== "googleNotoColor") {
    lines.push(`  emojiStyle="${props.emojiStyle}"`);
  }
  if (props.animationMode !== undefined && props.animationMode !== "loop") {
    lines.push(`  animationMode="${props.animationMode}"`);
  }
  // inherit is the default — omit when selected
  if (props.size !== undefined && props.size !== "inherit") {
    if (typeof props.size === "number") {
      lines.push(`  size={${props.size}}`);
    } else {
      lines.push(`  size="${props.size}"`);
    }
  }
  if (props.color && Object.keys(props.color).length > 0) {
    const colorBlock = prismColorPickerClipboardColorProp(props.color);
    for (const line of colorBlock.split("\n")) {
      lines.push(`  ${line}`);
    }
  }
  lines.push("/>", "");
  return lines.join("\n");
}

const GALLERY_EMOJI = "🎉";

/**
 * Live controls + comparison grid for {@link PrismEmoji}.
 * Layout aligned with {@link PrismIconDemo}.
 */
export function PrismEmojiDemo(): JSX.Element {
  const [emojiInput, setEmojiInput] = useState("🎉");
  const [codepointInput, setCodepointInput] = useState("");
  const [emojiStyle, setEmojiStyle] =
    useState<PrismEmojiStyle>("googleNotoColor");
  const [animationMode, setAnimationMode] =
    useState<PrismEmojiAnimationMode>("loop");
  const [size, setSize] = useState<PrismEmojiSize>("inherit");
  const [colorEnabled, setColorEnabled] = useState(false);
  const [emojiColor, setEmojiColor] = useState<PartialPrismColorSpec>({
    palette: "default",
    swatchPrimary: "indigo",
    shade: 500,
  });
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const emojiTrim = emojiInput.trim();
  const codeTrim = codepointInput.trim();
  const animationDisabled = emojiStyle !== "googleNotoAnimated";

  const previewProps = useMemo<PrismEmojiProps>(() => {
    const base: PrismEmojiProps = {
      emoji: undefined,
      codepoint: undefined,
      emojiStyle,
      size,
      animationMode,
    };
    if (emojiTrim !== "") base.emoji = emojiTrim;
    else if (codeTrim !== "") base.codepoint = codeTrim;
    else base.emoji = "🎉";
    if (colorEnabled && emojiColor && Object.keys(emojiColor).length > 0) {
      base.color = emojiColor;
    }
    return base;
  }, [
    emojiTrim,
    codeTrim,
    emojiStyle,
    size,
    animationMode,
    colorEnabled,
    emojiColor,
  ]);

  const resolvedKey = useMemo(() => {
    if (emojiTrim !== "") return emojiToCodepointKey(emojiTrim);
    if (codeTrim !== "") return normalizeCodepointSequenceKey(codeTrim);
    return null;
  }, [emojiTrim, codeTrim]);

  const debugDisplayPx =
    size === "inherit"
      ? 24
      : typeof size === "number"
        ? size
        : (
            {
              small: 20,
              medium: 24,
              large: 28,
              huge: 48,
              gigantic: 64,
            } as const
          )[size];

  const pngDebugUrl =
    resolvedKey !== null
      ? buildNotoEmojiRasterUrl(resolvedKey, debugDisplayPx, "png")
      : null;
  const gifDebugUrl =
    resolvedKey !== null
      ? buildNotoEmojiRasterUrl(resolvedKey, debugDisplayPx, "gif")
      : null;
  const webpDebugUrl =
    resolvedKey !== null
      ? buildNotoEmojiRasterUrl(resolvedKey, debugDisplayPx, "webp")
      : null;

  const snippet = useMemo(() => formatEmojiSnippet(previewProps), [previewProps]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Customize
        </PrismTypography>

        {/* Emoji input row */}
        <form
          className="grid w-full min-w-0 grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-5"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Col 1 — character / codepoint */}
          <div className="min-w-0 space-y-3">
            <PrismTypography role="overline" size="small" className="block">
              Emoji
            </PrismTypography>
            <label className="relative block space-y-1">
              <PrismTypography
                role="label"
                size="medium"
                font="mono"
                color={{ semanticText: "muted" }}
              >
                character
              </PrismTypography>
              <input
                type="text"
                value={emojiInput}
                onChange={(e) => setEmojiInput(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="🎉"
                aria-label="Emoji character"
              />
            </label>
            <div className="relative">
              <PrismButton
                type="button"
                variant="plain"
                color="blue"
                label="Browse emoji"
                size="small"
                shape="rectangleRounded"
                onClick={() => setEmojiPickerOpen(true)}
              />
              {emojiPickerOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-9999 cursor-default bg-black/40"
                    aria-label="Close emoji picker"
                    onClick={() => setEmojiPickerOpen(false)}
                  />
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Emoji picker"
                    className="fixed left-1/2 top-4 bottom-4 z-10000 flex max-h-[calc(100vh-2rem)] w-[min(40rem,calc(100vw-2rem))] min-h-0 -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PrismEmojiPicker
                      onEmojiSelect={(picked) => {
                        setEmojiInput(picked);
                        setCodepointInput("");
                        setEmojiPickerOpen(false);
                      }}
                    />
                  </div>
                </>
              ) : null}
            </div>
            <label className="relative block space-y-1">
              <PrismTypography
                role="label"
                size="medium"
                font="mono"
                color={{ semanticText: "muted" }}
              >
                codepoint (if character empty)
              </PrismTypography>
              <input
                type="text"
                value={codepointInput}
                onChange={(e) => setCodepointInput(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="1F389 or 1f600_fe0f"
                aria-label="Codepoint sequence"
              />
            </label>
            <PrismTypography
              role="body"
              size="small"
              color={{ semanticText: "muted" }}
              className="block wrap-break-word"
            >
              Browse opens the full picker (data from{" "}
              <span className="font-mono">@emoji-mart/data</span>). You can also
              type or paste here, or use the OS emoji shortcut (macOS:
              Control+Command+Space; Windows: Win+. ).
            </PrismTypography>
          </div>

          {/* Col 2 — Emoji Style */}
          <fieldset className="min-w-0 space-y-1.5">
            <legend className="mb-2">
              <PrismTypography role="overline" size="small">
                Emoji Style
              </PrismTypography>
            </legend>
            {STYLE_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="prism-emoji-style"
                  value={value}
                  checked={emojiStyle === value}
                  onChange={() => setEmojiStyle(value)}
                  className="border-input"
                />
                <PrismTypography
                  role="label"
                  size="medium"
                  font="mono"
                  color={emojiStyle === value ? undefined : { semanticText: "muted" }}
                  className="wrap-break-word"
                >
                  {label}
                </PrismTypography>
              </label>
            ))}
          </fieldset>

          {/* Col 3 — Size */}
          <fieldset className="min-w-0 space-y-1.5">
            <legend className="mb-2">
              <PrismTypography role="overline" size="small">
                Size
              </PrismTypography>
            </legend>
            {SIZE_OPTIONS.map((value) => (
              <label
                key={String(value)}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="radio"
                  name="prism-emoji-size"
                  value={String(value)}
                  checked={size === value}
                  onChange={() => setSize(value)}
                  className="border-input"
                />
                <PrismTypography
                  role="label"
                  size="medium"
                  font="mono"
                  color={size === value ? undefined : { semanticText: "muted" }}
                  className="wrap-break-word"
                >
                  {String(value)}
                </PrismTypography>
              </label>
            ))}
          </fieldset>

          {/* Col 4 — Color (when enabled, palette duotone is always used) */}
          <fieldset className="min-w-0 space-y-1.5">
            <legend className="mb-2">
              <PrismTypography role="overline" size="small">
                Color
              </PrismTypography>
            </legend>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={colorEnabled}
                onChange={() => setColorEnabled((v) => !v)}
                className="rounded border-input"
              />
              <PrismTypography
                role="label"
                size="medium"
                font="mono"
                color={colorEnabled ? undefined : { semanticText: "muted" }}
                className="wrap-break-word"
              >
                enable (duotone)
              </PrismTypography>
            </label>
            {colorEnabled ? (
              <div className="pt-1">
                <PrismColorPicker
                  color={emojiColor}
                  onColorChange={setEmojiColor}
                  showCopyButton={false}
                />
              </div>
            ) : null}
          </fieldset>

          {/* Col 5 — Animation (disabled for non-animated style) */}
          <fieldset
            className={
              animationDisabled
                ? "min-w-0 space-y-1.5 opacity-40"
                : "min-w-0 space-y-1.5"
            }
          >
            <legend className="mb-2">
              <PrismTypography role="overline" size="small">
                Animation
              </PrismTypography>
            </legend>
            {ANIMATION_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className={
                  animationDisabled
                    ? "flex items-center gap-2 cursor-not-allowed"
                    : "flex cursor-pointer items-center gap-2"
                }
              >
                <input
                  type="radio"
                  name="prism-emoji-animation"
                  value={value}
                  checked={animationMode === value}
                  onChange={() => setAnimationMode(value)}
                  disabled={animationDisabled}
                  className="border-input"
                />
                <PrismTypography
                  role="label"
                  size="medium"
                  font="mono"
                  color={
                    animationMode === value && !animationDisabled
                      ? undefined
                      : { semanticText: "muted" }
                  }
                  className="wrap-break-word"
                >
                  {label}
                </PrismTypography>
              </label>
            ))}
          </fieldset>
        </form>
      </section>

      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Example
        </PrismTypography>
        <div className="flex min-h-20 items-center gap-6 rounded-lg border border-border bg-muted/20 px-6 py-6">
          <PrismEmoji {...previewProps} />
        </div>
        <div className="max-w-3xl space-y-1 rounded-md border border-border bg-muted/30 px-4 py-3 font-mono text-xs text-muted-foreground">
          <div>
            <span className="text-foreground">Resolved CDN key: </span>
            {resolvedKey ?? "(none — check emoji / codepoint)"}
          </div>
          {pngDebugUrl ? (
            <div className="break-all">
              <span className="text-foreground">PNG: </span>
              <a
                href={pngDebugUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {pngDebugUrl}
              </a>
            </div>
          ) : null}
          {gifDebugUrl ? (
            <div className="break-all">
              <span className="text-foreground">GIF: </span>
              <a
                href={gifDebugUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {gifDebugUrl}
              </a>
            </div>
          ) : null}
          {webpDebugUrl ? (
            <div className="break-all">
              <span className="text-foreground">WebP: </span>
              <a
                href={webpDebugUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {webpDebugUrl}
              </a>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Code sample
        </PrismTypography>
        <PrismCodeBlock
          className="font-mono"
          mode="card"
          disableLineNumbers={false}
          disableLanguageLabel={false}
          color={{ swatchPrimary: "grey" }}
          language="tsx"
        >
          {snippet}
        </PrismCodeBlock>
      </section>

      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Compare styles ({GALLERY_EMOJI})
        </PrismTypography>
        <div className="flex max-w-xl flex-col gap-8">
          {STYLE_OPTIONS.map(({ value, label }) => (
            <div key={value} className="space-y-2">
              <PrismTypography role="overline" size="small" className="block">
                {label}
              </PrismTypography>
              <div className="flex items-center gap-4">
                <PrismEmoji emoji={GALLERY_EMOJI} emojiStyle={value} size="huge" />
                <PrismEmoji emoji={GALLERY_EMOJI} emojiStyle={value} size="medium" />
                <PrismEmoji emoji={GALLERY_EMOJI} emojiStyle={value} size="small" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <PrismTypography role="overline" size="small" className="block">
          Inline in body text
        </PrismTypography>
        <PrismTypography role="body" size="medium" className="max-w-prose">
          Launch day went well
          <PrismEmoji
            emoji={GALLERY_EMOJI}
            emojiStyle="googleNotoColor"
            className="mx-0.5 inline-block"
          />
          and the team shipped on time.
        </PrismTypography>
      </section>
    </div>
  );
}
