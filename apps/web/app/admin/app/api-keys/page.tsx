import * as React from "react";
import { headers } from "next/headers";
import { AdminPageShell } from "authentication";
import { requireAdminPage } from "@/lib/auth-gates";
import { auth } from "@/lib/auth";
import { PrismTypography } from "@ui";
import { ApiKeysClient } from "./api-keys-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminApiKeysPage(): Promise<React.JSX.Element> {
  const gate = await requireAdminPage();
  if (gate) return gate;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;
  if (!userId) {
    return (
      <AdminPageShell title="API keys" showSignOut>
        <PrismTypography role="body" size="regular">
          Sign in again to manage API keys.
        </PrismTypography>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      backHref="/admin"
      title="API keys"
      description="Create keys for extensions, cron jobs, or integrations. The raw key is shown once."
      showSignOut
    >
      <ApiKeysClient userId={userId} />
    </AdminPageShell>
  );
}
