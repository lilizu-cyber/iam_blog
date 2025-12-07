# JWT Token Refresh Guide

This guide explains how JWT token refresh works in the IAM Blog application.

## How Token Refresh Works

### Automatic Token Refresh

The application automatically refreshes tokens in two ways:

1. **Automatic refresh in `/me` endpoint**: When checking authentication status, if the token expires within 24 hours, it's automatically refreshed.

2. **Manual refresh endpoint**: You can call `/api/auth/refresh` to manually refresh your token.

### Token Expiration

- **Default expiration**: 7 days (configurable via `JWT_EXPIRES_IN` environment variable)
- **Auto-refresh threshold**: Tokens are refreshed when they expire within 24 hours
- **Cookie expiration**: Matches JWT expiration time

## API Endpoints

### 1. Check Authentication Status (Auto-Refresh)

**Endpoint**: `GET /api/auth/me`

**Behavior**:
- Returns current user information
- **Automatically refreshes token** if it expires within 24 hours
- Returns `tokenRefreshed: true` in response if token was refreshed

**Response**:
```json
{
  "success": true,
  "isAuthenticated": true,
  "tokenRefreshed": true,  // Present if token was refreshed
  "data": {
    "id": "user-id",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "loginTime": "2025-12-06T22:39:48.624Z"
  }
}
```

### 2. Manual Token Refresh

**Endpoint**: `POST /api/auth/refresh`

**Behavior**:
- Validates current token
- Issues a new token with fresh expiration
- Updates the `adminToken` cookie

**Request**: No body required (uses cookie)

**Response**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "id": "user-id",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Error Responses**:
- `401`: Token expired or invalid - must login again
- `401`: User account inactive - must login again

## Frontend Integration

The frontend automatically handles token refresh:

1. **Automatic**: When `/api/auth/me` returns `tokenRefreshed: true`, the token is already updated in the cookie.

2. **On 401 errors**: The frontend automatically attempts to refresh the token before showing an error.

3. **Periodic checks**: The `AuthContext` periodically checks authentication status, which triggers auto-refresh.

## Configuration

### Environment Variables

**`.env` file**:
```bash
# JWT expiration time (default: 7d)
JWT_EXPIRES_IN=7d

# Examples:
# JWT_EXPIRES_IN=1d    # 1 day
# JWT_EXPIRES_IN=24h   # 24 hours
# JWT_EXPIRES_IN=30d   # 30 days
# JWT_EXPIRES_IN=1h    # 1 hour
```

### Supported Time Formats

- `d` - Days (e.g., `7d`, `30d`)
- `h` - Hours (e.g., `24h`, `12h`)
- `m` - Minutes (e.g., `60m`, `30m`)

## How It Works

### Token Lifecycle

1. **Login**: User logs in → Token issued with 7-day expiration
2. **Active use**: Token used for authenticated requests
3. **Near expiration**: When token expires within 24 hours:
   - `/me` endpoint automatically issues new token
   - Cookie is updated with new token
   - User continues without interruption
4. **Expired**: If token fully expires:
   - User must login again
   - Or call `/refresh` endpoint (if still within grace period)

### Security Features

- ✅ **HTTP-only cookies**: Tokens stored in HTTP-only cookies (not accessible via JavaScript)
- ✅ **Secure flag**: Cookies use `Secure` flag in production (HTTPS only)
- ✅ **SameSite protection**: Cookies use `Strict` SameSite policy
- ✅ **User validation**: Token refresh validates user still exists and is active
- ✅ **Role verification**: Ensures user still has admin role

## Manual Token Refresh (cURL)

```bash
# Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt

# Check auth status (auto-refreshes if needed)
curl http://localhost:3001/api/auth/me \
  -b cookies.txt \
  -c cookies.txt
```

## Testing Token Refresh

### Quick Test Script

Run the automated test script:
```bash
npm run test:token-refresh
```

This will:
1. Login and get a token
2. Display token information (expiration, payload)
3. Test auto-refresh in `/me` endpoint
4. Test manual refresh endpoint
5. Verify refreshed token works

### Simple Token Check

Check your current token's expiration:
```bash
# Get token from browser DevTools → Application → Cookies → adminToken
node scripts/test-token-refresh-simple.js <your-token>
```

Or set environment variable:
```bash
export TEST_TOKEN="your-token-here"
node scripts/test-token-refresh-simple.js
```

### Manual Testing Steps

1. **Login** and note the token expiration time
2. **Check token** using the simple test script
3. **Call `/me` endpoint** - if token expires within 24 hours, it should auto-refresh
4. **Call `/refresh` endpoint** - should issue a new token
5. **Verify** new token has fresh expiration (7 days from now)

## Testing Token Refresh

### Test Auto-Refresh

1. **Login** to get a token
2. **Wait** or **manually expire** token (set short expiration in `.env`)
3. **Call `/me` endpoint** - token should auto-refresh
4. **Check response** for `tokenRefreshed: true`

### Test Manual Refresh

```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' \
  -c cookies.txt

# 2. Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# 3. Verify new token
curl http://localhost:3001/api/auth/me \
  -b cookies.txt
```

## Troubleshooting

### Token Not Refreshing

1. **Check expiration time**: Verify `JWT_EXPIRES_IN` is set correctly
2. **Check cookie settings**: Ensure cookies are being sent/received
3. **Check logs**: Look for "Token auto-refreshed" messages
4. **Verify user status**: Ensure user account is active

### Token Expired Error

If you get "Token expired" error:
- Token has fully expired (past expiration time)
- You need to login again
- Or the token was invalidated

### Cookie Not Updating

- Check browser console for cookie errors
- Verify `SameSite` and `Secure` settings match your environment
- Ensure you're using HTTPS in production

## Best Practices

1. **Set appropriate expiration**: Balance security (shorter) vs. user experience (longer)
   - **Recommended**: 7 days for admin tokens
   - **High security**: 1-24 hours
   - **Low security**: 30 days

2. **Monitor refresh activity**: Check logs for token refresh patterns

3. **Handle refresh failures**: Frontend should gracefully handle refresh failures

4. **Logout on refresh failure**: If refresh fails, automatically logout user

## Example: Setting 7-Day Expiration

```bash
# In .env file
JWT_EXPIRES_IN=7d
```

After setting this:
- Tokens expire after 7 days
- Auto-refresh happens when token expires within 24 hours
- Cookie expiration matches token expiration

## Summary

- ✅ Tokens automatically refresh when close to expiring
- ✅ Manual refresh endpoint available at `/api/auth/refresh`
- ✅ Frontend handles refresh automatically
- ✅ Secure cookie-based token storage
- ✅ Configurable expiration time

Your token will be automatically refreshed before it expires, so you don't need to manually replace it after 7 days!

