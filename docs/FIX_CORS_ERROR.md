# Fix CORS Error - Vercel Frontend to Backend

## The Problem

Your Vercel frontend (`https://iam-blog.vercel.app`) is trying to call `http://localhost:3001`, which:
1. ❌ **Doesn't exist** on the internet (localhost is only on your computer)
2. ❌ **CORS blocks it** - backend only allows `http://localhost:3000`

## The Solution

You need to **deploy your backend** and update the frontend to use it.

---

## Quick Fix Steps

### Step 1: Deploy Backend (Railway - Easiest)

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **Click**: "New Project" → "Deploy from GitHub repo"
4. **Select**: `lilizu-cyber/iam_blog`
5. **Railway auto-detects** Node.js → Click "Deploy"

### Step 2: Configure Backend Environment Variables

In Railway → Your Service → **Variables** tab, add:

```bash
NODE_ENV=production
PORT=3001
POSTGRESQL_URI=your-supabase-connection-string
JWT_SECRET=your-strong-secret-minimum-32-characters
FRONTEND_URL=https://iam-blog.vercel.app
```

**Important**: Set `FRONTEND_URL` to your Vercel URL!

### Step 3: Get Your Backend URL

1. Railway → Service → **Settings**
2. Click **"Generate Domain"**
3. Your backend URL: `https://your-app.railway.app`
4. **Test it**: Visit `https://your-app.railway.app/health`

### Step 4: Update Vercel Environment Variable

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Update** `VITE_API_URL`:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-app.railway.app/api`
   - **Environments**: Production, Preview, Development
3. **Save**

### Step 5: Redeploy Vercel

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger auto-deploy

---

## Why This Happens

### Current Setup (Broken)
```
Vercel Frontend (https://iam-blog.vercel.app)
    ↓ tries to call
localhost:3001 ❌ (doesn't exist on internet)
```

### Fixed Setup (Working)
```
Vercel Frontend (https://iam-blog.vercel.app)
    ↓ calls
Railway Backend (https://your-app.railway.app) ✅
    ↓ allows CORS from
https://iam-blog.vercel.app ✅
```

---

## Temporary Workaround (Testing Only)

If you want to test locally while backend is deploying:

1. **Run backend locally**: `npm run dev:backend`
2. **Update Vercel env var temporarily**: 
   - Use a tunneling service like **ngrok**:
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Create tunnel
   ngrok http 3001
   
   # Use the ngrok URL in Vercel:
   # VITE_API_URL = https://xxxxx.ngrok.io/api
   ```

**Note**: This is only for testing. Deploy the backend properly for production.

---

## Verify It's Working

After deploying backend and updating Vercel:

1. **Visit**: `https://iam-blog.vercel.app`
2. **Open browser console** (F12)
3. **Check Network tab** - API calls should go to `https://your-app.railway.app/api`
4. **No CORS errors** should appear

---

## Common Issues

### Backend Still Shows CORS Error

**Problem**: Backend CORS not updated

**Solution**:
1. Check `FRONTEND_URL` in Railway is set to `https://iam-blog.vercel.app`
2. Restart Railway service
3. Verify backend logs show correct CORS origin

### Frontend Still Calls localhost

**Problem**: Vercel environment variable not updated

**Solution**:
1. Verify `VITE_API_URL` is set in Vercel
2. Redeploy Vercel (environment variables require redeploy)
3. Check build logs to confirm variable is used

### Backend Not Accessible

**Problem**: Backend deployment failed

**Solution**:
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Check database connection (Supabase)
4. Test `/health` endpoint directly

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Set `FRONTEND_URL` in backend
3. ✅ Update `VITE_API_URL` in Vercel
4. ✅ Redeploy Vercel
5. ✅ Test the application

---

**See**: `BACKEND_DEPLOY_QUICK_START.md` for detailed backend deployment instructions.

