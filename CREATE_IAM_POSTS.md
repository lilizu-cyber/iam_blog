# Creating IAM Blog Posts

## Option 1: Use the Admin Panel (Recommended)

1. **Start the backend server** (if not already running):
   ```powershell
   npm run dev
   ```

2. **Login to admin panel**:
   - Go to: http://localhost:3000/admin/login
   - Username: `admin`
   - Password: `Schlurfend.?.123`

3. **Create posts manually**:
   - Go to "Create Post" or "Manage Posts"
   - Create each of the 5 IAM articles
   - Make sure to:
     - Set **Category** to **"IAM"**
     - Set **Status** to **"Published"**
     - Add appropriate tags

## Option 2: Use the Script (Requires Backend Running)

1. **Make sure backend is running**:
   ```powershell
   npm run dev
   ```

2. **Run the creation script**:
   ```powershell
   node scripts/create-iam-posts-api.js
   ```

   OR

   ```powershell
   node scripts/diagnose-and-create-posts.js
   ```

## Option 3: Verify Existing Posts

Check if posts already exist:
```powershell
node scripts/check-posts.js
```

## Troubleshooting

If posts are not showing on `/iam` page:

1. **Check if posts exist in database**:
   - Posts should have `status = 'published'`
   - Posts should have `is_iam_related = true`
   - Posts should have `category_id = 'iam'`

2. **Check backend logs** for errors

3. **Verify the query** is working:
   - Test: `http://localhost:3001/api/blog/iam`

4. **Clear browser cache** and refresh

## Articles to Create

1. Identity as the New Security Perimeter: How Okta Shapes Modern IAM Strategy
2. Automating the Identity Lifecycle With Okta: Reducing Risk and Improving Efficiency
3. Defending Against MFA Fatigue Attacks: How Okta Strengthens Modern Authentication
4. How Okta Workflows and AI Transform Identity Operations
5. Rethinking Access Governance With Okta Identity Governance (OIG)








