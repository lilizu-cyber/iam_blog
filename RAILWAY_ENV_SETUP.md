# 🚨 Railway Environment Variables Setup

## The Problem

Your Railway deployment is crashing because environment variables are missing. The logs show:
- ❌ Missing `JWT_SECRET`
- ❌ Missing `POSTGRESQL_URI` or `DATABASE_URL`
- ❌ Missing `NODE_ENV` (required in production)
- ❌ Missing `FRONTEND_URL` (required in production)

## ✅ Quick Fix - Add Environment Variables

### Step 1: Go to Railway Variables

1. Railway Dashboard → Your Service (`iam_blog`)
2. Click **"Variables"** tab (or **"Settings"** → **"Variables"**)

### Step 2: Add Required Variables

Click **"New Variable"** and add these one by one:

#### 1. `NODE_ENV`
```
NODE_ENV=production
```

#### 2. `POSTGRESQL_URI`
```
POSTGRESQL_URI=postgresql://postgres.utdayyicddkouzjjqhqu:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Where to find:**
- Go to Supabase Dashboard → **Settings** → **Database**
- Copy the **Connection String** (Session Pooler, port 5432)
- Replace `YOUR_PASSWORD` with your actual Supabase password

**⚠️ IMPORTANT**: 
- If you see "Circuit breaker open" errors, your password is **wrong**
- **Reset your password** in Supabase if needed (Settings → Database → Reset password)
- **URL-encode special characters** in password: `@` → `%40`, `#` → `%23`, etc.
- See `FIX_RAILWAY_DATABASE_CONNECTION.md` for detailed troubleshooting

#### 3. `JWT_SECRET`
```
JWT_SECRET=your-strong-random-secret-minimum-32-characters-long
```

**Generate one:**
```bash
# Run this locally
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use any strong random string (32+ characters).

#### 4. `FRONTEND_URL`
```
FRONTEND_URL=https://iam-blog.vercel.app
```

**Replace with your actual Vercel URL** (check Vercel dashboard).

#### 5. `PORT` (Optional - Railway sets this automatically)
```
PORT=3001
```

### Step 3: Save and Redeploy

1. After adding all variables, Railway will **auto-redeploy**
2. Or click **"Redeploy"** manually
3. Check **"Deploy Logs"** - should see "Server started on port..."

---

## 📋 Complete List

Here's all variables to add (copy-paste format):

```bash
NODE_ENV=production
PORT=3001
POSTGRESQL_URI=postgresql://postgres.utdayyicddkouzjjqhqu:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your-strong-random-secret-minimum-32-characters-long
FRONTEND_URL=https://iam-blog.vercel.app
```

**Optional (for AI features):**
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

---

## ✅ Verify It Works

After redeploy, check logs should show:
```
✅ Environment variable validation passed
✅ Server started on port 3001
```

Then test:
- Visit: `https://your-app.railway.app/health`
- Should return: `{"status":"healthy",...}`

---

## 🔗 Next Steps

1. **Get your Railway URL**: Service → Settings → Generate Domain
2. **Update Vercel**: Add `VITE_API_URL=https://your-app.railway.app/api`
3. **Test**: Your frontend should now connect to the backend!

---

## 🆘 Still Having Issues?

Check:
- ✅ All variables are set (no typos)
- ✅ `POSTGRESQL_URI` includes your actual password
- ✅ `FRONTEND_URL` matches your Vercel URL exactly
- ✅ `JWT_SECRET` is 32+ characters

