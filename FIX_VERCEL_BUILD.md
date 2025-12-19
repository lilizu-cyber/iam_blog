# 🔧 Fix Vercel Build Error

## The Problem

Vercel build is failing or not completing. This is usually because:

1. **Root Directory not set** - Vercel is trying to build from root instead of `frontend` directory
2. **Build command running in wrong directory** - Commands need to run from `frontend` folder

---

## ✅ Solution: Configure Vercel Project Settings

### Step 1: Set Root Directory in Vercel

1. **Vercel Dashboard** → Your Project (`iam-blog`) → **Settings** tab
2. **Scroll down to "Build & Development Settings"**
3. **Find "Root Directory"** field
4. **Set it to**: `frontend`
5. **Click "Save"**

### Step 2: Verify Build Settings

In the same "Build & Development Settings" section, verify:

- **Framework Preset**: `Vite` (or `Other`)
- **Root Directory**: `frontend` ⚠️ **MOST IMPORTANT!**
- **Build Command**: `npm run build` (or leave blank - `vercel.json` handles it)
- **Output Directory**: `build` (or leave blank - `vercel.json` handles it)
- **Install Command**: 
  - ✅ **If Root Directory = `frontend`**: Leave blank OR set to `npm install`
  - ❌ **If Root Directory is NOT set**: Set to `cd frontend && npm install`

**Note**: If Root Directory is set to `frontend`, Vercel automatically runs commands in that directory, so `npm install` is enough.

### Step 3: Redeploy

1. **Go to "Deployments"** tab
2. **Click "..."** (three dots) on latest deployment
3. **Click "Redeploy"**

---

## ✅ Alternative: If Root Directory Can't Be Set

If you can't set Root Directory (or it's not working), update `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build",
  "devCommand": "cd frontend && npm run dev",
  "installCommand": "cd frontend && npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Then commit and push:
```bash
git add vercel.json
git commit -m "Fix Vercel build command for frontend directory"
git push
```

---

## 🧪 Test Build Locally

Before deploying, test the build locally:

```bash
cd frontend
npm install
npm run build
```

This should create a `build` directory. If it fails, fix the error first.

---

## 📋 Checklist

- [ ] Root Directory set to `frontend` in Vercel Settings
- [ ] Build Command is `npm run build` (or blank)
- [ ] Output Directory is `build` (or blank)
- [ ] Local build works: `cd frontend && npm run build`
- [ ] Redeployed after changing settings

---

## 🆘 Common Errors

### Error: "Cannot find module 'vite'"

**Fix**: Root Directory is not set to `frontend`. Set it in Vercel Settings.

### Error: "Build command failed"

**Fix**: 
1. Check Root Directory is `frontend`
2. Test build locally: `cd frontend && npm run build`
3. Check for errors in build output

### Error: "Output directory not found"

**Fix**: 
1. Verify `frontend/build` exists after local build
2. Check Output Directory is set to `build` (not `frontend/build` if Root Directory is `frontend`)

---

## 📝 Summary

**Most Important**: Set **Root Directory** to `frontend` in Vercel Settings!

This tells Vercel to:
- Run `npm install` in `frontend/` directory
- Run `npm run build` in `frontend/` directory  
- Look for output in `frontend/build/` directory

