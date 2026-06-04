import "server-only";

import { headers } from "next/headers";
import type { PrismAuth } from "./server";

export type PrismAuthSessionResult = Awaited<
  ReturnType<PrismAuth["api"]["getSession"]>
>;

export type PrismSessionUser = NonNullable<PrismAuthSessionResult>["user"];

export function isAdminUser(user: PrismSessionUser | undefined): boolean {
  if (!user) {
    return false;
  }
  const role = (user as { role?: string | null }).role;
  return role === "admin";
}

export async function getSessionFromAuth(
  auth: PrismAuth
): Promise<PrismAuthSessionResult> {
  return auth.api.getSession({
    headers: await headers(),
  });
}
