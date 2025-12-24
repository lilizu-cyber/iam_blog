# 🚨 Fix CORS Errors - Final Checklist

## Current Errors

1. ❌ Frontend calling: `https://your-railway-app.railway.app` (placeholder!)
2. ❌ Backend CORS: `https://railway.com` (wrong!)
3. ❌ `/api/auth/me` returns 404 (backend not accessible)

---

## ✅ Step 1: Get Your Real Railway URL

1. **Railway Dashboard** → Your Service → **Settings** tab
2. **Find "Domains"** section
3. **Copy your Railway URL** - it will be something like:
   - `https://iam-blog-production.up.railway.app`
   - OR `https://iam-blog-backend.railway.app`
   - OR `https://[your-service-name].railway.app`

**⚠️ Important**: It's NOT `your-railway-app.railway.app` - that's a placeholder!

---

## ✅ Step 2: Update Vercel VITE_API_URL

1. **Vercel Dashboard** → Your Project (`iam-blog`) → **Settings** → **Environment Variables**
2. **Find `VITE_API_URL`** (or create it)
3. **Update the value** to:
   ```
   https://YOUR-REAL-RAILWAY-URL.railway.app/api
   ```
   **Replace `YOUR-REAL-RAILWAY-URL` with the URL you copied in Step 1!**

   **Example:**
   ```
   https://iam-blog-production.up.railway.app/api
   ```

4. **Environment**: Select **"All"** (Production, Preview, Development)
5. **Click "Save"**
6. **IMPORTANT - Redeploy**:
   - Go to **"Deployments"** tab
   - Click **"..."** (three dots) on latest deployment
   - Click **"Redeploy"**

---

## ✅ Step 3: Update Railway FRONTEND_URL

1. **Railway Dashboard** → Your Service → **Variables** tab
2. **Find `FRONTEND_URL`** (or create it)
3. **Update the value** to:
   ```
   https://iam-blog.vercel.app
   ```
   **Important**: This is your Vercel production URL, NOT Railway URL!

4. **Click "Save"** (Railway will auto-redeploy)

---

## ✅ Step 4: Verify Railway Has New CORS Code

The CORS fix I pushed earlier should allow Vercel URLs. Check:

1. **Railway Dashboard** → Your Service → **Deployments** tab
2. **Look for latest deployment** - should be after commit `e491ae4` (CORS fix)
3. **If not deployed yet**, wait for auto-deploy or click "Redeploy"

The new CORS code allows:
- ✅ `https://iam-blog.vercel.app` (production)
- ✅ `*.vercel.app` (all preview URLs)

---

## ✅ Step 5: Test Backend is Running

1. **Visit**: `https://YOUR-REAL-RAILWAY-URL.railway.app/health`
   - Should return: `{"status":"ok"}`
   - If 404 or error, backend isn't running

2. **Check Railway logs**:
   - Railway Dashboard → Your Service → **Logs** tab
   - Should see: `Server started on port 3001`
   - Should NOT see: `Failed to connect to PostgreSQL`

---

## 📋 Quick Checklist

- [ ] Got real Railway URL from Railway → Settings → Domains
- [ ] Updated Vercel `VITE_API_URL` = `https://your-real-railway-url.railway.app/api`
- [ ] Redeployed Vercel after updating `VITE_API_URL`
- [ ] Updated Railway `FRONTEND_URL` = `https://iam-blog.vercel.app`
- [ ] Railway redeployed with new CORS code (commit `e491ae4` or later)
- [ ] Backend health check works: `https://your-railway-url.railway.app/health`
- [ ] No CORS errors in browser console

---

## 🆘 Troubleshooting

### Error: Still seeing "your-railway-app.railway.app"

**Fix**: 
- `VITE_API_URL` in Vercel is still set to placeholder
- Update it with your REAL Railway URL
- **Redeploy Vercel** (environment variables require redeploy)

### Error: "Access-Control-Allow-Origin header has value 'https://railway.com'"

**Fix**: 
- `FRONTEND_URL` in Railway is set to `https://railway.com`
- Change it to `https://iam-blog.vercel.app`
- Wait for Railway to redeploy

### Error: "/api/auth/me 404"

**Possible causes:**
1. Backend not running - check Railway logs
2. Wrong Railway URL - verify you're using the correct URL
3. Backend crashed - check Railway logs for errors

**Fix**:
- Check Railway logs for errors
- Verify backend is running: visit `/health` endpoint
- Make sure `POSTGRESQL_URI` is set correctly

### Error: "background.js" errors

**Fix**: These are browser extension errors (not your code). Ignore them.

### Error: "icon-192x192.png 404"

**Fix**: Missing PWA icon. Not critical, but you can add it later.

---

## ✅ After All Fixes

1. **Visit**: `https://iam-blog.vercel.app`
2. **Open browser console** (F12)
3. **Should see**:
   - ✅ API calls to `https://your-real-railway-url.railway.app/api/...`
   - ✅ **No CORS errors!**
   - ✅ Blog posts loading
   - ✅ `/api/auth/me` returns 200 (not 404)

---

## 📝 Summary

**The two critical fixes:**

1. **Vercel**: `VITE_API_URL` = `https://your-real-railway-url.railway.app/api`
2. **Railway**: `FRONTEND_URL` = `https://iam-blog.vercel.app`

**Both need to be redeployed after changes!**

Once both are fixed and redeployed, CORS errors will disappear! 🎉



