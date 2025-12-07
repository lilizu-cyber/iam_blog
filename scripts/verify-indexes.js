require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  success: (msg) => console.log(`[✅] ${msg}`),
  fail: (msg) => console.log(`[❌] ${msg}`),
};

// Expected indexes for each table
const expectedIndexes = {
  blog_posts: [
    { name: 'blog_posts_slug_unique', columns: ['slug'], unique: true },
    { name: 'blog_posts_author_id_idx', columns: ['author_id'] },
    { name: 'blog_posts_status_idx', columns: ['status'] },
    { name: 'blog_posts_published_at_idx', columns: ['published_at'] },
    { name: 'blog_posts_is_security_related_idx', columns: ['is_security_related'] },
    { name: 'blog_posts_is_iam_related_idx', columns: ['is_iam_related'] },
    { name: 'blog_posts_popularity_score_idx', columns: ['popularity_score'] },
    { name: 'blog_posts_category_id_idx', columns: ['category_id'] },
    { name: 'blog_posts_tags_idx', columns: ['tags'], type: 'GIN' },
    { name: 'blog_posts_search_text_idx', columns: ['search_text'], type: 'GIN' },
    // Composite indexes for common query patterns
    { name: 'idx_blog_posts_status_published', columns: ['status', 'published_at'], composite: true },
    { name: 'idx_blog_posts_security_status_published', columns: ['is_security_related', 'status', 'published_at'], composite: true },
    { name: 'idx_blog_posts_iam_status_published', columns: ['is_iam_related', 'status', 'published_at'], composite: true },
    { name: 'idx_blog_posts_category_status_published', columns: ['category_id', 'status', 'published_at'], composite: true },
    { name: 'idx_blog_posts_status_popularity', columns: ['status', 'popularity_score'], composite: true },
    { name: 'idx_blog_posts_author_status_created', columns: ['author_id', 'status', 'created_at'], composite: true },
  ],
  users: [
    { name: 'users_username_unique', columns: ['username'], unique: true },
    { name: 'users_email_unique', columns: ['email'], unique: true },
  ],
  newsletter_subscriptions: [
    { name: 'newsletter_subscriptions_email_unique', columns: ['email'], unique: true },
    { name: 'newsletter_subscriptions_status_idx', columns: ['status'] },
    { name: 'newsletter_subscriptions_subscribed_at_idx', columns: ['subscribed_at'] },
  ],
  contact_messages: [
    { name: 'contact_messages_email_idx', columns: ['email'] },
    { name: 'contact_messages_status_idx', columns: ['status'] },
    { name: 'contact_messages_priority_idx', columns: ['priority'] },
    { name: 'contact_messages_submitted_at_idx', columns: ['submitted_at'] },
  ],
  events: [
    { name: 'events_stream_id_event_number_unique', columns: ['stream_id', 'event_number'], unique: true },
    { name: 'events_stream_id_idx', columns: ['stream_id'] },
    { name: 'events_event_type_idx', columns: ['event_type'] },
    { name: 'events_timestamp_idx', columns: ['timestamp'] },
  ],
};

async function verifyIndexes() {
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
  
  const sequelize = initializeSequelize(postgresUri);

  try {
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL');

    let allPassed = true;
    const results = {};

    for (const [tableName, indexes] of Object.entries(expectedIndexes)) {
      logger.info(`\nVerifying indexes for table: ${tableName}`);
      results[tableName] = { found: [], missing: [] };

      // Get existing indexes for this table
      const [existingIndexes] = await sequelize.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = '${tableName}'
        ORDER BY indexname;
      `);

      const existingIndexNames = new Set(existingIndexes.map(idx => idx.indexname.toLowerCase()));

      // Check each expected index
      for (const expectedIndex of indexes) {
        const indexName = expectedIndex.name.toLowerCase();
        const exists = existingIndexNames.has(indexName);

        if (exists) {
          logger.success(`  ✓ ${expectedIndex.name}`);
          results[tableName].found.push(expectedIndex);
        } else {
          logger.fail(`  ✗ ${expectedIndex.name} - MISSING`);
          results[tableName].missing.push(expectedIndex);
          allPassed = false;
        }
      }

      // Show any unexpected indexes
      const expectedNames = new Set(indexes.map(idx => idx.name.toLowerCase()));
      const unexpected = existingIndexes.filter(
        idx => !expectedNames.has(idx.indexname.toLowerCase())
      );

      if (unexpected.length > 0) {
        logger.info(`  Additional indexes found (${unexpected.length}):`);
        unexpected.forEach(idx => {
          logger.info(`    - ${idx.indexname}`);
        });
      }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('INDEX VERIFICATION SUMMARY');
    logger.info('='.repeat(60));

    let totalFound = 0;
    let totalMissing = 0;

    for (const [tableName, result] of Object.entries(results)) {
      const foundCount = result.found.length;
      const missingCount = result.missing.length;
      totalFound += foundCount;
      totalMissing += missingCount;

      logger.info(`\n${tableName}:`);
      logger.info(`  Found: ${foundCount}/${expectedIndexes[tableName].length}`);
      if (missingCount > 0) {
        logger.warn(`  Missing: ${missingCount}`);
        result.missing.forEach(idx => {
          logger.warn(`    - ${idx.name}`);
        });
      }
    }

    logger.info('\n' + '='.repeat(60));
    logger.info(`Total: ${totalFound} found, ${totalMissing} missing`);
    
    if (allPassed) {
      logger.success('\n✅ All indexes verified successfully!');
    } else {
      logger.warn('\n⚠️  Some indexes are missing. Run: npm run indexes:create');
    }

    return { allPassed, results };
  } catch (error) {
    logger.error('Failed to verify indexes:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  verifyIndexes()
    .then(({ allPassed }) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Index verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyIndexes, expectedIndexes };

