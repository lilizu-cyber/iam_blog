# Error Tracking Guide

This document describes the error tracking system implemented for the IAM Blog application.

## Overview

The error tracking system provides:
- **Centralized error tracking** - Capture all application errors
- **Sentry integration** - Full-featured error tracking and monitoring
- **Rollbar integration** - Alternative error tracking service
- **Error notifications** - Email and Slack notifications
- **Error dashboards** - Statistics and analytics
- **Error grouping** - Automatic error grouping and deduplication

## Error Tracking Services

### Sentry

Sentry is a comprehensive error tracking platform with:
- Real-time error tracking
- Performance monitoring
- Release tracking
- User context
- Breadcrumbs
- Source maps support

#### Setup

1. **Install Sentry:**
   ```bash
   npm install @sentry/node @sentry/tracing
   ```

2. **Get Sentry DSN:**
   - Sign up at https://sentry.io
   - Create a new project
   - Copy the DSN

3. **Configure in `.env`:**
   ```bash
   SENTRY_DSN=https://your-key@sentry.io/project-id
   SENTRY_TRACES_SAMPLE_RATE=0.1
   SENTRY_PROFILES_SAMPLE_RATE=0.1
   ```

4. **Initialize (already done):**
   The error tracker automatically initializes Sentry if `SENTRY_DSN` is set.

#### Features

- **Error Filtering** - Automatically filters out non-critical errors (404s, validation errors)
- **Performance Monitoring** - Tracks transaction performance
- **Release Tracking** - Associates errors with code releases
- **User Context** - Automatically captures user information
- **Breadcrumbs** - Tracks user actions leading to errors

### Rollbar

Rollbar is an alternative error tracking service.

#### Setup

1. **Install Rollbar:**
   ```bash
   npm install rollbar
   ```

2. **Get Access Token:**
   - Sign up at https://rollbar.com
   - Create a new project
   - Copy the access token

3. **Configure in `.env`:**
   ```bash
   ROLLBAR_ACCESS_TOKEN=your-access-token
   ```

4. **Initialize (already done):**
   The error tracker automatically initializes Rollbar if `ROLLBAR_ACCESS_TOKEN` is set.

## Error Tracking Features

### Automatic Error Capture

All errors are automatically captured:

```javascript
// Errors in route handlers
try {
  // Your code
} catch (error) {
  // Error is automatically tracked
  throw error;
}

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  errorTracker.captureError(error);
});

// Unhandled rejections
process.on('unhandledRejection', (error) => {
  errorTracker.captureError(error);
});
```

### Manual Error Tracking

Track errors manually:

```javascript
const errorTracker = require('./utils/errorTracker');

try {
  // Your code
} catch (error) {
  errorTracker.captureError(error, {
    context: {
      userId: user.id,
      action: 'createPost',
      data: { postId: '123' }
    }
  });
}
```

### User Context

Set user context for better error tracking:

```javascript
// Automatically set in authenticated routes
errorTracker.setUser({
  id: user.id,
  username: user.username,
  email: user.email
});
```

### Breadcrumbs

Add breadcrumbs to track user actions:

```javascript
errorTracker.addBreadcrumb('User clicked button', 'ui', 'info', {
  buttonId: 'submit',
  page: '/admin/posts'
});
```

## Error Notifications

### Email Notifications

Configure email notifications:

```bash
ERROR_NOTIFICATIONS_ENABLED=true
ERROR_NOTIFICATION_EMAIL=admin@example.com
ERROR_NOTIFICATION_THRESHOLD=5
```

**Note:** Email notifications require email service integration (nodemailer, SendGrid, etc.)

### Slack Notifications

Configure Slack notifications:

```bash
ERROR_NOTIFICATIONS_ENABLED=true
ERROR_NOTIFICATION_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ERROR_NOTIFICATION_THRESHOLD=5
```

**Setup Slack Webhook:**
1. Go to https://api.slack.com/apps
2. Create a new app
3. Enable "Incoming Webhooks"
4. Create a webhook URL
5. Add to `.env`

### Notification Threshold

Notifications are sent when an error occurs N times (default: 5):

```bash
ERROR_NOTIFICATION_THRESHOLD=5
```

## Error Statistics

### Get Error Stats

Query error statistics via API:

```bash
GET /errors/stats
```

**Response:**
```json
{
  "totalErrors": 1234,
  "uniqueErrors": 45,
  "topErrors": [
    {
      "error": "Database connection failed:Connection refused",
      "count": 234
    },
    {
      "error": "ValidationError:Invalid input",
      "count": 156
    }
  ]
}
```

## Error Filtering

The error tracker automatically filters out:

- **404 errors** - Not found errors (non-critical)
- **Validation errors** - Client-side validation errors (400-499, except 401/403)
- **Rate limit errors** - Too many requests (429)

### Custom Filtering

