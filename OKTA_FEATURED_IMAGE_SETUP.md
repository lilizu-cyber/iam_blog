# Okta Featured Image Setup Guide

This guide explains how to automatically assign the Okta featured image to posts that mention "Okta".

## 📋 Overview

The system now automatically detects when a post mentions "Okta" (in title, content, excerpt, or tags) and assigns a default Okta featured image. This works for both new posts and existing posts.

## 🖼️ Step 1: Save the Okta Image

1. **Save the Okta image** to your project:
   - Location: `frontend/public/images/okta-featured-image.png`
   - Recommended size: 1200x630px (for optimal social media sharing)
   - Format: PNG or JPG

2. **Verify the image path** in `frontend/src/utils/oktaFeaturedImage.js`:
   ```javascript
   export const OKTA_FEATURED_IMAGE = {
     url: '/images/okta-featured-image.png', // Make sure this matches your file name
     alt: 'Okta Identity and Access Management Platform',
     width: 1200,
     height: 630
   };
   ```

## 🔄 Step 2: Update Existing Posts

To assign the Okta featured image to existing posts that mention "Okta":

1. **Run the script:**
   ```bash
   node scripts/assign-okta-featured-image.js
   ```

2. **The script will:**
   - Find all posts (published and drafts) that mention "Okta"
   - Assign the Okta featured image to posts that don't already have a featured image
   - Show you a list of updated posts

3. **Example output:**
   ```
   Found 5 published posts
   Found 2 draft posts
   Found 3 posts mentioning Okta
   ✓ Updated post: "Implementing Okta PAM Gateway" (post-id-1)
   ✓ Updated post: "A Complete Guide to Managing Okta" (post-id-2)
   ✅ Successfully updated 2 posts with Okta featured image
   ```

## ✨ Step 3: Automatic Detection (Already Implemented)

The system now **automatically** assigns the Okta featured image when:

1. **Creating a new post:**
   - Type "Okta" in the title, content, excerpt, or tags
   - The featured image will be automatically set (if no image is already set)

2. **Editing an existing post:**
   - Add "Okta" to the title, content, excerpt, or tags
   - The featured image will be automatically set (if no image is already set)

## 🔍 How Detection Works

The system checks for "Okta" mentions in:
- **Title** - Case-insensitive
- **Content** - Strips HTML and checks plain text
- **Excerpt** - Case-insensitive
- **Tags** - Checks all tags

**Keywords detected:** `okta`, `Okta`, `OKTA`

## 📝 Example Usage

### Creating a New Post

1. Go to Admin → Create Post
2. Enter title: "Implementing Okta PAM Gateway on Red Hat Linux"
3. The Okta featured image is **automatically assigned** ✨
4. Continue writing your content
5. Save or publish

### Editing an Existing Post

1. Go to Admin → Manage Posts → Edit
2. Add "Okta" to the title or content
3. The Okta featured image is **automatically assigned** ✨
4. Save changes

## 🎯 Your Recent Posts

Based on your request, these posts should have the Okta image:

1. **"Deploy Okta PAM Gateway on Red Hat Linux with SELinux"**
   - Slug: `deploy-okta-pam-gateway-on-red-hat-linux-with-selinux`
   - ✅ Will get Okta image automatically

2. **"A Complete Guide to Managing Okta Privileged Access Server Agents"**
   - Slug: `a-complete-guide-to-managing-okta-privileged-access-server-agents`
   - ✅ Will get Okta image automatically

## 🔧 Manual Override

If you want to use a different featured image for a specific Okta post:

1. Edit the post
2. Upload or select a different featured image
3. The system will **not** override manually set images

## 📁 Files Modified

- `frontend/src/utils/oktaFeaturedImage.js` - Utility functions
- `frontend/src/pages/admin/CreatePost.jsx` - Auto-detection on create
- `frontend/src/pages/admin/EditPost.jsx` - Auto-detection on edit
- `scripts/assign-okta-featured-image.js` - Script to update existing posts

## 🚀 Next Steps

1. ✅ **Save the Okta image** to `frontend/public/images/okta-featured-image.png`
2. ✅ **Run the script** to update existing posts: `node scripts/assign-okta-featured-image.js`
3. ✅ **Test** by creating a new post with "Okta" in the title
4. ✅ **Verify** the featured image appears on the blog post page

## 💡 Tips

- The image should be **1200x630px** for optimal social media sharing
- Use **PNG** format for best quality
- The image will appear in:
  - Blog post hero section
  - Social media previews (Open Graph, Twitter Cards)
  - Blog list pages
  - Home page featured posts

## ❓ Troubleshooting

**Q: The image isn't showing up**
- Check that the image file exists at `frontend/public/images/okta-featured-image.png`
- Verify the path in `oktaFeaturedImage.js` matches your file name
- Clear browser cache and refresh

**Q: The script didn't find my posts**
- Make sure the posts actually contain "Okta" (case-insensitive)
- Check the database connection in your `.env` file
- Review the script output for any errors

**Q: I want to use a different image for some Okta posts**
- Manually set the featured image in the edit post page
- The system will not override manually set images

---

**Note:** After saving the image and running the script, your Okta posts will automatically have the featured image assigned! 🎉

