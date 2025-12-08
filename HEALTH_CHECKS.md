# Health Checks Guide

This document describes the health check system implemented for the IAM Blog application.

## Overview

The application provides comprehensive health check endpoints for monitoring and observability:

- **`/health`** - Comprehensive health check with detailed service status
- **`/ready`** - Readiness probe (for Kubernetes/Docker)
- **`/live`** - Liveness probe (for Kubernetes/Docker)

## Health Check Endpoints

### `/health` - Comprehensive Health Check

Returns detailed health status of all services.

**Request:**
```bash
GET /health
```

**Response (200 OK - Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T12:00:00.000Z",
  "uptime": 3600,
  "responseTime": 45,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 12,
      "details": {
        "database": "iam_blog_db",
        "host": "localhost",
        "port": 5432
      }
    },
    "eventStore": {
      "status": "healthy",
      "responseTime": 15,
      "details": {
        "database": "iam_blog_db",
        "host": "localhost",
        "port": 5432,
        "eventCount": 1234
      }
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5,
      "details": {
        "version": "7.0.0",
        "connected": true
      }
    },
    "system": {
      "status": "healthy",
      "memory": {
        "heapUsed": "45MB",
        "heapTotal": "128MB",
        "rss": "256MB",
        "heapUsedPercent": "35%"
      },
      "uptime": {
        "seconds": 3600,
        "formatted": "1h 0m 0s"
      },
      "nodeVersion": "v18.17.0",
      "platform": "linux"
    }
  }
}
```

**Response (503 Service Unavailable - Unhealthy):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-12-05T12:00:00.000Z",
  "uptime": 3600,
  "responseTime": 120,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "unhealthy",
      "error": "Connection refused",
      "responseTime": 5000
    },
    "eventStore": {
      "status": "unhealthy",
      "error": "Connection refused",
      "responseTime": 5000
    },
    "redis": {
      "status": "degraded",
      "error": "Connection refused",
      "message": "Redis unavailable, using memory store for rate limiting",
      "responseTime": 5000
    },
    "system": {
      "status": "healthy",
      "memory": {
        "heapUsed": "45MB",
        "heapTotal": "128MB",
        "rss": "256MB",
        "heapUsedPercent": "35%"
      },
      "uptime": {
        "seconds": 3600,
        "formatted": "1h 0m 0s"
      },
      "nodeVersion": "v18.17.0",
      "platform": "linux"
    }
  }
}
```

### `/ready` - Readiness Probe

Checks if the application is ready to receive traffic. Returns 200 if all critical services are healthy.

**Request:**
```bash
GET /ready
```

**Response (200 OK - Ready):**
```json
{
  "ready": true,
  "status": "healthy",
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```

**Response (503 Service Unavailable - Not Ready):**
```json
{
  "ready": false,
  "status": "unhealthy",
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```

### `/live` - Liveness Probe

Checks if the application process is alive. Always returns 200 if the process is running.

**Request:**
```bash
GET /live
```

**Response (200 OK):**
```json
{
  "alive": true,
  "timestamp": "2025-12-05T12:00:00.000Z",
  "uptime": 3600
}
```

## Health Check Components

### Database Health Check

Checks PostgreSQL connectivity for the read model store:

- **Connection test** - Verifies database connection
- **Query test** - Runs a simple SELECT query
- **Response time** - Measures query latency
- **Details** - Returns database name, host, and port

### Event Store Health Check

Checks PostgreSQL connectivity for the event store:

- **Connection test** - Verifies event store connection
- **Query test** - Counts events in the store
- **Response time** - Measures query latency
- **Details** - Returns database info and event count

### Redis Health Check

Checks Redis connectivity (optional):

- **Connection test** - Verifies Redis connection
- **PING test** - Tests Redis responsiveness
- **Version info** - Retrieves Redis version
- **Status** - Returns "healthy", "degraded", or "unhealthy"

