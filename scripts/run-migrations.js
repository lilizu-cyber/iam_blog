require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

async function runMigrations() {
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
  
  const sequelize = new Sequelize(postgresUri, {
    dialect: 'postgres',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL');

    // Create SequelizeMeta table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../src/backend/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    logger.info(`Found ${migrationFiles.length} migration files`);

    // Get already executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name'
    );
    const executedNames = new Set(executedMigrations.map(m => m.name));

    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedNames.has(file)) {
        logger.info(`Skipping already executed migration: ${file}`);
        continue;
      }

      logger.info(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));

      try {
        await sequelize.transaction(async (transaction) => {
          await migration.up(sequelize.getQueryInterface(), Sequelize);
          await sequelize.query(
            `INSERT INTO "SequelizeMeta" (name) VALUES ('${file}')`,
            { transaction }
          );
        });
        logger.info(`✅ Migration completed: ${file}`);
      } catch (error) {
        logger.error(`❌ Migration failed: ${file}`, error);
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'up' || !command) {
  runMigrations();
} else if (command === 'status') {
  // Show migration status
  (async () => {
    const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    const sequelize = new Sequelize(postgresUri, {
      dialect: 'postgres',
      logging: false,
    });

    try {
      await sequelize.authenticate();
      
      const migrationsDir = path.join(__dirname, '../src/backend/migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.js'))
        .sort();

      const [executedMigrations] = await sequelize.query(
        'SELECT name FROM "SequelizeMeta" ORDER BY name'
      );
      const executedNames = new Set(executedMigrations.map(m => m.name));

      logger.info('Migration Status:');
      migrationFiles.forEach(file => {
        const status = executedNames.has(file) ? '✅ Executed' : '⏳ Pending';
        logger.info(`  ${status}: ${file}`);
      });
    } catch (error) {
      logger.error('Failed to check migration status:', error);
    } finally {
      await sequelize.close();
    }
  })();
} else {
  logger.error(`Unknown command: ${command}`);
  logger.info('Usage: node scripts/run-migrations.js [up|status]');
  process.exit(1);
}


