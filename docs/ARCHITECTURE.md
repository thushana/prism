# Architecture Decisions

## Tech Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript 5.9.3 (target: ES2022)
- **Styling**: Tailwind CSS 4.1.17
- **Database**: Drizzle ORM 0.44.7 with SQLite (better-sqlite3)
- **Testing**: Vitest 4.0.10 with React Testing Library
- **Linting**: ESLint 9.39.1
- **Formatting**: Prettier 3.6.2
- **Runtime**: Node.js >= 24.0.0 (LTS)

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `app/components/` – React components
- `data/database/` - Database schema, migrations, and connection
- `docs/` - Project documentation

## Key Decisions

- **App Router**: Using Next.js App Router (not Pages Router)
- **TypeScript Path Alias**: `@/*` points to project root
- **Database**: SQLite for simplicity, Drizzle ORM for type safety
- **Testing**: Vitest for fast unit/integration tests
- **No `src/` directory**: Following user preference for flat structure
- **No Acronyms**: Avoid acronyms whenever possible (e.g., use "database" instead of "db")
- **File Moves**: Use `git mv` for moving files to preserve history

