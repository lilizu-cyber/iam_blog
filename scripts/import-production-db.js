#!/usr/bin/env node
/**
 * Import blog data from a production PostgreSQL database into the local dev database.
 *
 * Usage:
 *   PRODUCTION_POSTGRESQL_URI in .env (or PRODUCTION_DATABASE_URL)
 *   POSTGRESQL_URI=postgresql://postgres:postgres@localhost:5432/iam_blog_db
 *   npm run import:production
 *
 * Supabase on Windows/Docker: direct hosts (db.xxx.supabase.co) are IPv6-only and often
 * fail from Docker Desktop. Use the Session pooler URL on port 5432 for pg_dump instead.
 */

require('dotenv').config();
const { spawn } = require('child_process');
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

const POSTGRES_IMAGE = 'postgres:17-alpine';

function parsePostgresUri(uri) {
  const url = new URL(uri);
  return {
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, ''),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    sslmode: url.searchParams.get('sslmode') || 'require',
  };
}

function dockerHostForLocalPostgres(host) {
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'host.docker.internal';
  }
  return host;
}

/** Absolute path formatted for Docker volume mounts on Windows. */
function toDockerVolumePath(dirPath) {
  const resolved = path.resolve(dirPath);
  if (process.platform === 'win32') {
    return resolved.replace(/\\/g, '/');
  }
  return resolved;
}

