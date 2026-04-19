"use client";

import * as React from "react";

import { cn } from "@utilities";

import { PrismIcon } from "./prism-icon";
import { PrismTypography } from "./prism-typography";

// ─── types ───────────────────────────────────────────────────────────────────

/** Panel + wash: `card` = filled Material tint; `transparent` = no panel fill. */
export type PrismCodeBlockMode = "card" | "transparent";

export type PrismCodeBlockHighlightLanguage =
  | "tsx"
  | "ts"
  | "js"
  | "html"
  | "markdown"
  | "css"
  | "json";

/**
 * Material color families that exist in `@ui/styles/colors.css` (kebab-case, no shade).
 * Pass one as {@link PrismCodeBlockProps.color}; token colors are derived.
 */
export const PRISM_CODE_BLOCK_MATERIAL_COLOR_FAMILIES = [
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "blue-grey",
  "grey",
] as const;

export type PrismCodeBlockSyntaxColorFamily =
  (typeof PRISM_CODE_BLOCK_MATERIAL_COLOR_FAMILIES)[number];

export type PrismCodeBlockProps = {
  children: string;
  language?: string;
  mode?: PrismCodeBlockMode;
  surfaceClassName?: string;
  disableLineNumbers?: boolean;
  disableLanguageLabel?: boolean;
  characterMaxWidth?: number | null;
  /**
   * Material palette family (no shade), e.g. `"purple"`. Keywords/tags/braces stay on that
   * family’s shade ramp; **string** uses the ring **+1** family, **property** **−1**, **number**
   * **−2** (e.g. purple → deep-purple, pink, red). Values resolve to `var(--color-{family}-{n})`
   * in `colors.css`.
   */
  color?: PrismCodeBlockSyntaxColorFamily | (string & {});
  /** When set, the copy control is not rendered. */
  disableCopyButton?: boolean;
  className?: string;
};

// ─── syntax token map ──────────────────────────────────────────────────────────
// Inline-style colors backed by Prism @theme Material palette vars (see
// styles/colors.css). Inline styles bypass any class-generation issues so
// highlighting always paints; dark variants resolved via the .dark scope below.

type TokenKind =
  | "keyword"
  | "string"
  | "comment"
  | "tag"
  | "property"
  | "number"
  | "punct"
  | "brace"
  | "plain";

type TokenStyle = { light: string; dark: string };

function paletteVar(shade: string): string {
  return `var(--color-${shade})`;
}

function pair(lightShade: string, darkShade: string): TokenStyle {
  return { light: paletteVar(lightShade), dark: paletteVar(darkShade) };
}

type SyntaxPaletteMap = Record<Exclude<TokenKind, "plain">, TokenStyle>;

const TOKEN_KINDS_NO_PLAIN: Exclude<TokenKind, "plain">[] = [
  "keyword",
  "string",
  "comment",
  "tag",
  "property",
  "number",
  "punct",
  "brace",
];

const MATERIAL_SYNTAX_RING = PRISM_CODE_BLOCK_MATERIAL_COLOR_FAMILIES;

function materialColor(family: string, shade: number): string {
  return `var(--color-${family}-${shade})`;
}

/** Material palette starts at 50; lighten further with 50% `white` (CSS keyword). */
function veilHalfWhite(base: string): string {
  return `color-mix(in srgb, ${base} 50%, white)`;
}

function normalizeMaterialFamily(
  raw: string | undefined,
): PrismCodeBlockSyntaxColorFamily {
  const s = (raw ?? "blue")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  return (MATERIAL_SYNTAX_RING as readonly string[]).includes(s)
    ? (s as PrismCodeBlockSyntaxColorFamily)
    : "blue";
}

/** Walk the ordered hue ring: positive = next family, negative = previous (wraps). */
function ringFamilyAtOffset(
  primary: PrismCodeBlockSyntaxColorFamily,
  offset: number,
): PrismCodeBlockSyntaxColorFamily {
  const i = MATERIAL_SYNTAX_RING.indexOf(primary);
  const base = i === -1 ? MATERIAL_SYNTAX_RING.indexOf("blue") : i;
  const n = MATERIAL_SYNTAX_RING.length;
  const j = (base + offset) % n;
  return MATERIAL_SYNTAX_RING[(j + n) % n]!;
}

function pairFamilyShades(
  family: PrismCodeBlockSyntaxColorFamily,
  lightShade: number,
  darkShade: number,
): TokenStyle {
  return pair(`${family}-${lightShade}`, `${family}-${darkShade}`);
}

