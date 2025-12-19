# Vercel Install Command - What to Set

## Quick Answer

**If Root Directory is set to `frontend`:**
- **Install Command**: Leave **blank** OR set to `npm install`

**If Root Directory is NOT set:**
- **Install Command**: `cd frontend && npm install`

---

## Detailed Explanation

### Option 1: Root Directory = `frontend` (Recommended ✅)

**Vercel Settings:**
- **Root Directory**: `frontend`
- **Install Command**: Leave **blank** (Vercel defaults to `npm install`)

**OR**

- **Install Command**: `npm install`

**Why?** When Root Directory is `frontend`, Vercel automatically:
- Changes into the `frontend/` directory
- Runs `npm install` there
- Runs build commands there

So you just need `npm install` (or leave blank).

---

### Option 2: Root Directory = NOT set (Alternative)

**Vercel Settings:**
- **Root Directory**: Leave blank (or set to `.`)
- **Install Command**: `cd frontend && npm install`

**Why?** Without Root Directory set, Vercel runs from the repository root, so you need to:
- Change into `frontend/` directory first (`cd frontend`)
- Then run `npm install`

---

## Which Should You Use?

### ✅ Recommended: Set Root Directory to `frontend`

**Why?**
- Simpler configuration
- All commands run in the right directory automatically
- Less chance of errors
- Standard Vercel practice

**Settings:**
```
Root Directory: frontend
Install Command: (blank or npm install)
Build Command: (blank or npm run build)
Output Directory: (blank or build)
```

---

### Alternative: Don't Set Root Directory

**Only use this if you can't set Root Directory for some reason.**

**Settings:**
```
Root Directory: (blank)
Install Command: cd frontend && npm install
Build Command: cd frontend && npm run build
Output Directory: frontend/build
```

---

## Current `vercel.json` Configuration

Your `vercel.json` has:
```json
{
  "installCommand": "npm install"
}
```

This works if:
- ✅ Root Directory is set to `frontend` in Vercel Settings
- ❌ Root Directory is NOT set (then it will fail)

---

## What to Do Now

### Step 1: Check Your Vercel Settings

1. **Vercel Dashboard** → Your Project → **Settings** → **Build & Development Settings**
2. **Check "Root Directory"**:
   - If it's `frontend` → Install Command should be blank or `npm install`
   - If it's blank/not set → Install Command should be `cd frontend && npm install`

### Step 2: Set Install Command

**If Root Directory = `frontend`:**
- Leave Install Command **blank** (recommended)
- OR set it to: `npm install`

**If Root Directory = blank:**
- Set Install Command to: `cd frontend && npm install`

### Step 3: Save and Redeploy

1. Click **"Save"**
2. Go to **"Deployments"** tab
3. Click **"Redeploy"**

---

## Summary

| Root Directory | Install Command |
|----------------|-----------------|
| `frontend` | `npm install` (or blank) ✅ |
| blank/not set | `cd frontend && npm install` |

**Best Practice**: Set Root Directory to `frontend` and leave Install Command blank!

