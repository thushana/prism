"use client";

import * as React from "react";
import Link from "next/link";
import { PrismTypography } from "./prism-typography";
import {
  buildPrismPathBarAutoSegmentList,
  type PrismPathBarSegment,
  type PrismPathBarTitleEntry,
} from "./prism-path-segments";

export {
  buildPrismPathBarAutoSegmentList,
  listAncestorPathPrefixes,
  normalizePathname,
} from "./prism-path-segments";
export type {
  PrismPathBarSegment,
  PrismPathBarTitleEntry,
} from "./prism-path-segments";

const PRISM_PATH_BAR_LINK_CLASS =
  "group inline-flex underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export type PrismPathBarIcon = React.ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
}>;

export type PrismPathBarProps = {
  className?: string;
  /** Optional icon (e.g. Lucide) before the first segment. */
  icon?: PrismPathBarIcon;
} & (
  | {
      mode?: "explicit";
      segments: PrismPathBarSegment[];
    }
  | {
      mode: "auto";
      pathname: string;
      /** Normalized path prefix → title (string uses default `href` = key, or object with optional `href`). */
      titleByPathPrefix: Record<string, PrismPathBarTitleEntry>;
      /** Same string as the page `<h1>` when used from {@link AdminPageShell}. */
      pageTitle: string;
    }
);

/**
 * Path row for admin (or similar): explicit `segments`, or auto mode from
 * `pathname` + `titleByPathPrefix` + `pageTitle`. Uses Next `Link` + `PrismTypography` (not `PrismButton`).
 */
export function PrismPathBar(props: PrismPathBarProps): React.JSX.Element {
  const { className, icon: Icon } = props;
  const segmentList =
    props.mode === "auto"
      ? buildPrismPathBarAutoSegmentList(
          props.pathname,
          props.titleByPathPrefix,
          props.pageTitle
        )
      : (props.segments ?? []);
  const lastIndex = segmentList.length - 1;

  if (segmentList.length === 0) return <></>;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex list-none flex-wrap items-baseline gap-x-0 p-0">
        {Icon ? (
          <li className="mr-1.5 inline-flex shrink-0 items-center self-center text-muted-foreground">
            <Icon size={16} strokeWidth={2} aria-hidden />
          </li>
        ) : null}
        {segmentList.map((segment, index) => {
          const isLast = index === lastIndex;
          return (
            <li
              key={`${segment.label}-${index}`}
              className="inline-flex items-baseline gap-x-0"
            >
              {index > 0 ? (
                <PrismTypography
                  role="body"
                  size="small"
                  as="span"
                  color={{ semanticText: "muted" }}
                  aria-hidden
                  className="select-none px-2"
                >
                  /
                </PrismTypography>
              ) : null}
              {segment.href && !isLast ? (
                <Link
                  href={segment.href}
                  className={`${PRISM_PATH_BAR_LINK_CLASS} w-fit`}
                >
                  <PrismTypography
                    role="body"
                    size="small"
                    as="span"
                    color={{ semanticText: "muted" }}
                    className="group-hover:text-foreground"
                  >
                    {segment.label}
                  </PrismTypography>
                </Link>
              ) : (
                <PrismTypography
                  role="body"
                  size="small"
                  as="span"
                  color={{
                    semanticText: isLast ? "foreground" : "muted",
                  }}
                >
                  {segment.label}
                </PrismTypography>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
