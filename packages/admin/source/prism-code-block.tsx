"use client";

import {
  PrismCodeBlock,
  PrismIcon,
  PRISM_DEFAULT_COLOR_LOOP,
  type PrismCodeBlockMode,
  type PrismSwatchKey,
  PrismTypography,
} from "@ui";
import { useLayoutEffect, useMemo, useState } from "react";

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "(none — plain)" },
  { value: "tsx", label: "tsx" },
  { value: "ts", label: "ts" },
  { value: "js", label: "js" },
  { value: "html", label: "html" },
  { value: "markdown", label: "markdown" },
  { value: "css", label: "css" },
  { value: "json", label: "json" },
  { value: "python", label: "python (plain fallback)" },
];

/** Curated snippets (~5–10 lines) per playground language. */
const SAMPLE_BY_LANGUAGE: Record<string, string> = {
  "": `// No language prop → plain monospace (chip shows "code")
const seed = 0xdeadbeef;
type Id = string & { readonly __brand: unique symbol };
const row: Id = "usr_01" as Id;
`,

  tsx: `// TSX: JSX + attributes + strings
<PrismDivider
  spacing="comfortable"
  lineWeight="thin"
  tone="default"
/>
`,

  ts: `// TypeScript: types, keywords, strings
export type User = { id: string; name: string };

export function parseUser(raw: string): User | null {
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
`,

  js: `// JavaScript: export, loops, template literal
/** Sum numeric array */
export function sum(xs) {
  let total = 0;
  for (const x of xs) total += x;
  return total;
}

export const label = \`count: \${total}\`;
`,

  html: `<!-- HTML: tags, attrs, strings -->
<section class="stack" data-testid="hero">
  <h1 class="title">Prism</h1>
  <p id="lead">Code blocks</p>
</section>
`,

  markdown: `# Markdown preview

- **Bold** list item
- *Italic* line

Inline \`code()\` and a [link](/admin).

> Quoted line
`,

  css: `/* Layout tokens */
.panel {
  display: flex;
  gap: 8px;
  padding: 1rem;
  border-radius: 12px;
}

.button:hover {
  opacity: 0.92;
}
`,

  json: `{
  "name": "prism-code-block",
  "version": 1,
  "options": {
    "mode": "card",
    "lineNumbers": true
  },
  "tags": ["ui", "admin"]
}
`,

  python: `# Python: no highlighter in v1 → plain monospace
def greet(name: str) -> str:
    message = f"hello, {name}"
    return message

if __name__ == "__main__":
    print(greet("prism"))
`,
};

const MODE_OPTIONS: { value: PrismCodeBlockMode; label: string }[] = [
  { value: "card", label: "card" },
  { value: "transparent", label: "transparent" },
];

/** Shared box + uniform horizontal padding (`px-4`) for both text inputs and selects. */
const CUSTOMIZER_INPUT_CLASS =
  "box-border h-10 w-full max-w-xs rounded-md border border-input bg-background px-4 py-0 text-sm font-mono leading-10";

const CUSTOMIZER_SELECT_CLASS = `${CUSTOMIZER_INPUT_CLASS} appearance-none pr-10`;

const SYNTAX_COLOR_FAMILY_OPTIONS: { value: PrismSwatchKey; label: string }[] =
  [...PRISM_DEFAULT_COLOR_LOOP].map((value) => ({
    value,
    label: value,
  }));

function randomMaterialColorFamily(): PrismSwatchKey {
  const list = PRISM_DEFAULT_COLOR_LOOP;
  return list[Math.floor(Math.random() * list.length)]!;
}

function randomPlaygroundLanguage(): string {
  const values = LANGUAGE_OPTIONS.map((o) => o.value);
  return values[Math.floor(Math.random() * values.length)]!;
}

/**
 * Admin playground for {@link PrismCodeBlock} — mirrors the customize pattern
 * used by {@link PrismDividerCustomizerPlayground}.
 */
