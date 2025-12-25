# 🎯 Google AdSense Setup Guide for cyberiam.blog

Complete guide to set up and monetize your blog with Google AdSense.

## Prerequisites

1. ✅ Domain purchased: `cyberiam.blog`
2. ✅ Website deployed and accessible
3. ✅ Content published (at least 10-15 quality posts)
4. ✅ Privacy Policy and Terms of Service pages
5. ✅ About page with information about your blog

## Step 1: Apply for Google AdSense

### 1.1 Create AdSense Account

1. **Visit**: https://www.google.com/adsense/
2. **Click**: "Get Started"
3. **Sign in** with your Google account
4. **Enter your website**: `https://cyberiam.blog`
5. **Select your country** and accept terms
6. **Submit application**

### 1.2 Complete Application

Google will review your site. This typically takes:
- **1-14 days** for approval
- Sometimes up to 4 weeks

**Requirements for approval:**
- ✅ Original, quality content
- ✅ At least 10-15 blog posts
- ✅ Privacy Policy page
- ✅ Terms of Service page
- ✅ About page
- ✅ Easy navigation
- ✅ Mobile-friendly design
- ✅ No policy violations

## Step 2: Get Your AdSense Client ID

Once approved:

1. **Log in** to AdSense dashboard
2. **Go to**: Settings → Account → Account Information
3. **Find**: "Publisher ID" (format: `ca-pub-XXXXXXXXXX`)
4. **Copy this ID** - you'll need it!

## Step 3: Configure Environment Variable

### 3.1 Add to Vercel

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Add new variable**:
   - **Key**: `VITE_GOOGLE_ADSENSE_CLIENT_ID`
   - **Value**: `ca-pub-XXXXXXXXXX` (your Publisher ID)
   - **Environment**: Production, Preview, Development
3. **Save**

### 3.2 Add to Local `.env`

For local development, add to `frontend/.env`:

```bash
VITE_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
```

## Step 4: Create Ad Units in AdSense

### 4.1 Create Ad Units

1. **AdSense Dashboard** → **Ads** → **By ad unit**
2. **Click**: "Create new ad unit"
3. **Choose ad type**:
   - **Display ads** (recommended for blogs)
   - **In-article ads** (for blog posts)
   - **In-feed ads** (for blog lists)
   - **Multiplex ads** (multiple ads in one unit)

### 4.2 Recommended Ad Units

Create these ad units:

1. **Sidebar Ad** (Rectangle)
   - Name: `Sidebar Rectangle`
   - Size: 300x250 or 336x280
   - **Note the Ad Slot ID** (format: `1234567890`)

2. **In-Article Ad** (for blog posts)
   - Name: `In-Article Ad`
   - Size: Responsive
   - **Note the Ad Slot ID**

3. **Banner Ad** (Top/Bottom)
   - Name: `Banner Ad`
   - Size: 728x90 or Responsive
   - **Note the Ad Slot ID**

4. **Auto Ads** (Recommended)
   - Name: `Auto Ads`
   - Type: Auto ads
   - **Note**: This uses your Publisher ID, not a slot ID

## Step 5: Add Ads to Your Blog

### 5.1 Add Auto Ads (Easiest - Recommended)

Auto ads automatically place ads in optimal locations.

**Update `frontend/index.html`:**

Add this script before `</head>`:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
     crossorigin="anonymous"></script>
```

**Note**: Replace `ca-pub-XXXXXXXXXX` with your actual Publisher ID.

### 5.2 Add Manual Ad Units

Use the AdSense components in your blog:

**In Blog Post (`frontend/src/pages/BlogPost.jsx`):**

```jsx
import { InArticleAd } from '../components/Ads/GoogleAdSense'

// In your component, add ads between content sections:
<InArticleAd adSlot="YOUR_IN_ARTICLE_AD_SLOT_ID" />
```

**In Sidebar (`frontend/src/components/Layout/Sidebar.jsx`):**

```jsx
import { SidebarAd } from '../components/Ads/GoogleAdSense'

// Add to sidebar:
<SidebarAd adSlot="YOUR_SIDEBAR_AD_SLOT_ID" />
```

**Banner Ads (Top/Bottom of pages):**

```jsx
import { BannerAd } from '../components/Ads/GoogleAdSense'

// Add to top or bottom of page:
<BannerAd adSlot="YOUR_BANNER_AD_SLOT_ID" />
```

## Step 6: Update Environment Variables

After getting your Ad Slot IDs, you can store them as environment variables:

**Vercel Environment Variables:**

```
VITE_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
VITE_ADSENSE_SIDEBAR_SLOT=1234567890
VITE_ADSENSE_IN_ARTICLE_SLOT=0987654321
VITE_ADSENSE_BANNER_SLOT=1122334455
```

## Step 7: Verify AdSense Integration

### 7.1 Check AdSense Dashboard

1. **AdSense Dashboard** → **Ads** → **By ad unit**
2. **Check**: "Status" should show "Active"
3. **Wait**: Ads may take 24-48 hours to start showing

### 7.2 Test on Your Site

1. **Visit**: `https://cyberiam.blog`
2. **Check browser console** for AdSense errors
3. **Verify ads appear** (may take time)
4. **Test on mobile** devices

## Step 8: Best Practices

### 8.1 Ad Placement

✅ **Good placements:**
- After first paragraph in blog posts
- In sidebar (not too many)
- Between content sections
- Bottom of blog posts

❌ **Avoid:**
- Too many ads (3-4 max per page)
- Ads that block content
- Ads above the fold only
- Clickbait content

### 8.2 User Experience

- ✅ Respect cookie consent
- ✅ Don't slow down page load
- ✅ Mobile-friendly ads
- ✅ Clear separation from content

### 8.3 Compliance

- ✅ Privacy Policy mentions AdSense
- ✅ Cookie consent for ads
- ✅ No click fraud
- ✅ Follow AdSense policies

## Step 9: Monitor Performance

### 9.1 AdSense Dashboard

- **Earnings**: Track revenue
- **Page RPM**: Revenue per 1000 page views
- **CTR**: Click-through rate
- **CPC**: Cost per click

### 9.2 Optimization Tips

1. **Test different ad sizes**
2. **Try different placements**
3. **Monitor which ads perform best**
4. **A/B test ad positions**

## Troubleshooting

### Ads Not Showing?

1. **Check**: AdSense account approved?
2. **Verify**: Client ID correct in environment variables
3. **Check**: Ad units created and active?
4. **Wait**: Can take 24-48 hours after setup
5. **Check browser console** for errors

### Low Earnings?

1. **More traffic** = More earnings
2. **Quality content** = Better ad rates
3. **SEO optimization** = More organic traffic
4. **Social media promotion** = More visitors

### Policy Violations?

1. **Read**: AdSense policies carefully
2. **Fix**: Any violations immediately
3. **Contact**: AdSense support if needed

## Quick Reference

**Publisher ID Format**: `ca-pub-XXXXXXXXXX`  
**Ad Slot ID Format**: `1234567890`  
**Environment Variable**: `VITE_GOOGLE_ADSENSE_CLIENT_ID`

## Next Steps

1. ✅ Apply for AdSense
2. ✅ Get approved
3. ✅ Add Client ID to environment variables
4. ✅ Create ad units
5. ✅ Add ads to your blog
6. ✅ Monitor performance
7. ✅ Optimize for better earnings

## Support

- **AdSense Help**: https://support.google.com/adsense
- **AdSense Policies**: https://support.google.com/adsense/answer/48182
- **AdSense Community**: https://support.google.com/adsense/community

---

**Remember**: AdSense approval can take time. Focus on creating quality content while waiting for approval!

