# Application Performance Monitoring (APM) Guide

This document describes the Application Performance Monitoring (APM) system implemented for the IAM Blog application.

## Overview

The APM system provides:
- **Performance monitoring** - Track response times, error rates, and system metrics
- **Database query monitoring** - Track database query performance
- **Error tracking** - Capture and track application errors
- **APM integrations** - Support for New Relic, Datadog, and Sentry
- **Metrics endpoints** - Expose metrics for monitoring tools

## Built-in Performance Monitoring

### Metrics Collected

The application automatically tracks:

1. **Request Metrics**
   - Total requests
   - Successful requests
   - Failed requests
   - Requests by status code
   - Requests by route

2. **Performance Metrics**
   - Response times (min, max, average, p50, p95, p99)
   - Slow request detection (>1000ms)
   - Route-specific performance

3. **Error Metrics**
   - Total errors
   - Errors by type
   - Recent errors (last 100)

4. **Database Metrics**
   - Total queries
   - Average query time
   - Slow queries (>1000ms)
   - Query errors

5. **System Metrics**
   - Memory usage (heap, RSS)
   - Memory usage percentage
   - Application uptime

### Metrics Endpoints

#### `/metrics` - Summary Metrics

Returns a summary of key metrics:

```bash
GET /metrics
```

**Response:**
```json
{
  "requests": {
    "total": 1234,
    "successful": 1200,
    "failed": 34,
    "errorRate": "2.75%"
  },
  "performance": {
    "averageResponseTime": 145,
    "p50": 120,
    "p95": 350,
    "p99": 580,
    "min": 5,
    "max": 1200
  },
  "errors": {
    "total": 34,
    "byType": {
      "server_error": 10,
      "client_error": 24
    }
  },
  "database": {
    "queries": 5678,
    "averageTime": 45,
    "slowQueries": 12
  },
  "memory": {
    "heapUsed": 45,
    "heapTotal": 128,
    "rss": 256,
    "external": 5,
    "heapUsedPercent": 35
  },
  "uptime": 3600
}
```

#### `/metrics/detailed` - Detailed Metrics

Returns comprehensive metrics including recent errors and response times:

```bash
GET /metrics/detailed
```

**Response:**
```json
{
  "requests": {
    "total": 1234,
    "successful": 1200,
    "failed": 34,
    "byStatus": {
      "200": 1100,
      "201": 50,
      "400": 20,
      "404": 4,
      "500": 10
    },
    "byRoute": {
      "/api/blog": {
        "count": 500,
        "totalTime": 50000,
        "errors": 5
      }
    }
  },
  "responseTimes": {
    "min": 5,
    "max": 1200,
    "sum": 178900,
    "count": 1234,
    "average": 145,
    "p50": 120,
    "p95": 350,
    "p99": 580,
    "recent": [120, 145, 130, ...]
  },
  "errors": {
    "total": 34,
    "byType": {
      "server_error": 10,
      "client_error": 24
    },
    "recent": [
      {
        "type": "server_error",
        "statusCode": 500,
        "path": "/api/blog",
        "method": "GET",
        "duration": 1200,
        "timestamp": "2025-12-05T12:00:00.000Z"
      }
    ]
  },
  "database": {
    "queries": 5678,
    "slowQueries": 12,
    "totalTime": 255510,
    "averageTime": 45
  },
  "memory": {
    "heapUsed": 45,
    "heapTotal": 128,
    "rss": 256,
    "external": 5,
    "heapUsedPercent": 35
  },
  "uptime": 3600,
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```

## APM Tool Integrations

### New Relic

#### Setup

1. **Install New Relic agent:**
   ```bash
   npm install newrelic
   ```

2. **Create `newrelic.js` in project root:**
   ```javascript
   'use strict';
   
   exports.config = {
     app_name: [process.env.NEW_RELIC_APP_NAME || 'iam-blog-backend'],
     license_key: process.env.NEW_RELIC_LICENSE_KEY,
     logging: {
       level: 'info'
     },
     allow_all_headers: true,
     attributes: {
       exclude: [
         'request.headers.cookie',
         'request.headers.authorization'
       ]
     }
   };
   ```

3. **Add to `.env`:**
   ```bash
   NEW_RELIC_LICENSE_KEY=your-license-key
   NEW_RELIC_APP_NAME=iam-blog-backend
   ```

4. **Require at the top of `server.js`:**
   ```javascript
   if (process.env.NEW_RELIC_LICENSE_KEY) {
     require('newrelic');
   }
   ```

#### Features

- Automatic transaction tracking
- Database query monitoring
- Error tracking
- Custom metrics
- Performance insights

### Datadog

#### Setup

