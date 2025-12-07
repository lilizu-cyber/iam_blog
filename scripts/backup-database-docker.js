require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

const execAsync = promisify(exec);
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

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
      .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz') || 
                      file.endsWith('.dump') || file.endsWith('.dump.gz'))
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

// Find Docker container name for PostgreSQL
async function findPostgresContainer() {
  try {
    // First, try docker-compose service name (preferred for docker-compose setups)
    const composeServices = ['postgresql', 'postgres', 'db', 'database'];
    for (const service of composeServices) {
      try {
        // Check if service exists and is running
        const { stdout: composeStdout } = await execAsync(`docker-compose ps -q ${service} 2>$null`);
        if (composeStdout.trim()) {
          // Return service name - docker-compose exec will work with service name
          return service;
        }
      } catch (error) {
        // Service not found, continue
      }
    }

    // Try to find PostgreSQL container by name pattern
    const { stdout } = await execAsync('docker ps --format "{{.Names}}" --filter "ancestor=postgres"');
    const containers = stdout.trim().split('\n').filter(Boolean);
    
    if (containers.length > 0) {
      return containers[0];
    }

    // Try to find by name pattern
    try {
      const { stdout: nameStdout } = await execAsync('docker ps --format "{{.Names}}" | findstr /i postgres');
      const nameContainers = nameStdout.trim().split('\n').filter(Boolean);
      if (nameContainers.length > 0) {
        return nameContainers[0];
      }
    } catch (error) {
      // No containers found
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Create database backup using Docker
async function createBackup(options = {}) {
  const {
    backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'),
    retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    compress = process.env.BACKUP_COMPRESS !== 'false',
    format = process.env.BACKUP_FORMAT || 'custom',
    dockerContainer = process.env.POSTGRES_DOCKER_CONTAINER || null
  } = options;

  try {
    // Get database connection info
    const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
    if (!postgresUri) {
      throw new Error('POSTGRESQL_URI or DATABASE_URL environment variable is required');
    }

    const dbInfo = parsePostgresUri(postgresUri);
    
    // Find Docker container
    let containerName = dockerContainer;
    if (!containerName) {
      containerName = await findPostgresContainer();
    }

    if (!containerName) {
      throw new Error('PostgreSQL Docker container not found. Set POSTGRES_DOCKER_CONTAINER environment variable or ensure PostgreSQL container is running.');
    }

    logger.info('Starting database backup using Docker...', {
      container: containerName,
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

    // Build pg_dump command for Docker
    // Use docker-compose exec if it's a service name, otherwise use docker exec
    const useDockerCompose = ['postgresql', 'postgres', 'db', 'database'].includes(containerName);
    let command;
    
    if (format === 'custom') {
      // Custom format (binary) - recommended for production
      if (useDockerCompose) {
        command = `docker-compose exec -T ${containerName} pg_dump -U ${dbInfo.username} -Fc ${dbInfo.database}`;
      } else {
        command = `docker exec ${containerName} pg_dump -U ${dbInfo.username} -Fc ${dbInfo.database}`;
      }
    } else {
      // Plain SQL format
      if (useDockerCompose) {
        command = `docker-compose exec -T ${containerName} pg_dump -U ${dbInfo.username} ${dbInfo.database}`;
      } else {
        command = `docker exec ${containerName} pg_dump -U ${dbInfo.username} ${dbInfo.database}`;
      }
    }

    // Set PGPASSWORD for Docker exec
    const env = {
      ...process.env,
      PGPASSWORD: dbInfo.password,
    };

    logger.info(`Executing: ${command.replace(dbInfo.password, '***')}`);
    
    // Execute backup using streams for better handling and cross-platform compression
    const { spawn } = require('child_process');
    
    // Parse command for spawn
    const commandParts = command.split(' ');
    const dockerCmd = commandParts[0];
    const args = commandParts.slice(1);
    
    return new Promise((resolve, reject) => {
      const dockerProcess = spawn(dockerCmd, args, { env });
      let stdout = Buffer.alloc(0);
      let stderr = '';
      
      dockerProcess.stdout.on('data', (data) => {
        stdout = Buffer.concat([stdout, data]);
      });
      
      dockerProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      dockerProcess.on('close', async (code) => {
        if (code !== 0) {
          if (stderr && !stderr.includes('NOTICE')) {
            logger.warn('Backup warnings:', stderr);
          }
          reject(new Error(`pg_dump exited with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          // Write output to file
          if (compress) {
            logger.info('Compressing backup...');
            // Use Node.js zlib for cross-platform compression
            const gzip = zlib.createGzip();
            const writeStream = fs.createWriteStream(finalFilepath);
            
            await pipeline(
              require('stream').Readable.from(stdout),
              gzip,
              writeStream
            );
            logger.info(`Backup compressed: ${finalFilepath}`);
          } else {
            // Write directly to file
            fs.writeFileSync(filepath, stdout);
          }
          
          // Get file size
          const stats = fs.statSync(finalFilepath || filepath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          logger.info('✅ Backup completed successfully', {
            file: finalFilepath || filepath,
            size: `${fileSizeMB} MB`,
            timestamp: new Date().toISOString()
          });
          
          // Clean old backups
          await cleanOldBackups(backupDir, retentionDays);
          
          resolve({
            success: true,
            filepath: finalFilepath || filepath,
            size: stats.size,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          reject(error);
        }
      });
      
      dockerProcess.on('error', (error) => {
        reject(error);
      });
    });

  } catch (error) {
    logger.error('❌ Backup failed:', error.message);
    if (error.stderr) {
      logger.error('Error details:', error.stderr);
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

