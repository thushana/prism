"use client";

import type { ReactNode } from "react";
import { cn } from "@utilities";
import type { PartialPrismColorSpec } from "../styles/prism-color";
import {
  prismLocationHashUrl,
  usePrismClipboardCopy,
} from "./prism-clipboard-copy";
import { PrismIcon } from "./prism-icon";
import { PrismTypography } from "./prism-typography";

export type PrismMarkdownHeadingProps = {
  as: "h2" | "h3";
  id: string;
  color?: PartialPrismColorSpec;
  className?: string;
  children: ReactNode;
};

/**
 * Document heading with a hover affordance that copies the deep-link URL (`#id`).
 */
export function PrismMarkdownHeading({
  as,
  id,
  color,
  className,
  children,
}: PrismMarkdownHeadingProps) {
  const { copied, copyText } = usePrismClipboardCopy();

  async function handleCopyLink() {
    history.replaceState(null, "", `#${id}`);
    await copyText(prismLocationHashUrl(id, window.location));
  }

  return (
    <PrismTypography
      role="body"
      size="regular"
      font="sans"
      fontWeight="heavy"
      color={color ?? { semanticText: "monochrome" }}
      as={as}
      id={id}
      className={cn(
        "group/prism-markdown-heading inline-flex items-center gap-1.5",
        className
      )}
    >
      <span className="min-w-0">{children}</span>
      <button
        type="button"
        onClick={() => void handleCopyLink()}
        className={cn(
          "inline-flex size-[1em] shrink-0 items-center justify-center",
          "pointer-events-none opacity-0 transition-opacity",
          "group-hover/prism-markdown-heading:pointer-events-auto group-hover/prism-markdown-heading:opacity-100",
          "focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none"
        )}
        aria-label={copied ? "Copied link" : "Copy link to heading"}
      >
        <PrismIcon
          name={copied ? "check" : "link"}
          size="small"
          color={{ palette: "default", swatchPrimary: "grey", shade: 400 }}
        />
      </button>
    </PrismTypography>
  );
}
