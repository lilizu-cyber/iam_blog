# 🔧 Fix Railway Database Connection Error

## The Problem

**Error**: `Circuit breaker open: Too many authentication errors`

This means Railway is trying to connect to Supabase but the **password or connection string is wrong**.

---

## ✅ Solution: Fix POSTGRESQL_URI in Railway

### Step 1: Get Your Correct Supabase Connection String

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to**: Settings → Database
4. **Find**: "Connection string" section
5. **Select**: "Session mode" (NOT "Transaction mode")
6. **Copy the connection string** - it should look like:
   ```
   postgresql://postgres.utdayyicddkouzjjqhqu:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
   ```

### Step 2: Verify Your Supabase Password

**Important**: Make sure you're using the **correct password**:

1. In Supabase Dashboard → Settings → Database
2. If you forgot your password, click **"Reset database password"**
3. **Copy the new password** (you'll only see it once!)

### Step 3: Update Railway Environment Variable

1. **Go to Railway Dashboard** → Your Service
2. **Click "Variables" tab**
3. **Find `POSTGRESQL_URI`** (or create it if missing)
4. **Update the value** with your connection string:
   ```
   postgresql://postgres.utdayyicddkouzjjqhqu:YOUR_ACTUAL_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
   ```
   **Replace `YOUR_ACTUAL_PASSWORD` with your real Supabase password!**

5. **Important**: If your password has special characters, they might need URL encoding:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `%` becomes `%25`
   - `&` becomes `%26`
   - `+` becomes `%2B`
   - `=` becomes `%3D`
   - `?` becomes `%3F`

6. **Click "Save"**

### Step 4: Verify Connection String Format

Your connection string should be:
```
postgresql://postgres.utdayyicddkouzjjqhqu:PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Check:**
- ✅ Starts with `postgresql://`
- ✅ Username is `postgres.utdayyicddkouzjjqhqu` (with the project ref)
- ✅ Password is correct (no spaces, properly encoded if needed)
- ✅ Host is `aws-1-eu-west-1.pooler.supabase.com`
- ✅ Port is `5432`
- ✅ Database is `postgres`

### Step 5: Redeploy Railway

1. Railway will **auto-redeploy** after you save the variable
2. Or click **"Redeploy"** manually
3. **Check logs** - should see:
   ```
   ✅ Connected to PostgreSQL Event Store
   ✅ Server started on port 3001
   ```

---

## 🧪 Test Your Connection String Locally

Before updating Railway, test it locally:

1. **Create a test file** `test-connection.js`:
   ```javascript
   require('dotenv').config();
   const { Sequelize } = require('sequelize');
   
   const uri = 'YOUR_CONNECTION_STRING_HERE';
   
   const sequelize = new Sequelize(uri, {
     dialect: 'postgres',
     logging: console.log
   });
   
   sequelize.authenticate()
     .then(() => {
       console.log('✅ Connection successful!');
       process.exit(0);
     })
     .catch(err => {
       console.error('❌ Connection failed:', err.message);
       process.exit(1);
     });
   ```

2. **Run**: `node test-connection.js`
3. **If it works locally**, use the same string in Railway

---

## 🔍 Common Issues

### Issue 1: Wrong Username Format

**Wrong**: `postgres@...`  
**Correct**: `postgres.utdayyicddkouzjjqhqu@...` (with project ref)

### Issue 2: Wrong Port

**Wrong**: Port `6543` (Transaction mode)  
**Correct**: Port `5432` (Session mode)

### Issue 3: Password Not URL-Encoded

If your password has special characters, encode them:
- Password: `My@Pass#123`
- Encoded: `My%40Pass%23123`

### Issue 4: Using Direct Connection Instead of Pooler

**Wrong**: `db.utdayyicddkouzjjqhqu.supabase.co` (direct)  
**Correct**: `aws-1-eu-west-1.pooler.supabase.com` (pooler)

---

## ✅ Verify It Works

After updating and redeploying:

1. **Check Railway logs** - should see:
   ```
   ✅ Connected to PostgreSQL Event Store
   ✅ Connected to PostgreSQL Read Model Store
   ✅ Server started on port 3001
   ```

2. **Test health endpoint**: `https://your-app.railway.app/health`
   - Should return: `{"status":"healthy",...}`

---

## 🆘 Still Not Working?

1. **Double-check password** in Supabase (reset if needed)
2. **Verify connection string format** (no extra spaces, correct encoding)
3. **Check Supabase dashboard** - is your database active?
4. **Try resetting password** in Supabase and updating Railway again


