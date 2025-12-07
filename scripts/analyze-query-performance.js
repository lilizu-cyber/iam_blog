require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

// Common queries to analyze
const commonQueries = [
  {
    name: 'Get Published Posts',
    sql: `
      SELECT * FROM blog_posts 
      WHERE status = 'published' 
      ORDER BY published_at DESC 
      LIMIT 10;
    `,
    description: 'Main blog listing query'
  },
  {
    name: 'Get IAM Posts',
    sql: `
      SELECT * FROM blog_posts 
      WHERE is_iam_related = true 
      AND status = 'published' 
      ORDER BY published_at DESC 
      LIMIT 10;
    `,
    description: 'IAM posts page query'
  },
  {
    name: 'Get Security Posts',
    sql: `
      SELECT * FROM blog_posts 
      WHERE is_security_related = true 
      AND status = 'published' 
      ORDER BY published_at DESC 
      LIMIT 10;
    `,
    description: 'Security posts page query'
  },
  {
    name: 'Get Popular Posts',
    sql: `
      SELECT * FROM blog_posts 
      WHERE status = 'published' 
      ORDER BY popularity_score DESC 
      LIMIT 10;
    `,
    description: 'Popular posts query'
  },
  {
    name: 'Get Posts by Author',
    sql: `
      SELECT * FROM blog_posts 
      WHERE author_id = 'test-author-id' 
      AND status = 'published' 
      ORDER BY created_at DESC 
      LIMIT 10;
    `,
    description: 'Author posts query'
  },
  {
    name: 'Get Posts by Category',
    sql: `
      SELECT * FROM blog_posts 
      WHERE category_id = 'security' 
      AND status = 'published' 
      ORDER BY published_at DESC 
      LIMIT 10;
    `,
    description: 'Category posts query'
  },
  {
    name: 'Search Posts',
    sql: `
      SELECT * FROM blog_posts 
      WHERE status = 'published' 
      AND (
        title ILIKE '%security%' 
        OR content ILIKE '%security%' 
        OR excerpt ILIKE '%security%'
      )
      ORDER BY published_at DESC 
      LIMIT 10;
    `,
    description: 'Search query (text search)'
  },
  {
    name: 'Get Post by Slug',
    sql: `
      SELECT * FROM blog_posts 
      WHERE slug = 'test-slug' 
      AND status = 'published';
    `,
    description: 'Single post by slug query'
  },
];

async function analyzeQueryPerformance() {
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
  
  const sequelize = initializeSequelize(postgresUri);

  try {
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL');
    logger.info('\n' + '='.repeat(60));
    logger.info('QUERY PERFORMANCE ANALYSIS');
    logger.info('='.repeat(60));

    const results = [];

    for (const query of commonQueries) {
      logger.info(`\nAnalyzing: ${query.name}`);
      logger.info(`Description: ${query.description}`);

      try {
        // Use EXPLAIN ANALYZE to get execution plan and timing
        const [explainResults] = await sequelize.query(`
          EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query.sql}
        `);

        const plan = explainResults[0]['QUERY PLAN'][0];
        const executionTime = plan['Execution Time'];
        const planningTime = plan['Planning Time'];
        const totalTime = executionTime + planningTime;

        // Check if index is used
        const planStr = JSON.stringify(plan);
        const usesIndex = planStr.includes('Index Scan') || planStr.includes('Index Only Scan') || 
                          planStr.includes('Bitmap Index Scan');
        const usesSeqScan = planStr.includes('Seq Scan');
        
        // For small tables, PostgreSQL may choose sequential scan even with indexes
        // This is normal and expected behavior
        const tableSize = plan['Plan']?.['Total Cost'] || 0;
        const isSmallTable = tableSize < 100; // Heuristic for small table

        // Get index usage details
        const indexScans = [];
        if (usesIndex) {
          const indexMatches = planStr.match(/"Index Name":\s*"([^"]+)"/g);
          if (indexMatches) {
            indexMatches.forEach(match => {
              const indexName = match.match(/"([^"]+)"/)[1];
              indexScans.push(indexName);
            });
          }
        }

        const result = {
          name: query.name,
          executionTime: executionTime.toFixed(2),
          planningTime: planningTime.toFixed(2),
          totalTime: totalTime.toFixed(2),
          usesIndex,
          usesSeqScan,
          isSmallTable,
          indexScans,
          plan: plan
        };

        results.push(result);

        // Display results
        logger.info(`  Execution Time: ${executionTime.toFixed(2)} ms`);
        logger.info(`  Planning Time: ${planningTime.toFixed(2)} ms`);
        logger.info(`  Total Time: ${totalTime.toFixed(2)} ms`);
        
        if (usesIndex) {
          logger.info(`  ✓ Uses Index: ${indexScans.length > 0 ? indexScans.join(', ') : 'Yes'}`);
        } else if (usesSeqScan && !isSmallTable) {
          logger.warn(`  ⚠️  Uses Sequential Scan (consider adding index)`);
        } else if (usesSeqScan && isSmallTable) {
          logger.info(`  ℹ️  Uses Sequential Scan (normal for small tables - indexes will be used as data grows)`);
        }

        // Performance warning
        if (executionTime > 100) {
          logger.warn(`  ⚠️  Slow query (>100ms)`);
        } else if (executionTime > 50) {
          logger.warn(`  ⚠️  Moderate performance (50-100ms)`);
        } else {
          logger.info(`  ✓ Good performance (<50ms)`);
        }

      } catch (error) {
        logger.error(`  ✗ Failed to analyze: ${error.message}`);
        results.push({
          name: query.name,
          error: error.message
        });
      }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('PERFORMANCE SUMMARY');
    logger.info('='.repeat(60));

    const slowQueries = results.filter(r => r.executionTime && parseFloat(r.executionTime) > 100);
    const noIndexQueries = results.filter(r => r.usesSeqScan && !r.usesIndex && !r.isSmallTable);

    if (slowQueries.length > 0) {
      logger.warn(`\nSlow queries (>100ms): ${slowQueries.length}`);
      slowQueries.forEach(q => {
        logger.warn(`  - ${q.name}: ${q.executionTime}ms`);
      });
    }

    if (noIndexQueries.length > 0) {
      logger.warn(`\nQueries without indexes: ${noIndexQueries.length}`);
      noIndexQueries.forEach(q => {
        logger.warn(`  - ${q.name}`);
      });
      logger.warn('\nConsider adding indexes for these queries');
    }

    if (slowQueries.length === 0 && noIndexQueries.length === 0) {
      logger.info('\n✅ All queries performing well!');
    }

    return results;
  } catch (error) {
    logger.error('Failed to analyze query performance:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  analyzeQueryPerformance()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Query analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { analyzeQueryPerformance, commonQueries };