**Note:** Redis is optional. If unavailable, the application falls back to memory store for rate limiting.

### System Resources Check

Monitors application resources:

- **Memory usage** - Heap and RSS memory
- **Uptime** - Application uptime
- **Node version** - Node.js version
- **Platform** - Operating system platform

## Health Status Levels

### `healthy`
All critical services are operational and responding correctly.

### `degraded`
Some non-critical services are unavailable, but the application can still function. For example:
- Redis unavailable (falls back to memory store)
- Non-critical external services down

### `unhealthy`
One or more critical services are unavailable. The application may not function correctly:
- Database unavailable
- Event store unavailable

## Monitoring Integration

### Kubernetes

Configure health checks in your Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iam-blog-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: iam-blog-backend:latest
        livenessProbe:
          httpGet:
            path: /live
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Docker

Use health checks in Docker Compose:

```yaml
services:
  backend:
    image: iam-blog-backend:latest
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

### Monitoring Tools

#### Prometheus

Scrape health endpoint metrics:

```yaml
scrape_configs:
  - job_name: 'iam-blog-backend'
    metrics_path: '/health'
    static_configs:
      - targets: ['localhost:3001']
```

#### Datadog

Configure health check monitoring:

```yaml
health_checks:
  - name: backend_health
    url: http://localhost:3001/health
    interval: 30s
    timeout: 5s
```

#### New Relic

Monitor health endpoint:

```javascript
// Custom health check monitor
setInterval(async () => {
  const response = await fetch('http://localhost:3001/health');
  const health = await response.json();
  // Send to New Relic
}, 30000);
```

## Alerting

### Critical Alerts

Set up alerts for:

- **Health status = unhealthy** - Immediate alert
- **Database unavailable** - Critical alert
- **Event store unavailable** - Critical alert
- **High memory usage (>90%)** - Warning alert

### Example Alert Rules

#### Prometheus AlertManager

```yaml
groups:
  - name: health_checks
    rules:
      - alert: BackendUnhealthy
        expr: up{job="iam-blog-backend"} == 0
        for: 1m
        annotations:
          summary: "Backend is unhealthy"
      
      - alert: DatabaseDown
        expr: health_check_database_status{status="unhealthy"} == 1
        for: 30s
        annotations:
          summary: "Database is unavailable"
```

## Best Practices

### 1. Health Check Frequency

- **Liveness**: Check every 10-30 seconds
- **Readiness**: Check every 5-10 seconds
- **Comprehensive**: Check every 30-60 seconds

### 2. Timeout Configuration

- **Liveness**: 3-5 seconds timeout
- **Readiness**: 2-3 seconds timeout
- **Comprehensive**: 5-10 seconds timeout

### 3. Response Time Monitoring

Monitor health check response times:
- **Normal**: < 100ms
- **Warning**: 100-500ms
- **Critical**: > 500ms

### 4. Health Check Endpoints

- **Don't rate limit** - Health checks should always be accessible
- **Keep it fast** - Health checks should complete quickly
- **Don't cache** - Always return fresh status

## Troubleshooting

### Health Check Failing

1. **Check service logs** - Look for connection errors
2. **Verify connectivity** - Test database/Redis connections manually
3. **Check resource usage** - Monitor memory and CPU
4. **Review configuration** - Verify environment variables

### Slow Health Checks

1. **Database slow** - Check database performance
2. **Network issues** - Verify network connectivity
3. **High load** - Check system resources
4. **Connection pool** - Review connection pool settings

### False Positives

1. **Timeout too short** - Increase timeout values
2. **Network latency** - Account for network delays
3. **Cold starts** - Allow warm-up time

## Related Files

- Health checker: `src/backend/utils/healthCheck.js`
- Server routes: `src/backend/server.js`
- Event store: `src/backend/infrastructure/PostgresEventStore.js`
- Read model store: `src/backend/infrastructure/ReadModelStore.js`
- Rate limiter: `src/backend/middleware/rateLimiter.js`


