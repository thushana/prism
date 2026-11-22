/**
 * Plain civic text → copyable Markdown.
 * Structure (optional ALL-CAPS `##` / Title Case `###` headings) then link overlays.
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
 * Roll-call / vote-tally lines in resolutions (often blank after the colon).
 * Must not become `##` chapter headings with copy-link affordances.
 */
const SECTION_HEADING_DENYLIST = new Set([
  "AYES",
  "NOES",
  "NAYS",
  "ABSENT",
  "ABSENTIONS",
  "ABSTENTIONS",
  "ABSTAIN",
  "ABSTAINS",
]);

/**
 * ALL-CAPS section title line (document mode → `##`). Caller decides line boundaries.
 * Letters, spaces, and & / , - only; optional trailing colon; 3–60 chars; ≤6 words.
 */
export function isPrismMarkdownSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const core = trimmed.endsWith(":") ? trimmed.slice(0, -1).trimEnd() : trimmed;
  if (core.length < 3 || core.length > 60) return false;
  if (SECTION_HEADING_DENYLIST.has(core)) return false;
  // Letters, spaces, and & / , - only — no digits or lowercase.
  if (!/^[A-Z\s&/,-]+$/.test(core)) return false;
  if (letterCount(core) < 3) return false;
  const words = core.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 6) return false;
  return true;
}

/** One Title Case word, slash-compound, or short acronym (e.g. CEQA). */
const TITLE_CASE_WORD_RE =
  /^(?:[A-Z][a-z]*|[A-Z]{2,5})(?:[/-](?:[A-Z][a-z]*|[A-Z]{2,5}))*$/;

/** Lowercase topic-label word ("beverage", "walk-up", "children's"). */
const SENTENCE_CASE_WORD_RE = /^[a-z]+(?:'[a-z]+)?(?:[/-][a-z]+)*$/;

/**
 * Signature / certification labels that look like Title Case subsections.
 */
const TITLE_HEADING_DENYLIST = new Set(["approved as to form"]);

/**
 * Subsection line (document mode → `###`): Title Case ("Conclusion") or
 * sentence-case topic labels ("Food and beverage", "Tenant improvements").
 * Rejects prose that mixes capitals mid-line ("Close to Alameda…").
 */
export function isPrismMarkdownTitleHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  if (isPrismMarkdownSectionHeading(trimmed)) return false;
  const core = trimmed.endsWith(":") ? trimmed.slice(0, -1).trimEnd() : trimmed;
  if (core.length < 3 || core.length > 60) return false;
  if (TITLE_HEADING_DENYLIST.has(core.toLowerCase())) return false;
  // ALL-CAPS belongs to section-heading rules (or its denylist) — not ###.
  if (/^[A-Z\s&/,-]+$/.test(core)) return false;
  // Letters, spaces, apostrophes, and & / , - only — no digits.
  if (!/^[A-Za-z'\s&/,-]+$/.test(core)) return false;
  const words = core.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 6) return false;

  if (words.every((word) => TITLE_CASE_WORD_RE.test(word))) return true;

  // Sentence-case label: first word Title Case, remaining words lowercase.
  const [first, ...rest] = words;
  if (!first || rest.length === 0) return false;
  if (!TITLE_CASE_WORD_RE.test(first)) return false;
  return rest.every((word) => SENTENCE_CASE_WORD_RE.test(word));
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

type Segment =
  | { kind: "heading"; text: string; level: 2 | 3 }
  | { kind: "paragraph"; text: string };

/**
 * Split civic plain text into headings + paragraphs.
 * ALL-CAPS → `##`, Title Case → `###`, even when only a single newline separates
 * the label from the following body (common in Legistar).
 */
function segmentPlainText(text: string, mode: PrismMarkdownMode): Segment[] {
  const normalized = normalizeCivicPlainText(text);
  if (!normalized) return [];

  const segments: Segment[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph() {
    const paragraph = paragraphLines.join("\n").trim();
    paragraphLines = [];
    if (paragraph) segments.push({ kind: "paragraph", text: paragraph });
  }

  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trimEnd();
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }
    if (mode === "document") {
      const trimmed = line.trim();
      if (isPrismMarkdownSectionHeading(trimmed)) {
        flushParagraph();
        segments.push({ kind: "heading", text: trimmed, level: 2 });
        continue;
      }
      if (isPrismMarkdownTitleHeading(trimmed)) {
        flushParagraph();
        segments.push({ kind: "heading", text: trimmed, level: 3 });
        continue;
      }
    }
    paragraphLines.push(line);
  }
  flushParagraph();
  return segments;
}

export type PrismMarkdownOutlineEntry = { label: string; level: 2 | 3 };

/**
 * Every heading (`##` ALL-CAPS, `###` subsection) in document order.
 * Slug all of them together so ids match what PrismMarkdown renders.
 */
export function prismMarkdownDocumentOutline(
  text: string
): PrismMarkdownOutlineEntry[] {
  return segmentPlainText(text, "document").flatMap((segment) =>
    segment.kind === "heading"
      ? [{ label: segment.text, level: segment.level }]
      : []
  );
}

/**
 * ALL-CAPS (`##`) section heading labels in document order.
 * Title Case / sentence-case `###` subheads are omitted from the chapter list.
 */
export function prismMarkdownDocumentHeadings(text: string): string[] {
  return prismMarkdownDocumentOutline(text)
    .filter((entry) => entry.level === 2)
    .map((entry) => entry.label);
}

/**
 * Convert plain text to enriched Markdown.
 * `document` mode promotes ALL-CAPS lines to `##` and Title Case lines to `###`.
 * `title` mode never promotes headings. Keywords and matchers apply to paragraphs only.
 */
export function prismMarkdownEnrich(
  text: string,
  options: PrismMarkdownEnrichOptions
): string {
  const segments = segmentPlainText(text, options.mode);
  if (segments.length === 0) return "";

  const parts: string[] = [];
  for (const segment of segments) {
    if (segment.kind === "heading") {
      const marks = segment.level === 2 ? "##" : "###";
      parts.push(`${marks} ${escapeMarkdownInline(segment.text)}`);
      continue;
    }
    const matches = collectParagraphMatches(segment.text, options);
    parts.push(emitParagraphMarkdown(segment.text, matches));
  }
  return parts.join("\n\n");
}
