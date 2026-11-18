import type { Components } from "react-markdown";
import type GithubSlugger from "github-slugger";
import type { ReactNode } from "react";
import { PrismMarkdownHeading } from "./prism-markdown-heading";
import { PrismTypography } from "./prism-typography";
import type { PrismMarkdownMode } from "@prism/utilities";
import type { PartialPrismColorSpec } from "../styles/prism-color";

function textFromNode(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (typeof node === "object" && "props" in node) {
    return textFromNode(
      (node as { props: { children?: ReactNode } }).props.children
    );
  }
  return "";
}

function isExternalHttpHref(href: string | undefined): boolean {
  if (!href) return false;
  return /^https?:\/\//i.test(href);
}

export type PrismMarkdownStyleOptions = {
  mode: PrismMarkdownMode;
  disableLinks: boolean;
  headingIdPrefix: string;
  slugger: GithubSlugger;
  /** When set, `h2` uses this color instead of monochrome. */
  headingColor?: PartialPrismColorSpec;
};

/** Markdown element → PrismTypography map (internal to PrismMarkdown). */
export function prismMarkdownStyle(
  options: PrismMarkdownStyleOptions
): Components {
  const { mode, disableLinks, headingIdPrefix, slugger, headingColor } =
    options;

  return {
    h2: ({ children }) => {
      const id = `${headingIdPrefix}${slugger.slug(textFromNode(children))}`;
      return (
        <PrismMarkdownHeading
          as="h2"
          id={id}
          color={headingColor ?? { semanticText: "monochrome" }}
          className="mt-3 scroll-mt-24"
        >
          {children}
        </PrismMarkdownHeading>
      );
    },
    h3: ({ children }) => {
      const id = `${headingIdPrefix}${slugger.slug(textFromNode(children))}`;
      return (
        <PrismMarkdownHeading as="h3" id={id} className="mt-2 scroll-mt-24">
          {children}
        </PrismMarkdownHeading>
      );
    },
    p: ({ children }) => (
      <PrismTypography
        role="body"
        size="regular"
        font={mode === "document" ? "serif" : "sans"}
        // Document prose should fill the measure; `balance` shortens lines for even rags.
        textWrap={mode === "document" ? "wrap" : undefined}
        as="p"
        className={mode === "document" ? "tracking-tight" : undefined}
      >
        {children}
      </PrismTypography>
    ),
    a: ({ href, children }) => {
      if (disableLinks) {
        return <span>{children}</span>;
      }
      const external = isExternalHttpHref(href);
      return (
        <a
          href={href}
          className="underline break-all"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {children}
        </a>
      );
    },
  };
}
