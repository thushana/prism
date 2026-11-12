import * as React from "react";
import { notFound } from "next/navigation";
import { getPrismAdminRegistryEntry } from "@admin";
import { AdminPageShell } from "authentication";
import { requireAdminPage } from "@/library/authentication/authentication-gates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPrismComponentPage({
  params,
}: {
  params: Promise<{ component: string }>;
}): Promise<React.JSX.Element> {
  const gate = await requireAdminPage();
  if (gate) return gate;

  const { component } = await params;
  const entry = getPrismAdminRegistryEntry(component);
  if (!entry) {
    notFound();
  }

  const Demo = entry.Demo;

  return (
    <AdminPageShell
      title={entry.title}
      description={entry.description}
      showSignOut
    >
      <Demo />
    </AdminPageShell>
  );
}
