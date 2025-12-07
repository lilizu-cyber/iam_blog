# Logging Configuration Guide

This document describes the logging setup, configuration, and best practices for the IAM Blog application.

## Overview

The application uses **Winston** for logging with the following features:
- **Structured JSON logging** in production
- **Daily log rotation** with automatic compression
- **Configurable retention** policies
- **Multiple log levels** (error, warn, info, http, debug)
- **Separate log files** for errors, access, and combined logs

## Log Files

### Production Logs

All production logs are stored in the `logs/` directory:

- **`error-YYYY-MM-DD.log`** - Error-level logs only
- **`combined-YYYY-MM-DD.log`** - All log levels
- **`access-YYYY-MM-DD.log`** - HTTP request logs
- **`error-current.log`** - Symlink to latest error log
- **`combined-current.log`** - Symlink to latest combined log
- **`access-current.log`** - Symlink to latest access log

### Development Logs

- **`error.log`** - Error-level logs
- **`combined.log`** - All log levels

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Log retention in days (default: 30)
LOG_RETENTION_DAYS=30

# Maximum log file size before rotation (default: 20m)
# Options: 20m, 50m, 100m, etc.
LOG_MAX_SIZE=20m

# Date pattern for log file names (default: YYYY-MM-DD)
# Options: YYYY-MM-DD (daily), YYYY-MM (monthly), etc.
LOG_DATE_PATTERN=YYYY-MM-DD
```

### Log Levels

Log levels (from highest to lowest priority):

1. **error** - Error events that might still allow the app to continue
2. **warn** - Warning messages
3. **info** - Informational messages (default in production)
4. **http** - HTTP request logging
5. **debug** - Debug messages (development only)

### Log Format

#### Development Format
- Human-readable with colors
- Includes timestamps, levels, and messages
- Shows stack traces for errors
- Pretty-printed JSON for metadata

#### Production Format
- Structured JSON format
- Optimized for log aggregation tools
- Includes all metadata
- Compressed old log files (gzip)

## Log Rotation

### Automatic Rotation

Logs are automatically rotated:
- **Daily** - New log file each day
- **By size** - Rotate when file exceeds `LOG_MAX_SIZE`
- **Compressed** - Old logs are automatically gzipped
- **Retention** - Old logs deleted after `LOG_RETENTION_DAYS`

### Example Log Files

```
logs/
├── error-2025-12-01.log.gz
├── error-2025-12-02.log.gz
├── error-2025-12-03.log
├── error-current.log -> error-2025-12-03.log
├── combined-2025-12-01.log.gz
├── combined-2025-12-02.log.gz
├── combined-2025-12-03.log
└── combined-current.log -> combined-2025-12-03.log
```

## Structured Logging

The logger includes helper methods for structured logging:

### Command Logging

```javascript
logger.logCommand('CreateBlogPost', commandId, {
  userId: 'user-123',
  postId: 'post-456'
});
```

### Event Logging

```javascript
logger.logEvent('BlogPostCreated', eventId, {
  streamId: 'stream-123',
  postId: 'post-456'
});
```

### Query Logging

```javascript
logger.logQuery('GetBlogPosts', queryId, {
  page: 1,
  limit: 10
});
```

### Performance Logging

```javascript
logger.logPerformance('DatabaseQuery', 150, {
  query: 'SELECT * FROM posts',
  rows: 10
});
```

### Security Logging

```javascript
logger.logSecurity('FailedLoginAttempt', 'warn', {
  ip: '192.168.1.1',
  username: 'admin',
  reason: 'Invalid password'
});
```

### Audit Logging

```javascript
logger.logAudit('PostCreated', userId, 'blog-post', {
  postId: 'post-456',
  title: 'My Post'
});
```

## Log Aggregation

### Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)

1. **Install ELK Stack**:
   ```bash
   docker-compose up -d elasticsearch logstash kibana
   ```

2. **Configure Logstash** to read from log files:
   ```ruby
   input {
     file {
       path => "/path/to/logs/*.log"
       codec => json
     }
   }
   ```

3. **View logs in Kibana** at `http://localhost:5601`

### Option 2: AWS CloudWatch

1. **Install CloudWatch agent**:
   ```bash
   # On EC2 or ECS
   wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
   ```

2. **Configure agent** to monitor log files:
   ```json
   {
     "logs": {
       "logs_collected": {
         "files": {
           "collect_list": [
             {
               "file_path": "/path/to/logs/*.log",
               "log_group_name": "/aws/ec2/iam-blog",
               "log_stream_name": "{instance_id}"
             }
           ]
         }
       }
     }
   }
   ```

