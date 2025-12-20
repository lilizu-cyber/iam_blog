# 🔍 Verify /admin/posts Route

## Route Configuration

The route is correctly configured in `App.jsx`:
```javascript
<Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route path="posts" element={<ManagePosts />} />
</Route>
```

This should match `/admin/posts`.

## Troubleshooting Steps

### 1. Check Browser Console
Open browser console (F12) and check for:
- JavaScript errors
- Failed network requests
- React Router errors

### 2. Check Network Tab
In browser DevTools → Network tab:
- Look for requests to `/admin/posts`
- Check if it returns 404 (server) or if React Router handles it
- Check if `index.html` is being loaded

### 3. Verify Vercel Deployment
- Check Vercel dashboard → Deployments
- Ensure latest deployment completed successfully
- Check build logs for errors

### 4. Test Direct Access
Try accessing:
- `https://iam-blog.vercel.app/admin/posts` (with full domain)
- Check if it shows 404 or loads the page

### 5. Check Authentication
- Make sure you're logged in
- `/admin/posts` is protected, so you need to be authenticated
- If not logged in, it should redirect to `/admin/login`

### 6. Hard Refresh
- `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

## Possible Issues

### Issue 1: Vercel Not Applying Rewrite
**Symptom**: Vercel returns 404 before React Router loads

**Fix**: Verify `frontend/vercel.json` exists and has:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Issue 2: Build Error
**Symptom**: ManagePosts component not included in build

**Fix**: Check Vercel build logs for errors

### Issue 3: Lazy Loading Issue
**Symptom**: Component fails to load

**Fix**: Check browser console for import errors

## Quick Test

1. Go to: `https://iam-blog.vercel.app/admin/login`
2. Login
3. Should redirect to `/admin/dashboard`
4. Click "Manage Posts" card
5. Should navigate to `/admin/posts`

If step 5 fails, check browser console for errors.

