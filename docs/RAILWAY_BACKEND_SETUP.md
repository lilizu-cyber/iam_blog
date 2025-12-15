# Railway Backend Deployment - Fix Build Error

## The Problem

Railway is trying to build the entire project (including frontend), but:
- Frontend dependencies (vite) are not in root `package.json`
- Frontend is already deployed on Vercel
- Backend runs from source (no build needed)

## The Solution

Configure Railway to **skip the build** and just install dependencies, then run from source.

---

## Step 1: Configure Railway Build Settings

In Railway Dashboard:

1. Go to your service → **Settings** → **Build**
2. **Clear the build command** (leave it empty)
3. Or set to: `npm install --production`
4. **Start Command**: `npm start`

**OR** use the `railway.json` file (already created):

The `railway.json` file tells Railway to:
- Install dependencies only
- Run `npm start` (which runs from source)

---

## Step 2: Update Railway Service Settings

### Option A: Via Railway Dashboard

1. **Service** → **Settings** → **Build & Deploy**
2. **Build Command**: Leave empty or set to `npm install --production`
3. **Start Command**: `npm start`
4. **Save**

### Option B: Railway Auto-Detects

Railway should auto-detect Node.js and use `npm start` if no build command is set.

---

## Step 3: Environment Variables

Make sure these are set in Railway → **Variables**:

```bash
NODE_ENV=production
PORT=3001
POSTGRESQL_URI=your-supabase-connection-string
JWT_SECRET=your-strong-secret-32-chars-minimum
FRONTEND_URL=https://iam-blog.vercel.app
```

---

## Step 4: Redeploy

1. Click **"Redeploy"** in Railway
2. Or push a new commit to trigger auto-deploy
3. Build should succeed now (no frontend build attempted)

---

## Why This Works

- **`npm start`** runs `node src/backend/server.js` (from source)
- **No build needed** - Node.js 22 supports modern JavaScript natively
- **No frontend build** - Frontend is on Vercel
- **Faster deployment** - Just install dependencies and run

---

## Alternative: Use Dockerfile

If Railway still tries to build, you can use the Dockerfile:

1. Railway → Service → Settings
2. **Deploy** → **Dockerfile Path**: `Dockerfile.backend`
3. Railway will use Docker instead of Nixpacks

But the `railway.json` approach is simpler.

---

## Verify Deployment

After redeploy:

1. Check **Deploy Logs** - should show:
   ```
   npm install
   npm start
   Server started on port 3001
   ```

2. Test health endpoint:
   ```
   https://your-app.railway.app/health
   ```

3. Should return:
   ```json
   {
     "status": "healthy",
     "services": { ... }
   }
   ```

---

## Troubleshooting

### Still Building Frontend

**Solution**: 
- Clear build command in Railway settings
- Or set to: `npm install --production`

### Missing Dependencies

**Solution**:
- Make sure all backend dependencies are in root `package.json`
- Run `npm install` locally to verify

### Port Issues

**Solution**:
- Railway auto-assigns PORT (check in variables)
- Backend should use `process.env.PORT` (already configured)

---

**Next**: After backend deploys, update Vercel `VITE_API_URL` to your Railway URL!

