import "server-only";

import { createApiAuthentication } from "authentication/api";
import { auth } from "@/library/authentication/authentication";

export const { requireApiAuthentication } = createApiAuthentication(auth);
