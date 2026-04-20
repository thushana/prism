import type { JSX } from "react";
import Link from "next/link";
import { PrismBadge, PrismTypography } from "@ui";

export function PrismBadgeDemo(): JSX.Element {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Variants
        </PrismTypography>
        <div className="flex flex-wrap items-center gap-2">
          <PrismBadge variant="default">Default</PrismBadge>
          <PrismBadge variant="secondary">Secondary</PrismBadge>
          <PrismBadge variant="destructive">Destructive</PrismBadge>
          <PrismBadge variant="outline">Outline</PrismBadge>
        </div>
      </section>

      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          As child (link)
        </PrismTypography>
        <p className="text-sm text-muted-foreground">
          Renders the badge styles on a child element (e.g. navigation).
        </p>
        <div className="flex flex-wrap gap-2">
          <PrismBadge asChild variant="outline">
            <Link href="/admin/prism/components" className="no-underline">
              Components index
            </Link>
          </PrismBadge>
        </div>
      </section>
    </div>
  );
}
