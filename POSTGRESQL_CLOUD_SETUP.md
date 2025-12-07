# PostgreSQL Cloud Setup Guide

## Recommended: Supabase (Best Free Tier)

### Step 1: Sign Up
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (easiest)

### Step 2: Create Project
1. Click "New Project"
2. Choose organization
3. Enter project details:
   - **Name**: `iam-blog` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### Step 3: Get Connection String
1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Step 4: Update Your .env
```env
POSTGRESQL_URI=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

**Free Tier Limits:**
- 500 MB database storage
- 2 GB bandwidth/month
- Unlimited API requests
- Perfect for development and small projects

---

## Alternative: Neon (Serverless PostgreSQL)

### Step 1: Sign Up
1. Go to https://neon.tech
2. Click "Sign Up" (GitHub recommended)

### Step 2: Create Project
1. Click "Create Project"
2. Enter project name: `iam-blog`
3. Choose region
4. Click "Create Project"

### Step 3: Get Connection String
1. After project creation, you'll see the connection string
2. It looks like:
   ```
   postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb
   ```

### Step 4: Update Your .env
```env
POSTGRESQL_URI=postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb
```

**Free Tier Limits:**
- 3 GB storage
- Serverless (auto-scales)
- Branching feature (like Git for databases)

---

## Alternative: Railway

### Step 1: Sign Up
1. Go to https://railway.app
2. Sign up with GitHub

### Step 2: Create PostgreSQL Database
1. Click "New Project"
2. Click "New" → "Database" → "Add PostgreSQL"
3. Railway automatically creates the database

### Step 3: Get Connection String
1. Click on the PostgreSQL service
2. Go to **Variables** tab
3. Copy the `DATABASE_URL` value
4. It looks like:
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```

### Step 4: Update Your .env
```env
POSTGRESQL_URI=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

**Free Tier:**
- $5 credit/month
- Enough for small projects

---

## Comparison Table

| Service | Free Tier | Best For | Ease of Setup |
|---------|-----------|----------|---------------|
| **Supabase** | 500 MB | Development, Small apps | ⭐⭐⭐⭐⭐ Very Easy |
| **Neon** | 3 GB | Serverless needs, Branching | ⭐⭐⭐⭐ Easy |
| **Railway** | $5 credit | Full-stack apps | ⭐⭐⭐⭐ Easy |
| **Render** | 90-day trial | Simple deployments | ⭐⭐⭐⭐ Easy |
| **ElephantSQL** | 20 MB | Testing only | ⭐⭐⭐⭐ Easy |
| **AWS RDS** | No free tier | Production, Enterprise | ⭐⭐ Complex |
| **Google Cloud SQL** | No free tier | Production, Enterprise | ⭐⭐ Complex |
| **Azure** | No free tier | Production, Enterprise | ⭐⭐ Complex |

---

## Recommendation for Your Project

**For Development:**
- **Supabase** - Best free tier, easiest setup, includes extra features (auth, storage)

**For Production:**
- **Supabase** - If staying within free tier limits
- **Neon** - If you need more storage or serverless
- **Railway** - If you want everything in one place

---

## Quick Start: Supabase Setup

1. **Sign up**: https://supabase.com
2. **Create project**: Click "New Project"
3. **Get connection string**: Settings → Database → Connection string (URI)
4. **Update .env**:
   ```env
   POSTGRESQL_URI=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```
5. **Test connection**: Use the test script in the migration plan

That's it! Your PostgreSQL database is ready in the cloud.



