# Backend Deployment Guide

This guide explains how to deploy your backend API so you can use it with Vercel.

## Quick Answer

**Your backend URL will be:**
- **Railway**: `https://your-app-name.railway.app/api`
- **Render**: `https://your-app-name.onrender.com/api`
- **Fly.io**: `https://your-app-name.fly.dev/api`

---

## Option 1: Railway (Easiest) ⭐ Recommended

### Step 1: Sign Up
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

### Step 2: Deploy
1. Click "Deploy from GitHub repo"
2. Select your `iam_blog` repository
3. Railway auto-detects Node.js
4. Click "Deploy"

### Step 3: Configure Environment Variables

Go to your service → Variables tab and add:

```bash
NODE_ENV=production
PORT=3001
POSTGRESQL_URI=your-supabase-connection-string
JWT_SECRET=your-strong-secret-32-chars-minimum
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Step 4: Get Your Backend URL

1. Go to your service → Settings
2. Click "Generate Domain"
3. Your backend URL will be: `https://your-app.railway.app`
4. **For Vercel, use**: `https://your-app.railway.app/api`

---

## Option 2: Render

### Step 1: Sign Up
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Select your repository

### Step 3: Configure
- **Name**: `iam-blog-backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or paid)

### Step 4: Environment Variables

Add in "Environment" section:

```bash
NODE_ENV=production
PORT=3001
POSTGRESQL_URI=your-supabase-connection-string
JWT_SECRET=your-strong-secret-32-chars-minimum
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your backend URL: `https://your-app.onrender.com`
4. **For Vercel, use**: `https://your-app.onrender.com/api`

---

## Option 3: Fly.io

### Step 1: Install CLI
```bash
npm install -g flyctl
```

### Step 2: Sign Up
```bash
flyctl auth signup
```

### Step 3: Launch
```bash
cd /path/to/iam_blog
flyctl launch
```

Follow the prompts:
- App name: `iam-blog-backend` (or your choice)
- Region: Choose closest to you
- PostgreSQL: No (you're using Supabase)
- Redis: Optional

### Step 4: Set Secrets
```bash
flyctl secrets set NODE_ENV=production
flyctl secrets set PORT=3001
flyctl secrets set POSTGRESQL_URI="your-supabase-connection-string"
flyctl secrets set JWT_SECRET="your-strong-secret-32-chars-minimum"
flyctl secrets set FRONTEND_URL="https://your-vercel-app.vercel.app"
```

### Step 5: Deploy
```bash
flyctl deploy
```

Your backend URL: `https://your-app.fly.dev`
**For Vercel, use**: `https://your-app.fly.dev/api`

---

## After Deployment

### 1. Test Your Backend

Visit: `https://your-backend-url.com/health`

You should see:
```json
{
  "status": "healthy",
  "services": { ... }
}
```

### 2. Update Vercel Environment Variable

In Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_API_URL = https://your-backend-url.com/api
```

### 3. Update Backend CORS

In your backend environment variables (Railway/Render/Fly.io):

```
FRONTEND_URL = https://your-vercel-app.vercel.app
```

---

## Required Environment Variables

Make sure these are set in your backend hosting:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` (or hosting default) |
| `POSTGRESQL_URI` | Supabase connection | `postgresql://...` |
| `JWT_SECRET` | JWT secret (32+ chars) | `your-secret-here` |
| `FRONTEND_URL` | Vercel frontend URL | `https://your-app.vercel.app` |

---

## Troubleshooting

### Backend Not Starting

**Check logs:**
- Railway: Service → Deployments → View logs
- Render: Logs tab
- Fly.io: `flyctl logs`

**Common issues:**
- Missing environment variables
- Database connection failed
- Port mismatch

### CORS Errors

**Problem**: Frontend can't call backend

**Solution**:
1. Set `FRONTEND_URL` in backend to your Vercel URL
2. Restart backend service
3. Check backend logs for CORS errors

### Database Connection Failed

**Problem**: Can't connect to Supabase

**Solution**:
1. Verify `POSTGRESQL_URI` is correct
2. Check Supabase connection string format
3. Ensure Supabase allows connections from hosting IP

---

## Next Steps

1. ✅ Deploy backend to Railway/Render/Fly.io
2. ✅ Get backend URL
3. ✅ Test backend health endpoint
4. ✅ Set `VITE_API_URL` in Vercel
5. ✅ Set `FRONTEND_URL` in backend
6. ✅ Deploy frontend to Vercel
7. ✅ Test full application

---

**Last Updated**: 2025-01-XX