/** Full token ramp: primary family + immediate ring neighbours (±1, −2); all vars from `colors.css`. */
function buildSyntaxTokenMapFromFamily(
  primary: PrismCodeBlockSyntaxColorFamily,
): SyntaxPaletteMap {
  if (primary === "grey") {
    return {
      keyword:  pairFamilyShades("grey", 800, 300),
      string:   pairFamilyShades("grey", 700, 400),
      comment:  pair("blue-grey-500", "blue-grey-400"),
      tag:      pairFamilyShades("grey", 800, 300),
      property: pairFamilyShades("grey", 700, 400),
      number:   pairFamilyShades("grey", 700, 400),
      punct:    pairFamilyShades("grey", 600, 400),
      brace:    pairFamilyShades("grey", 900, 300),
    };
  }

  /** Ring neighbours for tonal spread: +1 / −1 for string & property, −2 for numbers. */
  const oneUp = ringFamilyAtOffset(primary, 1);
  const oneDown = ringFamilyAtOffset(primary, -1);
  const twoDown = ringFamilyAtOffset(primary, -2);

  return {
    keyword:  pairFamilyShades(primary, 800, 300),
    string:   pairFamilyShades(oneUp, 800, 300),
    comment:  pair("blue-grey-500", "blue-grey-400"),
    tag:      pairFamilyShades(primary, 700, 400),
    property: pairFamilyShades(oneDown, 700, 400),
    number:   pairFamilyShades(twoDown, 900, 200),
    punct:    pair("grey-600", "grey-400"),
    brace:    pairFamilyShades(primary, 900, 300),
  };
}

function panelFillFor(
  syntaxFamily: PrismCodeBlockSyntaxColorFamily,
  panelMode: PrismCodeBlockMode,
): { light: string; dark: string } {
  if (panelMode === "transparent") {
    return { light: "transparent", dark: "transparent" };
  }
  if (syntaxFamily === "grey") {
    return {
      light: veilHalfWhite(materialColor("grey", 100)),
      dark: materialColor("grey", 900),
    };
  }
  return {
    light: veilHalfWhite(materialColor(syntaxFamily, 50)),
    dark: materialColor(syntaxFamily, 900),
  };
}

function darkTokenRulesForInstance(
  instanceId: string,
  map: SyntaxPaletteMap,
): string {
  return TOKEN_KINDS_NO_PLAIN.map(
    (k) =>
      `.dark [data-slot="code-block"][data-prism-cb="${instanceId}"] [data-tk="${k}"] { color: ${map[k].dark} !important; }`,
  ).join("\n");
}

/** Panel fill reads `--pcb-fill` / `--pcb-fill-dark` from each `[data-slot="code-block"]`. */
const PRISM_CODE_BLOCK_BASE_CSS = `
[data-slot="code-block"] .prism-code-block-panel-fill { background: var(--pcb-fill); }
.dark [data-slot="code-block"] .prism-code-block-panel-fill { background: var(--pcb-fill-dark) !important; }
`;

type Token = { kind: TokenKind; text: string };

// ─── per-language highlighters ────────────────────────────────────────────────
// Each function receives a single line string and returns Token[].
// The registry dispatch normalizes language to lowercase before lookup.

function collectString(line: string, start: number, quote: string): [string, number] {
  let j = start + 1;
  let esc = false;
  while (j < line.length) {
    if (esc) { esc = false; j++; continue; }
    if (line[j] === "\\") { esc = true; j++; continue; }
    if (line[j] === quote) { j++; break; }
    j++;
  }
  return [line.slice(start, j), j];
}

function tokenizeTsx(line: string): Token[] {
  const tks: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      const [text, next] = collectString(line, i, ch);
      tks.push({ kind: "string", text });
      i = next;
      continue;
    }
    if (ch === "{") {
      let j = i + 1, depth = 1;
      while (j < line.length && depth > 0) {
        if (line[j] === "{") depth++;
        else if (line[j] === "}") depth--;
        j++;
      }
      tks.push({ kind: "brace", text: line.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === "/" && line[i + 1] === ">") {
      tks.push({ kind: "punct", text: "/>" }); i += 2; continue;
    }
    if (ch === "/" && line[i + 1] === "/") {
      tks.push({ kind: "comment", text: line.slice(i) }); break;
    }
    if (ch === "<" && line[i + 1] === "/") {
      tks.push({ kind: "punct", text: "</" }); i += 2;
      let j = i;
      while (j < line.length && /[\w.]/.test(line[j])) j++;
      if (j > i) tks.push({ kind: "tag", text: line.slice(i, j) });
      i = j; continue;
    }
    if (ch === "<" && i + 1 < line.length && /[A-Za-z]/.test(line[i + 1])) {
      tks.push({ kind: "punct", text: "<" }); i++;
      let j = i;
      while (j < line.length && /[\w.]/.test(line[j])) j++;
      tks.push({ kind: "tag", text: line.slice(i, j) });
      i = j; continue;
    }
    if (ch === ">") { tks.push({ kind: "punct", text: ">" }); i++; continue; }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < line.length && /[\w-]/.test(line[j])) j++;
      let k = j;
      while (k < line.length && line[k] === " ") k++;
      tks.push({ kind: line[k] === "=" ? "property" : "plain", text: line.slice(i, j) });
      i = j; continue;
    }
    tks.push({ kind: "plain", text: ch }); i++;
  }
  return tks;
}

