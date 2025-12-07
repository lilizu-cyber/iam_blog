require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

// Find pg_dump executable path
async function findPgDump() {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  const path = require('path');
  const fs = require('fs');
  const os = require('os');

  // Common PostgreSQL installation paths on Windows
  const windowsPaths = [
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
    'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\pg_dump.exe',
    'C:\\Program Files (x86)\\PostgreSQL\\14\\bin\\pg_dump.exe',
    process.env.PG_BIN_PATH ? path.join(process.env.PG_BIN_PATH, 'pg_dump.exe') : null,
  ].filter(Boolean);

  // Try to find pg_dump in PATH first
  try {
    if (os.platform() === 'win32') {
      const { stdout } = await execAsync('where pg_dump 2>$null');
      if (stdout && stdout.trim()) {
        const foundPath = stdout.trim().split('\r\n')[0].split('\n')[0].trim();
        if (foundPath && fs.existsSync(foundPath)) {
          return foundPath;
        }
      }
    } else {
      const { stdout } = await execAsync('which pg_dump');
      if (stdout && stdout.trim()) {
        const foundPath = stdout.trim();
        if (fs.existsSync(foundPath)) {
          return foundPath;
        }
      }
    }
  } catch (error) {
    // pg_dump not in PATH, try common locations
  }

  // On Windows, check common installation paths
  if (os.platform() === 'win32') {
    for (const pgPath of windowsPaths) {
      if (fs.existsSync(pgPath)) {
        return pgPath;
      }
    }
  }

  // If not found, throw error with helpful message
  throw new Error('PostgreSQL client tools (pg_dump) not found. Please install PostgreSQL or set PG_BIN_PATH environment variable.');
}

// Parse PostgreSQL connection string
function parsePostgresUri(uri) {
  const url = new URL(uri);
  return {
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.slice(1), // Remove leading '/'
    username: url.username,
    password: url.password,
  };
}

// Ensure backup directory exists
function ensureBackupDir(backupDir) {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    logger.info(`Created backup directory: ${backupDir}`);
  }
}

// Clean old backups based on retention policy
async function cleanOldBackups(backupDir, retentionDays) {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;
    for (const file of files) {
      if (file.mtime < cutoffDate) {
        fs.unlinkSync(file.path);
        logger.info(`Deleted old backup: ${file.name}`);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cleaned ${deletedCount} old backup(s)`);
    }
  } catch (error) {
    logger.warn('Failed to clean old backups:', error.message);
  }
}

// Create database backup
async function createBackup(options = {}) {
  const {
    backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'),
    retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    compress = process.env.BACKUP_COMPRESS !== 'false',
    format = process.env.BACKUP_FORMAT || 'custom' // 'custom' or 'plain'
  } = options;

  try {
    // Find pg_dump executable
    let pgDumpPath;
    try {
      pgDumpPath = await findPgDump();
      logger.info(`Using pg_dump: ${pgDumpPath}`);
    } catch (error) {
      logger.error('❌ PostgreSQL tools not found!');
      logger.error('');
      logger.error('To fix this:');
      logger.error('1. Install PostgreSQL (includes pg_dump): https://www.postgresql.org/download/');
      logger.error('2. Or add PostgreSQL bin directory to PATH');
      logger.error('3. Or set PG_BIN_PATH environment variable (e.g., C:\\Program Files\\PostgreSQL\\15\\bin)');
      logger.error('');
      throw error;
    }

    // Get database connection info
    const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
    if (!postgresUri) {
      throw new Error('POSTGRESQL_URI or DATABASE_URL environment variable is required');
    }

    const dbInfo = parsePostgresUri(postgresUri);
    logger.info('Starting database backup...', {
      host: dbInfo.host,
      database: dbInfo.database,
      format,
      compress
    });

    // Ensure backup directory exists
    ensureBackupDir(backupDir);

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const extension = format === 'custom' ? 'dump' : 'sql';
    const filename = `${dbInfo.database}_${timestamp}.${extension}`;
    const filepath = path.join(backupDir, filename);
    const finalFilepath = compress && format === 'custom' ? `${filepath}.gz` : filepath;

    // Set PGPASSWORD environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: dbInfo.password,
      PGUSER: dbInfo.username,
      PGHOST: dbInfo.host,
      PGPORT: dbInfo.port,
      PGDATABASE: dbInfo.database,
    };

    // Build pg_dump command
    // On Windows, use the full path; on Unix, use as-is (already in PATH or full path)
    let command;
    const os = require('os');
    const pgDumpCmd = os.platform() === 'win32' ? `"${pgDumpPath}"` : pgDumpPath;
    
    if (format === 'custom') {
      // Custom format (binary) - recommended for production
      command = `${pgDumpCmd} -Fc -f "${filepath}"`;
    } else {
      // Plain SQL format
      command = `${pgDumpCmd} -f "${filepath}"`;
    }

    // Execute backup
    logger.info(`Executing: ${command.replace(dbInfo.password, '***')}`);
    const { stdout, stderr } = await execAsync(command, { env });

    if (stderr && !stderr.includes('NOTICE')) {
      logger.warn('Backup warnings:', stderr);
    }

    // Compress if requested and format is custom
    if (compress && format === 'custom') {
      logger.info('Compressing backup...');
      await execAsync(`gzip "${filepath}"`);
      logger.info(`Backup compressed: ${finalFilepath}`);
    }

    // Get file size
    const stats = fs.statSync(finalFilepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    logger.info('✅ Backup completed successfully', {
      file: finalFilepath,
      size: `${fileSizeMB} MB`,
      timestamp: new Date().toISOString()
    });

    // Clean old backups
    await cleanOldBackups(backupDir, retentionDays);

    return {
      success: true,
      filepath: finalFilepath,
      size: stats.size,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('❌ Backup failed:', error.message);
    if (error.stderr) {
      logger.error('Error details:', error.stderr);
    }
    
    // Provide helpful error message for missing pg_dump
    if (error.message.includes('not recognized') || error.message.includes('not found')) {
      logger.error('');
      logger.error('PostgreSQL client tools not found!');
      logger.error('');
      logger.error('To fix this:');
      logger.error('1. Install PostgreSQL (includes pg_dump): https://www.postgresql.org/download/');
      logger.error('2. Or add PostgreSQL bin directory to PATH');
      logger.error('3. Or set PG_BIN_PATH environment variable (e.g., C:\\Program Files\\PostgreSQL\\15\\bin)');
      logger.error('');
    }
    
    throw error;
  }
}

// Main execution
if (require.main === module) {
  createBackup()
    .then((result) => {
      logger.info('Backup process completed', result);
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Backup process failed', error);
      process.exit(1);
    });
}

module.exports = { createBackup, cleanOldBackups };

