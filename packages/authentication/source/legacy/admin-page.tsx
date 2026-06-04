/**
 * Server-side helper for admin page authentication.
 * Checks the web authentication cookie and returns <PasswordForm /> if unauthenticated,
 * or null if authenticated. Centralises the repeated gate pattern across all admin pages.
 *
 * Usage (server component):
 *   const gate = await requireAdminPage();
 *   if (gate) return gate;
 *   // … render authenticated content
 */

import "server-only";
import * as React from "react";
import { cookies } from "next/headers";
import { checkWebAuthentication } from "./web";
import { PasswordForm } from "./password-form";

export async function requireAdminPage(): Promise<React.JSX.Element | null> {
  const cookieStore = await cookies();
  const isAuthenticated = await checkWebAuthentication(cookieStore);
  return isAuthenticated ? null : <PasswordForm />;
}
