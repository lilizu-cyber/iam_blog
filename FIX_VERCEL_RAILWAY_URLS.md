# 🔧 Fix Vercel and Railway URLs

## The Problems

1. **Frontend is using placeholder**: `https://your-railway-app.railway.app` (not a real URL!)
2. **Backend CORS is wrong**: Set to `https://railway.com` instead of your Vercel URL
3. **Vercel preview URL**: `https://iam-blog-b5g92zbko-lilis-projects-3fb4f039.vercel.app`

---

## ✅ Step 1: Get Your Real Railway Backend URL

1. **Go to Railway Dashboard** → Your Service
2. **Click "Settings"** tab
3. **Find "Domains"** section
4. **Your Railway URL** will be something like:
   - `https://iam-blog-production.up.railway.app`
   - OR `https://iam-blog-backend.railway.app`
   - OR a custom domain you set up

**Copy this URL!** (It's NOT `your-railway-app.railway.app` - that's just a placeholder!)

---

## ✅ Step 2: Update Vercel Environment Variable

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Find `VITE_API_URL`** (or create it)
3. **Update the value** to:
   ```
   https://YOUR-ACTUAL-RAILWAY-URL.railway.app/api
   ```
   **Replace `YOUR-ACTUAL-RAILWAY-URL` with your real Railway URL!**

   Example:
   ```
   https://iam-blog-production.up.railway.app/api
   ```

4. **Environment**: Select **"Production"** (or "All" for all environments)
5. **Click "Save"**
6. **Redeploy**: Go to "Deployments" → Click "..." → "Redeploy"

---

## ✅ Step 3: Fix Railway CORS (FRONTEND_URL)

Your Railway backend needs to allow your Vercel URL.

### Option A: Use Production Vercel URL (Recommended)

1. **Get your production Vercel URL**:
   - Vercel Dashboard → Your Project → **Settings** → **Domains**
   - Your production URL is usually: `https://iam-blog.vercel.app`
   - OR your custom domain if you set one up

2. **Update Railway**:
   - Railway Dashboard → Your Service → **Variables**
   - Find `FRONTEND_URL`
   - Set to: `https://iam-blog.vercel.app` (your production URL)
   - **Save**

### Option B: Allow All Preview Deployments (For Development)

If you want preview deployments to work, you'll need to update the backend CORS code to allow multiple origins. But for now, use **Option A** with your production URL.

---

## ✅ Step 4: Verify Both URLs

### Railway Variables Should Have:
```
FRONTEND_URL = https://iam-blog.vercel.app
```

### Vercel Environment Variable Should Have:
```
VITE_API_URL = https://your-actual-railway-url.railway.app/api
```

**Important**: 
- Railway URL should NOT have `/api` in `FRONTEND_URL`
- Vercel URL SHOULD have `/api` in `VITE_API_URL`

---

## ✅ Step 5: Redeploy Both

1. **Railway**: Auto-redeploys when you save variables, or click "Redeploy"
2. **Vercel**: Must manually redeploy after changing `VITE_API_URL`

---

## 🧪 Test It

After both redeployments:

1. **Visit your Vercel site**: `https://iam-blog.vercel.app`
2. **Open browser console** (F12)
3. **Should see**:
   - API calls to `https://your-actual-railway-url.railway.app/api/...`
   - **No CORS errors!**

---

## 📋 Quick Checklist

- [ ] Got your real Railway URL (NOT `your-railway-app.railway.app`)
- [ ] Updated Vercel `VITE_API_URL` with real Railway URL + `/api`
- [ ] Updated Railway `FRONTEND_URL` with your Vercel production URL
- [ ] Redeployed both services
- [ ] No CORS errors in browser console

---

## 🆘 Still Having Issues?

**Check:**
- ✅ Railway URL is real (not a placeholder)
- ✅ `VITE_API_URL` includes `/api` at the end
- ✅ `FRONTEND_URL` matches your Vercel production URL exactly
- ✅ Both services redeployed after changes
- ✅ Using production Vercel URL, not preview URL




