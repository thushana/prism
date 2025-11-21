# Vercel Deployment Guide

This monorepo contains two separate Next.js applications that can be deployed independently to Vercel.

## Setup

### Project 1: Web App (apps/web)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure:
   - **Project Name**: `starter-project-web` (or your preferred name)
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build -w apps/web`
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `npm install`

5. Add custom domain (optional):
   - Go to Project Settings → Domains
   - Add: `yourdomain.com` or `www.yourdomain.com`

### Project 2: Admin App (apps/admin)

1. In Vercel Dashboard, click "Add New" → "Project"
2. Import the **same** Git repository
3. Configure:
   - **Project Name**: `starter-project-admin` (or your preferred name)
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/admin`
   - **Build Command**: `npm run build -w apps/admin`
   - **Output Directory**: `apps/admin/.next`
   - **Install Command**: `npm install`

4. Add custom domain (optional):
   - Go to Project Settings → Domains
   - Add: `admin.yourdomain.com`

## Deployment Behavior

- **Automatic Deployments**: Both projects will deploy automatically on push to main
- **Smart Builds**: Vercel detects changes and only builds affected apps
- **Independent Scaling**: Each app can be scaled independently
- **Separate URLs**:
  - Web: `starter-project-web.vercel.app` → `yourdomain.com`
  - Admin: `starter-project-admin.vercel.app` → `admin.yourdomain.com`

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

Both projects can run on Vercel's **Free (Hobby) tier**:

- Unlimited deployments
- 100 GB bandwidth/month (shared)
- 6,000 build minutes/month (shared)
- Smart builds only rebuild changed apps

## Manual Deployment

To deploy manually:

```bash
# Deploy web app
cd apps/web
vercel

# Deploy admin app
cd apps/admin
vercel
```

## Troubleshooting

### Build fails with "Cannot find module"

- Ensure root `package.json` has `"workspaces": ["apps/*", "packages/*"]`
- Verify install command includes workspace dependencies

### Changes not deploying

- Check Vercel build logs
- Verify the correct root directory is set
- Ensure Git push includes all changed files
