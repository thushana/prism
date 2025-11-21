# Testing Vercel Builds Locally

Before deploying to Vercel, you can test builds locally to catch potential deployment issues early.

## Quick Test (Recommended)

The simplest way to test what Vercel will build is to run Next.js production builds directly:

```bash
# Test web app build
npm run vercel:test:web

# Test admin app build
npm run vercel:test:admin

# Test both apps
npm run build
```

This runs the same `next build` command that Vercel uses, so it will catch:

- TypeScript errors
- Build-time errors
- Missing dependencies
- Import resolution issues
- Environment variable issues (if you set them)

## Full Vercel Build Simulation

For a more accurate simulation of Vercel's build process (including environment variables and build settings):

### Prerequisites

1. **Link your project** (one-time setup):

   ```bash
   # For web app
   cd apps/web
   vercel link

   # For admin app
   cd apps/admin
   vercel link
   ```

2. **Pull project settings** (if not already linked):
   ```bash
   cd apps/web
   vercel pull --yes
   ```

### Run Vercel Build

```bash
# Test web app with Vercel CLI
npm run vercel:build:web

# Test admin app with Vercel CLI
npm run vercel:build:admin
```

This simulates the exact build process Vercel uses, including:

- Environment variables from Vercel
- Build command execution
- Output directory structure
- Function configuration

## What to Check

After running a build, verify:

1. **Build succeeds** - No errors during build
2. **Output directory** - `.next` folder is created correctly
3. **Static files** - Public assets are copied
4. **Type checking** - No TypeScript errors
5. **Dependencies** - All workspace packages resolve correctly
6. **Environment variables** - Any required env vars are available

## Common Issues

### Workspace Dependencies Not Found

If you see errors about missing packages (`ui`, `database`, `utilities`):

```bash
# Ensure dependencies are installed
npm install
```

### TypeScript Errors

Fix TypeScript errors before deploying:

```bash
npm run typecheck
```

### Missing Environment Variables

If your build requires environment variables:

1. Create `.env.local` in the app directory
2. Or use Vercel CLI to pull them:
   ```bash
   cd apps/web
   vercel env pull .env.local
   ```

## CI/CD Integration

You can also test builds in CI before deploying:

```yaml
# .github/workflows/test-build.yml
- name: Test Vercel Build
  run: |
    npm install
    npm run vercel:test:web
    npm run vercel:test:admin
```

## Comparison

| Method                  | Speed  | Accuracy  | Setup Required |
| ----------------------- | ------ | --------- | -------------- |
| `npm run vercel:test:*` | Fast   | High      | None           |
| `vercel build`          | Slower | Very High | Vercel link    |

**Recommendation**: Use `npm run vercel:test:*` for quick checks during development, and `vercel build` before important deployments.
