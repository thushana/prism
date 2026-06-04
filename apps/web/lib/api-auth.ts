import "server-only";

import { createApiAuthentication } from "authentication/api";
import { auth } from "@/lib/auth";

export const { requireApiAuthentication } = createApiAuthentication(auth);
