import * as React from "react";
import { PasskeySettings } from "authentication/passkey-settings";
import { AdminPageShell } from "authentication";
import { requireAdminPage } from "@/lib/auth-gates";
import { authEnv } from "@/config/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSecurityPage(): Promise<React.JSX.Element> {
  const gate = await requireAdminPage();
  if (gate) return gate;

  return (
    <AdminPageShell
      title="Security"
      description="Manage passkeys and other sign-in options for your account."
      showSignOut
    >
      <PasskeySettings authBaseURL={authEnv.BETTER_AUTH_URL} />
    </AdminPageShell>
  );
}
