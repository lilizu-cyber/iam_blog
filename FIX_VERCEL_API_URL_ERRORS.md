# 🔧 Fix Vercel API URL Errors

## The Problems

1. **Malformed API URL**: `/'https:/iamblog-production.up.railway.app/api/blog/posts...`
   - Notice: `/'https:/` (leading slash, quote, missing second slash)
   - This suggests `VITE_API_URL` in Vercel is set incorrectly

2. **Relative paths not using VITE_API_URL**:
   - `AuthContext` uses `fetch('/api/auth/me')` (relative path)
   - `Contact.jsx` uses `fetch('/api/contact/send')` (relative path)
   - `CreatePost.jsx` uses `fetch('/api/upload/files')` (relative path)
   - These go to Vercel domain, not Railway!

---

## ✅ What I Fixed

### 1. Created API URL Helper

Created `frontend/src/utils/apiUrl.js`:
- `getApiUrl()` - Gets API base URL from `VITE_API_URL`
- `buildApiUrl(endpoint)` - Builds full API endpoint URL

### 2. Updated Files to Use VITE_API_URL

Updated:
- ✅ `frontend/src/contexts/AuthContext.jsx` - All auth endpoints
- ✅ `frontend/src/pages/Contact.jsx` - Contact form
- ✅ `frontend/src/pages/admin/CreatePost.jsx` - File upload

**All now use `buildApiUrl()` instead of relative paths!**

---

## ⚠️ Critical: Fix VITE_API_URL in Vercel

The malformed URL suggests `VITE_API_URL` is set incorrectly in Vercel.

### Step 1: Check Current Value

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Find `VITE_API_URL`**
3. **Check the value** - it might have:
   - Quotes: `'https://...'` or `"https://..."`
   - Missing second slash: `https:/...` instead of `https://...`
   - Extra characters

### Step 2: Fix the Value

**Correct format:**
```
https://iamblog-production.up.railway.app/api
```

**Must:**
- ✅ Start with `https://` (both slashes!)
- ✅ End with `/api` (no trailing slash after `/api`)
- ✅ NO quotes around the value
- ✅ NO extra spaces

**Common mistakes:**
- ❌ `'https://iamblog-production.up.railway.app/api'` (has quotes)
- ❌ `https:/iamblog-production.up.railway.app/api` (missing second slash)
- ❌ `https://iamblog-production.up.railway.app/api/` (trailing slash)
- ❌ ` https://iamblog-production.up.railway.app/api` (leading space)

### Step 3: Update in Vercel

1. **Edit `VITE_API_URL`** in Vercel
2. **Set to**: `https://iamblog-production.up.railway.app/api`
3. **Environment**: All
4. **Save**

### Step 4: Redeploy Vercel

**⚠️ CRITICAL**: Environment variables require redeploy!

1. **Deployments** tab
2. **Click "..."** → **"Redeploy"**
3. **Wait for completion**

---

## 🧪 Test After Fixes

### Test 1: Check Browser Console

1. **Visit**: `https://iam-blog.vercel.app`
2. **Open browser console** (F12) → **Network** tab
3. **Look for API calls**:
   - ✅ Should see: `https://iamblog-production.up.railway.app/api/...`
   - ❌ Should NOT see: `/'https:/...` or `https://iam-blog.vercel.app/api/...`

### Test 2: Check Posts Load

1. **Visit**: `https://iam-blog.vercel.app`
2. **Blog posts should load** ✅
3. **No 404 errors** for `/api/blog/posts`

### Test 3: Check Auth Works

1. **Try to login** (if you have credentials)
2. **Should work** - `/api/auth/me` should return 200, not 404

---

## 📋 Quick Checklist

- [ ] `VITE_API_URL` in Vercel = `https://iamblog-production.up.railway.app/api` (no quotes, correct format)
- [ ] Code updated to use `buildApiUrl()` helper ✅ (just pushed)
- [ ] **Vercel redeployed** after fixing `VITE_API_URL`
- [ ] Browser console shows correct API URLs
- [ ] Blog posts load
- [ ] No 404 errors

---

## 🆘 Still Having Issues?

### Error: Still seeing `/'https:/...`

**Fix**: `VITE_API_URL` in Vercel has quotes or is malformed. Remove quotes, ensure `https://` has both slashes.

### Error: `/api/auth/me` returns 404

**Fix**: 
1. Make sure code is updated (just pushed)
2. Redeploy Vercel to get latest code
3. Check `VITE_API_URL` is set correctly

### Error: Posts still not loading

**Fix**:
1. Check Railway backend is running: `https://iamblog-production.up.railway.app/health`
2. Check Railway `FRONTEND_URL` = `https://iam-blog.vercel.app`
3. Check browser console for actual API URLs being called

---

## 📝 Summary

**Two fixes needed:**

1. **Code fix** ✅ (just pushed):
   - Created `apiUrl.js` helper
   - Updated `AuthContext`, `Contact.jsx`, `CreatePost.jsx` to use `VITE_API_URL`

2. **Vercel configuration** ⚠️ (you need to do this):
   - Fix `VITE_API_URL` value (remove quotes, ensure `https://` format)
   - Redeploy Vercel

**After both fixes**: All API calls will go to Railway backend correctly! 🎯

