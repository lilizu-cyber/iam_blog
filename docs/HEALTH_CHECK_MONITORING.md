# Health Check Monitoring Setup Guide

This guide explains how to set up external health check monitoring for your application.

## Overview

The health check monitoring system:
- Monitors `/health` and `/ready` endpoints
- Sends alerts when application becomes unhealthy
- Tracks consecutive failures
- Supports email and Slack notifications

## Prerequisites

1. **Health endpoints** must be accessible (already implemented)
2. **Backend URL** configured
3. **Alert channels** configured (optional but recommended)

## Health Endpoints

Your application already has these endpoints:

- **`/health`** - Comprehensive health check
  - Returns: `{ status: 'healthy'|'degraded'|'unhealthy', services: {...} }`
  - Status codes: 200 (healthy/degraded), 503 (unhealthy)

- **`/ready`** - Readiness check (for Kubernetes/Docker)
  - Returns: `{ status: 'ready'|'not ready' }`
  - Status codes: 200 (ready), 503 (not ready)

- **`/live`** - Liveness check (for Kubernetes/Docker)
  - Returns: `{ status: 'alive' }`
  - Status code: 200

## Setup Methods

### Option 1: Cron Job (Linux/Mac)

1. **Make script executable:**
   ```bash
   chmod +x scripts/monitor-health.js
   ```

2. **Edit crontab:**
   ```bash
   crontab -e
   ```

3. **Add monitoring schedule:**
   ```bash
   # Check every 5 minutes
   */5 * * * * cd /path/to/iam_blog && /usr/bin/node scripts/monitor-health.js >> logs/health-check.log 2>&1

   # Or every minute (for critical applications)
   * * * * * cd /path/to/iam_blog && /usr/bin/node scripts/monitor-health.js >> logs/health-check.log 2>&1
   ```

4. **Verify:**
   ```bash
   crontab -l
   ```

### Option 2: Windows Task Scheduler

1. **Open Task Scheduler**

2. **Create Basic Task:**
   - Name: "IAM Blog Health Check"
   - Trigger: Every 5 minutes
   - Action: Start a program
   - Program: `node`
   - Arguments: `C:\path\to\iam_blog\scripts\monitor-health.js`
   - Start in: `C:\path\to\iam_blog`

3. **Configure:**
   - Run whether user is logged on or not
   - Run with highest privileges

### Option 3: Systemd Timer (Linux)

1. **Create service file** (`/etc/systemd/system/iam-blog-health.service`):
   ```ini
   [Unit]
   Description=IAM Blog Health Check Monitor
   After=network.target

   [Service]
   Type=oneshot
   User=your-user
   WorkingDirectory=/path/to/iam_blog
   Environment="NODE_ENV=production"
   EnvironmentFile=/path/to/iam_blog/.env
   ExecStart=/usr/bin/node /path/to/iam_blog/scripts/monitor-health.js
   ```

2. **Create timer file** (`/etc/systemd/system/iam-blog-health.timer`):
   ```ini
   [Unit]
   Description=Run IAM Blog health check every 5 minutes
   Requires=iam-blog-health.service

   [Timer]
   OnCalendar=*:0/5
   Persistent=true

   [Install]
   WantedBy=timers.target
   ```

3. **Enable and start:**
   ```bash
   sudo systemctl enable iam-blog-health.timer
   sudo systemctl start iam-blog-health.timer
   sudo systemctl status iam-blog-health.timer
   ```

### Option 4: External Monitoring Services

#### UptimeRobot (Free)

1. **Sign up** at https://uptimerobot.com
2. **Add Monitor:**
   - Type: HTTP(s)
   - URL: `https://your-domain.com/health`
   - Interval: 5 minutes
   - Alert contacts: Email/SMS

#### Pingdom

1. **Sign up** at https://www.pingdom.com
2. **Create Check:**
   - Type: HTTP
   - URL: `https://your-domain.com/health`
   - Interval: 1-5 minutes
   - Alert: Email/SMS/Slack

#### StatusCake

1. **Sign up** at https://www.statuscake.com
2. **Create Test:**
   - Test Type: HTTP
   - Website URL: `https://your-domain.com/health`
   - Check Rate: 5 minutes
   - Alert: Email/SMS

#### Better Uptime

