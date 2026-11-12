import * as React from "react";
import Link from "next/link";
import { getPrismAdminComponentHubLinks } from "@admin";
import { AdminPageShell } from "authentication";
import { PrismTypography } from "@ui";
import { requireAdminPage } from "@/library/authentication/authentication-gates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPrismComponentsHubPage(): Promise<React.JSX.Element> {
  const gate = await requireAdminPage();
  if (gate) return gate;

  const links = getPrismAdminComponentHubLinks();

  return (
    <AdminPageShell
      title="Prism Components"
      description="Live playgrounds for @ui — Customize, Example, and Code."
      showSignOut
    >
      <section className="grid gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/60 hover:shadow-sm"
          >
            <PrismTypography role="title" size="large" font="sans">
              {link.title}
            </PrismTypography>
            <div className="mt-2">
              <PrismTypography
                role="body"
                size="regular"
                color={{ semanticText: "muted" }}
              >
                {link.description}
              </PrismTypography>
            </div>
          </Link>
        ))}
      </section>
    </AdminPageShell>
  );
}
