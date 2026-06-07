require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

async function createAdminUser() {
  let sequelize;
  try {
    logger.info('Initializing Sequelize...');
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    sequelize = initializeSequelize(postgresUri);
    await sequelize.authenticate();
    
    // Get User model - ensure it's properly initialized
    const userModule = require('../src/backend/models/User');
    let User;
    
    // Handle User model initialization
    if (userModule && typeof userModule.sync === 'function') {
      // Already a model instance
      User = userModule;
    } else if (userModule && userModule.defineUserModel) {
      // Need to initialize using defineUserModel
      User = userModule.defineUserModel(sequelize);
    } else if (typeof userModule === 'function') {
      // It's the getUserModel function
      User = userModule();
    } else {
      throw new Error('User model is not properly initialized');
    }
    
    if (!User || typeof User.sync !== 'function') {
      throw new Error('User model is not a valid Sequelize model');
    }
    
    // Sync User model to ensure table exists
    await User.sync({ alter: false });
    logger.info('User table synced.');

    // Get admin credentials from environment or use defaults
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Schlurfend.?.123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const site = require('../src/backend/config/site');

    logger.info(`Site author display name: ${site.authorName}`);

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { username: adminUsername }
    });

    if (existingAdmin) {
      logger.warn(`Admin user "${adminUsername}" already exists.`);
      logger.info('To update the password, delete the user first or use a different username.');
      logger.info(`Current admin user ID: ${existingAdmin.userId}`);
      return;
    }

    // Create admin user with hashed password
    logger.info(`Creating admin user: ${adminUsername}`);
    const adminUser = await User.createWithPassword({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true
    });

    logger.info('Admin user created successfully!');
    logger.info(`  User ID: ${adminUser.userId}`);
    logger.info(`  Username: ${adminUser.username}`);
    logger.info(`  Email: ${adminUser.email}`);
    logger.info(`  Role: ${adminUser.role}`);
    logger.info('\n⚠️  IMPORTANT: Save these credentials securely!');
    logger.info(`  Username: ${adminUsername}`);
    logger.info(`  Password: ${adminPassword}`);
    logger.info('\nYou can change the password later through the admin panel or by updating the user in the database.');

  } catch (error) {
    logger.error('Failed to create admin user:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      logger.info('Sequelize connection closed.');
    }
  }
}

createAdminUser();

