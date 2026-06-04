import "server-only";

import { createPrismAuth } from "authentication/better-auth";
import { db } from "@/database/db";
import * as schema from "@/database/schema";
import { authEnv } from "@/config/auth";

export const auth = createPrismAuth({
  db,
  schema,
  secret: authEnv.BETTER_AUTH_SECRET,
  baseURL: authEnv.BETTER_AUTH_URL,
  trustedOrigins: [authEnv.BETTER_AUTH_URL],
});
