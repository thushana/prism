/**
 * Bootstrap the first admin user (run once per environment).
 *
 *   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='…' pnpm run db:seed:admin
 */

import "dotenv/config";
import { auth } from "../lib/auth";

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME ?? "Admin";

if (!email || !password) {
  console.error(
    "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in the environment."
  );
  process.exit(1);
}

async function main() {
  const created = await auth.api.createUser({
    body: {
      email: email!,
      password: password!,
      name,
      role: "admin",
    },
  });

  console.log(`Admin user ready: ${email}`, created.user?.id ?? "");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
