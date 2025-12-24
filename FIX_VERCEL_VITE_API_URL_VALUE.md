# 🔧 Fix VITE_API_URL Value in Vercel

## What I See

From your screenshot:
- ✅ `VITE_API_URL` exists in Vercel
- ✅ Set for "All Environments"
- ⚠️ Value shows: `iamblog-production.up.railway.app`

## ⚠️ The Problem

The value is **missing**:
1. `https://` prefix
2. `/api` suffix

**Current value** (incomplete):
```
iamblog-production.up.railway.app
```

**Should be** (complete):
```
https://iamblog-production.up.railway.app/api
```

---

## ✅ Fix: Update the Value

### Step 1: Edit VITE_API_URL in Vercel

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Find `VITE_API_URL`**
3. **Click to edit** (or click the three dots → Edit)
4. **Update the Value field** to:
   ```
   https://iamblog-production.up.railway.app/api
   ```
   **Important**: 
   - Must start with `https://`
   - Must end with `/api`
   - No trailing slash after `/api`

5. **Environments**: Should be "All Environments" ✅
6. **Click "Save"**

### Step 2: Redeploy Vercel

**⚠️ CRITICAL**: Environment variables only apply on new deployments!

1. **Go to "Deployments"** tab
2. **Click "..."** (three dots) on latest deployment
3. **Click "Redeploy"**
4. **Wait for deployment to complete** (1-3 minutes)

---

## 🧪 Verify After Fix

### Test 1: Check Browser Console

1. **Visit**: `https://iam-blog.vercel.app`
2. **Open browser console** (F12) → **Network** tab
3. **Look for API calls**:
   - ✅ Should see: `https://iamblog-production.up.railway.app/api/...`
   - ❌ Should NOT see: `https://your-railway-app.railway.app/api/...`

### Test 2: Check No CORS Errors

1. **Open browser console** (F12)
2. **Should see**:
   - ✅ No CORS errors
   - ✅ API calls succeeding
   - ✅ Blog posts loading

---

## 📋 Quick Checklist

- [ ] `VITE_API_URL` value = `https://iamblog-production.up.railway.app/api` (with `https://` and `/api`)
- [ ] `VITE_API_URL` set for "All Environments"
- [ ] **Vercel redeployed** after updating the value
- [ ] Browser console shows correct API URL (not placeholder)
- [ ] No CORS errors

---

## 🆘 Still Having Issues?

### Error: Still seeing "your-railway-app.railway.app"

**Possible causes**:
1. Value still missing `https://` or `/api`
2. Vercel not redeployed after update
3. Browser cache (try hard refresh: Ctrl+Shift+R)

**Fix**:
1. Double-check the value in Vercel
2. Make sure you redeployed Vercel
3. Clear browser cache or use incognito mode

### Error: Still seeing CORS errors

**Check**:
1. Railway `FRONTEND_URL` = `https://iam-blog.vercel.app` ✅ (you have this)
2. Railway has redeployed after setting `FRONTEND_URL`
3. Railway has latest CORS code (commit `e491ae4`)

---

## 📝 Summary

**The Issue**: `VITE_API_URL` value is incomplete - missing `https://` prefix and `/api` suffix.

**The Fix**:
1. Update value to: `https://iamblog-production.up.railway.app/api`
2. **Redeploy Vercel** (required!)

**After fix**: Frontend will call the correct Railway URL and CORS errors should disappear! 🎯



