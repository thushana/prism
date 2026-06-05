import * as React from "react";
import Link from "next/link";
import { AdminPageShell } from "authentication";
import { requireAdminPage } from "@/lib/auth-gates";
import { PrismTypography } from "@ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const adminSections = [
  {
    title: "System",
    description: "Environment, git, and deployment details for quick checks.",
    href: "/admin/app/system",
  },
  {
    title: "API keys",
    description:
      "Create keys for extensions and integrations (x-api-key header).",
    href: "/admin/app/api-keys",
  },
  {
    title: "Security",
    description: "Manage passkeys and other sign-in options for your account.",
    href: "/admin/app/security",
  },
];

export default async function AdminHomePage(): Promise<React.JSX.Element> {
  const gate = await requireAdminPage();
  if (gate) return gate;

  return (
    <AdminPageShell
      title="Administrative Tools"
      description="Sign-in protected internal tools for this deployment."
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
              <PrismTypography
                role="body"
                size="regular"
                color={{ semanticText: "muted" }}
              >
                {section.description}
              </PrismTypography>
            </div>
          </Link>
        ))}
      </section>
    </AdminPageShell>
  );
}
