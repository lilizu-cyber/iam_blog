require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
  error: (message, error) => console.error(`[ERROR] ${message}`, error || ''),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data || ''),
};

async function setupPostgreSQL() {
  try {
    logger.info('Setting up PostgreSQL...');
    
    const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    const sequelize = initializeSequelize(postgresUri);
    
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL');
    
    // Drop existing tables first
    logger.info('Dropping existing tables (if any)...');
    await sequelize.query('DROP TABLE IF EXISTS "events" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "blog_posts" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "newsletter_subscriptions" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "contact_messages" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "users" CASCADE;');
    logger.info('Existing tables dropped.');
    
    // Now import models (Sequelize is initialized, so getSequelize() will work)
    logger.info('Creating tables...');
    const BlogPost = require('../src/backend/models/BlogPost');
    const NewsletterSubscription = require('../src/backend/models/NewsletterSubscription');
    const ContactMessage = require('../src/backend/models/ContactMessage');
    const User = require('../src/backend/models/User');
    const PostgresEventStore = require('../src/backend/infrastructure/PostgresEventStore');
    
    // Create event store table first
    logger.info('Creating event store table...');
    const eventStore = new PostgresEventStore(postgresUri);
    await eventStore.connect();
    logger.info('Event store table created');
    await eventStore.disconnect();
    
    // Create read model tables
    try {
      // Force recreate to ensure correct schema with underscored column names
      logger.info('Syncing BlogPost model...');
      await BlogPost.sync({ force: true });
      logger.info('BlogPost table created');
      
      // Wait a moment for table creation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify columns were created correctly (check for snake_case)
      logger.info('Verifying table structure...');
      const [allColumns] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        ORDER BY column_name;
      `);
      const columnNames = allColumns.map(c => c.column_name);
      logger.info(`BlogPost table has ${columnNames.length} columns`);
      
      // Check for IAM/Security columns
      const iamSecurityCols = columnNames.filter(name => 
        name.includes('iam') || name.includes('security')
      );
      logger.info('IAM/Security columns found:', iamSecurityCols.length > 0 ? iamSecurityCols.join(', ') : 'none found');
      
      if (!columnNames.includes('is_iam_related')) {
        logger.warn('⚠️  Column is_iam_related not found! Adding it manually...');
        // Add the missing column manually
        await sequelize.query(`
          ALTER TABLE blog_posts 
          ADD COLUMN IF NOT EXISTS is_iam_related BOOLEAN NOT NULL DEFAULT false;
        `);
        logger.info('✅ Column is_iam_related added manually');
        
        // Verify it was added
        const [verifyColumns] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'blog_posts' 
          AND column_name = 'is_iam_related';
        `);
        if (verifyColumns.length === 0) {
          throw new Error('Failed to add is_iam_related column');
        }
      }
      
      // Create indexes manually with correct column names (snake_case)
      logger.info('Creating BlogPost indexes...');
      const indexQueries = [
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_post_id ON blog_posts(post_id);`,
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);`,
        `CREATE INDEX IF NOT EXISTS idx_blog_posts_title ON blog_posts(title);`,
        `CREATE INDEX IF NOT EXISTS idx_blog_posts_author_created ON blog_posts(author_id, created_at DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_blog_posts_tags_gin ON blog_posts USING gin(tags);`,
        `CREATE INDEX IF NOT EXISTS idx_blog_posts_category_status ON blog_posts(category_id, status);`,
        `CREATE INDEX IF NOT EXISTS idx_blog_posts_security_status ON blog_posts(is_security_related, status);`,
        `CREATE INDEX IF NOT EXISTS idx_blog_posts_iam_status ON blog_posts(is_iam_related, status);`,
        `CREATE INDEX IF NOT EXISTS idx_blog_posts_popularity_status ON blog_posts(popularity_score DESC, status);`,
        `CREATE INDEX IF NOT EXISTS idx_blog_posts_view_count_status ON blog_posts(view_count DESC, status);`
      ];
      
      for (const query of indexQueries) {
        try {
          await sequelize.query(query);
        } catch (error) {
          logger.error(`Failed to create index: ${query}`, error.message);
          throw error;
        }
      }
      logger.info('BlogPost indexes created successfully');
    } catch (error) {
      logger.error('Error creating BlogPost table:', error.message);
      throw error;
    }
    
    // Create NewsletterSubscription table
    try {
      logger.info('Syncing NewsletterSubscription model...');
      await NewsletterSubscription.sync({ force: true });
      logger.info('NewsletterSubscription table created');
      
      // Wait a moment for table creation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify columns were created correctly
      const [newsletterColumns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'newsletter_subscriptions' 
        ORDER BY column_name;
      `);
      const newsletterColumnNames = newsletterColumns.map(c => c.column_name);
      logger.info(`NewsletterSubscription table has ${newsletterColumnNames.length} columns`);
      
      // Check for required columns
      const requiredNewsletterCols = ['subscribed_at', 'unsubscribed_at', 'ip_address', 'user_agent'];
      for (const col of requiredNewsletterCols) {
        if (!newsletterColumnNames.includes(col)) {
          logger.warn(`⚠️  Column ${col} not found! Adding it manually...`);
          const alterQueries = {
            'subscribed_at': `ALTER TABLE newsletter_subscriptions ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
            'unsubscribed_at': `ALTER TABLE newsletter_subscriptions ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP;`,
            'ip_address': `ALTER TABLE newsletter_subscriptions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(255);`,
            'user_agent': `ALTER TABLE newsletter_subscriptions ADD COLUMN IF NOT EXISTS user_agent TEXT;`
          };
          await sequelize.query(alterQueries[col]);
          logger.info(`✅ Column ${col} added manually`);
        }
      }
      
      // Create indexes manually with snake_case column names
      logger.info('Creating NewsletterSubscription indexes...');
      const newsletterIndexQueries = [
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);`,
        `CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriptions(status);`,
        `CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON newsletter_subscriptions(subscribed_at DESC);`
      ];
      
      for (const query of newsletterIndexQueries) {
        try {
          await sequelize.query(query);
        } catch (error) {
          logger.error(`Failed to create index: ${query}`, error.message);
          throw error;
        }
      }
      logger.info('NewsletterSubscription indexes created successfully');
    } catch (error) {
      logger.error('Error creating NewsletterSubscription table:', error.message);
      throw error;
    }
    
    // Create ContactMessage table
    try {
      logger.info('Syncing ContactMessage model...');
      await ContactMessage.sync({ force: true });
      logger.info('ContactMessage table created');
      
      // Wait a moment for table creation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify columns were created correctly
      const [contactColumns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'contact_messages' 
        ORDER BY column_name;
      `);
      const contactColumnNames = contactColumns.map(c => c.column_name);
      logger.info(`ContactMessage table has ${contactColumnNames.length} columns`);
      
      // Check for required columns
      const requiredContactCols = ['submitted_at', 'read_at', 'replied_at', 'ip_address', 'user_agent', 'admin_notes'];
      for (const col of requiredContactCols) {
        if (!contactColumnNames.includes(col)) {
          logger.warn(`⚠️  Column ${col} not found! Adding it manually...`);
          const alterQueries = {
            'submitted_at': `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
            'read_at': `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;`,
            'replied_at': `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP;`,
            'ip_address': `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS ip_address VARCHAR(255);`,
            'user_agent': `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS user_agent TEXT;`,
            'admin_notes': `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';`
          };
          await sequelize.query(alterQueries[col]);
          logger.info(`✅ Column ${col} added manually`);
        }
      }
      
      // Create indexes manually with snake_case column names
      logger.info('Creating ContactMessage indexes...');
      const contactIndexQueries = [
        `CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_messages(email);`,
        `CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);`,
        `CREATE INDEX IF NOT EXISTS idx_contact_priority ON contact_messages(priority);`,
        `CREATE INDEX IF NOT EXISTS idx_contact_submitted_at ON contact_messages(submitted_at DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_contact_name ON contact_messages(name);`
      ];
      
      for (const query of contactIndexQueries) {
        try {
          await sequelize.query(query);
        } catch (error) {
          logger.error(`Failed to create index: ${query}`, error.message);
          throw error;
        }
      }
      logger.info('ContactMessage indexes created successfully');
    } catch (error) {
      logger.error('Error creating ContactMessage table:', error.message);
      throw error;
    }
    
    // Create User table
    try {
      logger.info('Syncing User model...');
      await User.sync({ force: true });
      logger.info('User table created');
      
      // Wait a moment for table creation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logger.info('✅ User table created successfully!');
    } catch (error) {
      logger.error('Error creating User table:', error.message);
      throw error;
    }
    
    // Create full-text search index for BlogPost (if not already created)
    try {
      logger.info('Creating full-text search index...');
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_blog_posts_search_text_gin 
        ON blog_posts USING gin(to_tsvector('english', 
          COALESCE(title, '') || ' ' || 
          COALESCE(search_text, '') || ' ' || 
          COALESCE(excerpt, '')
        ));
      `);
      logger.info('Full-text search index created');
    } catch (error) {
      logger.warn('Full-text search index may already exist:', error.message);
    }
    
    logger.info('PostgreSQL setup completed successfully!');
    logger.info('\n📝 Next step: Run "npm run create:admin" to create the admin user.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('Failed to setup PostgreSQL:', error);
    process.exit(1);
  }
}

setupPostgreSQL();

