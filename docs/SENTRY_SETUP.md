# Sentry Error Tracking Setup Guide

This guide explains how to set up Sentry for error tracking and monitoring in production.

## Overview

Sentry provides:
- **Real-time error tracking** - Capture and track all application errors
- **Performance monitoring** - Track API response times and slow queries
- **Release tracking** - Associate errors with code releases
- **User context** - See which users are affected by errors
- **Breadcrumbs** - Track user actions leading to errors
- **Alerts** - Get notified when errors occur

## Prerequisites

1. **Sentry account** - Sign up at https://sentry.io (free tier available)
2. **Node.js packages** - Already installed (`@sentry/node`, `@sentry/tracing`)
3. **Environment variables** - Configure in `.env`

## Step 1: Create Sentry Project

1. **Sign up/Login** to Sentry: https://sentry.io
2. **Create a new project:**
   - Platform: **Node.js**
   - Project name: `iam-blog-backend` (or your preferred name)
3. **Copy the DSN** (Data Source Name)
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

## Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
SENTRY_TRACES_SAMPLE_RATE=0.1        # 10% of transactions (0.0 to 1.0)
SENTRY_PROFILES_SAMPLE_RATE=0.1       # 10% of profiles (0.0 to 1.0)

# Optional: Release tracking
APP_VERSION=1.0.0                     # Your app version
```

### Sample Rate Explanation

- **`SENTRY_TRACES_SAMPLE_RATE`**: Percentage of transactions to track for performance
  - `0.1` = 10% (recommended for production)
  - `1.0` = 100% (use only for debugging, can be expensive)
  - `0.0` = Disable performance tracking

- **`SENTRY_PROFILES_SAMPLE_RATE`**: Percentage of transactions to profile
  - `0.1` = 10% (recommended)
  - Lower = less data, lower cost

## Step 3: Verify Integration

The Sentry integration is **already implemented** in the codebase:

- **Location**: `src/backend/utils/errorTracker.js`
- **Initialization**: Automatic when `SENTRY_DSN` is set
- **Error Tracking**: Automatic in error handlers

### Test Sentry Integration

1. **Start your application:**
   ```bash
   npm run dev:backend
   ```

2. **Check logs** for Sentry initialization:
   ```
   [INFO] Sentry error tracking initialized
   ```

3. **Trigger a test error** (optional):
   ```bash
   # Visit a non-existent route
   curl http://localhost:3001/api/nonexistent
   ```

4. **Check Sentry dashboard** - You should see the error appear within seconds

## Step 4: Configure Sentry Dashboard

### Set Up Alerts

1. **Go to Settings → Alerts** in Sentry
2. **Create Alert Rule:**
   - **Name**: "High Error Rate"
   - **Conditions**: 
     - When: "The number of events in an issue is greater than 10 in 1m"
   - **Actions**:
     - Send email notification
     - Send Slack notification (optional)
     - Send PagerDuty alert (optional)

### Recommended Alert Rules

1. **Critical Errors (500+)**
   - Condition: Error level = "error" AND status code >= 500
   - Frequency: More than 5 in 5 minutes
   - Action: Immediate email/Slack notification

2. **High Error Rate**
   - Condition: Total errors > 50 in 10 minutes
   - Action: Email notification

3. **New Error Type**
   - Condition: New issue detected
   - Action: Email notification (for first occurrence)

4. **Performance Degradation**
   - Condition: P95 response time > 2 seconds
   - Action: Email notification

## Step 5: Release Tracking

Track which code version is deployed:

1. **Set version in `.env`:**
   ```bash
   APP_VERSION=1.0.0
   ```

2. **Create releases in Sentry** (optional, for better tracking):
   ```bash
   # Install Sentry CLI
   npm install -g @sentry/cli

   # Create release
   sentry-cli releases new $APP_VERSION
   sentry-cli releases set-commits $APP_VERSION --auto
   sentry-cli releases finalize $APP_VERSION
   ```

3. **Associate commits with releases** (for better debugging):
   ```bash
   sentry-cli releases set-commits $APP_VERSION --auto
   ```

## Step 6: User Context (Optional)

Automatically track which users are affected by errors:

The code already sets user context in `src/backend/middleware/authMiddleware.js`:

```javascript
// User context is automatically set when user is authenticated
errorTracker.setUser({
  id: req.user.id,
  username: req.user.username,
  email: req.user.email
});
```

## Features Already Implemented

### ✅ Error Filtering

Non-critical errors are automatically filtered:
- 404 errors (not found)
- Validation errors (400-499, except 401/403)
- Client errors (4xx)

Only critical errors (500+) and authentication errors are tracked.

### ✅ Performance Monitoring

- HTTP request tracking
- Database query tracking
- Transaction performance

### ✅ Breadcrumbs

User actions are automatically tracked:
- HTTP requests
- Database queries
- User authentication

### ✅ Error Context

Each error includes:
- Request details (method, path, query)
- User information (if authenticated)
- Environment (development/production)
- Release version

## Monitoring Dashboard

### Key Metrics to Watch

1. **Error Rate** - Errors per minute
2. **Affected Users** - Number of users experiencing errors
3. **Response Time** - P50, P95, P99 response times
4. **Error Types** - Most common errors
5. **Release Health** - Errors by release version

### Useful Views

1. **Issues** - All error issues
2. **Performance** - API performance metrics
3. **Releases** - Errors by release
4. **Users** - Affected users

## Best Practices

### 1. Don't Track Sensitive Data

The code already prevents tracking sensitive data:
- Passwords are never tracked
- Credit card numbers are filtered
- PII is excluded (`sendDefaultPii: false`)

### 2. Use Appropriate Error Levels

- **error** - Critical errors (500+)
- **warning** - Warnings (400-499)
- **info** - Informational (validation errors)

### 3. Add Context to Errors

When manually tracking errors:

```javascript
errorTracker.captureError(error, {
  context: {
    userId: user.id,
    action: 'createPost',
    postId: post.id
  }
});
```

### 4. Monitor Error Trends

- Check Sentry dashboard daily
- Review error trends weekly
- Address recurring errors promptly

### 5. Use Releases

- Tag each deployment with a version
- Track which releases introduce errors
- Rollback if necessary

## Troubleshooting

### Sentry Not Initializing

**Check:**
1. `SENTRY_DSN` is set in `.env`
2. DSN format is correct
3. Check logs for initialization errors

### Errors Not Appearing

**Check:**
1. Sentry DSN is correct
2. Network connectivity (Sentry needs internet)
3. Error is not filtered (check error filtering rules)
4. Check Sentry dashboard filters

### High Volume of Events

**Solution:**
- Lower sample rates: `SENTRY_TRACES_SAMPLE_RATE=0.05`
- Adjust error filtering rules
- Upgrade Sentry plan if needed

## Cost Considerations

### Free Tier Limits

- **5,000 events/month** - Usually sufficient for small apps
- **10,000 performance units/month**
- **1 project**

### Reducing Costs

1. **Lower sample rates** (if not needed)
2. **Filter more errors** (client errors)
3. **Use error grouping** (Sentry does this automatically)
4. **Upgrade plan** if needed (starts at $26/month)

## Next Steps

1. ✅ Set up Sentry account and project
2. ✅ Configure `SENTRY_DSN` in `.env`
3. ✅ Test error tracking
4. ✅ Set up alerts
5. ✅ Configure release tracking
6. ✅ Monitor dashboard regularly

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Sentry Pricing](https://sentry.io/pricing/)

---

**Last Updated**: 2025-01-XX

