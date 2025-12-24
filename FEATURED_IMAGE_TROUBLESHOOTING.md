# Featured Image Troubleshooting Guide

## 📍 Where Featured Images Appear

Featured images are displayed in **4 main locations**:

### 1. **Individual Blog Post Page** (Main View)
- **Location**: Top of the post, large hero section
- **URL**: `http://localhost:3000/blog/[post-slug]`
- **Size**: Large banner image (21:9 aspect ratio)
- **What you'll see**: 
  - ✅ **With image**: Large featured image at the top
  - ❌ **Without image**: Blue gradient background

### 2. **Home Page - Featured Posts Section**
- **Location**: Middle of homepage, "Featured Articles" section
- **URL**: `http://localhost:3000/`
- **Size**: Medium cards (16:9 aspect ratio)
- **What you'll see**:
  - ✅ **With image**: Image in each post card
  - ❌ **Without image**: Gradient background with icon

### 3. **Home Page - Recent Posts Section**
- **Location**: Bottom of homepage, "Latest Articles" section
- **URL**: `http://localhost:3000/`
- **Size**: Small thumbnail (16:9 aspect ratio)
- **What you'll see**:
  - ✅ **With image**: Small image on the left of each post
  - ❌ **Without image**: Gradient background with icon

### 4. **Blog List Page**
- **Location**: Main blog listing page
- **URL**: `http://localhost:3000/blog`
- **Size**: Medium cards (16:9 aspect ratio)
- **What you'll see**:
  - ✅ **With image**: Image in each post card
  - ❌ **Without image**: Gradient background with icon

## 🔍 How to Check if Your Post Has a Featured Image

### Option 1: Check in Admin Dashboard
1. Go to **Admin → Manage Posts**
2. Click **Edit** on your Okta post
3. Look at the form - there's no visible field, but check the browser console:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Type: `console.log(formData.featuredImage)`
   - You should see the image object if it's set

### Option 2: Check the API Response
1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Visit your blog post page
4. Find the API call to `/api/blog/posts/slug/[your-slug]`
5. Check the response - look for `featuredImage` field

### Option 3: Check Database Directly
If you have database access, check the `blog_posts` table:
```sql
SELECT post_id, title, featured_image 
FROM blog_posts 
WHERE slug LIKE '%okta%';
```

## 🛠️ Fixing the Issue

### Step 1: Save the Image File

**CRITICAL**: The image file must exist first!

1. **Save the Okta image** to:
   ```
   frontend/public/images/okta-featured-image.png
   ```

2. **Verify the file exists**:
   ```bash
   # In your project root
   ls frontend/public/images/okta-featured-image.png
   ```

3. **If the file doesn't exist**, the image won't load even if it's assigned in the database!

### Step 2: Assign Image to Existing Posts

You have **3 options**:

#### Option A: Run the Script (Recommended)
```bash
node scripts/assign-okta-featured-image.js
```

This will:
- Find all posts mentioning "Okta"
- Assign the featured image to posts without one
- Show you which posts were updated

#### Option B: Edit Post Manually
1. Go to **Admin → Manage Posts**
2. Click **Edit** on your Okta post
3. The image should auto-assign when you save (if "Okta" is in the title/content)
4. Click **Save Draft** or **Publish**

#### Option C: Use Auto-Detection
1. Edit your post
2. Make sure "Okta" is in the title, content, excerpt, or tags
3. Save the post
4. The image should auto-assign (if no image is currently set)

### Step 3: Verify the Image Path

Check that the path in `frontend/src/utils/oktaFeaturedImage.js` matches your file:

```javascript
export const OKTA_FEATURED_IMAGE = {
  url: '/images/okta-featured-image.png', // ← Must match your file name
  alt: 'Okta Identity and Access Management Platform',
  width: 1200,
  height: 630
};
```

**Important**: The path starts with `/images/` which maps to `frontend/public/images/`

### Step 4: Clear Cache and Refresh

1. **Hard refresh** your browser:
   - Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **Clear React Query cache**:
   - The frontend caches post data
   - Navigate away and back to the post
   - Or restart your dev server

3. **Restart your dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

## 🐛 Common Issues and Solutions

### Issue 1: Image File Doesn't Exist
**Symptom**: No image shows, browser console shows 404 error

**Solution**:
1. Save the image to `frontend/public/images/okta-featured-image.png`
2. Verify the file exists
3. Restart your dev server

### Issue 2: Post Doesn't Have Featured Image in Database
**Symptom**: Image file exists but still shows gradient background

**Solution**:
1. Run the script: `node scripts/assign-okta-featured-image.js`
2. Or manually edit the post and save it
3. Check the database to verify `featured_image` field is set

### Issue 3: Auto-Detection Not Working
**Symptom**: "Okta" is in the post but image isn't auto-assigned

**Solution**:
1. Check that "Okta" is spelled correctly (case-insensitive)
2. Make sure the post doesn't already have a featured image (auto-detection only works if no image is set)
3. Try manually editing and saving the post
4. Check browser console for any JavaScript errors

### Issue 4: Image Shows in Some Places But Not Others
**Symptom**: Image appears on blog post page but not on home page

**Solution**:
1. Clear React Query cache (navigate away and back)
2. Check that all components are using `post.featuredImage` correctly
3. Verify the image URL is accessible: `http://localhost:3000/images/okta-featured-image.png`

### Issue 5: Wrong Image Path
**Symptom**: 404 error in browser console, image path looks wrong

**Solution**:
1. Check the path in `oktaFeaturedImage.js`
2. Verify the file is in `frontend/public/images/`
3. Make sure the path starts with `/images/` (not `/public/images/`)

## ✅ Quick Checklist

Before asking for help, verify:

- [ ] Image file exists at `frontend/public/images/okta-featured-image.png`
- [ ] Image file name matches the path in `oktaFeaturedImage.js`
- [ ] Post mentions "Okta" in title, content, excerpt, or tags
- [ ] Ran the script: `node scripts/assign-okta-featured-image.js`
- [ ] Cleared browser cache (hard refresh)
- [ ] Restarted dev server
- [ ] Checked browser console for errors
- [ ] Verified post has `featuredImage` in database/API response

## 🧪 Testing Steps

1. **Test the image file directly**:
   ```
   http://localhost:3000/images/okta-featured-image.png
   ```
   If this doesn't work, the file isn't in the right place!

2. **Test auto-detection**:
   - Create a new post with "Okta" in the title
   - Check if image auto-assigns
   - If not, check browser console for errors

3. **Test script**:
   ```bash
   node scripts/assign-okta-featured-image.js
   ```
   Should show which posts were updated

4. **Test on different pages**:
   - Home page (Featured Posts section)
   - Home page (Recent Posts section)
   - Blog list page (`/blog`)
   - Individual post page (`/blog/[slug]`)

## 📞 Still Not Working?

If you've tried everything above:

1. **Check browser console** (F12 → Console) for errors
2. **Check network tab** (F12 → Network) for failed image requests
3. **Check the API response** - does `featuredImage` exist in the JSON?
4. **Verify database** - is `featured_image` field populated in the database?

## 🎯 Expected Result

After completing all steps, you should see:

- ✅ Large hero image at the top of your Okta blog post
- ✅ Image in the Featured Posts section on homepage
- ✅ Image in the Recent Posts section on homepage
- ✅ Image in the Blog list page
- ✅ Image in social media previews (Open Graph, Twitter Cards)

---

**Remember**: The image file must exist in `frontend/public/images/` before anything else will work!

