require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');
const { expectedIndexes } = require('./verify-indexes');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  success: (msg) => console.log(`[✅] ${msg}`),
};

async function createMissingIndexes() {
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
  
  const sequelize = initializeSequelize(postgresUri);

  try {
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL');

    let createdCount = 0;
    let skippedCount = 0;

    for (const [tableName, indexes] of Object.entries(expectedIndexes)) {
      logger.info(`\nProcessing indexes for table: ${tableName}`);

      // Get existing indexes
      const [existingIndexes] = await sequelize.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = '${tableName}';
      `);

      const existingIndexNames = new Set(
        existingIndexes.map(idx => idx.indexname.toLowerCase())
      );

      for (const index of indexes) {
        const indexName = index.name.toLowerCase();
        
        if (existingIndexNames.has(indexName)) {
          logger.info(`  ⏭️  Skipping ${index.name} (already exists)`);
          skippedCount++;
          continue;
        }

        try {
          let createQuery;

          if (index.type === 'GIN') {
            // GIN index (for arrays or full-text search)
            if (index.name === 'blog_posts_tags_idx') {
              createQuery = `
                CREATE INDEX IF NOT EXISTS ${index.name} 
                ON ${tableName} USING GIN (tags);
              `;
            } else if (index.name === 'blog_posts_search_text_idx') {
              createQuery = `
                CREATE INDEX IF NOT EXISTS ${index.name} 
                ON ${tableName} USING GIN (to_tsvector('english', COALESCE(search_text, '')));
              `;
            }
          } else if (index.unique) {
            // Unique index
            createQuery = `
              CREATE UNIQUE INDEX IF NOT EXISTS ${index.name} 
              ON ${tableName} (${index.columns.join(', ')});
            `;
          } else if (index.composite) {
            // Composite index with potential DESC ordering
            const columns = index.columns.map((col, i) => {
              // Add DESC for published_at and popularity_score in composite indexes
              if (col === 'published_at' || col === 'popularity_score') {
                return `${col} DESC`;
              }
              return col;
            });
            createQuery = `
              CREATE INDEX IF NOT EXISTS ${index.name} 
              ON ${tableName} (${columns.join(', ')});
            `;
          } else {
            // Simple index
            createQuery = `
              CREATE INDEX IF NOT EXISTS ${index.name} 
              ON ${tableName} (${index.columns.join(', ')});
            `;
          }

          await sequelize.query(createQuery);
          logger.success(`  ✓ Created ${index.name}`);
          createdCount++;
        } catch (error) {
          logger.error(`  ✗ Failed to create ${index.name}:`, error.message);
        }
      }
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('INDEX CREATION SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`Created: ${createdCount}`);
    logger.info(`Skipped: ${skippedCount}`);
    logger.success('\n✅ Index creation completed!');

    return { createdCount, skippedCount };
  } catch (error) {
    logger.error('Failed to create indexes:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  createMissingIndexes()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Index creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createMissingIndexes };


