# Supabase Connection Troubleshooting

## Common Issues and Solutions

### Issue 1: DNS Resolution Failed (`getaddrinfo ENOENT`)

**Error**: `getaddrinfo ENOENT db.xxxxx.supabase.co`

**Possible Causes**:
1. **Network connectivity issue** - No internet connection
2. **DNS server issue** - DNS not resolving
3. **Firewall blocking** - Corporate firewall blocking Supabase
4. **Incorrect hostname** - Hostname might be wrong

**Solutions**:

#### Solution 1: Test DNS Resolution
```powershell
# Windows PowerShell
nslookup db.utdayyicddkouzjjqhqu.supabase.co

# Or
Resolve-DnsName db.utdayyicddkouzjjqhqu.supabase.co
```

#### Solution 2: Test Network Connectivity
```powershell
# Test if host is reachable
Test-NetConnection -ComputerName db.utdayyicddkouzjjqhqu.supabase.co -Port 5432
```

#### Solution 3: Check Supabase Dashboard
1. Go to Supabase Dashboard
2. Settings → Database
3. Verify the connection string hostname matches exactly
4. Check if the database is paused (free tier auto-pauses after inactivity)

#### Solution 4: Use Connection Pooling String
Sometimes the direct connection doesn't work, try the pooling connection:
- Go to Supabase Dashboard → Settings → Database
- Look for "Connection pooling" section
- Use the connection string with port **6543** instead of 5432

### Issue 2: Password with Special Characters

**Problem**: Password contains `*`, `$`, `#`, etc. that need URL encoding

**Solution**: The password needs to be URL-encoded in the connection string.

**Example**:
- Password: `aN*9LQh7kZGj8$Y`
- Encoded: `aN%2A9LQh7kZGj8%24Y`

**Quick Fix**: Use this script to encode your connection string:
```javascript
const password = 'aN*9LQh7kZGj8$Y';
const encoded = encodeURIComponent(password);
console.log(encoded); // aN%2A9LQh7kZGj8%24Y
```

Then update your `.env`:
```env
POSTGRESQL_URI=postgresql://postgres:aN%2A9LQh7kZGj8%24Y@db.utdayyicddkouzjjqhqu.supabase.co:5432/postgres
```

### Issue 3: SSL Connection Required

**Error**: SSL/TLS connection errors

**Solution**: Supabase requires SSL. Make sure your connection includes SSL settings:

```javascript
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
}
```

### Issue 4: Database Paused (Free Tier)

**Problem**: Supabase free tier databases auto-pause after inactivity

**Solution**:
1. Go to Supabase Dashboard
2. Click on your project
3. If paused, click "Resume" or "Restore"
4. Wait a few minutes for it to wake up

### Issue 5: Firewall/Corporate Network

**Problem**: Corporate firewall blocking Supabase connections

**Solutions**:
1. **Use VPN** - Connect to a VPN that allows database connections
2. **Whitelist Supabase IPs** - Contact IT to whitelist Supabase IP ranges
3. **Use Connection Pooling** - Sometimes works better through firewalls (port 6543)

## Step-by-Step Debugging

### Step 1: Verify Connection String Format
```env
POSTGRESQL_URI=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Step 2: Test DNS Resolution
```powershell
nslookup db.utdayyicddkouzjjqhqu.supabase.co
```

Expected: Should return an IP address

### Step 3: Test Port Connectivity
```powershell
Test-NetConnection -ComputerName db.utdayyicddkouzjjqhqu.supabase.co -Port 5432
```

Expected: `TcpTestSucceeded: True`

### Step 4: Test Connection with Script
```bash
node scripts/test-supabase-connection.js
```

### Step 5: Check Supabase Dashboard
1. Verify database is running (not paused)
2. Check connection string matches exactly
3. Verify password is correct

## Alternative: Use Connection Pooling

If direct connection doesn't work, try connection pooling:

1. Go to Supabase Dashboard → Settings → Database
2. Find "Connection pooling" section
3. Copy the connection string (uses port 6543)
4. Update your `.env` with the pooling connection string

## Still Not Working?

1. **Double-check the connection string** in Supabase dashboard
2. **Verify your password** - Try resetting it in Supabase
3. **Check Supabase status** - https://status.supabase.com
4. **Try a different network** - Test from a different internet connection
5. **Contact Supabase support** - If database is definitely running

