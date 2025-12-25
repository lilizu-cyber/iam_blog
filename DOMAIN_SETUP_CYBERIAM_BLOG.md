# 🌐 Domain Setup Guide: cyberiam.blog

Complete guide to configure your custom domain `cyberiam.blog` with Vercel.

## Step 1: Configure Domain in Vercel

### 1.1 Add Domain to Vercel Project

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (`iam_blog` or your project name)
3. **Click**: "Settings" tab
4. **Click**: "Domains" in the left sidebar
5. **Click**: "Add Domain" button
6. **Enter**: `cyberiam.blog`
7. **Click**: "Add"

### 1.2 Configure DNS Records

Vercel will show you DNS records to add. You need to add these to your domain registrar:

#### Option A: Use Vercel Nameservers (Recommended)

1. **Copy the nameservers** from Vercel (usually 2-4 nameservers)
2. **Go to your domain registrar** (where you bought cyberiam.blog)
3. **Find DNS/Nameserver settings**
4. **Replace existing nameservers** with Vercel's nameservers
5. **Save changes**

**Vercel nameservers typically look like:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

#### Option B: Use A/CNAME Records (If you want to keep your registrar's DNS)

1. **Vercel will show you**:
   - An A record: `76.76.21.21` (or similar IP)
   - A CNAME record: `cname.vercel-dns.com`

2. **Go to your domain registrar's DNS settings**
3. **Add these records**:
   - **Type**: A
   - **Name**: @ (or root domain)
   - **Value**: `76.76.21.21` (IP from Vercel)
   - **TTL**: 3600

   - **Type**: CNAME
   - **Name**: www
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: 3600

4. **Save changes**

### 1.3 Wait for DNS Propagation

- **Usually takes**: 5 minutes to 48 hours
- **Typically**: 1-2 hours
- **Check status**: Vercel dashboard will show "Valid Configuration" when ready

## Step 2: Update Environment Variables

### 2.1 Update Railway Backend (FRONTEND_URL)

1. **Go to Railway Dashboard** → Your Backend Service
2. **Click**: "Variables" tab
3. **Find**: `FRONTEND_URL`
4. **Update to**: `https://cyberiam.blog`
5. **Save**

**Important**: This allows your backend to accept requests from your new domain.

### 2.2 Update Vercel (if needed)

Your Vercel environment variables should already work, but verify:

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Check**: `VITE_API_URL` is set correctly (should point to Railway backend)
3. **No changes needed** for domain setup

## Step 3: Update Code References

### 3.1 Domain Already Updated ✅

The following files have been updated to use `cyberiam.blog`:

- ✅ `frontend/index.html` - Meta tags updated
- ✅ `frontend/src/pages/Home.jsx` - Social links updated
- ✅ Domain references use `window.location.origin` (auto-updates)

### 3.2 Verify Updates

The code now uses:
- `https://cyberiam.blog` in meta tags
- Dynamic `window.location.origin` for URLs (automatically uses correct domain)

## Step 4: SSL Certificate

### 4.1 Automatic SSL

- ✅ **Vercel automatically provisions SSL** for your domain
- ✅ **HTTPS is enabled** automatically
- ✅ **No action needed** - just wait for DNS to propagate

### 4.2 Verify SSL

After DNS propagates:
1. **Visit**: `https://cyberiam.blog`
2. **Check**: Browser shows padlock icon
3. **Verify**: No SSL warnings

## Step 5: Test Your Domain

### 5.1 Basic Tests

1. **Visit**: `https://cyberiam.blog`
   - Should load your blog homepage

2. **Visit**: `https://www.cyberiam.blog`
   - Should redirect to `https://cyberiam.blog` (or vice versa)

3. **Test pages**:
   - `https://cyberiam.blog/blog`
   - `https://cyberiam.blog/admin/login`
   - `https://cyberiam.blog/about`

### 5.2 Check Backend Connection

1. **Open browser console** (F12)
2. **Visit**: `https://cyberiam.blog`
3. **Check Network tab** for API calls
4. **Verify**: No CORS errors
5. **Verify**: API calls go to Railway backend

## Step 6: Update External References

### 6.1 Social Media

Update your social media profiles:
- **Twitter**: Update website URL to `https://cyberiam.blog`
- **LinkedIn**: Update company page URL
- **GitHub**: Update repository description/website

### 6.2 Google Search Console

1. **Go to**: https://search.google.com/search-console
2. **Add property**: `https://cyberiam.blog`
3. **Verify ownership** (DNS or HTML file)
4. **Submit sitemap**: `https://cyberiam.blog/sitemap.xml`

### 6.3 Google Analytics (if using)

1. **Google Analytics** → Admin → Property Settings
2. **Update**: Default URL to `https://cyberiam.blog`

## Step 7: Redirect Old URLs (if applicable)

If you had a previous domain:

1. **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. **Add old domain** (if you have one)
3. **Set up redirect** to `cyberiam.blog`

Or add redirects in `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "https://cyberiam.blog/$1",
      "permanent": true
    }
  ]
}
```

## Troubleshooting

### Domain Not Working?

1. **Check DNS propagation**:
   - Use: https://dnschecker.org
   - Enter: `cyberiam.blog`
   - Verify: Records match Vercel's requirements

2. **Check Vercel status**:
   - Vercel Dashboard → Domains
   - Should show: "Valid Configuration"

3. **Wait longer**:
   - DNS can take up to 48 hours
   - Usually works within 1-2 hours

### SSL Certificate Issues?

1. **Wait for DNS propagation** first
2. **Vercel auto-provisions SSL** after DNS is valid
3. **Can take**: 5-10 minutes after DNS is valid

### CORS Errors?

1. **Verify**: Railway `FRONTEND_URL` = `https://cyberiam.blog`
2. **Redeploy**: Railway backend after updating `FRONTEND_URL`
3. **Check**: Vercel `VITE_API_URL` points to Railway backend

## Quick Checklist

- [ ] Domain added to Vercel
- [ ] DNS records configured at registrar
- [ ] DNS propagated (check with dnschecker.org)
- [ ] Railway `FRONTEND_URL` updated to `https://cyberiam.blog`
- [ ] Railway backend redeployed
- [ ] Domain accessible at `https://cyberiam.blog`
- [ ] SSL certificate active (padlock icon)
- [ ] No CORS errors in browser console
- [ ] Google Search Console configured
- [ ] Social media profiles updated

## Next Steps

After domain is working:

1. ✅ **Set up Google AdSense** (see `GOOGLE_ADSENSE_SETUP.md`)
2. ✅ **Submit to Google Search Console**
3. ✅ **Update social media links**
4. ✅ **Monitor analytics**
5. ✅ **Start creating content!**

---

**Your blog will be live at**: `https://cyberiam.blog` 🎉

