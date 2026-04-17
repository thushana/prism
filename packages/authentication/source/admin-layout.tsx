"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PrismPathBar,
  PrismTypography,
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
        color="muted"
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
   * Page title shown as `<h1>`; also used as the path bar leaf when `prismPathBarTitleByPathPrefix` is set.
   */
  title?: string;
  /** Muted description rendered below the title. */
  description?: string;
  /**
   * Explicit {@link PrismPathBar} segments. When non-empty, wins over `prismPathBarTitleByPathPrefix`.
   */
  explicitPrismPathBarSegmentList?: PrismPathBarSegment[];
  /**
   * Auto {@link PrismPathBar} from `usePathname()` + map. Requires `title` (same string as `<h1>` / leaf).
   * Ignored when `explicitPrismPathBarSegmentList` is non-empty.
   */
  prismPathBarTitleByPathPrefix?: Record<string, PrismPathBarTitleEntry>;
  /** Optional icon before path segments (e.g. a Lucide icon component). */
  prismPathBarIcon?: PrismPathBarIcon;
  /** If provided, renders an AdminBackLink when no path bar is shown. */
  backHref?: string;
  /** Label for the back link. Defaults to "Admin". */
  backLabel?: string;
  /** Whether to show the Sign out button. Defaults to true. */
  showSignOut?: boolean;
  /** Additional className for the outer <main> element. */
  className?: string;
};

/**
 * Consistent outer shell for all admin pages.
 *
 * Provides:
 *  - A centred <main> with standard Prism admin padding and max-width
 *  - An optional back link (pass backHref when not using {@link PrismPathBar})
 *  - Optional {@link PrismPathBar} (`explicitPrismPathBarSegmentList` or `prismPathBarTitleByPathPrefix` + `title`)
 *  - An optional page title + description header
 *  - A Sign out link in the top-right corner (suppress with showSignOut={false})
 */
export function AdminPageShell({
  children,
  title,
  description,
  explicitPrismPathBarSegmentList,
  prismPathBarTitleByPathPrefix,
  prismPathBarIcon,
  backHref,
  backLabel = "Admin",
  showSignOut = true,
  className,
}: AdminPageShellProps): React.JSX.Element {
  const pathname = usePathname();
  const showPathBarExplicit = Boolean(
    explicitPrismPathBarSegmentList &&
      explicitPrismPathBarSegmentList.length > 0
  );
  const showPathBarAuto = Boolean(
    prismPathBarTitleByPathPrefix && title && !showPathBarExplicit
  );
  const hasHeader =
    showPathBarExplicit ||
    showPathBarAuto ||
    backHref ||
    title ||
    showSignOut;
  const showBackLink =
    Boolean(backHref) && !showPathBarExplicit && !showPathBarAuto;

  return (
    <main
      className={[
        "mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasHeader && (
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex flex-col gap-4">
            {showPathBarExplicit ? (
              <PrismPathBar
                explicitModeSegmentList={explicitPrismPathBarSegmentList!}
                icon={prismPathBarIcon}
              />
            ) : null}
            {showPathBarAuto ? (
              <PrismPathBar
                mode="auto"
                pathname={pathname}
                titleByPathPrefix={prismPathBarTitleByPathPrefix!}
                pageTitle={title!}
                icon={prismPathBarIcon}
              />
            ) : null}
            {showBackLink ? (
              <AdminBackLink href={backHref!} label={backLabel} />
            ) : null}
            {title && (
              <div className="space-y-1">
                <PrismTypography role="headline" size="large" as="h1">
                  {title}
                </PrismTypography>
                {description && (
                  <PrismTypography role="body" size="medium" color="muted">
                    {description}
                  </PrismTypography>
                )}
              </div>
            )}
          </div>
          {showSignOut && (
            <div className="shrink-0">
              <SignOutForm />
            </div>
          )}
        </div>
      )}
      {children}
    </main>
  );
}
