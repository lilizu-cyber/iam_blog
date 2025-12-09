# Troubleshooting Guide

## Proxy Errors on Startup

If you're seeing proxy errors like `ECONNREFUSED` when starting the application, here's what's happening and how to fix it:

### Why This Happens

1. **Backend crashes on startup** - Syntax errors, missing environment variables, or database connection failures
2. **Database not running** - PostgreSQL might not be running after your computer restarts
3. **Frontend starts before backend** - The frontend (Vite) starts quickly and tries to make API calls before the backend is ready

### Quick Fixes

#### 1. Check if PostgreSQL is Running

```bash
# Check if PostgreSQL container is running
docker ps | grep postgresql

# If not running, start it:
docker-compose up -d postgresql

# Or if using local PostgreSQL, start the service
```

#### 2. Check Environment Variables

Make sure you have a `.env` file with required variables:

```bash
# Copy the example file
cp env.example .env

# Edit .env and update:
# - JWT_SECRET (change from default)
# - POSTGRESQL_URI (if different from default)
```

#### 3. Run Dependency Check

Before starting, verify all dependencies are ready:

```bash
npm run check:deps
```

This will:
- Check PostgreSQL connection
- Verify environment variables
- Give you clear error messages if something is wrong

#### 4. Start Services in Order

If you're still having issues, start services manually:

```bash
# Terminal 1: Start PostgreSQL
docker-compose up -d postgresql

# Wait a few seconds, then Terminal 2: Start backend
npm run dev:backend

# Wait for backend to show "Server started on port 3001", then Terminal 3: Start frontend
npm run dev:frontend
```

### Common Issues

#### "ECONNREFUSED" Errors

**Cause**: Backend server is not running or crashed during startup.

**Solution**:
1. Check backend terminal for error messages
2. Look for syntax errors or missing dependencies
3. Ensure PostgreSQL is running: `docker-compose up -d postgresql`
4. Check `.env` file exists and has correct values

#### "Database connection failed"

**Cause**: PostgreSQL is not running or connection string is wrong.

**Solution**:
```bash
# Start PostgreSQL
docker-compose up -d postgresql

# Verify it's running
docker ps

# Test connection
npm run check:deps
```

#### "JWT_SECRET not properly configured"

**Cause**: Missing or default JWT_SECRET in `.env` file.

**Solution**:
1. Create/update `.env` file
2. Set `JWT_SECRET` to a secure random string
3. Restart the backend

### Prevention

The `npm run dev` command now includes automatic dependency checking. The backend will:
- Check PostgreSQL connection before starting
- Retry connections automatically
- Show clear error messages if something is wrong

If you see proxy errors, check the backend terminal output first - it will tell you exactly what's wrong.

### Still Having Issues?

1. Check backend terminal for detailed error messages
2. Verify all services are running: `docker ps`
3. Check logs: `docker-compose logs postgresql`
4. Run dependency check: `npm run check:deps`




