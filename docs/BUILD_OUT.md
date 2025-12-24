# Build Out Checklist

This document outlines what needs to be built to fully implement the documented features.

## 🚧 Needs Implementation

### 1. Database Enhancements (Low Priority)

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

### 2. Additional Packages (Optional)

**Consider adding:**

- `packages/config` - Shared configuration
- `packages/types` - Shared TypeScript types
- `packages/api` - API client utilities

**Note**: Fonts and styles have been consolidated into `packages/ui/` (fonts in `ui/fonts/`, styles in `ui/styles/`)

---

## Implementation Priority

1. **Database Enhancements** - Low priority (nice to have examples)
2. **Additional Packages** - Optional (add as needed)

---

## Notes

- All documentation is ready - just needs implementation
- Follow patterns in ARCHITECTURE.md and CONVENTIONS.md
- Use existing packages (ui, database, utilities) as reference
- Keep it simple - this is a starter project, not production infrastructure