function promptConfirmation(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

function runDockerCommand(args, options = {}) {
  const { env = {}, label = 'docker' } = options;

  return new Promise((resolve, reject) => {
    let stderr = '';

    const child = spawn('docker', args, {
      stdio: ['ignore', 'inherit', 'pipe'],
      env: { ...process.env, ...env },
      shell: false,
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed (exit ${code})${stderr ? `: ${stderr.trim()}` : ''}`));
    });
  });
}

function buildPgEnv(db) {
  const env = {
    PGPASSWORD: db.password,
    PGSSLMODE: db.sslmode || 'require',
  };
  return env;
}

function isSupabaseDirectHost(host) {
  return /^db\.[a-z0-9]+\.supabase\.co$/i.test(host);
}

async function resolveIPv4(hostname) {
  try {
    const addresses = await dns.resolve4(hostname);
    return addresses[0] || null;
  } catch {
    return null;
  }
}

async function assertDumpHostReachable(db) {
  const ipv4 = await resolveIPv4(db.host);

  if (ipv4) {
    return { ipv4 };
  }

  if (isSupabaseDirectHost(db.host)) {
    throw new Error(
      `Supabase direct connection (${db.host}) is IPv6-only. Docker on Windows cannot reach it.\n\n` +
      'Use the Session pooler URL (port 5432, not 6543) in PRODUCTION_POSTGRESQL_URI:\n' +
      '  Supabase → Project Settings → Database → Connection string → Session pooler\n\n' +
      'Example:\n' +
      '  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require'
    );
  }

  logger.warn(
    `No IPv4 address found for ${db.host}. pg_dump will use IPv6; this may fail inside Docker on Windows.`
  );
  return { ipv4: null };
}

function buildDockerPgDumpArgs(db, outputPath, ipv4) {
  const backupDir = path.dirname(outputPath);
  const filename = path.basename(outputPath);
  const volumePath = toDockerVolumePath(backupDir);
  const args = [
    'run',
    '--rm',
    '-v',
    `${volumePath}:/backups`,
    '-e', `PGHOST=${db.host}`,
    '-e', `PGPORT=${db.port}`,
    '-e', `PGUSER=${db.username}`,
    '-e', `PGDATABASE=${db.database}`,
    '-e', `PGPASSWORD=${db.password}`,
    '-e', `PGSSLMODE=${db.sslmode || 'require'}`,
  ];

  if (ipv4) {
    args.push('-e', `PGHOSTADDR=${ipv4}`);
    logger.info('Using IPv4 for pg_dump:', { address: ipv4, sslHost: db.host });
  }

  args.push(
    POSTGRES_IMAGE,
    'pg_dump',
    '-Fc',
    '-f',
    `/backups/${filename}`
  );

  return args;
}

async function dumpProductionDatabase(productionUri, outputPath) {
  const db = parsePostgresUri(productionUri);
  const backupDir = path.dirname(outputPath);
  const filename = path.basename(outputPath);
  ensureBackupDir(backupDir);

  const volumePath = toDockerVolumePath(backupDir);

  logger.info('Dumping production database (this may take a minute)...');
  logger.info('Source host:', { host: db.host, port: db.port, database: db.database });
  logger.info('Backup volume:', { path: volumePath });

  if (db.host.includes('pooler.supabase.com') && db.port === '6543') {
    logger.warn(
      'Port 6543 is Supabase transaction pooler — pg_dump usually fails there. Use Session pooler port 5432.'
    );
  }

  const { ipv4 } = await assertDumpHostReachable(db);

  await runDockerCommand(
    buildDockerPgDumpArgs(db, outputPath, ipv4),
    { env: buildPgEnv(db), label: 'pg_dump' }
  );

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      `Dump file was not created: ${outputPath}\n` +
      'On Windows, ensure Docker Desktop file sharing is enabled for this drive.\n' +
      'For Supabase, use the Direct connection URL (db.xxxx.supabase.co), not the pooler.'
    );
  }

  const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  logger.info(`Production dump saved (${sizeMB} MB)`, { file: outputPath });
  return outputPath;
}

async function restoreToLocalDatabase(localUri, backupPath) {
  const db = parsePostgresUri(localUri);
  const host = dockerHostForLocalPostgres(db.host);
  const backupDir = path.dirname(backupPath);
  const filename = path.basename(backupPath);
  const volumePath = toDockerVolumePath(backupDir);

  logger.info('Restoring into local database...', {
    host: db.host,
    database: db.database,
  });

  const args = [
    'run',
    '--rm',
    '-v',
    `${volumePath}:/backups`,
    '-e',
    `PGPASSWORD=${db.password}`,
    POSTGRES_IMAGE,
    'pg_restore',
    '-h',
    host,
    '-p',
    db.port,
    '-U',
    db.username,
    '-d',
    db.database,
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-acl',
    `/backups/${filename}`,
  ];

  try {
    await runDockerCommand(args, { label: 'pg_restore' });
  } catch (error) {
    if (!String(error.message).includes('exit 1')) {
      throw error;
    }
    logger.warn('Restore finished with warnings (this is often normal for --clean restores).');
  }

  logger.info('Local database restore completed.');
}

function ensureBackupDir(backupDir) {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

async function ensureLocalPostgresRunning() {
  try {
    const { execSync } = require('child_process');
    execSync('node scripts/auto-start-postgres.js', { stdio: 'inherit', cwd: process.cwd() });
  } catch {
    logger.warn('Could not auto-start PostgreSQL. Ensure it is running: docker compose up -d postgresql');
  }
}

async function importProduction(options = {}) {
  const productionUri =
    process.env.PRODUCTION_POSTGRESQL_URI ||
    process.env.PRODUCTION_DATABASE_URL;

  const localUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;

  if (!productionUri) {
    throw new Error(
      'PRODUCTION_POSTGRESQL_URI is required in .env\n' +
      'Use Supabase/Railway → Database → Direct connection URL (?sslmode=require)'
    );
  }

  if (!localUri) {
    throw new Error('POSTGRESQL_URI must be set in .env for the local target database.');
  }

  if (!productionUri.startsWith('postgresql://') && !productionUri.startsWith('postgres://')) {
    throw new Error('PRODUCTION_POSTGRESQL_URI must start with postgresql:// or postgres://');
  }

  const localDb = parsePostgresUri(localUri);
  const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(backupDir, `production_import_${timestamp}.dump`);

  logger.warn('This will REPLACE your local database with production data.');
  logger.warn(`  Local target: ${localDb.database} @ ${localDb.host}:${localDb.port}`);
  logger.warn(`  Production:   ${parsePostgresUri(productionUri).host}`);

  if (!options.force) {
    const confirmed = await promptConfirmation('Continue? (yes/no): ');
    if (!confirmed) {
      logger.info('Import cancelled.');
      return { success: false, cancelled: true };
    }
  }

  await ensureLocalPostgresRunning();
  await dumpProductionDatabase(productionUri, backupPath);
  await restoreToLocalDatabase(localUri, backupPath);

  logger.info('');
  logger.info('Import complete. Next steps:');
  logger.info('  1. Restart the backend if it is running: npm run dev');
  logger.info('  2. Log in with your PRODUCTION admin credentials (users table was imported).');
  logger.info('  3. Do NOT run npm run setup:db — it wipes the database.');
  logger.info(`  4. Backup kept at: ${backupPath}`);

  return { success: true, backupPath };
}

if (require.main === module) {
  const force = process.argv.includes('--force');

  importProduction({ force })
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Import failed:', error.message);
      logger.error('');
      logger.error('Tips:');
      logger.error('- Supabase on Windows: use Session pooler (port 5432), not direct db.xxx host (IPv6-only)');
      logger.error('- Add ?sslmode=require and use postgres.[PROJECT_REF] as the pooler username');
      logger.error('- Ensure Docker Desktop is running');
      logger.error('- Ensure local PostgreSQL is up: docker compose up -d postgresql');
      process.exit(1);
    });
}

module.exports = {
  importProduction,
  dumpProductionDatabase,
  restoreToLocalDatabase,
  resolveIPv4,
  assertDumpHostReachable,
};
