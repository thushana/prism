import "server-only";

import { createAuthGates } from "authentication/gates";
import { SIGN_IN_PATH_DROP_OFF } from "@/library/config";
import { auth } from "@/library/authentication/authentication";

export const {
  checkSession,
  requireAdminPage,
  requireSessionPage,
  requireSessionApi,
  requireSessionPageOrRedirect,
} = createAuthGates(auth, { signInPathDropOff: SIGN_IN_PATH_DROP_OFF });
