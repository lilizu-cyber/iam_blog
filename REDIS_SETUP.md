# Redis Setup and Troubleshooting Guide

## Is Redis Required?

**No, Redis is OPTIONAL.** The application will work fine without Redis.

- **With Redis**: Distributed rate limiting (works across multiple server instances)
- **Without Redis**: Memory-based rate limiting (works for single server instances)

The application automatically falls back to memory store if Redis is not available.

## Checking if Redis is Running

### Option 1: Check Docker (if using Docker Compose)

```bash
# Check if Redis container is running
docker ps --filter "name=redis"

# Or check all containers
docker-compose ps
```

### Option 2: Check if Redis port is listening

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :6379
```

**Linux/Mac:**
```bash
netstat -an | grep 6379
# or
lsof -i :6379
```

### Option 3: Test Redis connection

**If Redis CLI is installed:**
```bash
redis-cli ping
# Should return: PONG
```

**Using Node.js (if you have redis-cli installed via npm):**
```bash
npx redis-cli ping
```

## Starting Redis

### Option 1: Using Docker Compose (Recommended)

```bash
# Start Redis only
docker-compose up -d redis

# Or start all services
docker-compose up -d
```

### Option 2: Install Redis Locally

**Windows:**
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Or use WSL (Windows Subsystem for Linux) and install Redis there
3. Or use Docker Desktop

**Linux:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

## Configuration

### Environment Variables

In your `.env` file:

```bash
# If Redis is running
REDIS_URL=redis://localhost:6379

# If using Docker Compose
REDIS_URL=redis://redis:6379

# To disable Redis (use memory store)
# Simply don't set REDIS_URL or comment it out
# REDIS_URL=
```

### Docker Compose Configuration

Redis is configured in `docker-compose.yml`:

```yaml
redis:
  image: redis:7.2-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  command: redis-server --appendonly yes
```

## Troubleshooting

### Error: "Redis connection error"

**This is normal and safe!** The application will:
1. Log a warning: "Redis connection error, using memory store for rate limiting"
2. Automatically fall back to memory store
3. Continue working normally

**To fix (if you want Redis):**
1. Make sure Redis is running: `docker-compose up -d redis`
2. Check `REDIS_URL` in `.env` matches your Redis setup
3. Verify Redis is accessible on the configured port

### Error: "ECONNREFUSED"

This means Redis is not running or not accessible.

**Solutions:**
1. **Start Redis**: `docker-compose up -d redis`
2. **Or disable Redis**: Remove or comment out `REDIS_URL` in `.env`
3. **Check port**: Make sure port 6379 is not blocked by firewall

### Error: "Redis reconnection attempts exceeded"

The application tried to connect to Redis but failed after 3 attempts.

**Solutions:**
1. Check if Redis is running
2. Verify `REDIS_URL` is correct
3. Check network connectivity
4. The app will continue using memory store (this is fine)

## When to Use Redis

### Use Redis if:
- Running multiple server instances (load balancing)
- Need distributed rate limiting across servers
- Want persistent rate limit data across restarts
- Using Redis for other features (caching, sessions)

### Don't need Redis if:
- Running a single server instance
- Development environment
- Small deployment
- Memory-based rate limiting is sufficient

## Verifying Redis is Working

### Check Application Logs

Look for these messages in your backend logs:

**Redis connected:**
```
Redis connected for rate limiting
Redis ready for rate limiting
Using Redis store for rate limiting
```

**Redis not available (using memory store):**
```
Redis connection error, using memory store for rate limiting
Using memory store for rate limiting
```

### Check Health Endpoint

```bash
curl http://localhost:3001/health
```

Look for Redis status in the response:
```json
{
  "services": {
    "redis": {
      "status": "healthy",
      "message": "Redis is connected",
      "responseTime": "2.5ms"
    }
  }
}
```

## Quick Start Commands

```bash
# Start Redis with Docker
docker-compose up -d redis

# Stop Redis
docker-compose stop redis

# View Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis

# Remove Redis (keeps data)
docker-compose stop redis

# Remove Redis and data
docker-compose down -v redis
```

## Summary

- ✅ **Redis is OPTIONAL** - app works without it
- ✅ **Automatic fallback** - uses memory store if Redis unavailable
- ✅ **No errors** - connection errors are logged but don't break the app
- ✅ **Easy to disable** - just don't set `REDIS_URL` in `.env`

If you see Redis connection errors but the app is working, you can safely ignore them or start Redis if you need distributed rate limiting.


