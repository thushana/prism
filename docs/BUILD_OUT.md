# Build Out Checklist

This document outlines what needs to be built to fully implement the documented features.

## ✅ Already Implemented

- ✅ **Monorepo Structure** - npm workspaces with apps and packages
- ✅ **Database Layer** - Drizzle ORM with SQLite (basic schema)
- ✅ **UI Components** - Shared UI package with Radix UI
- ✅ **Utilities** - Shared utilities package (classnames)
- ✅ **Deployment** - Vercel deployment configuration
- ✅ **Code Quality** - TypeScript, ESLint, Prettier, Husky

## 🚧 Needs Implementation

### 1. Logger Infrastructure (High Priority)

**Status**: Documented but not implemented

**What to build:**

- `packages/logger/source/` package
- Client logger (`logger-client.ts`) - browser console wrapper
- Server logger (`logger-server.ts`) - Winston-based
- Context-specific loggers (logSearch, logSuccess, logStats, etc.)
- Environment variable configuration
- Integration with existing codebase

**Files to create:**

```
packages/logger/
├── package.json
├── tsconfig.json
└── source/
    ├── client.ts
    ├── server.ts
    └── index.ts
```

**Dependencies needed:**

- `winston` (server logger)
- `server-only` package marker

**Migration needed:**

- Replace all `console.log/error/warn` with logger calls
- Update CONVENTIONS.md to remove "planned" notes

**Reference**: See [docs/LOGGER.md](./LOGGER.md) for full specification

---

### 2. CLI Tool Infrastructure (Medium Priority)

**Status**: Documented but not implemented

**What to build:**

- `source/cli/` directory structure
- Commander.js setup
- Command registration system
- Example commands (seed, migrate, export)

**Files to create:**

```
source/cli/
├── tools.ts              # Main entry point
└── commands/
    ├── seed.ts           # Database seeding
    ├── migrate.ts        # Migration runner
    └── export.ts         # Data export
```

**Dependencies needed:**

- `commander` - CLI framework
- `tsx` or similar - TypeScript execution

**Package.json script:**

```json
{
  "scripts": {
    "tools": "tsx source/cli/tools.ts"
  }
}
```

**Reference**: See [docs/CLI.md](./CLI.md) for full specification

---

### 3. Database Enhancements (Low Priority)

**Status**: Basic implementation exists, needs expansion

**What to enhance:**

- More example tables (posts, comments, etc.)
- Database connection utilities
- Query helpers/utilities
- Migration helpers

**Current state:**

- Basic `users` table exists
- Drizzle ORM configured
- Migration system working

**Enhancements:**

- Add more example schemas
- Create database connection factory
- Add query utilities
- Add seed data scripts

**Reference**: See [docs/DATABASE.md](./DATABASE.md) for current state

---

### 4. Additional Packages (Optional)

**Consider adding:**

- `packages/styles` - Already exists but could be expanded
- `packages/config` - Shared configuration
- `packages/types` - Shared TypeScript types
- `packages/api` - API client utilities

---

## Implementation Priority

1. **Logger** - High priority (needed for production-ready logging)
2. **CLI** - Medium priority (useful for development workflows)
3. **Database Enhancements** - Low priority (nice to have examples)
4. **Additional Packages** - Optional (add as needed)

---

## Quick Start Implementation

### Logger (Recommended First)

```bash
# 1. Create package structure
mkdir -p packages/logger/source

# 2. Create package.json
# 3. Implement client.ts and server.ts
# 4. Add to workspace dependencies
# 5. Update apps to use logger
```

### CLI (Second)

```bash
# 1. Create CLI structure
mkdir -p source/cli/commands

# 2. Install commander
npm install commander

# 3. Create tools.ts entry point
# 4. Add example commands
# 5. Add npm script
```

---

## Notes

- All documentation is ready - just needs implementation
- Follow patterns in ARCHITECTURE.md and CONVENTIONS.md
- Use existing packages (ui, database, utilities) as reference
- Keep it simple - this is a starter project, not production infrastructure
