"use client";

import {
  PrismButton,
  PrismCodeBlock,
  PrismColorPicker,
  PrismEmoji,
  PrismEmojiPicker,
  PrismTypography,
  prismColorPickerClipboardColorProp,
  type PartialPrismColorSpec,
  type PrismEmojiAnimationMode,
  type PrismEmojiProps,
  type PrismEmojiSize,
  type PrismEmojiStyle,
} from "@ui";
import { createPortal } from "react-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";

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

const GALLERY_EMOJI = "🌈";

/** Inline demo: cycle copy so the same emoji reads in different sentences. */
const INLINE_TEXT_ROTATE_MS = 5_000;

const INLINE_DEMO_PHRASES = [
  {
    before: "Sunlight through the prism splintered into ",
    after: " across the sheet.",
  },
  {
    before: "The spectrum leaned a little warmer around ",
    after: " at the red end.",
  },
  {
    before: "Chromatic dispersion caught ",
    after: " in a thin white beam.",
  },
  {
    before: "They traced the rainbow and marked ",
    after: " where the bands stacked cleanest.",
  },
] as const;

/** Showcase {@link PrismEmoji} inline across fonts and type scale steps. */
const INLINE_TYPE_DEMOS = [
  {
    id: "body-md-sans",
    caption: "Body · medium · sans",
    font: "sans",
    role: "body",
    size: "medium",
  },
  {
    id: "body-lg-serif",
    caption: "Body · large · serif",
    font: "serif",
    role: "body",
    size: "large",
  },
  {
    id: "body-sm-mono",
    caption: "Body · small · mono",
    font: "mono",
    role: "body",
    size: "small",
  },
  {
    id: "title-md-sans",
    caption: "Title · medium · sans",
    font: "sans",
    role: "title",
    size: "medium",
  },
  {
    id: "headline-sm-serif",
    caption: "Headline · small · serif",
    font: "serif",
    role: "headline",
    size: "small",
  },
  {
    id: "body-lg-mono",
    caption: "Body · large · mono",
    font: "mono",
    role: "body",
    size: "large",
  },
] as const;

function firstGraphemeCluster(s: string): string {
  const t = s.trim();
  if (!t) return "";
  const segmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;
  const first = segmenter ? [...segmenter.segment(t)][0]?.segment : undefined;
  if (first) return first;
  const cp = t.codePointAt(0);
  return cp !== undefined ? String.fromCodePoint(cp) : t;
}

/**
 * Modal overlay that hosts {@link PrismEmojiPicker}.
 *
 * Layout uses inline styles (no Tailwind dependency) and a body-portal so it
 * is unaffected by ancestor containing blocks (`transform`, `filter`,
 * `contain`) and by Tailwind class scanning across the workspace.
 */
function PrismEmojiPickerOverlay({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}): JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      dialogRef.current?.focus({ preventScroll: true });
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [open, mounted, onClose]);

  if (!open || !mounted || typeof document === "undefined") {
    return null;
  }

  const overlay = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        padding: "1rem",
        boxSizing: "border-box",
      }}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close emoji picker"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          border: 0,
          cursor: "default",
          padding: 0,
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Emoji picker"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none"
        style={{
          position: "relative",
          width: "min(40rem, 100%)",
          maxHeight: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <PrismEmojiPicker
          className="h-full min-h-0"
          onEmojiSelect={onSelect}
        />
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

/**
 * Live controls + comparison grid for {@link PrismEmoji}.
 * Layout aligned with {@link PrismIconDemo}.
 */
export function PrismEmojiDemo(): JSX.Element {
  const [emojiInput, setEmojiInput] = useState("🌈");
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
  const [inlinePhraseIndex, setInlinePhraseIndex] = useState(0);

  const emojiTrim = emojiInput.trim();
  const animationDisabled = emojiStyle !== "googleNotoAnimated";

  const previewProps = useMemo<PrismEmojiProps>(() => {
    const base: PrismEmojiProps = {
      emoji: emojiTrim !== "" ? emojiTrim : GALLERY_EMOJI,
      emojiStyle,
      size,
      animationMode,
    };
    if (colorEnabled && emojiColor && Object.keys(emojiColor).length > 0) {
      base.color = emojiColor;
    }
    return base;
  }, [
    emojiTrim,
    emojiStyle,
    size,
    animationMode,
    colorEnabled,
    emojiColor,
  ]);

  const snippet = useMemo(() => formatEmojiSnippet(previewProps), [previewProps]);

  const browseEmojiGlyph = useMemo(() => {
    if (emojiTrim !== "") return firstGraphemeCluster(emojiTrim);
    return GALLERY_EMOJI;
  }, [emojiTrim]);

  useEffect(() => {
    if (INLINE_DEMO_PHRASES.length <= 1) return;
    const id = window.setInterval(() => {
      setInlinePhraseIndex((i) => (i + 1) % INLINE_DEMO_PHRASES.length);
    }, INLINE_TEXT_ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const inlinePhrase = INLINE_DEMO_PHRASES[inlinePhraseIndex];

  return (
    <div className="relative isolate space-y-10">
      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Customize
        </PrismTypography>

        {/* Emoji input row */}
        <form
          className="grid w-full min-w-0 grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-5"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Col 1 — picker */}
          <div className="min-w-0 space-y-3">
            <PrismTypography role="overline" size="small" className="block">
              Emoji
            </PrismTypography>
            <div>
              <PrismButton
                type="button"
                variant="plain"
                paint="monochrome"
                color="blue"
                label={`${browseEmojiGlyph}\u00A0Browse emoji`}
                size="large"
                shape="pill"
                onClick={() => setEmojiPickerOpen(true)}
              />
            </div>
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
          Compare
        </PrismTypography>
        <div className="flex max-w-xl flex-col gap-8">
          {STYLE_OPTIONS.map(({ value, label }) => (
            <div key={value} className="space-y-2">
              <PrismTypography role="overline" size="small" className="block">
                {label}
              </PrismTypography>
              <div className="flex items-center gap-4">
                <PrismEmoji
                  key={`compare-${value}-${previewProps.emoji}-${previewProps.animationMode}`}
                  {...previewProps}
                  emojiStyle={value}
                  size="gigantic"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <PrismTypography role="overline" size="small" className="block">
          Inline in text
        </PrismTypography>
        <div className="flex flex-col gap-6">
          {INLINE_TYPE_DEMOS.map((row) => (
            <div key={row.id} className="space-y-1.5">
              <PrismTypography
                role="label"
                size="small"
                font="mono"
                color={{ semanticText: "muted" }}
                className="block uppercase tracking-wide"
              >
                {row.caption}
              </PrismTypography>
              <PrismTypography
                role={row.role}
                size={row.size}
                font={row.font}
                className="max-w-prose"
              >
                {inlinePhrase.before}
                <PrismEmoji
                  key={`${row.id}-${previewProps.emoji}-${previewProps.emojiStyle}-${previewProps.animationMode}-${inlinePhraseIndex}`}
                  {...previewProps}
                  size="inherit"
                  className="mx-0.5 inline-block align-middle"
                />
                {inlinePhrase.after}
              </PrismTypography>
            </div>
          ))}
        </div>
      </section>

      <PrismEmojiPickerOverlay
        open={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onSelect={(picked) => {
          setEmojiInput(picked);
          setEmojiPickerOpen(false);
        }}
      />
    </div>
  );
}
