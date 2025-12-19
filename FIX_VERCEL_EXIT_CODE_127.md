# 🔧 Fix Vercel Build Error - Exit Code 127

## The Problem

Vercel build is failing with:
```
Command "npm install && npm run build" exited with 127
```

**Exit code 127** means "command not found" - usually because:
1. Build is running in wrong directory (root instead of `frontend`)
2. `vite` command not found (because it's only in `frontend/node_modules`)
3. Root Directory not set in Vercel Settings

---

## ✅ Solution 1: Set Root Directory in Vercel (Recommended)

### Step 1: Go to Vercel Settings

1. **Vercel Dashboard** → Your Project (`iam-blog`) → **Settings** tab
2. **Scroll to "Build & Development Settings"**
3. **Find "Root Directory"** field

### Step 2: Set Root Directory

1. **Click "Edit"** next to Root Directory
2. **Set to**: `frontend`
3. **Click "Save"**

### Step 3: Verify Other Settings

In the same section, verify:
- **Framework Preset**: `Vite` (or `Other`)
- **Build Command**: Leave **blank** (or `npm run build`)
- **Output Directory**: Leave **blank** (or `build`)
- **Install Command**: Leave **blank** (or `npm install`)

**Note**: If Root Directory is `frontend`, Vercel automatically runs commands there, so you can leave these blank.

### Step 4: Redeploy

1. **Go to "Deployments"** tab
2. **Click "..."** (three dots) on latest deployment
3. **Click "Redeploy"**

---

## ✅ Solution 2: Update vercel.json (Alternative)

If you can't set Root Directory, I've updated `vercel.json` to explicitly run commands from `frontend`:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build",
  "installCommand": "cd frontend && npm install"
}
```

**To apply this fix:**
1. Commit and push the updated `vercel.json`:
   ```bash
   git add vercel.json
   git commit -m "Fix Vercel build to run from frontend directory"
   git push
   ```
2. Vercel will auto-redeploy

---

## 🧪 Test Build Locally

Before deploying, test the build locally:

```bash
cd frontend
npm install
npm run build
```

This should create a `frontend/build` directory. If it fails, fix the error first.

---

## 📋 Quick Checklist

- [ ] Root Directory set to `frontend` in Vercel Settings (Solution 1)
- [ ] OR vercel.json updated with `cd frontend &&` commands (Solution 2)
- [ ] Local build works: `cd frontend && npm run build`
- [ ] Redeployed after changes
- [ ] Build succeeds (no exit code 127)

---

## 🆘 Common Errors

### Error: "vite: command not found"

**Cause**: Build running from root directory, not `frontend`

**Fix**: 
- Set Root Directory to `frontend` in Vercel Settings
- OR use updated `vercel.json` with `cd frontend &&` commands

### Error: "Cannot find module 'vite'"

**Cause**: Dependencies not installed in `frontend/` directory

**Fix**: 
- Make sure Root Directory is `frontend`
- OR use `cd frontend && npm install` in install command

### Error: "Output directory not found"

**Cause**: Output directory path is wrong

**Fix**: 
- If Root Directory = `frontend`: Output Directory should be `build` (not `frontend/build`)
- If Root Directory = blank: Output Directory should be `frontend/build`

---

## 📝 Summary

**Exit code 127 = Command not found**

**Most common cause**: Build running from root instead of `frontend` directory

**Best fix**: Set **Root Directory** to `frontend` in Vercel Settings

**Alternative**: Update `vercel.json` to run commands from `frontend` directory

---

## ✅ After Fix

Your build should:
1. ✅ Install dependencies in `frontend/` directory
2. ✅ Run `vite build` from `frontend/` directory
3. ✅ Output to `frontend/build/` directory
4. ✅ Deploy successfully!

