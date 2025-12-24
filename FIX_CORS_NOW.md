# 🚨 Fix CORS Errors - Action Required

## The Two Problems

1. ❌ **Frontend**: Still calling `https://your-railway-app.railway.app` (placeholder!)
2. ❌ **Backend**: CORS set to `https://railway.com` (wrong!)

---

## ✅ Fix 1: Update Vercel VITE_API_URL (5 minutes)

### Step 1: Get Your Real Railway URL

1. **Railway Dashboard** → Your Service → **Settings** tab
2. **Find "Domains"** section
3. **Copy your Railway URL** - example:
   - `https://iam-blog-production.up.railway.app`
   - OR `https://iam-blog-backend.railway.app`
   - OR `https://[your-service-name].railway.app`

**⚠️ Important**: It's NOT `your-railway-app.railway.app` - that's a placeholder!

### Step 2: Update Vercel Environment Variable

1. **Vercel Dashboard** → Your Project (`iam-blog`) → **Settings** → **Environment Variables**
2. **Find `VITE_API_URL`** (or create it if it doesn't exist)
3. **Click to edit** (or create new)
4. **Set the value** to:
   ```
   https://YOUR-REAL-RAILWAY-URL.railway.app/api
   ```
   **Replace `YOUR-REAL-RAILWAY-URL` with the URL you copied!**

   **Example:**
   ```
   https://iam-blog-production.up.railway.app/api
   ```

5. **Environment**: Select **"All"** (Production, Preview, Development)
6. **Click "Save"**

### Step 3: Redeploy Vercel

**⚠️ CRITICAL**: Environment variables require a redeploy!

1. **Go to "Deployments"** tab
2. **Click "..."** (three dots) on the latest deployment
3. **Click "Redeploy"**
4. **Wait for deployment to complete**

---

## ✅ Fix 2: Update Railway FRONTEND_URL (2 minutes)

1. **Railway Dashboard** → Your Service → **Variables** tab
2. **Find `FRONTEND_URL`** (or create it if it doesn't exist)
3. **Click to edit** (or create new)
4. **Set the value** to:
   ```
   https://iam-blog.vercel.app
   ```
   **Important**: This is your Vercel production URL, NOT Railway URL!

5. **Click "Save"** (Railway will auto-redeploy)

---

## 🧪 Verify After Fixes

### Test 1: Check Vercel Environment Variable

1. **Vercel Dashboard** → Settings → Environment Variables
2. **Verify `VITE_API_URL`** shows your real Railway URL (not placeholder)
3. **Verify** it's set for "All" environments

### Test 2: Check Railway Environment Variable

1. **Railway Dashboard** → Variables
2. **Verify `FRONTEND_URL`** = `https://iam-blog.vercel.app`
3. **Verify** Railway has redeployed (check Deployments tab)

### Test 3: Test Backend Health

1. **Visit**: `https://YOUR-REAL-RAILWAY-URL.railway.app/health`
2. **Should return**: `{"status":"ok"}`
3. **If 404 or error**: Backend isn't running - check Railway logs

### Test 4: Test Frontend

1. **Visit**: `https://iam-blog.vercel.app`
2. **Open browser console** (F12)
3. **Should see**:
   - ✅ API calls to `https://your-real-railway-url.railway.app/api/...`
   - ✅ **NO CORS errors!**
   - ✅ Blog posts loading

---

## 📋 Quick Checklist

- [ ] Got real Railway URL from Railway → Settings → Domains
- [ ] Updated Vercel `VITE_API_URL` = `https://your-real-railway-url.railway.app/api`
- [ ] Set `VITE_API_URL` for "All" environments
- [ ] **Redeployed Vercel** after updating `VITE_API_URL`
- [ ] Updated Railway `FRONTEND_URL` = `https://iam-blog.vercel.app`
- [ ] Railway auto-redeployed after saving `FRONTEND_URL`
- [ ] Backend health check works: `/health` endpoint
- [ ] No CORS errors in browser console

---

## 🆘 Troubleshooting

### Still seeing "your-railway-app.railway.app" in console?

**Problem**: `VITE_API_URL` not updated or not redeployed

**Fix**:
1. Double-check `VITE_API_URL` in Vercel shows your REAL Railway URL
2. Make sure you **redeployed** Vercel after updating it
3. Check deployment logs to confirm new environment variable is used

### Still seeing "Access-Control-Allow-Origin header has value 'https://railway.com'"?

**Problem**: `FRONTEND_URL` in Railway is still wrong

**Fix**:
1. Check Railway Variables - `FRONTEND_URL` should be `https://iam-blog.vercel.app`
2. Make sure Railway has redeployed (check Deployments tab)
3. Wait a minute for Railway to finish redeploying

### "/api/auth/me 404" error?

**Possible causes**:
1. Backend not running - check Railway logs
2. Wrong Railway URL - verify you're using the correct URL
3. Backend crashed - check Railway logs for errors

**Fix**:
- Check Railway logs for errors
- Verify backend is running: visit `/health` endpoint
- Make sure `POSTGRESQL_URI` is set correctly in Railway

### "background.js" errors?

**Fix**: These are browser extension errors (not your code). Ignore them.

### "icon-192x192.png 404"?

**Fix**: Missing PWA icon. Not critical, can fix later.

---

## 📝 Summary

**Two critical fixes:**

1. **Vercel**: `VITE_API_URL` = `https://your-real-railway-url.railway.app/api`
   - Get URL from Railway → Settings → Domains
   - Update in Vercel → Settings → Environment Variables
   - **Redeploy Vercel** (required!)

2. **Railway**: `FRONTEND_URL` = `https://iam-blog.vercel.app`
   - Update in Railway → Variables
   - Railway auto-redeploys

**After both are fixed and redeployed:**
- ✅ Frontend calls correct Railway URL
- ✅ Backend allows CORS from Vercel
- ✅ No more CORS errors!

---

## ⚡ Most Important

**You MUST redeploy Vercel after updating `VITE_API_URL`!**

Environment variables are only applied on new deployments. Just saving the variable isn't enough - you need to redeploy!



