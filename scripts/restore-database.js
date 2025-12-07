require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readline = require('readline');

const execAsync = promisify(exec);
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

// Find PostgreSQL executable (pg_restore or psql)
async function findPgExecutable(tool) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  const path = require('path');
  const fs = require('fs');
  const os = require('os');

  // Common PostgreSQL installation paths on Windows
  const windowsPaths = [
    'C:\\Program Files\\PostgreSQL\\15\\bin',
    'C:\\Program Files\\PostgreSQL\\14\\bin',
    'C:\\Program Files\\PostgreSQL\\13\\bin',
    'C:\\Program Files\\PostgreSQL\\16\\bin',
    'C:\\Program Files (x86)\\PostgreSQL\\15\\bin',
    'C:\\Program Files (x86)\\PostgreSQL\\14\\bin',
    process.env.PG_BIN_PATH || null,
  ].filter(Boolean);

  const exeName = os.platform() === 'win32' ? `${tool}.exe` : tool;

  // Try to find in PATH first
  try {
    if (os.platform() === 'win32') {
      const { stdout } = await execAsync(`where ${tool} 2>$null`);
      if (stdout && stdout.trim()) {
        const foundPath = stdout.trim().split('\r\n')[0].split('\n')[0].trim();
        if (foundPath && fs.existsSync(foundPath)) {
          return foundPath;
        }
      }
    } else {
      const { stdout } = await execAsync(`which ${tool}`);
      if (stdout && stdout.trim()) {
        const foundPath = stdout.trim();
        if (fs.existsSync(foundPath)) {
          return foundPath;
        }
      }
    }
  } catch (error) {
    // Tool not in PATH, try common locations
  }

  // On Windows, check common installation paths
  if (os.platform() === 'win32') {
    for (const binPath of windowsPaths) {
      const fullPath = path.join(binPath, exeName);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  // If not found, throw error
  throw new Error(`PostgreSQL tool (${tool}) not found. Please install PostgreSQL or set PG_BIN_PATH environment variable.`);
}

// Parse PostgreSQL connection string
function parsePostgresUri(uri) {
  const url = new URL(uri);
  return {
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.slice(1),
    username: url.username,
    password: url.password,
  };
}

// Prompt for confirmation
function promptConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// List available backups
function listBackups(backupDir) {
  if (!fs.existsSync(backupDir)) {
    logger.warn(`Backup directory does not exist: ${backupDir}`);
    return [];
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.dump') || file.endsWith('.dump.gz') || 
                    file.endsWith('.sql') || file.endsWith('.sql.gz'))
    .map(file => {
      const filepath = path.join(backupDir, file);
      const stats = fs.statSync(filepath);
      return {
        name: file,
        path: filepath,
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        mtime: stats.mtime,
        date: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return files;
}

// Restore database from backup
async function restoreDatabase(backupFile, options = {}) {
  const {
    force = false,
    createDatabase = false,
    dropExisting = false
  } = options;

  try {
    // Check if backup file exists
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    // Get database connection info
    const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
    if (!postgresUri) {
      throw new Error('POSTGRESQL_URI or DATABASE_URL environment variable is required');
    }

    const dbInfo = parsePostgresUri(postgresUri);

    // Determine backup format
    const isCompressed = backupFile.endsWith('.gz');
    const isCustomFormat = backupFile.endsWith('.dump') || backupFile.endsWith('.dump.gz');
    const workingFile = isCompressed ? backupFile.replace('.gz', '') : backupFile;

    logger.info('Starting database restore...', {
      backup: backupFile,
      database: dbInfo.database,
      format: isCustomFormat ? 'custom' : 'plain',
      compressed: isCompressed
    });

    // Warning and confirmation
    if (!force) {
      logger.warn('⚠️  WARNING: This will overwrite the current database!');
      logger.warn(`   Database: ${dbInfo.database}`);
      logger.warn(`   Backup: ${backupFile}`);
      
      const confirmed = await promptConfirmation('Are you sure you want to proceed? (yes/no): ');
      if (!confirmed) {
        logger.info('Restore cancelled by user');
        return { success: false, cancelled: true };
      }
    }

    // Decompress if needed
    if (isCompressed) {
      logger.info('Decompressing backup...');
      await execAsync(`gunzip -c "${backupFile}" > "${workingFile}"`);
      logger.info('Backup decompressed');
    }

    // Set environment variables
    const env = {
      ...process.env,
      PGPASSWORD: dbInfo.password,
      PGUSER: dbInfo.username,
      PGHOST: dbInfo.host,
      PGPORT: dbInfo.port,
      PGDATABASE: dbInfo.database,
    };

    // Find PostgreSQL tools for database management
    let dropdbPath, createdbPath;
    try {
      dropdbPath = await findPgExecutable('dropdb');
      createdbPath = await findPgExecutable('createdb');
    } catch (error) {
      logger.error('❌ PostgreSQL tools not found!');
      logger.error('');
      logger.error('To fix this:');
      logger.error('1. Install PostgreSQL (includes dropdb/createdb): https://www.postgresql.org/download/');
      logger.error('2. Or add PostgreSQL bin directory to PATH');
      logger.error('3. Or set PG_BIN_PATH environment variable (e.g., C:\\Program Files\\PostgreSQL\\15\\bin)');
      logger.error('');
      throw error;
    }

    // Drop existing database if requested
    if (dropExisting) {
      logger.warn(`Dropping existing database: ${dbInfo.database}`);
      const os = require('os');
      const dropdbCmd = os.platform() === 'win32' ? `"${dropdbPath}"` : dropdbPath;
      await execAsync(`${dropdbCmd} -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} ${dbInfo.database}`, { env });
      logger.info('Database dropped');
    }

    // Create database if it doesn't exist
    if (createDatabase || dropExisting) {
      logger.info(`Creating database: ${dbInfo.database}`);
      const os = require('os');
      const createdbCmd = os.platform() === 'win32' ? `"${createdbPath}"` : createdbPath;
      await execAsync(`${createdbCmd} -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} ${dbInfo.database}`, { env });
      logger.info('Database created');
    }

    // Find PostgreSQL tools
    let pgRestorePath, psqlPath;
    try {
      pgRestorePath = isCustomFormat ? await findPgExecutable('pg_restore') : null;
      psqlPath = !isCustomFormat ? await findPgExecutable('psql') : null;
    } catch (error) {
      logger.error('❌ PostgreSQL tools not found!');
      logger.error('');
      logger.error('To fix this:');
      logger.error('1. Install PostgreSQL (includes pg_restore/psql): https://www.postgresql.org/download/');
      logger.error('2. Or add PostgreSQL bin directory to PATH');
      logger.error('3. Or set PG_BIN_PATH environment variable (e.g., C:\\Program Files\\PostgreSQL\\15\\bin)');
      logger.error('');
      throw error;
    }

    // Restore backup
    logger.info('Restoring backup...');
    let command;
    const os = require('os');
    // On Windows, quote the path; on Unix, use as-is
    const pgRestoreCmd = os.platform() === 'win32' && pgRestorePath ? `"${pgRestorePath}"` : pgRestorePath;
    const psqlCmd = os.platform() === 'win32' && psqlPath ? `"${psqlPath}"` : psqlPath;
    
    if (isCustomFormat) {
      // Custom format (binary) - use pg_restore
      command = `${pgRestoreCmd} -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database} --clean --if-exists "${workingFile}"`;
    } else {
      // Plain SQL format - use psql
      command = `${psqlCmd} -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database} -f "${workingFile}"`;
    }

    logger.info(`Executing: ${command.replace(dbInfo.password, '***')}`);
    const { stdout, stderr } = await execAsync(command, { env });

    if (stderr && !stderr.includes('NOTICE') && !stderr.includes('WARNING')) {
      logger.warn('Restore warnings:', stderr);
    }

    // Clean up decompressed file if it was created
    if (isCompressed && fs.existsSync(workingFile)) {
      fs.unlinkSync(workingFile);
    }

    logger.info('✅ Database restore completed successfully');
    return {
      success: true,
      database: dbInfo.database,
      backup: backupFile,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('❌ Restore failed:', error.message);
    if (error.stderr) {
      logger.error('Error details:', error.stderr);
    }
    
    // Provide helpful error message for missing PostgreSQL tools
    if (error.message.includes('not recognized') || error.message.includes('not found')) {
      logger.error('');
      logger.error('PostgreSQL client tools not found!');
      logger.error('');
      logger.error('To fix this:');
      logger.error('1. Install PostgreSQL (includes pg_restore/psql): https://www.postgresql.org/download/');
      logger.error('2. Or add PostgreSQL bin directory to PATH');
      logger.error('3. Or set PG_BIN_PATH environment variable (e.g., C:\\Program Files\\PostgreSQL\\15\\bin)');
      logger.error('');
    }
    
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const backupFile = args[0];
  const force = args.includes('--force');
  const createDatabase = args.includes('--create-db');
  const dropExisting = args.includes('--drop-existing');
  const list = args.includes('--list');

  if (list) {
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    const backups = listBackups(backupDir);
    
    if (backups.length === 0) {
      logger.info('No backups found');
    } else {
      logger.info(`Found ${backups.length} backup(s):`);
      backups.forEach((backup, index) => {
        logger.info(`  ${index + 1}. ${backup.name}`);
        logger.info(`     Size: ${backup.sizeMB} MB`);
        logger.info(`     Date: ${backup.date}`);
        logger.info('');
      });
    }
    process.exit(0);
  }

  if (!backupFile) {
    logger.error('Usage: node scripts/restore-database.js <backup-file> [--force] [--create-db] [--drop-existing]');
    logger.error('       node scripts/restore-database.js --list');
    process.exit(1);
  }

  restoreDatabase(backupFile, { force, createDatabase, dropExisting })
    .then((result) => {
      if (result && result.success) {
        logger.info('Restore process completed', result);
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('Restore process failed', error);
      process.exit(1);
    });
}

module.exports = { restoreDatabase, listBackups };

