# 🚨 URGENT: Fix CORS and API URL Errors

## The Problems

1. **Frontend is using placeholder URL**: `https://your-railway-app.railway.app` (not real!)
2. **Backend CORS is wrong**: Set to `https://railway.com` instead of `https://iam-blog.vercel.app`

---

## ✅ Fix 1: Update Vercel Environment Variable

Your frontend needs to use your **actual Railway backend URL**, not the placeholder.

### Step 1: Get Your Real Railway URL

1. **Railway Dashboard** → Your Service → **Settings** tab
2. **Find "Domains"** section (or "Generate Domain" if you haven't)
3. **Your Railway URL** will be something like:
   - `https://iam-blog-production.up.railway.app`
   - OR `https://iam-blog-backend.railway.app`
   - OR `https://[your-service-name].railway.app`

**Copy this URL!** (It's NOT `your-railway-app.railway.app` - that's a placeholder!)

### Step 2: Update Vercel Environment Variable

1. **Vercel Dashboard** → Your Project (`iam-blog`) → **Settings** → **Environment Variables**
2. **Find `VITE_API_URL`** (or create it if it doesn't exist)
3. **Update the value** to:
   ```
   https://YOUR-ACTUAL-RAILWAY-URL.railway.app/api
   ```
   **Replace `YOUR-ACTUAL-RAILWAY-URL` with your real Railway URL!**

   **Example:**
   ```
   https://iam-blog-production.up.railway.app/api
   ```

4. **Environment**: Select **"Production"** (or "All" for all environments)
5. **Click "Save"**
6. **IMPORTANT - Redeploy**: 
   - Go to **"Deployments"** tab
   - Click **"..."** (three dots) on latest deployment
   - Click **"Redeploy"**

---

## ✅ Fix 2: Update Railway CORS (FRONTEND_URL)

Your Railway backend needs to allow your Vercel frontend.

1. **Railway Dashboard** → Your Service → **Variables** tab
2. **Find `FRONTEND_URL`** (or create it if it doesn't exist)
3. **Update the value** to:
   ```
   https://iam-blog.vercel.app
   ```
   **Important**: This is your Vercel production URL, NOT Railway URL!

4. **Click "Save"** (Railway will auto-redeploy)

---

## ✅ Quick Checklist

- [ ] Got your real Railway URL (from Railway → Settings → Domains)
- [ ] Updated Vercel `VITE_API_URL` = `https://your-real-railway-url.railway.app/api`
- [ ] Redeployed Vercel after updating `VITE_API_URL`
- [ ] Updated Railway `FRONTEND_URL` = `https://iam-blog.vercel.app`
- [ ] Railway auto-redeployed after saving `FRONTEND_URL`

---

## 🧪 Test After Fixes

1. **Wait for both redeployments to complete** (check Railway and Vercel dashboards)
2. **Visit**: `https://iam-blog.vercel.app`
3. **Open browser console** (F12)
4. **Should see**:
   - ✅ API calls to `https://your-real-railway-url.railway.app/api/...`
   - ✅ **No CORS errors!**
   - ✅ Blog posts loading

---

## 🆘 Still Having Issues?

### Error: "your-railway-app.railway.app" in console

**Fix**: You didn't update `VITE_API_URL` in Vercel, or you didn't redeploy after updating it.

### Error: "Access-Control-Allow-Origin header has value 'https://railway.com'"

**Fix**: `FRONTEND_URL` in Railway is set to `https://railway.com` instead of `https://iam-blog.vercel.app`

### Error: "Access-Control-Allow-Origin header has value 'http://localhost:3000'"

**Fix**: `FRONTEND_URL` in Railway is not set, or `NODE_ENV` is not set to `production`

---

## 📝 Summary

**Vercel needs:**
- `VITE_API_URL` = `https://your-real-railway-url.railway.app/api`

**Railway needs:**
- `FRONTEND_URL` = `https://iam-blog.vercel.app`
- `NODE_ENV` = `production`

**Both need to be redeployed after changes!**



