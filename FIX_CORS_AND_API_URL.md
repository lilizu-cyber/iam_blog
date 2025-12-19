# 🔧 Fix CORS and API URL Issues

## The Problems

1. **Frontend is using `localhost:3001`** instead of your Railway backend URL
2. **Backend CORS** is configured for `http://localhost:3000` instead of `https://iam-blog.vercel.app`

## ✅ Solution

### Step 1: Get Your Railway Backend URL

1. Go to Railway Dashboard → Your Service
2. Click **"Settings"** → **"Generate Domain"** (if not already done)
3. Your backend URL will be: `https://your-app-name.railway.app`
4. **Copy this URL** - you'll need it!

---

### Step 2: Update Vercel Environment Variable

**Exact Location:**
1. **Vercel Dashboard** → Click your project (`iam_blog`)
2. Click **"Settings"** tab (top navigation)
3. Click **"Environment Variables"** (left sidebar, under Configuration)
4. Fill in the form:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-app-name.railway.app/api`
     - Replace `your-app-name` with your actual Railway app name!
   - **Environment**: Select **"Production"**
5. Click **"Save"**

6. **IMPORTANT - Redeploy**:
   - Click **"Deployments"** tab (top navigation)
   - Find latest deployment
   - Click **"..."** (three dots) → **"Redeploy"**

**See `VERCEL_ENV_VAR_STEPS.md` for detailed step-by-step guide.**

---

### Step 3: Verify Railway Environment Variables

Make sure Railway has these set (from `RAILWAY_ENV_SETUP.md`):

1. Go to Railway → Your Service → **"Variables"**
2. Verify these are set:
   ```
   NODE_ENV=production
   POSTGRESQL_URI=your-supabase-connection-string
   JWT_SECRET=your-secret-here
   FRONTEND_URL=https://iam-blog.vercel.app
   ```

   **Important**: `FRONTEND_URL` must match your Vercel URL exactly!

---

### Step 4: Redeploy Both Services

1. **Railway**: Should auto-redeploy when you update variables, or click "Redeploy"
2. **Vercel**: Must manually redeploy after adding `VITE_API_URL`

---

## ✅ Verify It Works

After both redeployments:

1. **Test Backend**: Visit `https://your-app-name.railway.app/health`
   - Should return: `{"status":"healthy",...}`

2. **Test Frontend**: Visit `https://iam-blog.vercel.app`
   - Open browser console (F12)
   - Should see API calls to `https://your-app-name.railway.app/api/...`
   - **No more CORS errors!**

---

## 🎯 Quick Checklist

- [ ] Railway backend URL: `https://your-app-name.railway.app`
- [ ] Vercel `VITE_API_URL` = `https://your-app-name.railway.app/api`
- [ ] Railway `FRONTEND_URL` = `https://iam-blog.vercel.app`
- [ ] Both services redeployed
- [ ] No CORS errors in browser console

---

## 🆘 Still Having Issues?

**Check:**
- ✅ Railway backend is running (check `/health` endpoint)
- ✅ `FRONTEND_URL` in Railway matches Vercel URL exactly (no trailing slash)
- ✅ `VITE_API_URL` in Vercel includes `/api` at the end
- ✅ Both services have been redeployed after changes

