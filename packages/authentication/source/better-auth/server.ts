import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import type { PasskeyOptions } from "@better-auth/passkey";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { resolvePasskeyRelyingParty } from "./passkey-options";

export type PrismAuthSchema = Record<string, unknown>;

export interface CreatePrismAuthOptions {
  // App-owned Drizzle instance (must include auth schema in its schema map).
  db: Parameters<typeof drizzleAdapter>[0];
  schema: PrismAuthSchema;
  secret: string;
  baseURL: string;
  trustedOrigins?: string[];
  /** Human-readable app name shown in passkey / WebAuthn prompts. Enables passkeys when set. */
  rpName?: string;
  /** Passkey plugin overrides (RP fields are derived from baseURL + rpName unless set here). */
  passkeys?: boolean | Omit<PasskeyOptions, "rpID" | "rpName" | "origin">;
}

export function createPrismAuth({
  db,
  schema,
  secret,
  baseURL,
  trustedOrigins = [],
  rpName,
  passkeys,
}: CreatePrismAuthOptions) {
  const passkeysEnabled = passkeys !== false && !!rpName;

  const passkeyPluginOptions =
    passkeysEnabled && rpName
      ? {
          ...resolvePasskeyRelyingParty({ baseURL, rpName }),
          ...(typeof passkeys === "object" ? passkeys : {}),
        }
      : null;

  if (passkeysEnabled && !passkeyPluginOptions) {
    throw new Error(
      "createPrismAuth: rpName is required when passkeys are enabled"
    );
  }

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
      ...(passkeyPluginOptions ? [passkey(passkeyPluginOptions)] : []),
      nextCookies(),
    ],
  });
}

export type PrismAuth = ReturnType<typeof createPrismAuth>;