1. **Install Datadog APM:**
   ```bash
   npm install dd-trace
   ```

2. **Add to `.env`:**
   ```bash
   DD_API_KEY=your-api-key
   DD_SERVICE=iam-blog-backend
   DD_ENV=production
   ```

3. **Initialize in `server.js` (already done):**
   ```javascript
   // Automatically initialized if DD_API_KEY is set
   ```

#### Features

- Distributed tracing
- Database query monitoring
- Error tracking
- Custom metrics
- Service maps

### Sentry

#### Setup

1. **Install Sentry:**
   ```bash
   npm install @sentry/node
   ```

2. **Add to `.env`:**
   ```bash
   SENTRY_DSN=your-sentry-dsn
   SENTRY_TRACES_SAMPLE_RATE=0.1
   SENTRY_PROFILES_SAMPLE_RATE=0.1
   ```

3. **Initialize in `server.js` (already done):**
   ```javascript
   // Automatically initialized if SENTRY_DSN is set
   ```

#### Features

- Error tracking
- Performance monitoring
- Release tracking
- User context
- Breadcrumbs

## Monitoring Best Practices

### 1. Response Time Monitoring

Monitor response times and set alerts:

- **P50 < 200ms** - Good
- **P95 < 500ms** - Acceptable
- **P99 < 1000ms** - Warning threshold
- **P99 > 2000ms** - Critical alert

### 2. Error Rate Monitoring

Track error rates and set alerts:

- **Error rate < 1%** - Normal
- **Error rate 1-5%** - Warning
- **Error rate > 5%** - Critical

### 3. Database Performance

Monitor database query performance:

- **Average query time < 100ms** - Good
- **Average query time 100-500ms** - Acceptable
- **Average query time > 500ms** - Warning
- **Slow queries > 1000ms** - Alert

### 4. Memory Monitoring

Monitor memory usage:

- **Memory usage < 70%** - Normal
- **Memory usage 70-90%** - Warning
- **Memory usage > 90%** - Critical alert

## Alerting Configuration

### Prometheus Alerts

```yaml
groups:
  - name: application_monitoring
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_failed[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "Error rate is above 5%"
      
      - alert: SlowResponseTime
        expr: http_response_time_p99 > 2000
        for: 5m
        annotations:
          summary: "P99 response time is above 2 seconds"
      
      - alert: HighMemoryUsage
        expr: memory_heap_used_percent > 90
        for: 5m
        annotations:
          summary: "Memory usage is above 90%"
      
      - alert: SlowDatabaseQueries
        expr: rate(database_slow_queries[5m]) > 10
        for: 5m
        annotations:
          summary: "Too many slow database queries"
```

### Datadog Alerts

1. **Error Rate Alert:**
   - Metric: `http.requests.failed / http.requests.total`
   - Threshold: > 5%
   - Duration: 5 minutes

2. **Response Time Alert:**
   - Metric: `http.response_time.p99`
   - Threshold: > 2000ms
   - Duration: 5 minutes

3. **Memory Alert:**
   - Metric: `memory.heap_used_percent`
   - Threshold: > 90%
   - Duration: 5 minutes

### New Relic Alerts

1. **Error Rate Alert:**
   - Condition: Error rate > 5%
   - Duration: 5 minutes

2. **Response Time Alert:**
   - Condition: Apdex score < 0.7
   - Duration: 5 minutes

3. **Memory Alert:**
   - Condition: Memory usage > 90%
   - Duration: 5 minutes

## Dashboard Configuration

### Grafana Dashboard

Import the following dashboard JSON for Grafana:

```json
{
  "dashboard": {
    "title": "IAM Blog Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_failed[5m]) / rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "http_response_time_p95"
          }
        ]
      },
      {
        "title": "Database Query Time",
        "targets": [
          {
            "expr": "database_query_average_time"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "memory_heap_used_percent"
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### Metrics Not Appearing

1. **Check middleware order** - Performance monitor should be early in middleware chain
2. **Check database monitoring** - Verify DatabaseMonitor is wrapping Sequelize
3. **Check APM initialization** - Verify environment variables are set

### High Memory Usage

1. **Check for memory leaks** - Monitor heap usage over time
2. **Review query performance** - Slow queries can cause memory issues
3. **Check connection pools** - Too many database connections

### Slow Response Times

1. **Check database queries** - Review slow query log
2. **Check external APIs** - Monitor third-party API calls
3. **Review code performance** - Profile application code

## Related Files

- Performance monitor: `src/backend/middleware/performanceMonitor.js`
- APM integrations: `src/backend/utils/apmIntegrations.js`
- Database monitor: `src/backend/utils/databaseMonitor.js`
- Server setup: `src/backend/server.js`
- Environment config: `.env`



