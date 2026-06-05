/**
 * Bootstrap the first admin user (run once per environment).
 *
 *   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='…' pnpm run db:seed:admin
 *
 * Creates the auth instance directly (bypassing library/authentication/authentication.ts which uses server-only).
 * Re-running for an existing email resets the password and ensures role=admin.
 */

import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { createPrismAuth } from "authentication/better-auth";
import { db } from "./db";
import * as schema from "./schema";
import { account, user } from "./schema/auth";

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME ?? "Admin";

if (!email || !password) {
  console.error(
    "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in the environment."
  );
  process.exit(1);
}

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

if (!secret || secret.length < 32) {
  console.error(
    "BETTER_AUTH_SECRET must be set and at least 32 characters long."
  );
  process.exit(1);
}

const auth = createPrismAuth({ db, schema, secret, baseURL });

function isUserExistsError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "body" in err &&
    typeof (err as { body?: { code?: string } }).body?.code === "string" &&
    (err as { body: { code: string } }).body.code ===
      "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
  );
}

async function resetAdminPassword(
  normalizedEmail: string,
  plainPassword: string
): Promise<string> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);
  const existing = rows[0];
  if (!existing) {
    throw new Error(`User ${normalizedEmail} not found after duplicate error.`);
  }

  const hashedPassword = await hashPassword(plainPassword);
  await db
    .update(account)
    .set({ password: hashedPassword })
    .where(
      and(eq(account.userId, existing.id), eq(account.providerId, "credential"))
    );
  await db
    .update(user)
    .set({ role: "admin", name })
    .where(eq(user.id, existing.id));

  return existing.id;
}

async function main() {
  try {
    const created = await auth.api.createUser({
      body: {
        email: email!,
        password: password!,
        name,
        role: "admin",
      },
    });

    console.log(`Admin user created: ${email}`, created.user?.id ?? "");
  } catch (err) {
    if (!isUserExistsError(err)) throw err;

    const userId = await resetAdminPassword(email!, password!);
    console.log(`Admin password reset: ${email}`, userId);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
