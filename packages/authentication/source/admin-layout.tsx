"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PrismLayoutMain,
  PrismPathBar,
  PrismTypography,
  normalizePathname,
  type PrismPathBarIcon,
  type PrismPathBarSegment,
  type PrismPathBarTitleEntry,
} from "@ui";
import { SignOutForm } from "./sign-out-form";

const ADMIN_SUBNAV_LINK_CLASS =
  "group inline-flex underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export type AdminBackLinkProps = {
  href?: string;
  label?: string;
};

/**
 * Back-navigation link for admin sub-pages.
 * Defaults to "← Admin" pointing at /admin.
 */
export function AdminBackLink({
  href = "/admin",
  label = "Admin",
}: AdminBackLinkProps): React.JSX.Element {
  return (
    <Link href={href} className={`${ADMIN_SUBNAV_LINK_CLASS} w-fit`}>
      <PrismTypography
        role="body"
        size="small"
        as="span"
        color={{ semanticText: "muted" }}
        className="group-hover:text-foreground"
      >
        ← {label}
      </PrismTypography>
    </Link>
  );
}

export type { PrismPathBarIcon, PrismPathBarSegment };

export type AdminPageShellProps = {
  children: React.ReactNode;
  /**
   * Page title string; used as the path bar leaf when `prismPathBarTitleByPathPrefix` is set.
   * When `titleSlot` is set, this is still used for the path bar leaf while `titleSlot` replaces the gradient heading.
   */
  title?: string;
  /**
   * Optional rich path bar leaf (e.g. emoji raster + name). When set with auto path bar, {@link title}
   * stays the plain-text leaf; the bar renders this node instead.
   */
  pathBarPageTitleContent?: React.ReactNode;
  /**
   * Optional client heading (e.g. live-updating title). When set, replaces the default gradient
   * {@link PrismTypography} block; keep passing `title` for the path bar leaf when using auto path bar.
   */
  titleSlot?: React.ReactNode;
  /** Muted description rendered below the title. */
  description?: string;
  /**
   * Explicit {@link PrismPathBar} segments. When non-empty, wins over `prismPathBarTitleByPathPrefix`.
   */
  explicitPrismPathBarSegments?: PrismPathBarSegment[];
  /**
   * Auto {@link PrismPathBar} from `usePathname()` + map. Requires `title` (same string as `<h1>` / leaf).
   * Ignored when `explicitPrismPathBarSegments` is non-empty.
   */
  prismPathBarTitleByPathPrefix?: Record<string, PrismPathBarTitleEntry>;
  /** Optional icon before path segments (e.g. a Lucide icon component). */
  prismPathBarIcon?: PrismPathBarIcon;
  /**
   * @deprecated Prefer {@link prismPathBarTitleByPathPrefix}. When set without a path bar map,
   * seeds the auto path bar ancestor at this href (defaults to `/admin` when omitted).
   */
  backHref?: string;
  /** Label for the `/admin` (or `backHref`) path bar segment. Defaults to "Admin". */
  backLabel?: string;
  /** Whether to show the Sign out button. Defaults to true. */
  showSignOut?: boolean;
  /** Additional className for the {@link PrismLayoutMain} content column (`.content-main`, max-width xl). */
  className?: string;
};

/**
 * Consistent outer shell for all admin pages.
 *
 * Provides:
 *  - Full-viewport padding and a centered {@link PrismLayoutMain} column (same width as `.content-main` / 1280px)
 *  - {@link PrismPathBar} slash breadcrumbs on sub-pages when `title` is set (auto from pathname, or explicit segments)
 *  - Legacy {@link AdminBackLink} only when `backHref` is set without `title` and no path bar is configured
 *  - An optional page title + description header
 *  - A Sign out link in the top-right corner (suppress with showSignOut={false})
 */
export function AdminPageShell({
  children,
  title,
  pathBarPageTitleContent,
  titleSlot,
  description,
  explicitPrismPathBarSegments,
  prismPathBarTitleByPathPrefix,
  prismPathBarIcon,
  backHref,
  backLabel = "Admin",
  showSignOut = true,
  className,
}: AdminPageShellProps): React.JSX.Element {
  const pathname = usePathname() ?? "";
  const normalizedPathname = normalizePathname(pathname);
  const showPathBarExplicit = Boolean(
    explicitPrismPathBarSegments && explicitPrismPathBarSegments.length > 0
  );
  const autoPathBarTitleByPathPrefix: Record<string, PrismPathBarTitleEntry> = {
    [normalizePathname(backHref ?? "/admin")]: backLabel,
    ...prismPathBarTitleByPathPrefix,
  };
  const showPathBarAuto = Boolean(
    title && normalizedPathname !== "/admin" && !showPathBarExplicit
  );
  const hasHeader =
    showPathBarExplicit ||
    showPathBarAuto ||
    backHref ||
    title ||
    titleSlot ||
    showSignOut;
  const showBackLink =
    Boolean(backHref) && !title && !showPathBarExplicit && !showPathBarAuto;

  return (
    <main className="min-h-screen w-full p-6">
      <PrismLayoutMain
        className={["flex w-full flex-col gap-8", className]
          .filter(Boolean)
          .join(" ")}
      >
        {hasHeader && (
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex flex-col gap-4">
              {showPathBarExplicit ? (
                <PrismPathBar
                  segments={explicitPrismPathBarSegments!}
                  icon={prismPathBarIcon}
                />
              ) : null}
              {showPathBarAuto ? (
                <PrismPathBar
                  mode="auto"
                  pathname={pathname}
                  titleByPathPrefix={autoPathBarTitleByPathPrefix}
                  pageTitle={title!}
                  pageTitleContent={pathBarPageTitleContent}
                  icon={prismPathBarIcon}
                  lenientMissingPrefixes
                />
              ) : null}
              {showBackLink ? (
                <AdminBackLink href={backHref!} label={backLabel} />
              ) : null}
              {(titleSlot ?? title) ? (
                <div className="space-y-1">
                  {titleSlot ?? (
                    <PrismTypography
                      role="display"
                      size="small"
                      color={{
                        gradient: {
                          swatches: ["deep-purple", "light-blue"],
                          direction: "angled",
                          shade: 700,
                        },
                      }}
                      fontWeight={900}
                      textWrap="wrap"
                    >
                      {title}
                    </PrismTypography>
                  )}
                  {description ? (
                    <PrismTypography
                      role="body"
                      size="regular"
                      color={{ semanticText: "muted" }}
                    >
                      {description}
                    </PrismTypography>
                  ) : null}
                </div>
              ) : null}
            </div>
            {showSignOut && (
              <div className="shrink-0">
                <SignOutForm />
              </div>
            )}
          </div>
        )}
        {children}
      </PrismLayoutMain>
    </main>
  );
}
