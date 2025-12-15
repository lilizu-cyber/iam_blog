# Fix Railway Build Error - Quick Solution

## The Problem

Railway is running `npm run build` which tries to build the frontend, but `vite` is not installed in the root.

## Quick Fix in Railway Dashboard

### Step 1: Go to Service Settings

1. Railway Dashboard → Your Service → **Settings**
2. Click **"Build & Deploy"** tab

### Step 2: Configure Build Settings

**Clear or override the build command:**

1. **Build Command**: Leave **EMPTY** or set to:
   ```
   npm install --production
   ```

2. **Start Command**: Set to:
   ```
   npm start
   ```

3. **Save** the settings

### Step 3: Redeploy

1. Click **"Redeploy"** button
2. Or Railway will auto-deploy on next push

---

## Why This Works

- **No build needed**: Backend runs from source (`src/backend/server.js`)
- **No frontend build**: Frontend is on Vercel, not Railway
- **Just install and run**: `npm install --production` then `npm start`

---

## Alternative: Use Nixpacks Configuration

If Railway still tries to build, create a `nixpacks.toml` file:

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.install]
cmds = ["npm install --production"]

[start]
cmd = "npm start"
```

But the dashboard settings approach is simpler.

---

## Verify It Works

After redeploy, check logs should show:
```
npm install --production
npm start
Server started on port 3001
```

No frontend build errors!

