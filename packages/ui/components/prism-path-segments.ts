/**
 * Pure helpers for {@link PrismPathBar} auto mode: pathname normalization and
 * segment list from an authoritative title map (no slug-based labels).
 */

import type { ReactNode } from "react";

export type PrismPathBarTitleEntry =
  | string
  | {
      label: string;
      /** Omit for a non-link segment (e.g. logical section with no route). */
      href?: string;
    };

export type PrismPathBarSegment = { label: ReactNode; href?: string };

/** Strip query/hash, ensure leading `/`, drop trailing slash except root. */
export function normalizePathname(raw: string | null | undefined): string {
  const noQuery = (raw ?? "").trim().split(/[?#]/)[0] ?? "";
  let p = noQuery;
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

/**
 * Cumulative path prefixes for ancestor segments (excludes leaf path segment).
 * e.g. `/admin/prism/components/prism-button` → `["/admin","/admin/prism","/admin/prism/components"]`
 */
export function listAncestorPathPrefixes(normalizedPath: string): string[] {
  const parts = normalizedPath.split("/").filter(Boolean);
  if (parts.length <= 1) return [];
  const prefixes: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    prefixes.push(`/${parts.slice(0, i + 1).join("/")}`);
  }
  return prefixes;
}

/** Turn a URL path segment into a readable label (e.g. `api-keys` → `Api Keys`). */
export function slugPathSegmentToLabel(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function resolveTitleEntry(
  prefix: string,
  entry: PrismPathBarTitleEntry | undefined,
  lenientMissingPrefixes: boolean
): PrismPathBarSegment {
  if (entry === undefined) {
    if (!lenientMissingPrefixes) {
      throw new Error(
        `PrismPathBar auto mode: missing titleByPathPrefix["${prefix}"]. Add an entry for every ancestor prefix of the route.`
      );
    }
    const lastSegment = prefix.split("/").filter(Boolean).pop() ?? "";
    return { label: slugPathSegmentToLabel(lastSegment), href: prefix };
  }
  if (typeof entry === "string") {
    return { label: entry, href: prefix };
  }
  return { label: entry.label, href: entry.href };
}

export type BuildPrismPathBarAutoSegmentListOptions = {
  pageTitleContent?: ReactNode;
  /** When true, unmapped ancestor prefixes use {@link slugPathSegmentToLabel}. */
  lenientMissingPrefixes?: boolean;
};

/**
 * Build path bar segments: one segment per ancestor (from map) + leaf (`pageTitle`).
 */
export function buildPrismPathBarAutoSegmentList(
  pathname: string,
  titleByPathPrefix: Record<string, PrismPathBarTitleEntry>,
  pageTitle: string,
  pageTitleContentOrOptions?:
    ReactNode | BuildPrismPathBarAutoSegmentListOptions
): PrismPathBarSegment[] {
  const options =
    pageTitleContentOrOptions !== null &&
    typeof pageTitleContentOrOptions === "object" &&
    !("$$typeof" in pageTitleContentOrOptions)
      ? (pageTitleContentOrOptions as BuildPrismPathBarAutoSegmentListOptions)
      : {
          pageTitleContent: pageTitleContentOrOptions as ReactNode | undefined,
        };
  const { pageTitleContent, lenientMissingPrefixes = false } = options;

  const normalized = normalizePathname(pathname);
  const ancestors = listAncestorPathPrefixes(normalized);
  const segmentList: PrismPathBarSegment[] = [];
  for (const prefix of ancestors) {
    segmentList.push(
      resolveTitleEntry(
        prefix,
        titleByPathPrefix[prefix],
        lenientMissingPrefixes
      )
    );
  }
  segmentList.push({ label: pageTitleContent ?? pageTitle });
  return segmentList;
}
