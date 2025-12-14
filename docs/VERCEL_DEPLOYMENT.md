# Vercel Deployment Guide

This guide explains how to deploy your IAM Blog frontend to Vercel.

## Overview

- **Frontend**: Deploy to Vercel (this guide)
- **Backend**: Deploy separately (VPS, Railway, Render, etc.)
- **Database**: Supabase (already configured)

## Prerequisites

1. **Vercel account** - Sign up at https://vercel.com (free tier available)
2. **GitHub/GitLab/Bitbucket** - Your code must be in a Git repository
3. **Backend deployed** - Your backend API must be accessible via URL

## Step 1: Prepare Your Repository

### 1.1 Ensure Code is Committed

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 1.2 Verify Build Works Locally

```bash
cd frontend
npm install
npm run build
```

The build should complete successfully and create a `frontend/build` directory.

## Step 2: Connect to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New Project"**
3. **Import your Git repository**:
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Choose your repository
   - Click "Import"

### Option B: Via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

## Step 3: Configure Project Settings

### 3.1 Framework Preset

Vercel should auto-detect **Vite**, but verify:
- **Framework Preset**: Vite
- **Root Directory**: `frontend` (or leave blank if `vercel.json` is configured)

### 3.2 Build Settings

Vercel will use `vercel.json` configuration, but you can also set:

- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `cd frontend && npm install`

### 3.3 Environment Variables

**Critical**: Set these in Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Production API URL (your backend URL)
VITE_API_URL=https://your-backend-domain.com/api

# Optional: Other environment variables
NODE_ENV=production
```

**How to set:**
1. Go to Project Settings → Environment Variables
2. Add each variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-domain.com/api`
   - **Environment**: Production, Preview, Development (select all)
3. Click "Save"

## Step 4: Deploy

### First Deployment

1. **Click "Deploy"** in Vercel Dashboard
2. **Wait for build** (usually 1-3 minutes)
3. **Check build logs** for any errors

### Automatic Deployments

After first deployment:
- **Every push to `main` branch** → Production deployment
- **Every push to other branches** → Preview deployment
- **Pull Requests** → Preview deployment

## Step 5: Configure Custom Domain (Optional)

1. **Go to Project Settings → Domains**
2. **Add your domain**: `yourdomain.com`
3. **Follow DNS instructions**:
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Or A record: `@` → Vercel IP addresses
4. **Wait for DNS propagation** (up to 24 hours)

## Step 6: Verify Deployment

### Check Frontend

1. **Visit your Vercel URL**: `https://your-project.vercel.app`
2. **Test navigation**: All pages should load
3. **Test API calls**: Check browser console for errors

### Common Issues

#### API Calls Failing

**Problem**: Frontend can't reach backend

**Solution**:
1. Verify `VITE_API_URL` is set correctly in Vercel
2. Check backend CORS settings allow Vercel domain
3. Check backend is accessible from internet

#### 404 Errors on Routes

**Problem**: React Router routes return 404

**Solution**: `vercel.json` already includes rewrite rules. If still happening:
- Verify `vercel.json` is in root directory
- Check Vercel project settings use correct configuration

#### Build Fails

**Problem**: Build errors during deployment

**Solution**:
1. Check build logs in Vercel Dashboard
2. Test build locally: `cd frontend && npm run build`
3. Fix any TypeScript/ESLint errors
4. Ensure all dependencies are in `package.json`

## Backend Configuration

### Update CORS for Vercel

Your backend needs to allow requests from Vercel domain.

**In your backend `.env`**:
```bash
# Add Vercel domain to allowed origins
FRONTEND_URL=https://your-project.vercel.app
```

**In `src/backend/server.js`**, CORS should already be configured:
```javascript
origin: process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_URL 
  : 'http://localhost:3000',
```

### Backend Deployment Options

Since Vercel is for frontend, deploy backend separately:

1. **Railway** - https://railway.app (easy, free tier)
2. **Render** - https://render.com (free tier)
3. **Fly.io** - https://fly.io (free tier)
4. **VPS** - DigitalOcean, AWS EC2, etc.
5. **Vercel Serverless Functions** - Convert backend to serverless (advanced)

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.yourdomain.com/api` |

### Optional

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |

## Vercel CLI Commands

### Deploy to Production

```bash
vercel --prod
```

### Deploy Preview

```bash
vercel
```

### View Logs

```bash
vercel logs
```

### List Deployments

```bash
vercel ls
```

### Remove Deployment

```bash
vercel remove
```

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys:
- ✅ **Production**: Every push to `main` branch
- ✅ **Preview**: Every push to other branches
- ✅ **Preview**: Every Pull Request

### Manual Deployments

You can also trigger deployments manually:
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Click "Redeploy" on any deployment

## Performance Optimization

Vercel automatically provides:
- ✅ **CDN** - Global content delivery
- ✅ **Edge Network** - Fast response times
- ✅ **Automatic HTTPS** - SSL certificates
- ✅ **Image Optimization** - Automatic image optimization
- ✅ **Caching** - Smart caching headers

### Custom Headers

Already configured in `vercel.json`:
- Static assets: 1 year cache
- JS/CSS files: 1 year cache

## Monitoring

### Vercel Analytics (Optional)

1. **Enable Analytics** in Project Settings
2. **View metrics**:
   - Page views
   - Performance metrics
   - Real user monitoring

### Error Tracking

Integrate with Sentry (already configured):
- Frontend errors automatically tracked
- Set `SENTRY_DSN` in Vercel environment variables

## Troubleshooting

### Build Timeout

**Problem**: Build takes too long

**Solution**:
- Optimize build process
- Remove unnecessary dependencies
- Use Vercel's build cache

### Environment Variables Not Working

**Problem**: `process.env.VITE_API_URL` is undefined

**Solution**:
- Variables must start with `VITE_` for Vite
- Redeploy after adding variables
- Check variable names match exactly

### API Calls to Relative URLs

**Problem**: API calls use `/api` instead of full URL

**Solution**:
- Set `VITE_API_URL` in Vercel
- Check `frontend/src/services/api.js` uses `import.meta.env.VITE_API_URL`

## Next Steps

1. ✅ Deploy frontend to Vercel
2. ✅ Configure environment variables
3. ✅ Deploy backend separately
4. ✅ Update backend CORS settings
5. ✅ Test full application
6. ✅ Set up custom domain (optional)
7. ✅ Enable analytics (optional)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

**Last Updated**: 2025-01-XX

