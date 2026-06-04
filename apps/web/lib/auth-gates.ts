import "server-only";

import { createAuthGates } from "authentication/gates";
import { auth } from "@/lib/auth";

export const {
  checkSession,
  requireAdminPage,
  requireSessionPage,
  requireSessionApi,
  requireSessionPageOrRedirect,
} = createAuthGates(auth);
