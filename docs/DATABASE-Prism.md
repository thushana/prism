# Database Guide

This project uses **Drizzle ORM** with **Neon PostgreSQL**. The database schema is defined in `packages/database/source/schema.ts`.

## Philosophy

- **Type-safe**: Drizzle ORM provides excellent TypeScript support
- **Production-ready**: Neon PostgreSQL for both development and production
- **Schema-first**: Define schema in TypeScript, generate migrations automatically
- **Serverless-friendly**: Uses Neon's serverless driver for optimal performance

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

The shared database package exports both `database` and `db` (they are aliases):

```typescript
// Both of these work - they reference the same instance
import { db } from "@database";
import { database } from "@database"; // Also available

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

### Shared Package vs App-Specific Database

**Shared Package (`packages/database`)**:

- Used by CLI tools, shared utilities, and cross-app functionality
- Import with: `import { db } from "@database"` or `import { database } from "@database"`
- Schema defined in `packages/database/source/schema.ts`
- Database connection: Configure via `DATABASE_URL` environment variable (Neon PostgreSQL)

**App-Specific Database (`apps/web/database`)**:

- Used for app-specific database needs and custom configurations
- Import with: `import { db } from "../database/db"` (relative import)
- Schema defined in `apps/web/database/schema.ts`
- Database connection: Configure via `DATABASE_URL` environment variable (Neon PostgreSQL)

Choose the shared package for CLI tools and shared functionality. Use app-specific database for app-specific schemas and configurations.

## Schema Definition

The schema is defined in `packages/database/source/schema.ts`:

```typescript
import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

## Common Operations

### Querying

```typescript
// You can use either 'db' or 'database' - they're the same
import { db } from "@database";
// or: import { database } from "@database";
import { users } from "@database/schema";
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

### Migration Workflow

1. **Make Schema Changes**: Edit the schema file (e.g., `packages/database/source/schema.ts`)

2. **Generate Migration**:
   ```bash
   npm run database:generate
   ```
   This creates migration files in `packages/database/migrations/` with a timestamp and name.

3. **Review Migration**: Always review the generated SQL:
   ```bash
   cat packages/database/migrations/[timestamp]_[name]/migration.sql
   ```

4. **Apply Migration**:
   ```bash
   npm run database:migrate
   ```
   
   **Important**: This uses the runtime `migrate()` function (not `drizzle-kit migrate`), which respects the `__drizzle_migrations` table and only runs new migrations.

### Best Practices

#### ✅ DO: Use Migrations for Schema Changes

- Always use `database:generate` → `database:migrate` workflow for schema changes
- Migrations are version-controlled and reproducible
- Safe for production deployments

#### ❌ DON'T: Mix `database:push` and `database:migrate`

**Problem**: If you initially created your database with `database:push`, then try to use `database:migrate`, the migration system will attempt to apply ALL migrations from scratch, including ones that create tables that already exist.

**Solution**: 
- Use migrations from the start, OR
- If you must use `database:push` initially, archive old migrations and start fresh (see troubleshooting below)

### Migration Tracking

Drizzle-kit tracks applied migrations in the `__drizzle_migrations` table:

```sql
CREATE TABLE "__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
```

Each migration is recorded with its hash (migration directory name) and timestamp.

### Development Shortcut

For rapid development, you can push schema changes directly (bypasses migrations):

```bash
npm run database:push
```

**⚠️ Warning**: Only use `database:push` in development. Mixing `database:push` and `database:migrate` can cause issues (see troubleshooting below).

## Drizzle Studio

Visual database browser:

```bash
npm run database:studio
```

Opens a web interface at `http://localhost:4983` to browse and edit your database.

## Production Considerations

**Neon PostgreSQL is used for both development and production.**

1. **Get your connection strings**:
   - Sign up at [Neon Console](https://console.neon.tech)
   - Create a new project
   - Copy the connection strings (pooled and unpooled)

2. **Configure environment variables**:
   - `DATABASE_URL`: Pooled connection for runtime queries
   - `DATABASE_URL_UNPOOLED`: Unpooled connection for migrations

3. **For Vercel deployment**:
   - Add `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in Vercel project settings
   - The same configuration works for both development and production

### Production Migration Guidelines

For production deployments:

1. **Never use `database:push`** - always use migrations
2. **Test migrations** in staging first
3. **Backup database** before applying migrations
4. **Review migration SQL** before applying
5. **Make migrations idempotent** when possible for safety

## Adding Tables

1. **Define schema** in `packages/database/source/schema.ts`:

   ```typescript
   export const posts = pgTable("posts", {
     id: serial("id").primaryKey(),
     title: text("title").notNull(),
     content: text("content"),
     userId: integer("user_id").references(() => users.id),
     createdAt: timestamp("created_at", { withTimezone: true })
       .notNull()
       .defaultNow(),
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

### Connection Issues

If you see connection errors:

- Verify `DATABASE_URL` environment variable is set correctly
- Check that your Neon database is running and accessible
- Ensure the connection string includes `?sslmode=require` for SSL
- For migrations, ensure `DATABASE_URL_UNPOOLED` is set (or `DATABASE_URL` will be used)

### Migration Fails: "Table already exists"

**Cause**: Database was created with `database:push`, then migrations are being applied.

**Solution**: Archive old migrations and start fresh:
1. Move existing migrations to an archive folder: `mv database/migrations/* database/migrations-archive/`
2. Clear the migrations table: `TRUNCATE TABLE __drizzle_migrations;`
3. Mark initial state as applied (or generate a new initial migration if needed)
4. From now on, use the proper migration workflow going forward

### Schema Mismatch

If migrations fail:

1. Check your schema matches the migration
2. Verify the database connection is working
3. Review the migration SQL file for errors
4. Consider making the migration idempotent if it's failing due to existing objects

## Related Docs

- [ARCHITECTURE-Prism.md](./ARCHITECTURE-Prism.md) - Overall architecture
- [CONVENTIONS-Prism.md](./CONVENTIONS-Prism.md) - Naming & API conventions
- [Drizzle ORM Docs](https://orm.drizzle.team/) - Official documentation
