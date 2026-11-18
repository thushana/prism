import type { Components } from "react-markdown";
import type GithubSlugger from "github-slugger";
import type { ReactNode } from "react";
import { PrismTypography } from "./prism-typography";
import type { PrismMarkdownMode } from "@prism/utilities";

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
};

/** Markdown element → PrismTypography map (internal to PrismMarkdown). */
export function prismMarkdownStyle(
  options: PrismMarkdownStyleOptions
): Components {
  const { mode, disableLinks, headingIdPrefix, slugger } = options;

  return {
    h2: ({ children }) => {
      const id = `${headingIdPrefix}${slugger.slug(textFromNode(children))}`;
      return (
        <PrismTypography
          role="body"
          size="regular"
          font="sans"
          fontWeight="heavy"
          color={{ semanticText: "monochrome" }}
          as="h2"
          id={id}
          className="mt-3"
        >
          {children}
        </PrismTypography>
      );
    },
    p: ({ children }) => (
      <PrismTypography
        role="body"
        size="regular"
        font={mode === "document" ? "serif" : "sans"}
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
