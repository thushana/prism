/**
 * Plain civic text → copyable Markdown.
 * Structure (optional ALL-CAPS headings) then link overlays (matchers + Keywords).
 */

export type PrismMarkdownMode = "document" | "title";

export type PrismMarkdownKeyword = {
  label: string;
  href: string;
};

export type PrismMarkdownMatch = {
  start: number;
  end: number;
  href: string;
};

export type PrismMarkdownMatcher = (text: string) => PrismMarkdownMatch[];

export type PrismMarkdownEnrichOptions = {
  mode: PrismMarkdownMode;
  keywords?: PrismMarkdownKeyword[];
  matchers?: PrismMarkdownMatcher[];
};

const BUILTIN_URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

/**
 * Escape only characters that would change Markdown structure.
 * Do not escape hyphens, periods, or parentheses mid-prose (keeps copy readable;
 * avoids leaking `\-` when a line is accidentally treated as a code block).
 */
function escapeMarkdownInline(text: string): string {
  return text.replace(/[\\`*_{}[\]<>]/g, "\\$&");
}

/** Per-line escapes for markers that only matter at the start of a line. */
function escapeMarkdownLine(line: string): string {
  let out = escapeMarkdownInline(line);
  out = out.replace(/^([#>])/, "\\$1");
  out = out.replace(/^([-+*])(\s)/, "\\$1$2");
  out = out.replace(/^(\d+)\.(\s)/, "$1\\.$2");
  return out;
}

function escapeMarkdownLinkLabel(text: string): string {
  return text.replace(/[\\[\]]/g, "\\$&");
}

/** Prefer angle-bracket destinations so parentheses in URLs stay intact. */
function formatMarkdownLink(label: string, href: string): string {
  const safeHref = href.replace(/[<>\s]/g, "");
  if (!safeHref) return escapeMarkdownLine(label);
  return `[${escapeMarkdownLinkLabel(label)}](<${safeHref}>)`;
}

function letterCount(value: string): number {
  return (value.match(/[A-Z]/g) ?? []).length;
}

/**
 * ALL-CAPS section title line (document mode). Blank-line bounded by the caller.
 * Letters, spaces, and & / , - only; optional trailing colon; 3–60 chars; ≤6 words.
 */
export function isPrismMarkdownSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const core = trimmed.endsWith(":") ? trimmed.slice(0, -1).trimEnd() : trimmed;
  if (core.length < 3 || core.length > 60) return false;
  // Letters, spaces, and & / , - only — no digits or lowercase.
  if (!/^[A-Z\s&/,-]+$/.test(core)) return false;
  if (letterCount(core) < 3) return false;
  const words = core.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 6) return false;
  return true;
}

function stripTrailingUrlJunk(url: string): string {
  return url.replace(/[.,;:!?)]+$/g, "");
}

/**
 * Civic vendors indent with tabs/spaces (e.g. WHEREAS). Markdown would treat that
 * as a code block (`<pre>`), which blows out layout and shows escape backslashes.
 */
function normalizeCivicPlainText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[\t ]+/, ""))
    .join("\n")
    .trim();
}

export function prismMarkdownBuiltinUrlMatcher(
  text: string
): PrismMarkdownMatch[] {
  const matches: PrismMarkdownMatch[] = [];
  for (const match of text.matchAll(BUILTIN_URL_RE)) {
    const raw = match[0] ?? "";
    const cleaned = stripTrailingUrlJunk(raw);
    if (!cleaned) continue;
    const start = match.index ?? 0;
    matches.push({ start, end: start + cleaned.length, href: cleaned });
  }
  return matches;
}

function keywordMatchers(
  keywords: PrismMarkdownKeyword[]
): PrismMarkdownMatcher[] {
  const sorted = [...keywords]
    .filter((keyword) => keyword.label.trim().length > 0 && keyword.href.trim())
    .sort((a, b) => b.label.length - a.label.length);

  return sorted.map((keyword) => {
    const escaped = keyword.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`,
      "giu"
    );
    return (text: string): PrismMarkdownMatch[] => {
      const matches: PrismMarkdownMatch[] = [];
      for (const match of text.matchAll(pattern)) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        matches.push({ start, end, href: keyword.href });
      }
      return matches;
    };
  });
}

