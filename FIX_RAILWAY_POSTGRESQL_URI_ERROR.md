# 🚨 Fix Railway PostgreSQL Connection Error

## The Error

```
Failed to connect to PostgreSQL Event Store: Cannot read properties of undefined (reading 'searchParams')
```

## Root Cause

The `POSTGRESQL_URI` environment variable is **not set** or is **empty** in Railway.

When Sequelize tries to parse an undefined/empty connection string, it causes this error.

**⚠️ IMPORTANT**: The code now has better error messages. After deploying the latest code, you'll see a clearer error message telling you exactly what's wrong. But the fix is still the same: **Set `POSTGRESQL_URI` in Railway**.

---

## ✅ Solution: Set POSTGRESQL_URI in Railway

### Step 1: Get Your Supabase Connection String

1. **Go to Supabase Dashboard** → Your Project → **Settings** → **Database**
2. **Find "Connection string"** section
3. **Select "Session mode"** (NOT Transaction mode)
4. **Copy the connection string** - it should look like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true
   ```

### Step 2: Set Environment Variable in Railway

1. **Railway Dashboard** → Your Service → **Variables** tab
2. **Click "+ New Variable"**
3. **Name**: `POSTGRESQL_URI`
4. **Value**: Paste your Supabase connection string
5. **Click "Add"**

### Step 3: Verify the Connection String

Make sure your connection string:
- ✅ Starts with `postgresql://` or `postgres://`
- ✅ Contains your Supabase password (URL-encoded if it has special characters)
- ✅ Uses port `5432`
- ✅ Includes `?pgbouncer=true` at the end (for Session Pooler)

**Example format:**
```
postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

### Step 4: Redeploy

1. **Go to "Deployments"** tab
2. **Click "Redeploy"** (or Railway will auto-redeploy)
3. **Check logs** - should now show:
   ```
   Connected to PostgreSQL Event Store
   ```

---

## 🔍 Verify Environment Variables

In Railway, make sure you have these set:

| Variable | Required | Example |
|----------|----------|---------|
| `POSTGRESQL_URI` | ✅ Yes | `postgresql://postgres...@pooler.supabase.com:5432/postgres?pgbouncer=true` |
| `JWT_SECRET` | ✅ Yes | `your-32-character-minimum-secret` |
| `NODE_ENV` | ✅ Yes | `production` |
| `FRONTEND_URL` | ✅ Yes | `https://your-vercel-app.vercel.app` |
| `PORT` | ⚠️ Optional | `3001` (default) |

---

## 🆘 Still Getting Errors?

### Error: "Connection string is empty or invalid"

**Fix**: Make sure `POSTGRESQL_URI` is set in Railway Variables tab.

### Error: "Invalid database connection string format"

**Fix**: 
- Connection string must start with `postgresql://` or `postgres://`
- Check for extra spaces or line breaks
- Make sure the entire string is on one line

### Error: "Circuit breaker open: Too many authentication errors"

**Fix**:
- **Password is wrong**: Reset your Supabase database password
- **Password has special characters**: URL-encode them (e.g., `@` becomes `%40`)
- **Using wrong connection string**: Use "Session mode" connection string, not "Transaction mode"

### Error: "Connection timeout"

**Fix**:
- Check if Supabase allows connections from Railway's IP
- Verify the hostname is correct (`pooler.supabase.com`)
- Make sure you're using port `5432`

---

## 📝 Quick Checklist

- [ ] `POSTGRESQL_URI` is set in Railway Variables
- [ ] Connection string starts with `postgresql://`
- [ ] Connection string includes password
- [ ] Connection string uses port `5432`
- [ ] Connection string includes `?pgbouncer=true`
- [ ] No extra spaces or line breaks in the connection string
- [ ] Redeployed after setting the variable

---

## 🔗 Related Guides

- `RAILWAY_ENV_SETUP.md` - Complete Railway environment setup
- `FIX_RAILWAY_DATABASE_CONNECTION.md` - Detailed database connection troubleshooting

