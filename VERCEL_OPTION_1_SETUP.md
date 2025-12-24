# ✅ Vercel Setup - Option 1 (Recommended)

## Step-by-Step Guide

### Step 1: Set Root Directory

1. **Vercel Dashboard** → Your Project (`iam-blog`) → **Settings** tab
2. **Scroll to "Build & Development Settings"**
3. **Find "Root Directory"** field
4. **Click "Edit"** (or "Override" if it's locked)
5. **Set to**: `frontend`
6. **Click "Save"**

---

### Step 2: Remove/Clear Production Overrides

1. **Still in Settings** → **Build & Development Settings**
2. **Find "Production Overrides"** section (it should be collapsible)
3. **Click to expand it**
4. **For each override** (Build Command, Output Directory, Install Command):
   - **Click "Remove"** or **Clear the field**
   - OR **Toggle the override OFF** if there's a toggle switch
5. **This will make Vercel use Project Settings instead**

---

### Step 3: Update Project Settings

1. **Still in Settings** → **Build & Development Settings**
2. **Find "Project Settings"** section
3. **Update these fields**:

   **Build Command:**
   - **Leave blank** (Vercel will auto-detect `npm run build` for Vite)
   - OR set to: `npm run build`
   - **Toggle "Override" OFF** if you want Vercel to auto-detect

   **Output Directory:**
   - **Set to**: `build` ⚠️ **Important: NOT `dist`!**
   - This matches your `vite.config.js` which has `outDir: 'build'`
   - **Toggle "Override" ON** to keep this setting

   **Install Command:**
   - **Leave blank** (Vercel will auto-detect `npm install`)
   - OR set to: `npm install`
   - **Toggle "Override" OFF** if you want Vercel to auto-detect

   **Framework Preset:**
   - Should already be: `Vite`
   - If not, set it to `Vite`

4. **Click "Save"** at the bottom

---

### Step 4: Verify Settings

Your final configuration should look like:

**Root Directory:** `frontend` ✅

**Project Settings:**
- Framework Preset: `Vite` ✅
- Build Command: `npm run build` (or blank) ✅
- Output Directory: `build` ✅ (NOT `dist`)
- Install Command: `npm install` (or blank) ✅

**Production Overrides:**
- Should be **empty/removed** ✅

---

### Step 5: Redeploy

1. **Go to "Deployments"** tab
2. **Click "..."** (three dots) on latest deployment
3. **Click "Redeploy"**
4. **Wait for build to complete**

---

## ✅ What This Does

With Root Directory = `frontend`:

1. **Vercel automatically**:
   - Changes into `frontend/` directory
   - Runs `npm install` there (finds `vite` in `frontend/node_modules`)
   - Runs `npm run build` there (runs `vite build`)
   - Looks for output in `frontend/build/` directory

2. **No more exit code 127** because:
   - Commands run from `frontend/` where `vite` exists
   - Dependencies are installed in the right place

3. **Output directory matches**:
   - Vercel looks for `build/` (relative to `frontend/`)
   - Your `vite.config.js` outputs to `build/`
   - Everything aligns! ✅

---

## 🧪 Test It

After redeploy:

1. **Check build logs** - should show:
   ```
   Running npm install in frontend/
   Running npm run build in frontend/
   Build output in frontend/build/
   ```

2. **Build should succeed** - no exit code 127!

3. **Site should deploy** - visit your Vercel URL

---

## 🆘 Troubleshooting

### Error: "vite: command not found"

**Fix**: Root Directory is not set to `frontend`. Double-check Step 1.

### Error: "Output directory not found"

**Fix**: Output Directory should be `build` (not `frontend/build`). Since Root Directory is `frontend`, the path is relative to that directory.

### Error: Still using old overrides

**Fix**: Make sure you cleared/removed Production Overrides in Step 2. Vercel might cache them - try redeploying again.

---

## 📝 Summary

**Key Points:**
- ✅ Root Directory = `frontend` (most important!)
- ✅ Output Directory = `build` (matches vite.config.js)
- ✅ Production Overrides = removed/cleared
- ✅ Project Settings = use Vite defaults with `build` output

**Result:**
- ✅ Build runs from `frontend/` directory
- ✅ Finds `vite` command
- ✅ Outputs to correct directory
- ✅ No more exit code 127!



