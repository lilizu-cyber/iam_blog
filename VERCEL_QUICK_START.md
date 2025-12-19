# Vercel Deployment - Quick Start

## 🚀 Quick Deployment Steps

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Add Vercel configuration"
git push
```

### 2. Connect to Vercel

1. **Go to**: https://vercel.com
2. **Sign up/Login** (use GitHub account)
3. **Click "Add New Project"**
4. **Import your repository**
5. **Configure project**:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: Leave blank (or set to `frontend` if needed)
   - **Build Command**: `cd frontend && npm run build` (auto-detected)
   - **Output Directory**: `frontend/build` (auto-detected)

### 3. Set Environment Variables

**Before deploying**, go to **Project Settings → Environment Variables** and add:

```
VITE_API_URL = https://your-backend-url.com/api
```

**Important**: Replace `https://your-backend-url.com/api` with your actual backend URL.

### 4. Deploy

Click **"Deploy"** and wait 1-3 minutes.

### 5. Done! 🎉

Your site will be live at: `https://your-project.vercel.app`

---

## 📋 Checklist

- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Environment variable `VITE_API_URL` set
- [ ] Backend deployed and accessible
- [ ] Backend CORS allows Vercel domain
- [ ] Deployed successfully

---

## 🔧 Backend Configuration

**Important**: Your backend needs to allow requests from Vercel.

### Update Backend CORS

In your backend `.env`:
```bash
FRONTEND_URL=https://your-project.vercel.app
```

The backend already has CORS configured to use `FRONTEND_URL` in production.

---

## 🐛 Troubleshooting

### API Calls Failing?

1. Check `VITE_API_URL` is set in Vercel
2. Verify backend is accessible
3. Check backend CORS settings

### 404 on Routes?

- `vercel.json` should handle this automatically
- If not, check Vercel project settings

### Build Fails?

1. Test locally: `cd frontend && npm run build`
2. Check build logs in Vercel Dashboard
3. Fix any errors shown

---

## 📚 Full Documentation

See `docs/VERCEL_DEPLOYMENT.md` for complete guide.

---

**Need Help?** Check Vercel Dashboard → Deployments → View Logs

