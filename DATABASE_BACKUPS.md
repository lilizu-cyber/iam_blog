# Database Backup & Restore Guide

This document describes the database backup and restore procedures for the IAM Blog application.

## Overview

- **Backup Format**: PostgreSQL custom format (binary) - recommended for production
- **Compression**: Enabled by default (gzip)
- **Retention**: 30 days (configurable)
- **Location**: `./backups/` directory (configurable)

## Quick Start

### Create a Backup

**Option 1: Using local PostgreSQL tools** (requires PostgreSQL installed)
```bash
npm run backup:db
```

**Option 2: Using Docker** (if PostgreSQL is running in Docker)
```bash
npm run backup:db:docker
```

### List Available Backups

```bash
npm run restore:list
```

### Restore from Backup

```bash
npm run restore:db <backup-file>
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Backup directory (default: ./backups)
BACKUP_DIR=./backups

# Retention period in days (default: 30)
BACKUP_RETENTION_DAYS=30

# Enable/disable compression (default: true)
BACKUP_COMPRESS=true

# Backup format: 'custom' (recommended) or 'plain' (default: custom)
BACKUP_FORMAT=custom
```

### Backup Directory Structure

```
backups/
├── iam_blog_db_2025-01-05T10-30-00.dump.gz
├── iam_blog_db_2025-01-06T10-30-00.dump.gz
└── iam_blog_db_2025-01-07T10-30-00.dump.gz
```

## Backup Procedures

### Manual Backup

```bash
# Using npm script
npm run backup:db

# Or directly
node scripts/backup-database.js
```

### Automated Backups

#### Option 1: Cron Job (Linux/macOS)

Add to crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/iam_blog && npm run backup:db >> /var/log/backup.log 2>&1

# Or using node directly
0 2 * * * cd /path/to/iam_blog && node scripts/backup-database.js >> /var/log/backup.log 2>&1
```

#### Option 2: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `scripts/backup-database.js`
   - Start in: `C:\path\to\iam_blog`

#### Option 3: Systemd Service (Linux)

Create `/etc/systemd/system/iam-blog-backup.service`:

```ini
[Unit]
Description=IAM Blog Database Backup
After=network.target

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/path/to/iam_blog
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node scripts/backup-database.js
```

Create `/etc/systemd/system/iam-blog-backup.timer`:

```ini
[Unit]
Description=Daily IAM Blog Database Backup
Requires=iam-blog-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable iam-blog-backup.timer
sudo systemctl start iam-blog-backup.timer
```

#### Option 4: Docker Cron

If using Docker, add to your `docker-compose.yml`:

```yaml
services:
  backup:
    image: postgres:15
    volumes:
      - ./backups:/backups
      - ./scripts:/scripts
    environment:
      - POSTGRESQL_URI=${POSTGRESQL_URI}
      - BACKUP_DIR=/backups
    command: >
      sh -c "echo '0 2 * * * node /scripts/backup-database.js' | crontab - && crond -f"
```

## Restore Procedures

### List Available Backups

```bash
npm run restore:list
```

### Restore from Backup

**⚠️ WARNING: This will overwrite your current database!**

```bash
# Interactive (will prompt for confirmation)
npm run restore:db backups/iam_blog_db_2025-01-05T10-30-00.dump.gz

# Force (no confirmation)
npm run restore:db backups/iam_blog_db_2025-01-05T10-30-00.dump.gz --force

# Drop and recreate database
npm run restore:db backups/iam_blog_db_2025-01-05T10-30-00.dump.gz --drop-existing
```

### Restore Options

- `--force`: Skip confirmation prompt
- `--create-db`: Create database if it doesn't exist
- `--drop-existing`: Drop existing database before restore

## Backup Formats

### Custom Format (Recommended)

- **Extension**: `.dump` or `.dump.gz`
- **Advantages**:
  - Smaller file size
  - Faster restore
  - Can restore specific tables
  - Preserves all database objects
- **Usage**: Default format

### Plain SQL Format

- **Extension**: `.sql` or `.sql.gz`
- **Advantages**:
  - Human-readable
  - Can edit before restore
  - Works with any PostgreSQL version
- **Usage**: Set `BACKUP_FORMAT=plain` in `.env`

## Backup Retention

Backups are automatically cleaned based on retention policy:

- **Default**: 30 days
- **Configurable**: Set `BACKUP_RETENTION_DAYS` in `.env`
- **Cleanup**: Runs automatically after each backup

To disable cleanup, set `BACKUP_RETENTION_DAYS=0` (not recommended).

## Testing Restore

### Test on Staging/Development

1. **Create test backup**:
   ```bash
   npm run backup:db
   ```

2. **Create test database**:
   ```bash
   createdb iam_blog_test
   ```

3. **Restore to test database**:
   ```bash
   # Temporarily change DATABASE_URL
   DATABASE_URL=postgresql://user:pass@localhost:5432/iam_blog_test \
     node scripts/restore-database.js backups/latest.dump.gz
   ```

4. **Verify data**:
   ```bash
   psql iam_blog_test -c "SELECT COUNT(*) FROM blog_posts;"
   ```

### Regular Restore Testing

**Recommended**: Test restore procedure monthly:

1. Create a backup
2. Restore to a test database
3. Verify all data is present
4. Document any issues

## Backup Verification

### Check Backup File

```bash
# For custom format
pg_restore --list backups/iam_blog_db_2025-01-05T10-30-00.dump.gz