type RankedMatch = PrismMarkdownMatch & { priority: number; length: number };

function resolveMatches(
  text: string,
  matchers: PrismMarkdownMatcher[]
): PrismMarkdownMatch[] {
  const ranked: RankedMatch[] = [];
  matchers.forEach((matcher, priority) => {
    for (const match of matcher(text)) {
      if (match.end <= match.start) continue;
      if (match.start < 0 || match.end > text.length) continue;
      ranked.push({
        ...match,
        priority,
        length: match.end - match.start,
      });
    }
  });

  ranked.sort(
    (a, b) =>
      a.start - b.start || b.length - a.length || a.priority - b.priority
  );

  const accepted: PrismMarkdownMatch[] = [];
  let cursor = 0;
  for (const match of ranked) {
    if (match.start < cursor) continue;
    accepted.push({ start: match.start, end: match.end, href: match.href });
    cursor = match.end;
  }
  return accepted;
}

function emitParagraphMarkdown(
  text: string,
  matches: PrismMarkdownMatch[]
): string {
  // Preserve source newlines as CommonMark hard breaks (backslash + newline).
  const lines = text.split("\n");
  const emittedLines = lines.map((line, lineIndex) => {
    const lineStart = lines
      .slice(0, lineIndex)
      .reduce((sum, part) => sum + part.length + 1, 0);
    const lineEnd = lineStart + line.length;
    const lineMatches = matches
      .filter((match) => match.start < lineEnd && match.end > lineStart)
      .map((match) => ({
        start: Math.max(0, match.start - lineStart),
        end: Math.min(line.length, match.end - lineStart),
        href: match.href,
      }))
      .filter((match) => match.end > match.start);

    let cursor = 0;
    let out = "";
    for (const match of lineMatches) {
      if (match.start < cursor) continue;
      if (match.start > cursor) {
        out += escapeMarkdownLine(line.slice(cursor, match.start));
      }
      const label = line.slice(match.start, match.end);
      out += formatMarkdownLink(label, match.href);
      cursor = match.end;
    }
    if (cursor < line.length) {
      out += escapeMarkdownLine(line.slice(cursor));
    }
    return out;
  });

  return emittedLines.join("\\\n");
}

function collectParagraphMatches(
  text: string,
  options: PrismMarkdownEnrichOptions
): PrismMarkdownMatch[] {
  const matchers: PrismMarkdownMatcher[] = [
    ...(options.matchers ?? []),
    prismMarkdownBuiltinUrlMatcher,
    ...keywordMatchers(options.keywords ?? []),
  ];
  return resolveMatches(text, matchers);
}

/**
 * Convert plain text to enriched Markdown.
 * `document` mode promotes blank-line-bounded ALL-CAPS lines to `##` headings.
 * `title` mode never promotes headings. Keywords and matchers apply to paragraphs only.
 */
export function prismMarkdownEnrich(
  text: string,
  options: PrismMarkdownEnrichOptions
): string {
  const normalized = normalizeCivicPlainText(text);
  if (!normalized) return "";

  const blocks = normalized.split(/\n{2,}/);
  const parts: string[] = [];

  for (const block of blocks) {
    const trimmedBlock = block.replace(/^\n+|\n+$/g, "");
    if (!trimmedBlock) continue;

    const lines = trimmedBlock.split("\n");
    const singleLine = lines.length === 1 ? lines[0]!.trim() : null;

    if (
      options.mode === "document" &&
      singleLine != null &&
      isPrismMarkdownSectionHeading(singleLine)
    ) {
      // Headings are never keyword/URL enriched.
      parts.push(`## ${escapeMarkdownInline(singleLine)}`);
      continue;
    }

    const matches = collectParagraphMatches(trimmedBlock, options);
    parts.push(emitParagraphMarkdown(trimmedBlock, matches));
  }

  return parts.join("\n\n");
}