const TS_KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "class", "extends", "import", "export", "from", "type", "interface", "enum",
  "async", "await", "new", "this", "typeof", "instanceof", "void", "null",
  "undefined", "true", "false", "default", "switch", "case", "break", "throw",
  "try", "catch", "finally", "in", "of", "readonly", "static", "public",
  "private", "protected", "as", "keyof", "infer", "never", "unknown", "any",
]);

function tokenizeTsJs(line: string): Token[] {
  const tks: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    // comment
    if (ch === "/" && line[i + 1] === "/") {
      tks.push({ kind: "comment", text: line.slice(i) }); break;
    }
    if (ch === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);
      const text = end === -1 ? line.slice(i) : line.slice(i, end + 2);
      tks.push({ kind: "comment", text });
      i = end === -1 ? line.length : end + 2; continue;
    }
    // string
    if (ch === '"' || ch === "'" || ch === "`") {
      const [text, next] = collectString(line, i, ch);
      tks.push({ kind: "string", text });
      i = next; continue;
    }
    // number
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < line.length && /[\d._xXbBoO]/.test(line[j])) j++;
      tks.push({ kind: "number", text: line.slice(i, j) });
      i = j; continue;
    }
    // word / keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < line.length && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tks.push({ kind: TS_KEYWORDS.has(word) ? "keyword" : "plain", text: word });
      i = j; continue;
    }
    tks.push({ kind: "plain", text: ch }); i++;
  }
  return tks;
}

function tokenizeHtml(line: string): Token[] {
  const tks: Token[] = [];
  let i = 0;
  while (i < line.length) {
    // comment
    if (line.startsWith("<!--", i)) {
      const end = line.indexOf("-->", i + 4);
      const text = end === -1 ? line.slice(i) : line.slice(i, end + 3);
      tks.push({ kind: "comment", text });
      i = end === -1 ? line.length : end + 3; continue;
    }
    if (line[i] === "<") {
      tks.push({ kind: "punct", text: "<" }); i++;
      if (line[i] === "/") { tks.push({ kind: "punct", text: "/" }); i++; }
      let j = i;
      while (j < line.length && /[^\s>/]/.test(line[j])) j++;
      if (j > i) tks.push({ kind: "tag", text: line.slice(i, j) });
      i = j; continue;
    }
    if (line[i] === ">" || (line[i] === "/" && line[i + 1] === ">")) {
      const text = line[i + 1] === ">" ? "/>" : ">";
      tks.push({ kind: "punct", text }); i += text.length; continue;
    }
    if (line[i] === '"' || line[i] === "'") {
      const [text, next] = collectString(line, i, line[i]);
      tks.push({ kind: "string", text }); i = next; continue;
    }
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[\w-]/.test(line[j])) j++;
      let k = j;
      while (k < line.length && line[k] === " ") k++;
      tks.push({ kind: line[k] === "=" ? "property" : "plain", text: line.slice(i, j) });
      i = j; continue;
    }
    tks.push({ kind: "plain", text: line[i] }); i++;
  }
  return tks;
}

