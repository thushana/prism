import "server-only";

import { createPrismAuth } from "authentication/better-auth";
import { readApplicationSettings } from "application-settings";
import { db } from "@/database/db";
import * as schema from "@/database/schema";
import { authEnv } from "@/config/auth";

const { nameDisplay } = readApplicationSettings();

export const auth = createPrismAuth({
  db,
  schema,
  secret: authEnv.BETTER_AUTH_SECRET,
  baseURL: authEnv.BETTER_AUTH_URL,
  trustedOrigins: [authEnv.BETTER_AUTH_URL],
  rpName: nameDisplay,
});
