require('dotenv').config();
const readline = require('readline');
const { initializeSequelize } = require('../src/backend/models/index');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

function promptConfirmation(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

function getUserModel(sequelize) {
  const userModule = require('../src/backend/models/User');

  if (userModule && typeof userModule.sync === 'function') {
    return userModule;
  }

  if (userModule && userModule.defineUserModel) {
    return userModule.defineUserModel(sequelize);
  }

  if (typeof userModule === 'function') {
    return userModule();
  }

  throw new Error('User model is not properly initialized');
}

function getConnectionConfig() {
  const candidates = [
    ['TARGET_POSTGRESQL_URI', process.env.TARGET_POSTGRESQL_URI],
    ['PRODUCTION_POSTGRESQL_URI', process.env.PRODUCTION_POSTGRESQL_URI],
    ['POSTGRESQL_URI', process.env.POSTGRESQL_URI],
    ['DATABASE_URL', process.env.DATABASE_URL],
  ];

  for (const [name, value] of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return { name, uri: value.trim() };
    }
  }

  return null;
}

function getHostFromPostgresUri(uri) {
  try {
    return new URL(uri).hostname;
  } catch {
    const atIndex = uri.indexOf('@');
    if (atIndex === -1) {
      throw new Error(
        'Invalid database URL. Expected postgresql://user:password@host:5432/dbname?sslmode=require. ' +
        'If your password contains @, ?, #, or %, URL-encode those characters in the connection string.'
      );
    }

    const hostPart = uri.slice(atIndex + 1).split(/[/?#]/)[0];
    return hostPart.split(':')[0];
  }
}

async function resetAdminPassword() {
  let sequelize;

  try {
    const connection = getConnectionConfig();
    if (!connection) {
      throw new Error(
        'No database URL found. Set TARGET_POSTGRESQL_URI for production, or POSTGRESQL_URI for local.'
      );
    }

    const { name: connectionSource, uri: postgresUri } = connection;
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
    const newPassword = process.env.NEW_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!newPassword || newPassword.length < 12) {
      throw new Error('Set NEW_ADMIN_PASSWORD to a new password (minimum 12 characters).');
    }

    let host;
    try {
      host = getHostFromPostgresUri(postgresUri);
    } catch (error) {
      throw new Error(`${error.message} (from ${connectionSource})`);
    }

    logger.info(`Using ${connectionSource}`);
    logger.info(`Target host: ${host}`);
    const isLikelyProduction =
      !host.includes('localhost') &&
      !host.includes('127.0.0.1') &&
      process.env.NODE_ENV !== 'test';

    if (isLikelyProduction && process.env.FORCE !== 'true') {
      logger.warn(`Target database host: ${host}`);
      logger.warn('This will change the admin password in that database.');
      const confirmed = await promptConfirmation('Continue? (yes/no): ');
      if (!confirmed) {
        logger.info('Password reset cancelled.');
        return;
      }
    }

    sequelize = initializeSequelize(postgresUri);
    await sequelize.authenticate();

    const User = getUserModel(sequelize);
    await User.sync({ alter: false });

    const adminUser = await User.findOne({
      where: { username: adminUsername, isActive: true },
    });

    if (!adminUser) {
      throw new Error(`Admin user "${adminUsername}" not found.`);
    }

    await adminUser.setPassword(newPassword);
    await adminUser.save();

    logger.info('Admin password updated successfully.');
    logger.info(`  Username: ${adminUser.username}`);
    logger.info(`  Database: ${host}`);
    logger.info('');
    logger.info('Next steps:');
    logger.info('  1. Save the new password in your password manager.');
    logger.info('  2. Update local .env if you use password login there.');
    logger.info('  3. Production admin UI uses Auth0 — this changes POST /api/auth/login only.');
  } catch (error) {
    logger.error('Failed to reset admin password:', error.message);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

resetAdminPassword();
