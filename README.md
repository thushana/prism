# StarterProject

A [Next.js](https://nextjs.org) project built with TypeScript and Tailwind CSS.

## Prerequisites

- Node.js >= 24.0.0

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run quality` - Run typecheck, lint, and format
- `npm run database:generate` - Generate database migrations
- `npm run database:migrate` - Run database migrations
- `npm run database:push` - Push schema changes to database
- `npm run database:studio` - Open Drizzle Studio (database GUI)
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run watch` - Watch TypeScript files and compile
- `npm run clean` - Clean build artifacts
- `npm run dev:kill` - Kill all development servers

## Tech Stack

- **Framework**: Next.js 16.0.3
- **Language**: TypeScript 5.9.3 (target: ES2022)
- **Styling**: Tailwind CSS 4.1.17
- **Database**: Drizzle ORM 0.44.7 with SQLite (better-sqlite3)
- **Testing**: Vitest 4.0.10 with React Testing Library
- **Linting**: ESLint 9.39.1
- **Formatting**: Prettier 3.6.2
- **Fonts**: [Geist](https://vercel.com/font) and Geist Mono via `next/font`

## Testing

This project uses [Vitest](https://vitest.dev/) for testing with React Testing Library. Tests should be placed in files ending with `.test.ts` or `.test.tsx`.

Run tests with:
```bash
npm run test
```

For an interactive UI:
```bash
npm run test:ui
```

For coverage reports:
```bash
npm run test:coverage
```

## Database

This project uses [Drizzle ORM](https://orm.drizzle.team/) with SQLite. The database schema is defined in `data/database/schema.ts`.

### Database Commands

- `npm run database:generate` - Generate migration files from schema changes
- `npm run database:migrate` - Apply migrations to the database
- `npm run database:push` - Push schema changes directly (useful for development)
- `npm run database:studio` - Open Drizzle Studio to browse and edit data

### Usage Example

```typescript
import { database } from "@/data/database";
import { users } from "@/data/database/schema";

// Query
const allUsers = await database.select().from(users);

// Insert
await database.insert(users).values({
  name: "John Doe",
  email: "john@example.com",
  createdAt: new Date(),
});
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your environment variables. Never commit `.env.local` or any files containing secrets.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Next.js GitHub repository](https://github.com/vercel/next.js)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Quick Deploy

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com/new)
3. Vercel will automatically detect Next.js and configure the build settings
4. Add any required environment variables in the Vercel dashboard
5. Deploy!

### Configuration

This project includes a `vercel.json` configuration file with:
- Node.js 24.x runtime
- Build and install commands
- Function timeout settings (10 seconds)

### Database Considerations

**Important**: SQLite with `better-sqlite3` has limitations on Vercel's serverless platform:
- Serverless functions are stateless and ephemeral
- No persistent file system for database files
- Native bindings may not work in Vercel's environment

**For production deployments**, consider:
- Using a managed database service (PostgreSQL, MySQL, etc.)
- Using Vercel Postgres or other serverless-compatible databases
- Migrating to Drizzle ORM with a PostgreSQL adapter

For development, SQLite works perfectly fine locally.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
