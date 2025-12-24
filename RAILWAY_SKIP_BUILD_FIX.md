# 🚨 Fix Railway Build Error - Skip Frontend Build

## The Problem

Railway is running `npm run build` which tries to build the frontend, causing:
```
sh: 1: vite: not found
```

## ✅ Solution: Override Build Command in Railway Dashboard

Railway is ignoring the config files. You need to **manually set it in the dashboard**.

---

## Step-by-Step Fix

### Step 1: Go to Railway Build Settings

1. **Railway Dashboard** → Your Project → Your Service
2. **Click "Settings"** tab (top navigation)
3. **Click "Build & Deploy"** (left sidebar, under "Configuration")

### Step 2: Clear/Override Build Command

1. **Find "Build Command"** field
2. **Delete everything** in that field (leave it **EMPTY**)
   - OR set it to: `npm install --production`
3. **Find "Start Command"** field
4. **Set it to**: `npm start`
5. **Click "Save"** button

### Step 3: Redeploy

1. **Go to "Deployments"** tab
2. **Click "Redeploy"** button (or wait for auto-redeploy)
3. **Check build logs** - should now show:
   ```
   npm install --production
   npm start
   Server started on port 3001
   ```

---

## Why This Works

- **Empty build command** = Railway skips build, just installs dependencies
- **`npm start`** = Runs `node src/backend/server.js` (from source, no build needed)
- **No frontend build** = Frontend is on Vercel, not Railway

---

## Alternative: If Empty Doesn't Work

If leaving it empty doesn't work, try:

**Build Command**: `npm install --production --ignore-scripts`

This installs dependencies without running any build scripts.

---

## Verify It Works

After redeploy, check logs should show:
- ✅ `npm install --production` (or just `npm install`)
- ✅ `npm start`
- ✅ `Server started on port 3001`
- ❌ **NO** `npm run build`
- ❌ **NO** `vite build`
- ❌ **NO** `vite: not found` errors

---

## 🆘 Still Building Frontend?

If Railway still tries to build:

1. **Check "Build Command"** is truly empty (no spaces, no hidden characters)
2. **Try**: `echo "Skipping build"` (dummy command that does nothing)
3. **Check Railway logs** - see what command it's actually running
4. **Contact Railway support** - they can help override auto-detection

---

## Quick Checklist

- [ ] Went to Settings → Build & Deploy
- [ ] Cleared "Build Command" (left empty)
- [ ] Set "Start Command" to `npm start`
- [ ] Saved settings
- [ ] Redeployed
- [ ] No `vite` errors in logs




