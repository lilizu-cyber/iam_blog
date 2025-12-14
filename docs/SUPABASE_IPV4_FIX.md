# Supabase IPv4 Compatibility Fix

## Problem
Your Supabase database is **not IPv4 compatible**, which means it only works with IPv6 networks. Your network/Node.js is trying to connect via IPv4, causing DNS resolution failures.

## Solution: Use Session Pooler

Supabase provides a **Session Pooler** that works with IPv4 networks. You need to use the connection string from the "Pooler settings" instead of the direct connection.

## Steps to Fix

### 1. Get Session Pooler Connection String

1. Go to Supabase Dashboard → Your Project
2. Click **Settings** → **Database**
3. Scroll to **"Connection string"** section
4. Click on **"Session"** tab (not "URI" tab)
5. Copy the connection string - it will look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   Note: Port is **6543** (not 5432)

### 2. Update Your .env File

Replace your current `POSTGRESQL_URI` with the Session Pooler connection string.

### 3. Alternative: Purchase IPv4 Add-on

If you prefer to use the direct connection (port 5432), you can purchase the IPv4 add-on from Supabase, but using the Session Pooler is free and recommended.

## Connection String Format

**Direct Connection (IPv6 only - won't work on your network):**
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**Session Pooler (IPv4 compatible - use this!):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## After Updating

1. Test connection: `node scripts/test-supabase-connection.js`
2. Check dependencies: `npm run check:deps`



