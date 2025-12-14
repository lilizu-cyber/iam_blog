# Automated Database Backups Setup Guide

This guide explains how to set up automated database backups for production.

## Overview

The backup system:
- Creates daily backups of your PostgreSQL database
- Compresses backups to save space
- Automatically cleans old backups based on retention policy
- Works with Supabase, local PostgreSQL, or any PostgreSQL database

## Prerequisites

1. **PostgreSQL client tools** (`pg_dump`) must be installed
2. **Environment variables** configured (see below)
3. **Backup directory** with write permissions

## Environment Variables

Add to your `.env` file:

```bash
# Backup Configuration
BACKUP_DIR=./backups                    # Directory to store backups
BACKUP_RETENTION_DAYS=30                # Keep backups for 30 days
BACKUP_COMPRESS=true                     # Compress backups (recommended)
BACKUP_FORMAT=custom                     # 'custom' (binary) or 'plain' (SQL)
```

## Setup Methods

### Option 1: Cron Job (Linux/Mac)

1. **Make script executable:**
   ```bash
   chmod +x scripts/schedule-backups.js
   ```

2. **Edit crontab:**
   ```bash
   crontab -e
   ```

3. **Add backup schedule:**
   ```bash
   # Daily backup at 2 AM
   0 2 * * * cd /path/to/iam_blog && /usr/bin/node scripts/schedule-backups.js >> logs/backup.log 2>&1

   # Or every 6 hours
   0 */6 * * * cd /path/to/iam_blog && /usr/bin/node scripts/schedule-backups.js >> logs/backup.log 2>&1
   ```

4. **Verify cron job:**
   ```bash
   crontab -l
   ```

### Option 2: Windows Task Scheduler

1. **Open Task Scheduler** (search "Task Scheduler" in Windows)

2. **Create Basic Task:**
   - Name: "IAM Blog Database Backup"
   - Trigger: Daily at 2:00 AM
   - Action: Start a program
   - Program: `node`
   - Arguments: `C:\path\to\iam_blog\scripts\schedule-backups.js`
   - Start in: `C:\path\to\iam_blog`

3. **Configure:**
   - Run whether user is logged on or not
   - Run with highest privileges
   - Configure for: Windows 10/11

4. **Set Environment Variables:**
   - In Task Scheduler, edit the task
   - Go to "Actions" → "Edit"
   - Add environment variables in "Start in" or use a batch file

### Option 3: Systemd Timer (Linux)

1. **Create service file** (`/etc/systemd/system/iam-blog-backup.service`):
   ```ini
   [Unit]
   Description=IAM Blog Database Backup
   After=network.target

   [Service]
   Type=oneshot
   User=your-user
   WorkingDirectory=/path/to/iam_blog
   Environment="NODE_ENV=production"
   EnvironmentFile=/path/to/iam_blog/.env
   ExecStart=/usr/bin/node /path/to/iam_blog/scripts/schedule-backups.js
   ```

2. **Create timer file** (`/etc/systemd/system/iam-blog-backup.timer`):
   ```ini
   [Unit]
   Description=Run IAM Blog backup daily
   Requires=iam-blog-backup.service

   [Timer]
   OnCalendar=daily
   OnCalendar=02:00
   Persistent=true

   [Install]
   WantedBy=timers.target
   ```

3. **Enable and start:**
   ```bash
   sudo systemctl enable iam-blog-backup.timer
   sudo systemctl start iam-blog-backup.timer
   sudo systemctl status iam-blog-backup.timer
   ```

### Option 4: Docker Cron Container

1. **Create Dockerfile** (`Dockerfile.backup`):
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   # Install PostgreSQL client
   RUN apk add --no-cache postgresql-client
   
   # Copy project files
   COPY package*.json ./
   COPY scripts/ ./scripts/
   COPY src/backend/utils/logger.js ./src/backend/utils/
   
   # Install dependencies
   RUN npm install --production
   
   # Install cron
   RUN apk add --no-cache dcron
   
   # Copy backup script
   COPY scripts/schedule-backups.js ./scripts/
   
   # Create crontab
   RUN echo "0 2 * * * cd /app && node scripts/schedule-backups.js" > /etc/crontabs/root
   
   # Start cron
   CMD ["crond", "-f"]
   ```

2. **Build and run:**
   ```bash
   docker build -f Dockerfile.backup -t iam-blog-backup .
   docker run -d --name iam-blog-backup \
     --env-file .env \
     -v $(pwd)/backups:/app/backups \
     iam-blog-backup
   ```

### Option 5: Cloud Services

#### Supabase (Recommended for Supabase users)

Supabase provides automatic daily backups. To enable:

1. Go to Supabase Dashboard → Settings → Database
2. Enable "Point-in-time Recovery" (PITR)
3. Configure backup retention (7-30 days)

**Manual backup via Supabase:**
```bash
# Use Supabase CLI
supabase db dump -f backups/supabase-backup-$(date +%Y%m%d).sql
```

#### AWS RDS / Google Cloud SQL

Both services provide automated backups:
- **AWS RDS**: Enable automated backups in RDS console
- **Google Cloud SQL**: Enable automated backups in Cloud SQL console

## Manual Backup

You can also run backups manually:

```bash
# Using npm script
npm run backup:db