export function PrismCodeBlockDemo(): React.JSX.Element {
  /** SSR-safe defaults; `useLayoutEffect` randomizes language and color before paint. */
  const [language, setLanguage] = useState("tsx");
  const [mode, setMode] = useState<PrismCodeBlockMode>("card");
  const [disableLineNumbers, setDisableLineNumbers] = useState(false);
  const [disableLanguageLabel, setDisableLanguageLabel] = useState(false);
  const [color, setColor] = useState<PrismSwatchKey>("blue");

  useLayoutEffect(() => {
    setColor(randomMaterialColorFamily());
    setLanguage(randomPlaygroundLanguage());
  }, []);
  const [widthInput, setWidthInput] = useState("80");
  const [disableCopyButton, setDisableCopyButton] = useState(false);

  const sampleBody = SAMPLE_BY_LANGUAGE[language] ?? SAMPLE_BY_LANGUAGE[""]!;

  const characterMaxWidth = useMemo(() => {
    const t = widthInput.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? n : 80;
  }, [widthInput]);

  const languageProp = language === "" ? undefined : language;

  const generatedUsage = useMemo(() => {
    const lines: string[] = ["<PrismCodeBlock"];
    lines.push(`  mode="${mode}"`);
    if (language) lines.push(`  language="${language}"`);
    lines.push(`  color={{ swatchPrimary: "${color}" }}`);
    if (characterMaxWidth != null) {
      lines.push(`  characterMaxWidth={${characterMaxWidth}}`);
    }
    if (disableLineNumbers) lines.push("  disableLineNumbers");
    if (disableLanguageLabel) lines.push("  disableLanguageLabel");
    if (disableCopyButton) lines.push("  disableCopyButton");
    lines.push(">");
    lines.push("  {`// Your source string (children: string)`}");
    lines.push("</PrismCodeBlock>");
    return lines.join("\n");
  }, [
    mode,
    language,
    color,
    characterMaxWidth,
    disableLineNumbers,
    disableLanguageLabel,
    disableCopyButton,
  ]);

  return (
    <>
      <div className="mb-6">
        <PrismTypography
          role="title"
          size="large"
          as="h3"
          font="sans"
          className="mb-2 font-bold"
        >
          Customize
        </PrismTypography>
        <PrismTypography
          role="body"
          size="medium"
          font="sans"
          className="mb-4 text-muted-foreground"
        >
          Show code snippets, with code highlighting.
        </PrismTypography>
        <PrismTypography
          role="body"
          size="medium"
          font="sans"
          className="mb-4 text-muted-foreground"
        >
          Pick a Material color family (no shade in the prop—e.g.{" "}
          <span className="font-mono text-foreground">purple</span>). Keywords,
          tags, and braces stay on that ramp; strings sit on the ring{" "}
          <span className="font-mono text-foreground">+1</span> family, properties
          on <span className="font-mono text-foreground">−1</span>, numbers on{" "}
          <span className="font-mono text-foreground">−2</span> (
          <span className="font-mono text-foreground">purple</span> →{" "}
          <span className="font-mono text-foreground">deep-purple</span>,{" "}
          <span className="font-mono text-foreground">pink</span>,{" "}
          <span className="font-mono text-foreground">red</span>) so accents read
          as tonal neighbours, not a single flat hue. Every swatch resolves to{" "}
          <span className="font-mono text-foreground">var(--color-…)</span> in{" "}
          <span className="font-mono text-foreground">colors.css</span>. Card
          wash uses the same family at 50 / 900. Copy uses the literal language
          string for the screen reader label when set.
        </PrismTypography>

        <div className="mb-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="min-w-0">
            <PrismTypography role="overline" size="small" font="sans" className="mb-1 block">
              language
            </PrismTypography>
            <div className="relative max-w-xs">
              <select
                className={CUSTOMIZER_SELECT_CLASS}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <PrismIcon
                name="expand_more"
                size={16}
                weight="regular"
                fill="off"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>
          <div className="min-w-0">
            <PrismTypography role="overline" size="small" font="sans" className="mb-1 block">
              mode
            </PrismTypography>
            <div className="relative max-w-xs">
              <select
                className={CUSTOMIZER_SELECT_CLASS}
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as PrismCodeBlockMode)
                }
              >
                {MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <PrismIcon
                name="expand_more"
                size={16}
                weight="regular"
                fill="off"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>
          <div className="min-w-0">
            <PrismTypography role="overline" size="small" font="sans" className="mb-1 block">
              color
            </PrismTypography>
            <div className="relative max-w-xs">
              <select
                className={CUSTOMIZER_SELECT_CLASS}
                value={color}
                onChange={(e) =>
                  setColor(e.target.value as PrismSwatchKey)
                }
              >
                {SYNTAX_COLOR_FAMILY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <PrismIcon
                name="expand_more"
                size={16}
                weight="regular"
                fill="off"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>
          <div className="min-w-0">
            <PrismTypography role="overline" size="small" font="sans" className="mb-1 block">
              characterMaxWidth
            </PrismTypography>
            <input
              type="text"
              inputMode="numeric"
              placeholder="80 — empty = no clamp"
              value={widthInput}
              onChange={(e) => setWidthInput(e.target.value)}
              className={CUSTOMIZER_INPUT_CLASS}
            />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={disableLineNumbers}
              onChange={() => setDisableLineNumbers((v) => !v)}
              className="rounded border-input"
            />
            <PrismTypography role="label" size="medium" tone="muted" font="mono">
              disableLineNumbers
            </PrismTypography>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={disableLanguageLabel}
              onChange={() => setDisableLanguageLabel((v) => !v)}
              className="rounded border-input"
            />
            <PrismTypography role="label" size="medium" tone="muted" font="mono">
              disableLanguageLabel
            </PrismTypography>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={disableCopyButton}
              onChange={() => setDisableCopyButton((v) => !v)}
              className="rounded border-input"
            />
            <PrismTypography role="label" size="medium" tone="muted" font="mono">
              disableCopyButton
            </PrismTypography>
          </label>
        </div>

        <div className="mb-5">
          <PrismTypography
            role="title"
            size="small"
            as="h2"
            font="sans"
            className="mb-4 font-bold"
          >
            Example
          </PrismTypography>
          <PrismCodeBlock
            className="font-mono"
            mode={mode}
            disableLineNumbers={disableLineNumbers}
            disableLanguageLabel={disableLanguageLabel}
            disableCopyButton={disableCopyButton}
            color={{ swatchPrimary: color }}
            characterMaxWidth={characterMaxWidth}
            language={languageProp}
          >
            {sampleBody}
          </PrismCodeBlock>
        </div>

        <div className="mt-8">
          <PrismTypography
            role="title"
            size="small"
            as="h2"
            font="sans"
            className="mb-4 font-bold"
          >
            CodeBlock
          </PrismTypography>
          <PrismCodeBlock
            className="font-mono"
            mode="card"
            disableLineNumbers={false}
            disableLanguageLabel={false}
            color={{ swatchPrimary: "grey" }}
            language="tsx"
          >
            {generatedUsage}
          </PrismCodeBlock>
        </div>
      </div>
    </>
  );
}
