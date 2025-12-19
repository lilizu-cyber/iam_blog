# Vercel Project Setup - Configuration Guide

## Current Settings to Update

Based on your Vercel "New Project" page, here's what to configure:

### 1. Framework Preset ✅
- **Current**: "Other"
- **Recommendation**: Keep as "Other" (Vercel will use `vercel.json` configuration)
- **OR**: If "Vite" is available, select "Vite"

### 2. Root Directory ⚠️ **IMPORTANT**
- **Current**: `./` (root of repository)
- **Should be**: `frontend` (since your frontend is in a subdirectory)
- **Action**: Click "Edit" next to Root Directory and change to `frontend`

### 3. Build and Output Settings
Click the ">" to expand and verify:
- **Build Command**: `npm run build` (or leave default, vercel.json will override)
- **Output Directory**: `build` (or leave default, vercel.json will override)
- **Install Command**: `npm install` (or leave default)

**Note**: `vercel.json` already specifies these, so defaults are fine.

### 4. Environment Variables ⚠️ **REQUIRED**

**Remove the example variable** and add:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_API_URL` | `https://your-backend-url.com/api` | Production, Preview, Development |

**Important**: 
- Replace `https://your-backend-url.com/api` with your actual backend URL
- If backend not deployed yet, use: `http://localhost:3001/api` (for testing)
- You can update this later when backend is deployed

**How to add:**
1. Remove the example `EXAMPLE_NAME` variable (click "-")
2. Click "+ Add More"
3. Key: `VITE_API_URL`
4. Value: `https://your-backend-url.com/api` (or `http://localhost:3001/api` for now)
5. Select all environments: Production, Preview, Development

### 5. Project Name ✅
- **Current**: `iam-blog`
- **Status**: Good, you can keep this or change it

## Recommended Configuration

```
Framework Preset: Other (or Vite if available)
Root Directory: frontend
Build Command: (default - vercel.json handles this)
Output Directory: (default - vercel.json handles this)
Install Command: (default)

Environment Variables:
  VITE_API_URL = https://your-backend-url.com/api
  (or http://localhost:3001/api for testing)
```

## After Configuration

1. Click **"Deploy"** button
2. Wait for build (1-3 minutes)
3. Your site will be live at: `https://iam-blog.vercel.app` (or similar)

## Troubleshooting

### Build Fails
- Check Root Directory is set to `frontend`
- Verify `vercel.json` is in repository root
- Check build logs in Vercel Dashboard

### API Calls Fail
- Verify `VITE_API_URL` is set correctly
- Check backend CORS allows Vercel domain
- Test backend is accessible

---

**Next Step**: Update Root Directory to `frontend` and add `VITE_API_URL` environment variable, then click Deploy!

