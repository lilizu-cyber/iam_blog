#!/usr/bin/env node
/**
 * Automated Database Backup Scheduler
 * 
 * This script can be run as a cron job to automate database backups.
 * 
 * Usage:
 *   - Manual: node scripts/schedule-backups.js
 *   - Cron (daily at 2 AM): 0 2 * * * cd /path/to/project && node scripts/schedule-backups.js
 *   - Cron (every 6 hours): 0 */6 * * * cd /path/to/project && node scripts/schedule-backups.js
 */

require('dotenv').config();
const { createBackup } = require('./backup-database');
const logger = require('../src/backend/utils/logger');
const path = require('path');

async function runScheduledBackup() {
  try {
    logger.info('Starting scheduled database backup...');
    
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
    const compress = process.env.BACKUP_COMPRESS !== 'false';
    const format = process.env.BACKUP_FORMAT || 'custom';

    const result = await createBackup({
      backupDir,
      retentionDays,
      compress,
      format
    });

    logger.info('✅ Scheduled backup completed successfully', {
      file: result.filepath,
      size: `${(result.size / (1024 * 1024)).toFixed(2)} MB`,
      timestamp: result.timestamp
    });

    // Exit with success
    process.exit(0);
  } catch (error) {
    logger.error('❌ Scheduled backup failed:', {
      error: error.message,
      stack: error.stack
    });

    // Exit with error code (for cron job monitoring)
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runScheduledBackup();
}

module.exports = { runScheduledBackup };

