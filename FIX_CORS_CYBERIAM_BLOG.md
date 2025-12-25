# 🔧 Fix CORS for cyberiam.blog Domain

## The Problem

Your new domain `cyberiam.blog` is being blocked by CORS because the Railway backend doesn't allow it.

**Error**: `Access to XMLHttpRequest at 'https://iamblog-production.up.railway.app/api/...' from origin 'https://cyberiam.blog' has been blocked by CORS policy`

## ✅ Solution: Update Railway Environment Variable

The backend CORS configuration has been updated to allow `cyberiam.blog`, but you also need to update the Railway `FRONTEND_URL` environment variable.

### Step 1: Update Railway FRONTEND_URL

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your backend service** (iamblog-production or similar)
3. **Click**: "Variables" tab
4. **Find**: `FRONTEND_URL` environment variable
5. **Update the value** to: `https://cyberiam.blog`
   - **Note**: This replaces the old Vercel URL
   - If you want to keep both, you can set it to the new domain (cyberiam.blog takes priority)
6. **Click**: "Save"
7. **Wait**: Railway will automatically redeploy (takes 1-2 minutes)

### Step 2: Verify Backend Code is Updated

The backend code has been updated to allow:
- ✅ `https://cyberiam.blog` (your new domain)
- ✅ `*.cyberiam.blog` (any subdomains)
- ✅ `*.vercel.app` (Vercel preview URLs)
- ✅ The `FRONTEND_URL` environment variable value

**Make sure you've committed and pushed the code changes!**

### Step 3: Test the Fix

1. **Wait for Railway redeploy** to complete (check Railway dashboard)
2. **Visit**: `https://cyberiam.blog`
3. **Open browser console** (F12)
4. **Check**: No CORS errors
5. **Verify**: Blog posts load correctly

## Alternative: Support Multiple Domains

If you want to support both the old Vercel URL and the new domain, you can:

1. **Keep `FRONTEND_URL`** set to `https://cyberiam.blog` (primary domain)
2. The code now automatically allows:
   - The `FRONTEND_URL` value
   - `https://cyberiam.blog` (hardcoded)
   - `*.vercel.app` (all Vercel previews)

## Troubleshooting

### Still Getting CORS Errors?

1. **Check Railway deployment**: Make sure the redeploy completed
2. **Check environment variable**: Verify `FRONTEND_URL` is set correctly
3. **Check code deployment**: Make sure the CORS code changes are deployed
4. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. **Check Railway logs**: Look for CORS warnings in the logs

### Verify CORS Configuration

Check Railway logs for CORS messages:
- ✅ Should see: Requests from `https://cyberiam.blog` being allowed
- ❌ Should NOT see: "CORS blocked origin: https://cyberiam.blog"

## Quick Checklist

- [ ] Code changes committed and pushed
- [ ] Railway `FRONTEND_URL` updated to `https://cyberiam.blog`
- [ ] Railway redeployed successfully
- [ ] Tested `https://cyberiam.blog` - no CORS errors
- [ ] Blog posts loading correctly

---

**After updating Railway `FRONTEND_URL`, wait 1-2 minutes for redeploy, then test your site!**

