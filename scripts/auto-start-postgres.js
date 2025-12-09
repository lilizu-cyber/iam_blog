require('dotenv').config();
const { execSync, spawn } = require('child_process');
const { Sequelize } = require('sequelize');
const net = require('net');

const DEFAULT_PORT = 5432;
const ALTERNATIVE_PORTS = [5433, 5434, 5435, 3100, 3101];
const MAX_WAIT_TIME = 30000; // 30 seconds
const CHECK_INTERVAL = 1000; // 1 second

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

/**
 * Check if PostgreSQL is running on a specific port
 */
async function checkPostgreSQLPort(host, port) {
  const testUri = `postgresql://postgres:postgres@${host}:${port}/postgres`;
  const sequelize = new Sequelize(testUri, {
    dialect: 'postgres',
    logging: false,
    retry: { max: 1 },
    dialectOptions: {
      connectTimeout: 2000
    }
  });

  try {
    await sequelize.authenticate();
    await sequelize.close();
    return true;
  } catch (error) {
    try {
      await sequelize.close();
    } catch (e) {
      // Ignore close errors
    }
    return false;
  }
}

/**
 * Find an available port for PostgreSQL
 */
async function findAvailablePort(startPort = DEFAULT_PORT) {
  // First check if PostgreSQL is already running on the default port
  if (await checkPostgreSQLPort('localhost', startPort)) {
    console.log(`✅ PostgreSQL is already running on port ${startPort}`);
    return startPort;
  }

  // Check if port is in use by checking for listening connections
  // If it's in use but not PostgreSQL, we'll still try to use it (Docker will handle it)
  const portInUse = !(await isPortAvailable(startPort));
  
  if (portInUse) {
    // Port is in use, check if it's PostgreSQL
    const isPostgres = await checkPostgreSQLPort('localhost', startPort);
    if (isPostgres) {
      console.log(`✅ PostgreSQL is already running on port ${startPort}`);
      return startPort;
    }
    
    // Port is in use by something else, try alternative ports
    console.log(`⚠️  Port ${startPort} is in use, checking alternative ports...`);
    for (const port of ALTERNATIVE_PORTS) {
      if (await checkPostgreSQLPort('localhost', port)) {
        console.log(`✅ Found PostgreSQL running on port ${port}`);
        return port;
      }
    }
    
    // If default port is in use but not PostgreSQL, still use it (Docker will fail if needed)
    console.log(`⚠️  Port ${startPort} is in use, but will attempt to start PostgreSQL anyway`);
    return startPort;
  }

  // Port is available
  return startPort;
}

/**
 * Check if Docker is available
 */
function isDockerAvailable() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Docker Compose is available
 */