Modify filtering in `src/backend/utils/errorTracker.js`:

```javascript
beforeSend(event, hint) {
  const error = hint.originalException;
  
  // Add custom filtering logic
  if (error && error.skipTracking) {
    return null; // Don't track this error
  }
  
  return event;
}
```

## Error Dashboards

### Sentry Dashboard

1. **Access Sentry Dashboard:**
   - Go to https://sentry.io
   - Navigate to your project
   - View errors, performance, and releases

2. **Key Metrics:**
   - Error rate
   - Error frequency
   - Affected users
   - Performance impact

3. **Error Details:**
   - Stack traces
   - User context
   - Breadcrumbs
   - Environment info

### Rollbar Dashboard

1. **Access Rollbar Dashboard:**
   - Go to https://rollbar.com
   - Navigate to your project
   - View errors and occurrences

2. **Key Metrics:**
   - Error count
   - Error trends
   - Affected users
   - Environment distribution

## Best Practices

### 1. Error Context

Always provide context when tracking errors:

```javascript
errorTracker.captureError(error, {
  context: {
    userId: user.id,
    action: 'createPost',
    data: { postId: '123' },
    environment: process.env.NODE_ENV
  }
});
```

### 2. User Context

Set user context for authenticated requests:

```javascript
// In authentication middleware
if (req.user) {
  errorTracker.setUser({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email
  });
}
```

### 3. Breadcrumbs

Add breadcrumbs for debugging:

```javascript
errorTracker.addBreadcrumb('Processing payment', 'payment', 'info', {
  amount: 100,
  currency: 'USD'
});
```

### 4. Error Levels

Use appropriate error levels:

- **error** - Critical errors (500+)
- **warning** - Warnings (400-499)
- **info** - Informational (validation errors)

### 5. Sensitive Data

Never track sensitive data:

```javascript
// ❌ Bad
errorTracker.captureError(error, {
  password: user.password, // Never track passwords!
  creditCard: payment.cardNumber // Never track PII!
});

// ✅ Good
errorTracker.captureError(error, {
  userId: user.id,
  action: 'payment',
  amount: payment.amount
});
```

## Alerting Configuration

### Sentry Alerts

1. **Create Alert Rule:**
   - Go to Settings → Alerts
   - Create new alert rule
   - Set conditions (e.g., error rate > 10/min)
   - Configure notification channels

2. **Alert Conditions:**
   - Error rate threshold
   - Error frequency
   - Affected users
   - Performance degradation

### Rollbar Alerts

1. **Create Alert:**
   - Go to Settings → Alerts
   - Create new alert
   - Set conditions
   - Configure notifications

2. **Alert Types:**
   - Error count threshold
   - Error rate threshold
   - New error type
   - Error recurrence

## Integration with Monitoring

### Prometheus

Export error metrics to Prometheus:

```javascript
// In metrics endpoint
const errorStats = errorTracker.getErrorStats();
metrics.errors = {
  total: errorStats.totalErrors,
  unique: errorStats.uniqueErrors
};
```

### Grafana Dashboard

Create Grafana dashboard for error tracking:

```json
{
  "panels": [
    {
      "title": "Error Rate",
      "targets": [
        {
          "expr": "rate(errors_total[5m])"
        }
      ]
    },
    {
      "title": "Top Errors",
      "targets": [
        {
          "expr": "topk(10, errors_by_type)"
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN:**
   ```bash
   echo $SENTRY_DSN
   ```

2. **Check Sentry initialization:**
   - Look for "Sentry error tracking initialized" in logs
   - Check for initialization errors

3. **Check error filtering:**
   - Verify error isn't being filtered out
   - Check `beforeSend` function

### Notifications Not Sending

1. **Check configuration:**
   ```bash
   echo $ERROR_NOTIFICATIONS_ENABLED
   echo $ERROR_NOTIFICATION_THRESHOLD
   ```

2. **Check threshold:**
   - Notifications only send when threshold is reached
   - Check error count in stats

3. **Check webhook/email:**
   - Verify Slack webhook URL is correct
   - Verify email service is configured

### High Error Volume

1. **Review error filtering:**
   - Add more filters for non-critical errors
   - Adjust sample rates

2. **Review error grouping:**
   - Check if errors are properly grouped
   - Adjust grouping rules

## Production Checklist

- [x] Sentry or Rollbar configured
- [x] Error tracking initialized
- [x] User context set for authenticated requests
- [x] Error notifications configured
- [x] Error filtering configured
- [x] Error statistics endpoint available
- [ ] Error dashboards set up
- [ ] Alert rules configured
- [ ] Error response time monitoring
- [ ] Error rate monitoring

## Related Files

- Error tracker: `src/backend/utils/errorTracker.js`
- APM integrations: `src/backend/utils/apmIntegrations.js`
- Server setup: `src/backend/server.js`
- Environment config: `.env`