# For plain format
head -n 50 backups/iam_blog_db_2025-01-05T10-30-00.sql.gz | gunzip
```

### Verify Backup Integrity

```bash
# Test restore without actually restoring
pg_restore --list backups/iam_blog_db_2025-01-05T10-30-00.dump.gz | head -n 20
```

## Remote Backup Storage

### Option 1: AWS S3

```bash
# After backup, upload to S3
aws s3 cp backups/latest.dump.gz s3://your-bucket/backups/
```

### Option 2: Google Cloud Storage

```bash
gsutil cp backups/latest.dump.gz gs://your-bucket/backups/
```

### Option 3: Azure Blob Storage

```bash
az storage blob upload --file backups/latest.dump.gz \
  --container-name backups --name latest.dump.gz
```

### Option 4: rsync to Remote Server

```bash
rsync -avz backups/ user@remote-server:/backups/iam-blog/
```

## Disaster Recovery Plan

### Scenario 1: Database Corruption

1. **Stop application**
2. **Identify last good backup**
3. **Restore from backup**:
   ```bash
   npm run restore:db backups/latest.dump.gz --drop-existing
   ```
4. **Run migrations** (if needed):
   ```bash
   npm run migrate:up
   ```
5. **Verify data integrity**
6. **Restart application**

### Scenario 2: Accidental Data Deletion

1. **Stop application immediately**
2. **Identify backup before deletion**
3. **Restore specific tables** (if using custom format):
   ```bash
   pg_restore -t blog_posts backups/backup.dump.gz | psql database
   ```
4. **Or restore full database** if needed

### Scenario 3: Server Failure

1. **Set up new server**
2. **Install PostgreSQL**
3. **Restore from remote backup**:
   ```bash
   # Download backup
   aws s3 cp s3://bucket/backups/latest.dump.gz ./
   
   # Restore
   npm run restore:db latest.dump.gz --create-db
   ```
4. **Run migrations** (if needed)
5. **Update application configuration**
6. **Restart application**

## Best Practices

1. ✅ **Automate backups** - Don't rely on manual backups
2. ✅ **Test restores regularly** - Monthly at minimum
3. ✅ **Store backups off-site** - Use cloud storage
4. ✅ **Encrypt backups** - Especially for sensitive data
5. ✅ **Monitor backup success** - Set up alerts
6. ✅ **Document restore procedures** - Keep this guide updated
7. ✅ **Version backups** - Keep multiple versions
8. ✅ **Backup before major changes** - Always backup before migrations/updates

## Monitoring & Alerts

### Check Backup Status

```bash
# List recent backups
ls -lh backups/ | tail -n 10

# Check backup age
find backups/ -name "*.dump.gz" -mtime +1
```

### Set Up Alerts

Example script to check if backup ran today:

```bash
#!/bin/bash
LATEST_BACKUP=$(ls -t backups/*.dump.gz 2>/dev/null | head -n 1)
if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backups found"
  exit 1
fi

BACKUP_AGE=$(find "$LATEST_BACKUP" -mtime -1)
if [ -z "$BACKUP_AGE" ]; then
  echo "WARNING: Latest backup is older than 24 hours"
  exit 1
fi

echo "OK: Backup is recent"
```

## Managed Database Services

If using a managed PostgreSQL service, they typically provide automatic backups:

### AWS RDS
- Automatic daily backups
- Point-in-time recovery
- Backup retention: 7-35 days

### Google Cloud SQL
- Automatic daily backups
- On-demand backups
- Backup retention: 7-365 days

### Azure Database for PostgreSQL
- Automatic daily backups
- Long-term retention available
- Point-in-time restore

### Heroku Postgres
- Automatic daily backups
- Manual backups available
- Point-in-time recovery (premium plans)

## Troubleshooting

### Backup Fails

**Error**: `pg_dump: error: connection to server failed`

**Solution**: Check database connection string and network connectivity

**Error**: `Permission denied`

**Solution**: Ensure backup directory is writable:
```bash
chmod 755 backups/
```

### Restore Fails

**Error**: `database already exists`

**Solution**: Use `--drop-existing` flag or drop database manually:
```bash
dropdb database_name
```

**Error**: `relation already exists`

**Solution**: Use `--clean` flag (automatically used in restore script)

## Related Files

- Backup script: `scripts/backup-database.js`
- Restore script: `scripts/restore-database.js`
- Documentation: `DATABASE_BACKUPS.md`
- Environment config: `.env`

## Support

For issues or questions:
1. Check this documentation
2. Review backup/restore logs
3. Test on development environment first
4. Contact database administrator if needed

