import { db } from "./db";
import { users } from "./schema";

async function seed() {
  try {
    console.log(`Seeding database...`);
    console.log(
      `DATABASE_URL: ${process.env.DATABASE_URL ? "✅ Set" : "❌ Not set"}`
    );

    // Clear existing users
    await db.delete(users);

    // Insert seed data
    await db.insert(users).values([
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
    ]);

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  }
}

seed();