function isDockerComposeAvailable() {
  try {
    execSync('docker-compose --version', { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync('docker compose version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Start PostgreSQL using Docker Compose
 */
async function startPostgreSQLWithDocker(port) {
  console.log(`🚀 Starting PostgreSQL on port ${port}...`);

  const dockerComposeCmd = isDockerComposeAvailable() ? 'docker-compose' : 'docker compose';
  
  try {
    // Check if container is already running
    try {
      const status = execSync(
        `${dockerComposeCmd} ps postgresql --format json`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      const containers = JSON.parse(status);
      if (containers && containers.length > 0 && containers[0].State === 'running') {
        console.log('✅ PostgreSQL container is already running');
        return true;
      }
    } catch (e) {
      // Container not running or doesn't exist, continue to start it
    }

    // Start PostgreSQL container
    execSync(`${dockerComposeCmd} up -d postgresql`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('⏳ Waiting for PostgreSQL to be ready...');
    return true;
  } catch (error) {
    console.error('❌ Failed to start PostgreSQL with Docker:', error.message);
    return false;
  }
}

/**
 * Start PostgreSQL using Docker run (fallback)
 */
async function startPostgreSQLWithDockerRun(port) {
  console.log(`🚀 Starting PostgreSQL container on port ${port}...`);

  try {
    // Check if container already exists
    try {
      const existing = execSync(`docker ps -a --filter "name=iam-blog-postgres" --format "{{.Names}}"`, {
        encoding: 'utf-8'
      }).trim();
      
      if (existing) {
        console.log('📦 Starting existing PostgreSQL container...');
        execSync('docker start iam-blog-postgres', { stdio: 'inherit' });
      } else {
        console.log('📦 Creating new PostgreSQL container...');
        execSync(
          `docker run -d --name iam-blog-postgres ` +
          `-e POSTGRES_USER=postgres ` +
          `-e POSTGRES_PASSWORD=postgres ` +
          `-e POSTGRES_DB=iam_blog_db ` +
          `-p ${port}:5432 ` +
          `-v iam-blog-postgres-data:/var/lib/postgresql/data ` +
          `postgres:15-alpine`,
          { stdio: 'inherit' }
        );
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to start PostgreSQL container:', error.message);
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Wait for PostgreSQL to be ready
 */
async function waitForPostgreSQL(host, port, maxWait = MAX_WAIT_TIME) {
  const startTime = Date.now();
  const checkInterval = CHECK_INTERVAL;

  while (Date.now() - startTime < maxWait) {
    if (await checkPostgreSQLPort(host, port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  return false;
}

/**
 * Update .env file with the correct PostgreSQL port
 */
function updateEnvFile(port) {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  let envContent = fs.readFileSync(envPath, 'utf-8');
  const postgresUri = `postgresql://postgres:postgres@localhost:${port}/iam_blog_db`;
  
  // Update or add POSTGRESQL_URI
  if (envContent.includes('POSTGRESQL_URI=')) {
    envContent = envContent.replace(
      /POSTGRESQL_URI=.*/,
      `POSTGRESQL_URI=${postgresUri}`
    );
  } else {
    envContent += `\nPOSTGRESQL_URI=${postgresUri}\n`;
  }

  // Also update DATABASE_URL if it exists
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL=${postgresUri}`
    );
  }

  fs.writeFileSync(envPath, envContent);
  // Reload environment
  delete require.cache[require.resolve('dotenv')];
  require('dotenv').config();
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Auto-starting PostgreSQL...\n');

  // Find available port
  const port = await findAvailablePort();
  
  if (!port) {
    console.error('❌ No available ports found for PostgreSQL');
    console.error('   Please free up a port (5432-5435, 3100-3101) or stop existing PostgreSQL instances');
    process.exit(1);
  }

  // Check if PostgreSQL is already running
  if (await checkPostgreSQLPort('localhost', port)) {
    console.log(`✅ PostgreSQL is already running on port ${port}`);
    updateEnvFile(port);
    process.exit(0);
  }

  // Try to start PostgreSQL
  let started = false;

  if (isDockerComposeAvailable()) {
    started = await startPostgreSQLWithDocker(port);
  } else if (isDockerAvailable()) {
    started = await startPostgreSQLWithDockerRun(port);
  } else {
    console.error('❌ Docker is not available');
    console.error('   Please install Docker or start PostgreSQL manually');
    console.error('   Docker: https://www.docker.com/get-started');
    process.exit(1);
  }

  if (!started) {
    console.error('❌ Failed to start PostgreSQL');
    process.exit(1);
  }

  // Wait for PostgreSQL to be ready
  const isReady = await waitForPostgreSQL('localhost', port);
  
  if (!isReady) {
    console.error('❌ PostgreSQL failed to start within timeout');
    console.error('   Check Docker logs: docker logs iam-blog-postgres');
    process.exit(1);
  }

  // Update .env file with the correct port
  updateEnvFile(port);

  console.log(`\n✅ PostgreSQL is ready on port ${port}`);
  console.log(`   Connection: postgresql://postgres:****@localhost:${port}/iam_blog_db\n`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

