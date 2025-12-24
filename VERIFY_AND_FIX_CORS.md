# ✅ Verify Environment Variables Are Applied

## What I See in Railway (Looks Good!)

From your screenshot, Railway has:
- ✅ `FRONTEND_URL` = `https://iam-blog.vercel.app` (correct!)
- ✅ `VITE_API_URL` = `iamblog-production.up.railway.a...` (looks correct, but truncated)

**But wait**: `VITE_API_URL` should be in **Vercel**, not Railway!

---

## ⚠️ The Issue

`VITE_API_URL` is a **frontend** environment variable. It needs to be in **Vercel**, not Railway!

**Railway** (Backend) should have:
- ✅ `FRONTEND_URL` = `https://iam-blog.vercel.app`
- ✅ `POSTGRESQL_URI`
- ✅ `JWT_SECRET`
- ✅ `NODE_ENV`
- ✅ `PORT`

**Vercel** (Frontend) should have:
- ✅ `VITE_API_URL` = `https://iamblog-production.up.railway.app/api`

---

## ✅ Step 1: Check Vercel Environment Variables

1. **Vercel Dashboard** → Your Project (`iam-blog`) → **Settings** → **Environment Variables**
2. **Look for `VITE_API_URL`**
3. **Check the value**:
   - Should be: `https://iamblog-production.up.railway.app/api`
   - Should **NOT** be: `https://your-railway-app.railway.app/api`

**If it's missing or has the placeholder:**
- Click "Add New" or edit existing
- Set to: `https://iamblog-production.up.railway.app/api`
- Environment: **All**
- Save

---

## ✅ Step 2: Verify Vercel Was Redeployed

**Critical**: Even if `VITE_API_URL` is set correctly, Vercel must be **redeployed** for it to take effect!

1. **Vercel Dashboard** → **Deployments** tab
2. **Check the latest deployment**:
   - When was it created?
   - Was it **after** you set `VITE_API_URL`?
   - If not, you need to redeploy!

3. **If you need to redeploy**:
   - Click "..." (three dots) on latest deployment
   - Click "Redeploy"
   - Wait for it to complete

---

## ✅ Step 3: Verify Railway FRONTEND_URL

From your screenshot, Railway `FRONTEND_URL` looks correct:
- ✅ Value: `https://iam-blog.vercel.app`

**But verify**:
1. **Railway Dashboard** → Your Service → **Variables**
2. **Check `FRONTEND_URL`**:
   - Should be: `https://iam-blog.vercel.app`
   - Should **NOT** be: `https://railway.com`

3. **Check Railway has redeployed**:
   - Railway → **Deployments** tab
   - Should show a recent deployment after you saved `FRONTEND_URL`

---

## 🧪 Test After Verification

### Test 1: Check Frontend is Using Correct URL

1. **Visit**: `https://iam-blog.vercel.app`
2. **Open browser console** (F12) → **Network** tab
3. **Look for API calls**:
   - ✅ Should see: `https://iamblog-production.up.railway.app/api/...`
   - ❌ Should NOT see: `https://your-railway-app.railway.app/api/...`

### Test 2: Check Backend CORS

1. **Open browser console** (F12)
2. **Look for CORS errors**:
   - ✅ Should see: No CORS errors
   - ❌ Should NOT see: "Access-Control-Allow-Origin header has value 'https://railway.com'"

### Test 3: Test Backend Directly

1. **Visit**: `https://iamblog-production.up.railway.app/health`
2. **Should return**: `{"status":"ok"}`
3. **If 404 or error**: Backend isn't running - check Railway logs

---

## 🆘 If Still Getting Errors

### Error: Still seeing "your-railway-app.railway.app"

**Possible causes**:
1. `VITE_API_URL` not set in Vercel (only in Railway)
2. `VITE_API_URL` has placeholder value in Vercel
3. Vercel not redeployed after setting `VITE_API_URL`

**Fix**:
1. Check Vercel → Settings → Environment Variables
2. Verify `VITE_API_URL` exists and has correct value
3. **Redeploy Vercel** (required!)

### Error: Still seeing "Access-Control-Allow-Origin header has value 'https://railway.com'"

**Possible causes**:
1. Railway `FRONTEND_URL` still set to `https://railway.com`
2. Railway not redeployed after updating `FRONTEND_URL`
3. CORS code not deployed (needs commit `e491ae4` or later)

**Fix**:
1. Check Railway Variables - `FRONTEND_URL` should be `https://iam-blog.vercel.app`
2. Check Railway Deployments - should have recent deployment
3. Check Railway has latest code (commit `e491ae4` with CORS fix)

---

## 📋 Final Checklist

- [ ] `VITE_API_URL` is set in **Vercel** (not just Railway)
- [ ] `VITE_API_URL` value = `https://iamblog-production.up.railway.app/api` (not placeholder)
- [ ] `VITE_API_URL` is set for "All" environments in Vercel
- [ ] **Vercel was redeployed** after setting `VITE_API_URL`
- [ ] Railway `FRONTEND_URL` = `https://iam-blog.vercel.app` (verified ✅)
- [ ] Railway has redeployed after updating `FRONTEND_URL`
- [ ] Railway has latest code (CORS fix from commit `e491ae4`)
- [ ] No CORS errors in browser console

---

## 📝 Summary

**Key Points:**

1. **`VITE_API_URL` must be in Vercel**, not Railway (it's a frontend variable)
2. **Vercel must be redeployed** after setting environment variables
3. **Railway `FRONTEND_URL` looks correct** from your screenshot ✅
4. **Both services must be redeployed** for changes to take effect

**Most Likely Issue**: `VITE_API_URL` is either:
- Not set in Vercel (only in Railway)
- Has placeholder value in Vercel
- Vercel not redeployed after setting it

Check Vercel environment variables and redeploy if needed! 🎯