# Or directly
node scripts/backup-database.js
```

## Backup Verification

### Check Backup Files

```bash
# List backups
ls -lh backups/

# Check backup size
du -sh backups/
```

### Test Restore

**Important:** Always test your restore procedure!

```bash
# List available backups
npm run restore:list

# Restore a backup
npm run restore:db
```

## Monitoring

### Check Backup Logs

```bash
# View cron logs (if using cron)
tail -f logs/backup.log

# Check system logs (if using systemd)
journalctl -u iam-blog-backup.service -f
```

### Backup Health Check

Create a monitoring script to verify backups are being created:

```bash
# scripts/check-backup-health.js
const fs = require('fs');
const path = require('path');

const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const maxAgeHours = 26; // Alert if no backup in last 26 hours

const files = fs.readdirSync(backupDir)
  .filter(f => f.endsWith('.dump') || f.endsWith('.dump.gz') || f.endsWith('.sql') || f.endsWith('.sql.gz'))
  .map(f => ({
    name: f,
    path: path.join(backupDir, f),
    mtime: fs.statSync(path.join(backupDir, f)).mtime
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (files.length === 0) {
  console.error('❌ No backups found!');
  process.exit(1);
}

const latest = files[0];
const ageHours = (Date.now() - latest.mtime.getTime()) / (1000 * 60 * 60);

if (ageHours > maxAgeHours) {
  console.error(`❌ Latest backup is ${ageHours.toFixed(1)} hours old (max: ${maxAgeHours})`);
  process.exit(1);
}

console.log(`✅ Latest backup: ${latest.name} (${ageHours.toFixed(1)} hours ago)`);
process.exit(0);
```

Add to cron:
```bash
# Check backup health every hour
0 * * * * cd /path/to/iam_blog && node scripts/check-backup-health.js || echo "Backup check failed" | mail -s "Backup Alert" admin@example.com
```

## Backup Retention

Configure retention in `.env`:

```bash
BACKUP_RETENTION_DAYS=30  # Keep backups for 30 days
```

Old backups are automatically deleted when new backups are created.

## Troubleshooting

### PostgreSQL Tools Not Found

**Error:** `PostgreSQL client tools (pg_dump) not found`

**Solution:**
1. Install PostgreSQL (includes `pg_dump`)
2. Or add PostgreSQL bin directory to PATH
3. Or set `PG_BIN_PATH` environment variable

### Permission Denied

**Error:** `Permission denied` when creating backups

**Solution:**
```bash
# Ensure backup directory exists and is writable
mkdir -p backups
chmod 755 backups
```

### Backup Too Large

**Solution:**
- Enable compression: `BACKUP_COMPRESS=true`
- Use custom format: `BACKUP_FORMAT=custom`
- Consider excluding large tables if not needed

### Cron Job Not Running

**Check:**
1. Verify cron service is running: `systemctl status cron`
2. Check cron logs: `grep CRON /var/log/syslog`
3. Verify PATH in cron: Add `PATH=/usr/bin:/bin` to crontab
4. Test manually: Run the script directly

## Best Practices

1. **Test Restores Regularly** - Verify backups can be restored
2. **Monitor Backup Health** - Set up alerts for failed backups
3. **Store Off-Site** - Copy backups to cloud storage (S3, Google Cloud Storage)
4. **Encrypt Backups** - For sensitive data, encrypt backups
5. **Document Process** - Keep restore procedures documented
6. **Version Control** - Track backup scripts in git

## Cloud Storage Integration

### AWS S3

```bash
# After backup, upload to S3
aws s3 cp backups/latest.dump.gz s3://your-bucket/backups/
```

### Google Cloud Storage

```bash
# After backup, upload to GCS
gsutil cp backups/latest.dump.gz gs://your-bucket/backups/
```

## Next Steps

1. ✅ Set up automated backups using one of the methods above
2. ✅ Test restore procedure
3. ✅ Set up backup health monitoring
4. ✅ Configure off-site backup storage (optional but recommended)
5. ✅ Document restore procedures for your team

---

**Last Updated**: 2025-01-XX