function tokenizeMarkdown(line: string): Token[] {
  if (/^#{1,6}\s/.test(line)) return [{ kind: "keyword", text: line }];
  if (/^```/.test(line)) return [{ kind: "comment", text: line }];
  if (/^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
    return [
      { kind: "punct", text: line.slice(0, 2) },
      { kind: "plain", text: line.slice(2) },
    ];
  }
  const tks: Token[] = [];
  let i = 0;
  while (i < line.length) {
    // inline code
    if (line[i] === "`") {
      const end = line.indexOf("`", i + 1);
      const text = end === -1 ? line.slice(i) : line.slice(i, end + 1);
      tks.push({ kind: "string", text }); i = end === -1 ? line.length : end + 1; continue;
    }
    // bold **
    if (line[i] === "*" && line[i + 1] === "*") {
      const end = line.indexOf("**", i + 2);
      const text = end === -1 ? line.slice(i) : line.slice(i, end + 2);
      tks.push({ kind: "keyword", text }); i = end === -1 ? line.length : end + 2; continue;
    }
    // italic *
    if (line[i] === "*") {
      const end = line.indexOf("*", i + 1);
      const text = end === -1 ? line.slice(i) : line.slice(i, end + 1);
      tks.push({ kind: "property", text }); i = end === -1 ? line.length : end + 1; continue;
    }
    // link [text](url)
    if (line[i] === "[") {
      const close = line.indexOf("]", i);
      const paren = close !== -1 && line[close + 1] === "(" ? line.indexOf(")", close) : -1;
      if (paren !== -1) {
        tks.push({ kind: "property", text: line.slice(i, close + 1) });
        tks.push({ kind: "string", text: line.slice(close + 1, paren + 1) });
        i = paren + 1; continue;
      }
    }
    tks.push({ kind: "plain", text: line[i] }); i++;
  }
  return tks;
}

function tokenizeCss(line: string): Token[] {
  const tks: Token[] = [];
  let i = 0;
  while (i < line.length) {
    if (line.startsWith("/*", i)) {
      const end = line.indexOf("*/", i + 2);
      const text = end === -1 ? line.slice(i) : line.slice(i, end + 2);
      tks.push({ kind: "comment", text }); i = end === -1 ? line.length : end + 2; continue;
    }
    if (line[i] === '"' || line[i] === "'") {
      const [text, next] = collectString(line, i, line[i]);
      tks.push({ kind: "string", text }); i = next; continue;
    }
    if (line[i] === "{" || line[i] === "}") {
      tks.push({ kind: "brace", text: line[i] }); i++; continue;
    }
    if (line[i] === ":" || line[i] === ";") {
      tks.push({ kind: "punct", text: line[i] }); i++; continue;
    }
    if (/[a-zA-Z_-]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[\w-]/.test(line[j])) j++;
      let k = j;
      while (k < line.length && line[k] === " ") k++;
      tks.push({ kind: line[k] === ":" ? "property" : "plain", text: line.slice(i, j) });
      i = j; continue;
    }
    if (/[0-9.]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[\d.%a-z]/.test(line[j])) j++;
      tks.push({ kind: "number", text: line.slice(i, j) }); i = j; continue;
    }
    tks.push({ kind: "plain", text: line[i] }); i++;
  }
  return tks;
}

function tokenizeJson(line: string): Token[] {
  const tks: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      const [text, next] = collectString(line, i, '"');
      let k = next;
      while (k < line.length && line[k] === " ") k++;
      // key if followed by :
      tks.push({ kind: line[k] === ":" ? "property" : "string", text });
      i = next; continue;
    }
    if (/[0-9\-.]/.test(ch)) {
      let j = i;
      while (j < line.length && /[\d.\-eE+]/.test(line[j])) j++;
      tks.push({ kind: "number", text: line.slice(i, j) }); i = j; continue;
    }
    if (/[a-z]/.test(ch)) {
      let j = i;
      while (j < line.length && /[a-z]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tks.push({ kind: word === "true" || word === "false" || word === "null" ? "keyword" : "plain", text: word });
      i = j; continue;
    }
    if (ch === "{" || ch === "}") { tks.push({ kind: "brace", text: ch }); i++; continue; }
    if (ch === "[" || ch === "]") { tks.push({ kind: "punct", text: ch }); i++; continue; }
    tks.push({ kind: "plain", text: ch }); i++;
  }
  return tks;
}

// ─── registry ─────────────────────────────────────────────────────────────────
// Add new languages here: one function above + one entry below.

type HighlightFn = (line: string) => Token[];

const HIGH_LIGHTERS: Partial<Record<PrismCodeBlockHighlightLanguage, HighlightFn>> = {
  tsx:      tokenizeTsx,
  ts:       tokenizeTsJs,
  js:       tokenizeTsJs,
  html:     tokenizeHtml,
  markdown: tokenizeMarkdown,
  css:      tokenizeCss,
  json:     tokenizeJson,
};

function renderTokens(
  tokens: Token[],
  lineKey: string,
  syntaxMap: SyntaxPaletteMap,
): React.ReactNode {
  return tokens.map((tk, idx) => {
    if (tk.kind === "plain") {
      return (
        <span key={`${lineKey}-${idx}`} data-tk={tk.kind}>
          {tk.text}
        </span>
      );
    }
    const style = syntaxMap[tk.kind];
    return (
      <span
        key={`${lineKey}-${idx}`}
        data-tk={tk.kind}
        style={{ color: style.light }}
      >
        {tk.text}
      </span>
    );
  });
}

