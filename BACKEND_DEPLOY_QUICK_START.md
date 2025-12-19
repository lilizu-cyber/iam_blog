# Backend Deployment - Quick Start Guide

## 🚀 Option 1: Railway (Easiest - Recommended)

### Step 1: Sign Up
1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (same account as your repository)

### Step 2: Deploy
1. Click **"Deploy from GitHub repo"**
2. Select your repository: **`lilizu-cyber/iam_blog`**
3. Railway will auto-detect Node.js
4. Click **"Deploy"**

### Step 3: Configure Environment Variables

Go to your service → **Variables** tab and add:

```bash
NODE_ENV=production
PORT=3001
POSTGRESQL_URI=your-supabase-connection-string
JWT_SECRET=your-strong-secret-minimum-32-characters-long
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Where to find:**
- `POSTGRESQL_URI`: From your Supabase dashboard (Connection String)
- `JWT_SECRET`: Generate a strong random string (32+ characters)
- `FRONTEND_URL`: Your Vercel URL (e.g., `https://iam-blog.vercel.app`)

### Step 4: Get Your Backend URL

1. Go to your service → **Settings**
2. Click **"Generate Domain"** (or use the default)
3. Your backend URL will be: `https://your-app.railway.app`
4. **For Vercel, use**: `https://your-app.railway.app/api`

### Step 5: Run Migrations

In Railway, go to your service → **Deployments** → **View Logs**

Or use Railway CLI:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run migrate:up
```

---

## 🚀 Option 2: Render (Free Tier)

### Step 1: Sign Up
1. Go to **https://render.com**
2. Sign up with **GitHub**

### Step 2: Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository: `lilizu-cyber/iam_blog`
3. Configure:
   - **Name**: `iam-blog-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Environment Variables

Add in **"Environment"** section:

```bash
NODE_ENV=production
PORT=3001
POSTGRESQL_URI=your-supabase-connection-string
JWT_SECRET=your-strong-secret-32-chars-minimum
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for first deployment
3. Your backend URL: `https://your-app.onrender.com`
4. **For Vercel, use**: `https://your-app.onrender.com/api`

**Note**: Free tier spins down after 15 minutes of inactivity (takes ~30 seconds to wake up).

---

## 🚀 Option 3: Fly.io

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
cd C:\Users\drilo\Documents\projects\iam_blog
flyctl launch
```

Follow prompts:
- App name: `iam-blog-backend`
- Region: Choose closest to you
- PostgreSQL: No (using Supabase)
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

## 📋 Required Environment Variables

All platforms need these:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` (or platform default) |
| `POSTGRESQL_URI` | Supabase connection | `postgresql://postgres.xxx@...` |
| `JWT_SECRET` | JWT secret (32+ chars) | `your-secret-here` |
| `FRONTEND_URL` | Vercel frontend URL | `https://iam-blog.vercel.app` |

---

## 🔑 Generate JWT Secret

If you need to generate a JWT secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use the script
npm run generate:jwt
```

---

## ✅ After Deployment

### 1. Test Your Backend

Visit: `https://your-backend-url.com/health`

You should see:
```json
{
  "status": "healthy",
  "services": { ... }
}
```

### 2. Run Migrations

```bash
# On Railway (using CLI or in service)
railway run npm run migrate:up

# On Render (add as build command or run manually)
# Add to build command: npm install && npm run migrate:up

# On Fly.io
flyctl ssh console
npm run migrate:up
```

### 3. Update Vercel Environment Variable

In Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_API_URL = https://your-backend-url.com/api
```

### 4. Update Backend CORS

Make sure `FRONTEND_URL` in backend matches your Vercel URL.

---

## 🎯 Recommended: Railway

**Why Railway?**
- ✅ Easiest setup
- ✅ Auto-detects Node.js
- ✅ Free tier available
- ✅ No cold starts
- ✅ Easy environment variable management
- ✅ Built-in logs and monitoring

---

## 📚 Full Documentation

See `docs/BACKEND_DEPLOYMENT.md` for detailed instructions.

---

**Quick Start**: Use Railway - it's the fastest and easiest option!

