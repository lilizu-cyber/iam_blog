# 📍 Where to Set VITE_API_URL in Vercel - Step by Step

## Exact Location in Vercel Dashboard

### Step 1: Go to Your Project
1. **Login to Vercel**: https://vercel.com
2. **Click on your project** (`iam_blog` or whatever you named it)

### Step 2: Open Settings
1. **Click "Settings"** tab at the top (next to "Deployments", "Analytics", etc.)

### Step 3: Go to Environment Variables
1. In the left sidebar, **click "Environment Variables"**
   - It's under the "Configuration" section
   - Look for a folder icon with "Environment Variables" text

### Step 4: Add the Variable
1. You'll see a form with:
   - **Key** (input field)
   - **Value** (input field)
   - **Environment** (dropdown: Production, Preview, Development)

2. **Fill in:**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-railway-app.railway.app/api`
     - Replace `your-railway-app` with your actual Railway app name!
   - **Environment**: Select **"Production"** (or "All" if you want it for all environments)

3. **Click "Save"** button

### Step 5: Redeploy (IMPORTANT!)
After saving, you MUST redeploy:

1. **Click "Deployments"** tab at the top
2. Find your latest deployment
3. Click the **"..."** (three dots) menu on the right
4. Click **"Redeploy"**
5. Confirm the redeploy

**OR** just push a new commit to trigger auto-deploy.

---

## Visual Guide

```
Vercel Dashboard
├── Your Project (iam_blog)
    ├── [Top Tabs]
    │   ├── Overview
    │   ├── Deployments  ← Check here after setting env var
    │   ├── Analytics
    │   └── Settings  ← CLICK HERE
    │       ├── [Left Sidebar]
    │       │   ├── General
    │       │   ├── Environment Variables  ← CLICK HERE
    │       │   ├── Domains
    │       │   └── ...
    │       └── [Main Content]
    │           └── Environment Variables Form
    │               ├── Key: VITE_API_URL
    │               ├── Value: https://your-app.railway.app/api
    │               └── Save button
```

---

## Quick Checklist

- [ ] Logged into Vercel
- [ ] Selected your project
- [ ] Clicked "Settings" tab
- [ ] Clicked "Environment Variables" in left sidebar
- [ ] Added `VITE_API_URL` with your Railway backend URL + `/api`
- [ ] Selected "Production" environment
- [ ] Clicked "Save"
- [ ] Redeployed the project

---

## Example

If your Railway URL is: `https://iam-blog-production.railway.app`

Then set:
```
Key: VITE_API_URL
Value: https://iam-blog-production.railway.app/api
Environment: Production
```

**Note**: The `/api` at the end is important!




