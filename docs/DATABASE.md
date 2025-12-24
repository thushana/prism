# Database Guide

This project uses **Drizzle ORM** with **SQLite** for local development. The database schema is defined in `packages/database/source/schema.ts`.

## Philosophy

- **Type-safe**: Drizzle ORM provides excellent TypeScript support
- **Simple**: SQLite for local development, easy to migrate to PostgreSQL for production
- **Schema-first**: Define schema in TypeScript, generate migrations automatically
- **Zero-config**: Works out of the box with minimal setup

## Quick Start

```bash
# Generate migrations from schema changes
npm run database:generate

# Apply migrations
npm run database:migrate

# Push schema changes directly (development only)
npm run database:push

# Open Drizzle Studio (database GUI)
npm run database:studio
```

## Connecting

```typescript
import { db } from "database";

// Query users
const users = await db.query.users.findMany();

// Query with conditions
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.email, "user@example.com"),
});

// Insert
await db.insert(users).values({
  name: "John Doe",
  email: "john@example.com",
});

// Update
await db.update(users).set({ name: "Jane Doe" }).where(eq(users.id, 1));
```

## Schema Definition

The schema is defined in `packages/database/source/schema.ts`:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

## Common Operations

### Querying

```typescript
import { db } from "database";
import { users } from "database/schema";
import { eq } from "drizzle-orm";

// Find all
const allUsers = await db.query.users.findMany();

// Find one
const user = await db.query.users.findFirst({
  where: eq(users.email, "user@example.com"),
});

// Find by ID
const userById = await db.query.users.findFirst({
  where: eq(users.id, 1),
});
```

### Inserting

```typescript
await db.insert(users).values({
  name: "John Doe",
  email: "john@example.com",
});
```

### Updating

```typescript
await db.update(users).set({ name: "Jane Doe" }).where(eq(users.id, 1));
```

### Deleting

```typescript
await db.delete(users).where(eq(users.id, 1));
```

## Migrations

### Generate Migrations

After updating the schema:

```bash
npm run database:generate
```

This creates migration files in `packages/database/migrations/`.

### Apply Migrations

```bash
npm run database:migrate
```

### Development Shortcut

For rapid development, you can push schema changes directly (bypasses migrations):

```bash
npm run database:push
```

**Note**: Only use `database:push` in development. Use migrations in production.

## Drizzle Studio

Visual database browser:

```bash
npm run database:studio
```

Opens a web interface at `http://localhost:4983` to browse and edit your database.

## Production Considerations

**SQLite is for development only.** For production:

1. **Use a managed database service**:
   - PostgreSQL (Vercel Postgres, Supabase, Neon)
   - MySQL (PlanetScale)
   - Other serverless-compatible databases

2. **Update Drizzle config**:
   - Change adapter from `better-sqlite3` to `postgres` or `mysql2`
   - Update connection string to use environment variable

3. **Example PostgreSQL setup**:

   ```typescript
   // drizzle.config.ts
   import { drizzle } from "drizzle-orm/postgres-js";
   import postgres from "postgres";

   const connectionString = process.env.DATABASE_URL!;
   const client = postgres(connectionString);
   export const db = drizzle(client);
   ```

## Adding Tables

1. **Define schema** in `packages/database/source/schema.ts`:

   ```typescript
   export const posts = sqliteTable("posts", {
     id: integer("id").primaryKey({ autoIncrement: true }),
     title: text("title").notNull(),
     content: text("content"),
     userId: integer("user_id").references(() => users.id),
     createdAt: integer("created_at", { mode: "timestamp" })
       .notNull()
       .$defaultFn(() => new Date()),
   });
   ```

2. **Export from index** in `packages/database/source/index.ts`:

   ```typescript
   export * from "./schema";
   ```

3. **Generate migration**:

   ```bash
   npm run database:generate
   ```

4. **Apply migration**:
   ```bash
   npm run database:migrate
   ```

## Troubleshooting

### Database Locked

If you see "database is locked" errors:

- Close any open database connections
- Close Drizzle Studio if it's open
- Restart your dev server

### Schema Mismatch

If migrations fail:

1. Check your schema matches the migration
2. Consider resetting the database in development:
   ```bash
   rm packages/database/*.db packages/database/*.db-wal packages/database/*.db-shm
   npm run database:push
   ```

## Related Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall architecture
- [CONVENTIONS.md](./CONVENTIONS.md) - Naming & API conventions
- [Drizzle ORM Docs](https://orm.drizzle.team/) - Official documentation
