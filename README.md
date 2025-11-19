# TimeTraveler

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

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your environment variables. Never commit `.env.local` or any files containing secrets.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Next.js GitHub repository](https://github.com/vercel/next.js)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
