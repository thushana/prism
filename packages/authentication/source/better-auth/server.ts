import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { apiKey } from "@better-auth/api-key";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
export type PrismAuthSchema = Record<string, unknown>;

export interface CreatePrismAuthOptions {
  // App-owned Drizzle instance (must include auth schema in its schema map).
  db: Parameters<typeof drizzleAdapter>[0];
  schema: PrismAuthSchema;
  secret: string;
  baseURL: string;
  trustedOrigins?: string[];
}

export function createPrismAuth({
  db,
  schema,
  secret,
  baseURL,
  trustedOrigins = [],
}: CreatePrismAuthOptions) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    secret,
    baseURL,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    plugins: [
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
      }),
      apiKey(),
      nextCookies(),
    ],
  });
}

export type PrismAuth = ReturnType<typeof createPrismAuth>;
