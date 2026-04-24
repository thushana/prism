import * as React from "react";
import Link from "next/link";
import { AdminPageShell } from "authentication";
import { requireAdminPage } from "authentication/admin-page";
import { PrismTypography } from "@ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const adminSections = [
  {
    title: "System",
    description: "Environment, git, and deployment details for quick checks.",
    href: "/admin/app/system",
  },
];

export default async function AdminHomePage(): Promise<React.JSX.Element> {
  const gate = await requireAdminPage();
  if (gate) return gate;

  return (
    <AdminPageShell
      title="Administrative Tools"
      description="Password-protected internal tools for this deployment."
      showSignOut
    >
      <section className="grid gap-4">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/60 hover:shadow-sm"
          >
            <PrismTypography role="title" size="large" font="sans">
              {section.title}
            </PrismTypography>
            <div className="mt-2">
              <PrismTypography role="body" size="medium" color={{ semanticText: "muted" }}>
                {section.description}
              </PrismTypography>
            </div>
          </Link>
        ))}
      </section>
    </AdminPageShell>
  );
}
