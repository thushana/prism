# Starter Project (Monorepo)

A [Next.js](https://nextjs.org) monorepo built with TypeScript and Tailwind CSS. This project uses npm workspaces to manage multiple applications and shared packages.

## Project Structure

```
starter-project/
├── apps/
│   ├── web/              # Main customer-facing application
│   └── admin/            # Admin dashboard
├── packages/
│   ├── ui/               # Shared UI components
│   ├── database/         # Database layer (Drizzle ORM + SQLite)
│   └── utilities/        # Shared utility functions
└── package.json          # Root workspace configuration
```

## Prerequisites

- Node.js >= 22.0.0 (as specified in `package.json`)
- npm (comes with Node.js)

## Getting Started

### Installation

Install all dependencies for the monorepo:

```bash
npm install
```

This will install dependencies for all workspaces (apps and packages).

### Development

Run both apps concurrently in development mode:

```bash
npm run dev
```

This will:

- Kill any existing dev servers on ports 3000 and 3001
- Start both web and admin apps with colored output (blue for web, green for admin)
- Web app: http://localhost:3000 (also http://www.localhost:3000 and http://web.localhost:3000)
- Admin app: http://localhost:3001 (also http://admin.localhost:3001)

Or run individual apps:

```bash
# Web app (http://localhost:3000)
npm run dev:web

# Admin app (http://localhost:3001)
npm run dev:admin
```

#### Subdomain Setup (Optional)

For subdomain routing (`www.localhost`, `web.localhost`, `admin.localhost`), run the setup script once:

```bash
npm run dev:setup
```

This adds the subdomains to your `/etc/hosts` file. After setup, you can access:

- Web: `http://www.localhost:3000` or `http://web.localhost:3000`
- Admin: `http://admin.localhost:3001`

## Available Scripts

### Development

- `npm run dev` - Run all apps concurrently in development mode (kills existing servers first)
- `npm run dev:web` - Run web app only (port 3000)
- `npm run dev:admin` - Run admin app only (port 3001)
- `npm run dev:kill` - Kill all development servers on ports 3000 and 3001
- `npm run dev:setup` - Set up subdomain routing (adds entries to `/etc/hosts`)

### Building

- `npm run build` - Build all apps
- `npm run build:web` - Build web app only
- `npm run build:admin` - Build admin app only

### Production

- `npm run start` - Start all production servers
- `npm run start:web` - Start web app (port 3000)
- `npm run start:admin` - Start admin app (port 3001)

### Code Quality

- `npm run typecheck` - Run TypeScript type checking across all workspaces
- `npm run lint` - Run ESLint across all workspaces
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run quality` - Run typecheck, lint, format, and tests
- `npm run quality:quick` - Run typecheck, lint, and format (no tests)

### Testing

- `npm run test` - Run all tests
- `npm run test:run` - Run all tests once
- `npm run test:ui` - Run tests with Vitest UI (web app)
- `npm run test:coverage` - Generate coverage report (web app)

### Database

- `npm run database:generate` - Generate database migrations
- `npm run database:migrate` - Run database migrations
- `npm run database:push` - Push schema changes to database
- `npm run database:studio` - Open Drizzle Studio (database GUI)

### Utilities

- `npm run clean` - Clean build artifacts
- `npm run watch` - Watch TypeScript files

## Tech Stack

### Core

- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript 5.9.3 (target: ES2022)
- **Styling**: Tailwind CSS 4.1.17
- **Monorepo**: npm workspaces

### Apps

- **apps/web**: Main customer-facing Next.js application
- **apps/admin**: Admin dashboard with dev-sheet for development info

### Packages

- **packages/ui**: Shared UI components (Button, Card, Badge, Icon)
  - Radix UI primitives
  - Class Variance Authority for variants
  - Material Symbols Rounded icons (via Google Fonts)
- **packages/database**: Database layer
  - Drizzle ORM 0.44.7
  - SQLite with better-sqlite3 (development)
- **packages/utilities**: Shared utility functions
  - `cn()` - Tailwind class name merger

### Development

- **Testing**: Vitest 4.0.10 with React Testing Library
- **Linting**: ESLint 9.39.1 with Next.js config
- **Formatting**: Prettier 3.6.2
- **Git Hooks**: Husky 9.1.7 with lint-staged
- **Fonts**: Geist and Geist Mono via `next/font`

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. Tests should be placed in files ending with `.test.ts` or `.test.tsx`.

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Database

This project uses [Drizzle ORM](https://orm.drizzle.team/) with SQLite for development. The database schema is defined in `packages/database/source/schema.ts`.

### Usage Example

```typescript
import { db } from "database";

// Both apps can import from the shared database package
const data = await db.query.users.findMany();
```

### Database Commands

```bash
# Generate migrations from schema changes
npm run database:generate

# Apply migrations
npm run database:migrate

# Push schema changes directly (development)
npm run database:push

# Open Drizzle Studio GUI
npm run database:studio
```

## Shared Packages

### Using Shared Packages

All apps can import from shared packages:

```typescript
// Import UI components
import { Button, Card } from "ui";

// Import database
import { db } from "database";

// Import utilities
import { cn } from "utilities";
```

### Package Structure

Each package follows the same structure:

```
packages/[package-name]/
├── source/           # Source files
│   └── index.ts      # Main export file
├── package.json      # Package configuration
└── tsconfig.json     # TypeScript configuration
```

## Deployment

This monorepo is designed to deploy each app independently on Vercel. See [VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) for detailed instructions.

### Quick Summary

1. **Web App**: Deploy from `apps/web` root directory
2. **Admin App**: Deploy from `apps/admin` root directory

Both projects can point to the same GitHub repository but with different root directories.

### Custom Domains

- Web: `yourdomain.com` or `www.yourdomain.com`
- Admin: `admin.yourdomain.com`

### Database for Production

**Important**: SQLite with `better-sqlite3` is for local development only. For production:

- Use a managed database service (PostgreSQL, MySQL, etc.)
- Consider Vercel Postgres or other serverless-compatible databases
- Update the database package to use the appropriate Drizzle adapter

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your environment variables. Never commit `.env.local` or any files containing secrets.

Environment variables can be set per-app in Vercel or at the root level for all apps.

## Learn More

### Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub repository](https://github.com/vercel/next.js)

### Monorepos

- [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Turborepo](https://turbo.build/) - Consider for larger monorepos

### Drizzle ORM

- [Drizzle Documentation](https://orm.drizzle.team/)
- [Drizzle with Next.js](https://orm.drizzle.team/docs/tutorials/drizzle-with-nextjs)

## Contributing

1. Make changes in the appropriate workspace
2. Run `npm run quality` to ensure code quality
3. Commit with descriptive messages (see `.cursor/commands/commitmessage.md`)
4. Pre-commit hooks will automatically format and lint your code

## License

This project is private and not licensed for public use.