### Option 3: Google Cloud Logging

1. **Install Cloud Logging agent**:
   ```bash
   curl -sSO https://dl.google.com/cloudagents/add-logging-agent-repo.sh
   sudo bash add-logging-agent-repo.sh
   sudo apt-get install google-fluentd
   ```

2. **Configure** to read application logs

### Option 4: Datadog

1. **Install Datadog agent**:
   ```bash
   DD_API_KEY=your-api-key bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script_agent7.sh)"
   ```

2. **Configure** log collection in `/etc/datadog-agent/datadog.yaml`

### Option 5: Splunk

1. **Install Splunk Universal Forwarder**
2. **Configure** to monitor log directory
3. **Forward** to Splunk indexer

## Log Monitoring

### View Recent Logs

```bash
# View latest error log
tail -f logs/error-current.log

# View latest combined log
tail -f logs/combined-current.log

# View logs from specific date
cat logs/error-2025-12-05.log

# Search logs
grep "ERROR" logs/combined-*.log
```

### Analyze Logs

```bash
# Count errors by type
grep -o '"level":"error"' logs/combined-*.log | wc -l

# Find slow requests (if logged)
grep "duration" logs/access-*.log | awk '$NF > 1000'

# Extract unique error messages
jq -r '.message' logs/error-*.log | sort | uniq -c | sort -rn
```

## Best Practices

### 1. Log Levels

- **error**: Use for errors that need immediate attention
- **warn**: Use for warnings that might indicate problems
- **info**: Use for important business events
- **http**: Use for HTTP request logging
- **debug**: Use for detailed debugging information

### 2. Structured Data

Always include relevant context:

```javascript
// ✅ Good
logger.error('Database query failed', {
  query: 'SELECT * FROM posts',
  error: error.message,
  userId: req.user?.id,
  requestId: req.id
});

// ❌ Bad
logger.error('Database query failed');
```

### 3. Sensitive Data

Never log sensitive information:

```javascript
// ❌ Never log passwords, tokens, or secrets
logger.info('User login', { password: req.body.password }); // BAD!

// ✅ Log only safe identifiers
logger.info('User login', { 
  userId: user.id,
  username: user.username 
});
```

### 4. Performance

- Use appropriate log levels (don't log everything as `info`)
- Avoid logging in tight loops
- Use structured logging for better querying

### 5. Error Context

Always include context with errors:

```javascript
try {
  await someOperation();
} catch (error) {
  logger.error('Operation failed', {
    operation: 'someOperation',
    error: error.message,
    stack: error.stack,
    context: { userId, resourceId }
  });
}
```

## Log Retention Policy

### Default Retention

- **30 days** - Logs older than 30 days are automatically deleted
- **Compressed** - Logs older than 1 day are compressed (gzip)
- **Size limit** - Individual log files rotate at 20MB

### Custom Retention

Set in `.env`:

```bash
# Keep logs for 90 days
LOG_RETENTION_DAYS=90

# Rotate at 50MB
LOG_MAX_SIZE=50m
```

## Troubleshooting

### Logs Directory Not Created

If logs directory doesn't exist, it's created automatically on first log write. To create manually:

```bash
mkdir -p logs
```

### Logs Not Rotating

Check:
1. `LOG_RETENTION_DAYS` is set correctly
2. `LOG_MAX_SIZE` is valid format (e.g., "20m", "50m")
3. File permissions allow write access

### Logs Too Large

Reduce retention or size:

```bash
LOG_RETENTION_DAYS=7  # Keep only 7 days
LOG_MAX_SIZE=10m      # Rotate at 10MB
```

### Missing Logs

Check:
1. Log level configuration (production defaults to 'warn')
2. File permissions
3. Disk space available

## Production Checklist

- [x] Logs directory exists and is writable
- [x] Daily log rotation configured
- [x] Log retention policy set
- [x] Structured JSON logging enabled
- [x] Old logs automatically compressed
- [x] Sensitive data not logged
- [ ] Log aggregation tool configured (optional)
- [ ] Log monitoring alerts set up (optional)
- [ ] Log backup strategy defined (optional)

## Related Files

- Logger configuration: `src/backend/utils/logger.js`
- Error handling: `src/backend/utils/errorHandler.js`
- Server setup: `src/backend/server.js`
- Environment config: `.env`