// ─── component ───────────────────────────────────────────────────────────────

function PrismCodeBlock({
  children,
  language,
  mode = "card",
  surfaceClassName,
  disableLineNumbers = false,
  disableLanguageLabel = false,
  characterMaxWidth = 80,
  color: colorProp,
  disableCopyButton = false,
  className,
}: PrismCodeBlockProps): React.JSX.Element {
  const [copied, setCopied] = React.useState(false);

  const materialFamily = normalizeMaterialFamily(colorProp);
  const syntaxTokenMap = React.useMemo(
    () => buildSyntaxTokenMapFromFamily(materialFamily),
    [materialFamily],
  );
  const panelFill = React.useMemo(
    () => panelFillFor(materialFamily, mode),
    [materialFamily, mode],
  );

  const reactInstanceId = React.useId().replace(/[^a-zA-Z0-9]/g, "") || "pcb";
  const instanceDarkCss = React.useMemo(
    () => darkTokenRulesForInstance(reactInstanceId, syntaxTokenMap),
    [reactInstanceId, syntaxTokenMap],
  );

  const normalizedLanguage = language?.trim();
  const languageKey = normalizedLanguage?.toLowerCase() as PrismCodeBlockHighlightLanguage | undefined;
  const highlighter = languageKey ? HIGH_LIGHTERS[languageKey] : undefined;
  const copyLabel = normalizedLanguage ? `Copy ${normalizedLanguage}` : "Copy code";
  const chipLabel = normalizedLanguage ?? "code";
  const hideLineNumbers = disableLineNumbers;

  const lines = children.replace(/\n$/, "").split("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <style
        // eslint-disable-next-line react/no-danger -- base panel vars + per-instance dark token colors
        dangerouslySetInnerHTML={{
          __html: `${PRISM_CODE_BLOCK_BASE_CSS}\n${instanceDarkCss}`,
        }}
        suppressHydrationWarning
      />

      <div
        data-slot="code-block"
        data-mode={mode}
        data-prism-material-family={materialFamily}
        data-prism-cb={reactInstanceId}
        className={cn("min-w-0 font-mono", className)}
        style={{
          width: characterMaxWidth != null ? `min(100%, ${characterMaxWidth}ch)` : "100%",
          ["--pcb-fill" as string]: panelFill.light,
          ["--pcb-fill-dark" as string]: panelFill.dark,
        }}
      >
      {/* panel: outer = layout + surfaceClassName; inner = theme-tinted fill */}
      <div
        className={cn("relative overflow-hidden rounded-xl", surfaceClassName)}
      >
        <div className="prism-code-block-panel-fill" style={{ borderRadius: "inherit" }}>
          <div
            className="overflow-x-auto font-mono leading-relaxed text-foreground"
            style={{
              padding: "0.5rem 0.75rem",
              fontSize: "13px",
            }}
          >
            <div>
              {lines.map((line, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", minHeight: "1.6em" }}>
                  {!hideLineNumbers ? (
                    <span
                      aria-hidden
                      style={{
                        flexShrink: 0,
                        fontSize: "0.6rem",
                        lineHeight: 1.2,
                        fontWeight: 300,
                        opacity: 0.35,
                        userSelect: "none",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {i + 1}
                    </span>
                  ) : null}
                  <span style={{ minWidth: 0, flex: 1, whiteSpace: "pre" }}>
                    {highlighter
                      ? renderTokens(highlighter(line), `L${i}`, syntaxTokenMap)
                      : line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!disableLanguageLabel ? (
          <div
            className="pointer-events-none"
            style={{ position: "absolute", top: "0.125rem", right: "0.625rem", zIndex: 10 }}
          >
            <PrismTypography
              role="label"
              size="small"
              font="mono"
              tone="muted"
              className="inline uppercase tracking-wide"
            >
              {chipLabel}
            </PrismTypography>
          </div>
        ) : null}

        {!disableCopyButton ? (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied!" : copyLabel}
            title={copied ? "Copied!" : copyLabel}
            className="rounded-md p-0.5 text-muted-foreground transition hover:text-foreground"
            style={{ position: "absolute", bottom: "0.125rem", right: "0.625rem", zIndex: 10 }}
          >
            <PrismIcon
              name={copied ? "check" : "content_copy"}
              size={18}
              weight="regular"
              fill="off"
              className="block"
            />
          </button>
        ) : null}
      </div>
      </div>
    </>
  );
}

export { PrismCodeBlock };
