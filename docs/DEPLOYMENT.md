# Vercel Deployment Guide

This monorepo contains sample and generated Next.js applications that can be deployed independently to Vercel.

## Setup

### Sample App: Web App (apps/web)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure:
   - **Project Name**: `prism-web` (or your preferred name)
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` ⚠️ **IMPORTANT**: This must be set!
   - **Build Command**: `npm run build` (or leave default - Vercel will run from apps/web)
   - **Output Directory**: `.next` (leave default - relative to root directory)
   - **Install Command**: `cd ../.. && npm install` (install from monorepo root for workspace dependencies)

5. Add custom domain (optional):
   - Go to Project Settings → Domains
   - Add: `yourdomain.com` or `www.yourdomain.com`

### Generated Apps

Apps generated via `npm run prism generate <app-name>` can be deployed the same way:

1. In Vercel Dashboard, click "Add New" → "Project"
2. Import the **same** Git repository
3. Configure:
   - **Project Name**: `your-app-name` (or your preferred name)
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/<app-name>` ⚠️ **IMPORTANT**: This must be set!
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (leave default - relative to root directory)
   - **Install Command**: `cd ../.. && npm install` (install from monorepo root for workspace dependencies)

4. Add custom domain (optional):
   - Go to Project Settings → Domains
   - Add your custom domain

**Note:** The `apps/web` directory is kept as a sample reference. Generated apps are created in `apps/` and can be deployed independently.

## Deployment Behavior

- **Automatic Deployments**: All projects will deploy automatically on push to main
- **Smart Builds**: Vercel detects changes and only builds affected apps
- **Independent Scaling**: Each app can be scaled independently
- **Separate URLs**: Each app gets its own Vercel URL and can have custom domains

## Database Configuration

The SQLite database in `packages/database` is for local development only. For production:

1. Consider using a hosted database (PostgreSQL, MySQL, etc.)
2. Update environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL` for each project

## Environment Variables

If you need environment variables:

1. Go to Project Settings → Environment Variables
2. Add variables for each environment (Production, Preview, Development)
3. Variables can be different per project (web vs admin)

## Cost

All apps can run on Vercel's **Free (Hobby) tier**:

- Unlimited deployments
- 100 GB bandwidth/month (shared)
- 6,000 build minutes/month (shared)
- Smart builds only rebuild changed apps

## Testing Builds Locally

Test builds locally before deploying to catch potential issues early.

### Quick Test (Recommended)

Run Next.js production builds directly:

```bash
# Test web app build
npm run vercel:test:web

# Test all apps
npm run build
```

This runs the same `next build` command that Vercel uses and catches:

- TypeScript errors
- Build-time errors
- Missing dependencies
- Import resolution issues
- Environment variable issues (if set)

### Full Vercel Build Simulation

For a more accurate simulation including environment variables and build settings:

1. **Link your project** (one-time setup):

   ```bash
   # For web app
   cd apps/web
   vercel link

   # For generated apps
   cd apps/<app-name>
   vercel link
   ```

2. **Run Vercel build**:

   ```bash
   # Test web app with Vercel CLI
   npm run vercel:build:web

   # Test generated apps (from app directory)
   cd apps/<app-name>
   vercel build
   ```

This simulates Vercel's exact build process, including environment variables, build commands, and output structure.

### Build Verification Checklist

After running a build, verify:

1. **Build succeeds** - No errors during build
2. **Output directory** - `.next` folder is created correctly
3. **Static files** - Public assets are copied
4. **Type checking** - No TypeScript errors
5. **Dependencies** - All workspace packages resolve correctly
6. **Environment variables** - Required env vars are available

### Build Testing Methods

| Method                  | Speed  | Accuracy  | Setup Required |
| ----------------------- | ------ | --------- | -------------- |
| `npm run vercel:test:*` | Fast   | High      | None           |
| `vercel build`          | Slower | Very High | Vercel link    |

**Recommendation**: Use `npm run vercel:test:*` for quick checks during development, and `vercel build` before important deployments.

## Manual Deployment

Deploy manually using Vercel CLI:

```bash
# Deploy web app
cd apps/web
vercel

# Deploy generated apps
cd apps/<app-name>
vercel
```

## Troubleshooting

### Build fails with "Couldn't find any `pages` or `app` directory"

**This error means the Root Directory is not set correctly in Vercel project settings.**

1. Go to your Vercel project → Settings → General
2. Scroll to "Root Directory"
3. Set it to:
   - `apps/web` for the sample web app
   - `apps/<app-name>` for generated apps
4. Save and redeploy

### Build fails with "husky: command not found"

**This error occurs when the `prepare` script tries to run husky during `npm install`.**

The `prepare` script is configured to skip husky in CI/Vercel environments. If you still see this error:

1. Ensure your `package.json` has the conditional prepare script:
   ```json
   "prepare": "node -e \"if (!process.env.CI && !process.env.VERCEL) { try { require('husky').install() } catch { process.exit(0) } }\""
   ```
2. This script only runs husky in local development, not in Vercel builds

### Build fails with "Cannot find module"

- Ensure root `package.json` has `"workspaces": ["apps/*", "packages/*"]`
- Verify install command is `cd ../.. && npm install` to install from monorepo root
- Run `npm install` to ensure all workspace dependencies are linked

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

### Changes not deploying

- Check Vercel build logs
- Verify the correct root directory is set
- Ensure Git push includes all changed files

## CI/CD Integration

Test builds in CI before deploying:

```yaml
# .github/workflows/test-build.yml
- name: Test Vercel Build
  run: |
    npm install
    npm run vercel:test:web
    # Add tests for generated apps as needed
```
