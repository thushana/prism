# Build Out Checklist

This document outlines what needs to be built to fully implement the documented features.

## 🚧 Needs Implementation

### 1. CLI Tool Infrastructure (Medium Priority)

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

### 2. Database Enhancements (Low Priority)

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

### 3. Additional Packages (Optional)

**Consider adding:**

- `packages/config` - Shared configuration
- `packages/types` - Shared TypeScript types
- `packages/api` - API client utilities

**Note**: Fonts and styles have been consolidated into `packages/ui/` (fonts in `ui/fonts/`, styles in `ui/styles/`)

---

## Implementation Priority

1. **CLI** - Medium priority (useful for development workflows)
2. **Database Enhancements** - Low priority (nice to have examples)
3. **Additional Packages** - Optional (add as needed)

---

## Quick Start Implementation

### CLI (Recommended First)

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
