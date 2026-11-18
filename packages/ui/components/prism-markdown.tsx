import GithubSlugger from "github-slugger";
import type { ReactElement } from "react";
import Markdown from "react-markdown";
import {
  prismMarkdownEnrich,
  type PrismMarkdownKeyword,
  type PrismMarkdownMatcher,
  type PrismMarkdownMode,
} from "@prism/utilities";
import { prismMarkdownStyle } from "./prism-markdown-style";

export type PrismMarkdownProps = {
  text: string;
  mode: PrismMarkdownMode;
  keywords?: PrismMarkdownKeyword[];
  matchers?: PrismMarkdownMatcher[];
  /** Prefix heading ids so multiple documents on one page do not collide. */
  headingIdPrefix?: string;
  /** Render anchors as plain text (e.g. inside `<summary>`). */
  disableLinks?: boolean;
  className?: string;
};

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * react-markdown's default drops `tel:`; civic text needs phone links.
 * Anything outside this allowlist (javascript:, data:, …) is dropped.
 */
function safeUrlTransform(url: string): string {
  const colonIndex = url.indexOf(":");
  if (colonIndex === -1) return url; // relative / hash links
  const protocol = url.slice(0, colonIndex + 1).toLowerCase();
  const beforeColon = url.slice(0, colonIndex);
  if (/[/?#]/.test(beforeColon)) return url; // colon inside path/query
  return SAFE_LINK_PROTOCOLS.has(protocol) ? url : "";
}

/**
 * Plain text → enriched Markdown → PrismTypography-styled render.
 * App supplies Keywords and optional link matchers; Prism owns structure and style.
 */
export function PrismMarkdown({
  text,
  mode,
  keywords,
  matchers,
  headingIdPrefix = "",
  disableLinks = false,
  className,
}: PrismMarkdownProps): ReactElement | null {
  const markdown = prismMarkdownEnrich(text, { mode, keywords, matchers });
  if (!markdown) return null;

  const slugger = new GithubSlugger();
  const components = prismMarkdownStyle({
    mode,
    disableLinks,
    headingIdPrefix,
    slugger,
  });

  return (
    <div
      className={
        className ?? (mode === "document" ? "grid gap-3" : "grid gap-1")
      }
    >
      <Markdown components={components} urlTransform={safeUrlTransform}>
        {markdown}
      </Markdown>
    </div>
  );
}
