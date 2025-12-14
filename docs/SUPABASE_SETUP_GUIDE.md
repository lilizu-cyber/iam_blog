# Supabase Connection Setup Guide

## Step 1: Get Your Supabase Connection String

### Option A: From Supabase Dashboard

1. **Log in to Supabase**: https://supabase.com/dashboard
2. **Select your project** (or create one if you haven't)
3. **Go to Settings**:
   - Click the ⚙️ (gear) icon in the left sidebar
   - Or go to: `https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/settings/database`
4. **Find Connection String**:
   - Scroll down to **"Connection string"** section
   - Click on the **"URI"** tab
   - You'll see something like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - **OR** the direct connection:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

### Option B: From Project Settings

1. Go to: **Settings** → **Database**
2. Look for **"Connection string"** section
3. Select **"URI"** tab
4. Copy the connection string

## Step 2: Update Your Local .env File

Once you have the connection string, update your `.env` file:

```env
# Replace the localhost connection with your Supabase connection
POSTGRESQL_URI=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Important**: Replace `[YOUR-PASSWORD]` with the password you created when setting up Supabase.

## Step 3: Test the Connection

Run this command to test if the connection works:

```bash
npm run check:deps
```

Or test directly:

```bash
node -e "const { Sequelize } = require('sequelize'); const sequelize = new Sequelize(process.env.POSTGRESQL_URI); sequelize.authenticate().then(() => console.log('✅ Connected to Supabase!')).catch(err => console.error('❌ Connection failed:', err.message));"
```

## Step 4: Run Migrations (if needed)

If you need to set up your database schema:

```bash
npm run migrate:up
```

## Step 5: Add to GitHub Secrets

For CI/CD, add the connection string to GitHub Secrets:

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add:
   - **Name**: `POSTGRESQL_URI_STAGING`
   - **Value**: Your Supabase connection string
5. Repeat for production:
   - **Name**: `POSTGRESQL_URI_PRODUCTION`
   - **Value**: Your Supabase connection string (or a different database)

## Connection String Format

Your Supabase connection string should look like one of these:

### Direct Connection (Port 5432):
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Connection Pooling (Port 6543):
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**For GitHub Actions/CI**: Use the **direct connection** (port 5432)

## Troubleshooting

### Connection Refused
- Check if your IP is allowed (Supabase allows all IPs by default)
- Verify the password is correct
- Make sure you're using the correct port (5432 for direct, 6543 for pooling)

### Authentication Failed
- Double-check your password
- Make sure you're using the `postgres` user
- Verify the project reference is correct

### Can't Find Connection String
- Make sure you're in the correct project
- Check that you have admin access
- Try refreshing the page

## Next Steps

After connecting:
1. ✅ Test the connection locally
2. ✅ Run migrations to set up tables
3. ✅ Add to GitHub Secrets for CI/CD
4. ✅ Update production configuration



