# 🔄 Vercel vs Railway Deployment - When to Deploy What

## Quick Answer

**You need to deploy/redeploy BOTH services separately:**

1. **Vercel** (Frontend) - Needs redeploy when you change `VITE_API_URL`
2. **Railway** (Backend) - Needs redeploy when you change `FRONTEND_URL` or push code

**The integration doesn't automatically deploy one when you deploy the other.**

---

## Understanding the Integration

If you have a **Railway integration** in Vercel, it typically provides:
- ✅ Monitoring/observability (see Railway logs in Vercel)
- ✅ Status indicators
- ✅ Possibly webhook notifications

**It does NOT:**
- ❌ Automatically deploy Railway when you deploy Vercel
- ❌ Automatically deploy Vercel when you deploy Railway
- ❌ Share environment variables automatically
- ❌ Sync deployments

**They are still separate services that need separate deployments!**

---

## When to Deploy/Redeploy

### Vercel (Frontend) - Deploy When:

1. ✅ **You change `VITE_API_URL`** environment variable
   - **Action**: Vercel Dashboard → Deployments → Redeploy

2. ✅ **You push code changes** to the `frontend/` directory
   - **Action**: Usually auto-deploys on git push, or manually redeploy

3. ✅ **You change other Vercel settings** (Root Directory, Build Command, etc.)
   - **Action**: Vercel Dashboard → Deployments → Redeploy

### Railway (Backend) - Deploy When:

1. ✅ **You change `FRONTEND_URL`** environment variable
   - **Action**: Railway auto-redeploys when you save variables (or manually redeploy)

2. ✅ **You push code changes** to the backend (`src/backend/`)
   - **Action**: Railway auto-deploys on git push (if connected), or manually redeploy

3. ✅ **You change other Railway settings** (Build Command, etc.)
   - **Action**: Railway Dashboard → Deployments → Redeploy

---

## Current Situation

### What You Just Did:

1. ✅ **Updated `VITE_API_URL` in Vercel**
   - **Action Required**: **Redeploy Vercel** ✅
   - Railway integration doesn't help here - you need to redeploy Vercel manually

2. ✅ **Updated `FRONTEND_URL` in Railway** (from earlier)
   - **Action**: Railway should auto-redeploy, but verify it did

### What You Need to Do Now:

1. **Vercel**: 
   - Go to Deployments → Click "..." → "Redeploy"
   - Wait for deployment to complete
   - This applies the new `VITE_API_URL` value

2. **Railway** (verify):
   - Check Railway → Deployments tab
   - Should show recent deployment after you saved `FRONTEND_URL`
   - If not, manually redeploy

---

## How to Check if Deployments Are Needed

### Check Vercel:

1. **Vercel Dashboard** → **Deployments** tab
2. **Look at latest deployment**:
   - **Created date**: Was it after you updated `VITE_API_URL`?
   - **If NO**: You need to redeploy
   - **If YES**: Should be good (but verify the value is correct)

### Check Railway:

1. **Railway Dashboard** → Your Service → **Deployments** tab
2. **Look at latest deployment**:
   - **Created date**: Was it after you updated `FRONTEND_URL`?
   - **If NO**: You may need to redeploy
   - **If YES**: Should be good

---

## Step-by-Step: Deploy Both Now

### Step 1: Redeploy Vercel (Required)

1. **Vercel Dashboard** → Your Project → **Deployments** tab
2. **Find latest deployment**
3. **Click "..."** (three dots)
4. **Click "Redeploy"**
5. **Wait for completion** (1-3 minutes)
6. **Verify**: Check that new deployment shows correct `VITE_API_URL` in build logs

### Step 2: Verify Railway Deployment

1. **Railway Dashboard** → Your Service → **Deployments** tab
2. **Check latest deployment**:
   - If it's recent (after you saved `FRONTEND_URL`): ✅ Good
   - If it's old: Click "Redeploy" to be safe

### Step 3: Test After Both Deploy

1. **Wait for both deployments to complete**
2. **Visit**: `https://iam-blog.vercel.app`
3. **Open browser console** (F12)
4. **Should see**:
   - ✅ API calls to `https://iamblog-production.up.railway.app/api/...`
   - ✅ No CORS errors
   - ✅ Blog posts loading

---

## Common Misconceptions

### ❌ "The integration auto-deploys Railway when I deploy Vercel"

**False!** The integration is for monitoring/observability, not deployment automation.

### ❌ "I only need to deploy Vercel"

**False!** Both services are independent:
- Vercel = Frontend (needs redeploy for `VITE_API_URL` changes)
- Railway = Backend (needs redeploy for `FRONTEND_URL` changes)

### ❌ "Changing environment variables auto-deploys"

**Partially true:**
- **Railway**: Auto-redeploys when you save variables ✅
- **Vercel**: Does NOT auto-redeploy - you must manually redeploy ❌

---

## Summary

| Service | When to Deploy | How to Deploy |
|---------|---------------|---------------|
| **Vercel** (Frontend) | After changing `VITE_API_URL` or frontend code | Manual: Deployments → Redeploy |
| **Railway** (Backend) | After changing `FRONTEND_URL` or backend code | Usually auto, or Manual: Deployments → Redeploy |

**Key Points:**
- ✅ **Vercel integration with Railway** = Monitoring only, not deployment automation
- ✅ **Both services need separate deployments**
- ✅ **Vercel requires manual redeploy** after env var changes
- ✅ **Railway usually auto-redeploys** after env var changes

**Right Now**: You need to **manually redeploy Vercel** to apply the `VITE_API_URL` change! 🎯



