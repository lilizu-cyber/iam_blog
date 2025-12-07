require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');
const { BlogPost } = require('../src/backend/models');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

async function checkIAMPosts() {
  let sequelize;
  try {
    logger.info('Initializing Sequelize...');
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    sequelize = await initializeSequelize(postgresUri);
    logger.info('Sequelize initialized.');

    // Check all posts
    const allPosts = await BlogPost.findAll({
      raw: true,
      order: [['created_at', 'DESC']]
    });

    logger.info(`Found ${allPosts.length} total posts in database.`);

    // Check IAM posts
    const iamPosts = allPosts.filter(post => 
      post.category_id === 'iam' || post.is_iam_related === true
    );

    logger.info(`Found ${iamPosts.length} IAM-related posts.`);

    // Check published IAM posts
    const publishedIAMPosts = iamPosts.filter(post => post.status === 'published');
    logger.info(`Found ${publishedIAMPosts.length} published IAM posts.`);

    // Display details
    console.log('\n=== IAM Posts Details ===');
    iamPosts.forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.title}`);
      console.log(`   Post ID: ${post.post_id}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Category ID: ${post.category_id}`);
      console.log(`   is_iam_related: ${post.is_iam_related}`);
      console.log(`   is_security_related: ${post.is_security_related}`);
      console.log(`   Published At: ${post.published_at || 'Not published'}`);
      console.log(`   Created At: ${post.created_at}`);
    });

    // Check posts that should be IAM but aren't flagged
    const shouldBeIAM = allPosts.filter(post => 
      post.category_id === 'iam' && post.is_iam_related === false
    );

    if (shouldBeIAM.length > 0) {
      logger.warn(`Found ${shouldBeIAM.length} posts with categoryId='iam' but is_iam_related=false:`);
      shouldBeIAM.forEach(post => {
        console.log(`  - ${post.title} (ID: ${post.post_id})`);
      });
    }

    // Check posts that are flagged as IAM but don't have categoryId='iam'
    const flaggedButNotCategorized = allPosts.filter(post => 
      post.is_iam_related === true && post.category_id !== 'iam'
    );

    if (flaggedButNotCategorized.length > 0) {
      logger.info(`Found ${flaggedButNotCategorized.length} posts flagged as IAM but categoryId != 'iam':`);
      flaggedButNotCategorized.forEach(post => {
        console.log(`  - ${post.title} (ID: ${post.post_id}, categoryId: ${post.category_id})`);
      });
    }

    logger.info('\nDiagnostic check completed.');
  } catch (error) {
    logger.error('Diagnostic script failed:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      logger.info('Sequelize connection closed.');
    }
  }
}

checkIAMPosts();



