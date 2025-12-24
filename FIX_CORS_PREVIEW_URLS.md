# 🔧 Fix CORS for Vercel Preview URLs

## The Problem

You're seeing CORS errors from Vercel preview deployments:
- Origin: `https://iam-blog-b5g92zbko-lilis-projects-3fb4f039.vercel.app` (preview URL)
- Error: Backend CORS only allows `https://railway.com` (wrong!)

**Also**: Frontend is still using placeholder `https://your-railway-app.railway.app` instead of real Railway URL.

---

## ✅ What I Just Fixed

I updated the backend CORS configuration to:
- ✅ Allow your production Vercel URL (`https://iam-blog.vercel.app`)
- ✅ Allow ALL Vercel preview URLs (`*.vercel.app`)
- ✅ Still allow `localhost:3000` in development

**You need to commit and push this change!**

---

## ✅ What You Need to Do

### Step 1: Commit and Push the CORS Fix

```bash
git add src/backend/server.js
git commit -m "Fix CORS to allow Vercel preview URLs"
git push
```

This will trigger Railway to redeploy with the new CORS configuration.

### Step 2: Fix Railway FRONTEND_URL

1. **Railway Dashboard** → Your Service → **Variables** tab
2. **Find `FRONTEND_URL`** (or create it)
3. **Set to**: `https://iam-blog.vercel.app`
   - This is your production URL (preview URLs are now allowed automatically)
4. **Click "Save"** (Railway will auto-redeploy)

### Step 3: Fix Vercel VITE_API_URL

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Find `VITE_API_URL`** (or create it)
3. **Set to**: `https://YOUR-REAL-RAILWAY-URL.railway.app/api`
   - **Replace `YOUR-REAL-RAILWAY-URL` with your actual Railway URL!**
   - Get it from: Railway → Settings → Domains
4. **Environment**: Select **"All"** (Production, Preview, Development)
5. **Click "Save"**
6. **Redeploy**: Deployments → "..." → "Redeploy"

---

## 🧪 How to Get Your Real Railway URL

1. **Railway Dashboard** → Your Service → **Settings** tab
2. **Find "Domains"** section
3. **Your Railway URL** will be something like:
   - `https://iam-blog-production.up.railway.app`
   - OR `https://iam-blog-backend.railway.app`
   - OR `https://[your-service-name].railway.app`

**Copy this URL!** (It's NOT `your-railway-app.railway.app` - that's a placeholder!)

---

## 📋 Quick Checklist

- [ ] Committed and pushed CORS fix (`git push`)
- [ ] Railway `FRONTEND_URL` = `https://iam-blog.vercel.app`
- [ ] Vercel `VITE_API_URL` = `https://your-real-railway-url.railway.app/api`
- [ ] Vercel environment set to "All" (not just Production)
- [ ] Both services redeployed
- [ ] No CORS errors in browser console

---

## ✅ After These Fixes

**Production URL** (`https://iam-blog.vercel.app`):
- ✅ Will work (allowed by `FRONTEND_URL`)

**Preview URLs** (`https://iam-blog-*.vercel.app`):
- ✅ Will work (allowed by regex pattern `*.vercel.app`)

**Both will call**: `https://your-real-railway-url.railway.app/api`

---

## 🆘 Still Having Issues?

### Error: "your-railway-app.railway.app" in console

**Fix**: `VITE_API_URL` in Vercel is still set to placeholder. Update it with your real Railway URL.

### Error: "Access-Control-Allow-Origin header has value 'https://railway.com'"

**Fix**: `FRONTEND_URL` in Railway is set to `https://railway.com`. Change it to `https://iam-blog.vercel.app`.

### Error: CORS still blocking preview URL

**Fix**: 
1. Make sure you pushed the CORS fix (`git push`)
2. Wait for Railway to redeploy
3. Check Railway logs to confirm new code is running

---

## 📝 Summary

**Railway needs:**
- `FRONTEND_URL` = `https://iam-blog.vercel.app`
- New CORS code (commit and push!)

**Vercel needs:**
- `VITE_API_URL` = `https://your-real-railway-url.railway.app/api`
- Environment: "All" (for preview deployments)

**After fixes:**
- Production and preview URLs will both work! 🎉