1. **Sign up** at https://betteruptime.com
2. **Create Monitor:**
   - Type: HTTP
   - URL: `https://your-domain.com/health`
   - Interval: 1 minute
   - Alert: Email/SMS/Slack/PagerDuty

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Health Check Monitoring
BACKEND_URL=http://localhost:3001              # Backend URL (for local monitoring)
HEALTH_CHECK_URL=https://your-domain.com       # Public URL (for external monitoring)

# Alert Configuration
HEALTH_ALERT_EMAIL=admin@example.com           # Email for alerts
HEALTH_ALERT_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
HEALTH_ALERT_THRESHOLD=2                       # Alert after N consecutive failures
```

### Alert Threshold

- **`HEALTH_ALERT_THRESHOLD=2`** - Alert after 2 consecutive failures (recommended)
- **`HEALTH_ALERT_THRESHOLD=1`** - Alert on first failure (more sensitive)
- **`HEALTH_ALERT_THRESHOLD=3`** - Alert after 3 failures (less sensitive)

### Alert Cooldown

Alerts have a 1-hour cooldown to prevent spam. To change:

Edit `scripts/monitor-health.js`:
```javascript
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
```

## Slack Integration

### Create Slack Webhook

1. **Go to Slack App Directory**: https://api.slack.com/apps
2. **Create New App** → "Incoming Webhooks"
3. **Activate Incoming Webhooks**
4. **Add New Webhook to Workspace**
5. **Copy Webhook URL**
6. **Add to `.env`:**
   ```bash
   HEALTH_ALERT_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

## Testing

### Manual Test

```bash
# Test health check script
node scripts/monitor-health.js

# Expected output:
# [INFO] Checking health at http://localhost:3001/health...
# [INFO] ✅ Health check passed { status: 'healthy', responseTime: '45ms' }
```

### Test Alert

Temporarily stop your backend and run the monitor:

```bash
# Stop backend
# Then run monitor
node scripts/monitor-health.js

# Expected output:
# [WARN] ⚠️ Health check failed (1/2)
# [ERROR] 🚨 Health Check Alert (after threshold reached)
```

## Monitoring Dashboard

### View Health Check Logs

```bash
# View cron logs
tail -f logs/health-check.log

# View systemd logs
journalctl -u iam-blog-health.service -f
```

### Health Check Status

The script returns:
- **Exit code 0** - Healthy
- **Exit code 1** - Unhealthy

Use this for monitoring tools that check exit codes.

## Integration with Monitoring Tools

### Prometheus

Export health metrics:

```javascript
// Add to your monitoring setup
const healthGauge = new promClient.Gauge({
  name: 'app_health_status',
  help: 'Application health status (1=healthy, 0=unhealthy)'
});

// Update from health check
const result = await performHealthCheck();
healthGauge.set(result.success ? 1 : 0);
```

### Grafana

Create dashboard with:
- Health status over time
- Response time trends
- Service status breakdown

## Best Practices

### 1. Check Frequency

- **Production**: Every 1-5 minutes
- **Staging**: Every 5-10 minutes
- **Development**: Every 15-30 minutes (optional)

### 2. Alert Thresholds

- **Critical**: Alert on first failure
- **Standard**: Alert after 2-3 failures
- **Non-critical**: Alert after 5+ failures

### 3. Multiple Endpoints

Monitor both:
- `/health` - Overall health
- `/ready` - Readiness for traffic

### 4. External + Internal Monitoring

- **External**: Use UptimeRobot/Pingdom (from internet)
- **Internal**: Use cron script (from server)

### 5. Alert Channels

Use multiple channels:
- **Email** - For detailed alerts
- **Slack** - For team notifications
- **SMS** - For critical alerts (via PagerDuty)

## Troubleshooting

### Health Check Fails But App Works

**Possible causes:**
1. Health endpoint not accessible (firewall/network)
2. Health endpoint timeout
3. Database connection issues (health check includes DB)

**Solution:**
- Check network connectivity
- Verify health endpoint is accessible
- Check database connection

### Too Many Alerts

**Solution:**
- Increase `HEALTH_ALERT_THRESHOLD`
- Increase alert cooldown period
- Filter alerts by severity

### Alerts Not Sending

**Check:**
1. Email/Slack configuration correct
2. Network connectivity
3. Check logs for errors

## Next Steps

1. ✅ Set up monitoring using one of the methods above
2. ✅ Configure alert channels (email/Slack)
3. ✅ Test alerts by stopping backend
4. ✅ Set up external monitoring service (optional but recommended)
5. ✅ Create monitoring dashboard (optional)

---

**Last Updated**: 2025-01-XX

