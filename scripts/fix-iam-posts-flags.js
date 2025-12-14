require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');
const { BlogPost } = require('../src/backend/models');
const ReadModelStore = require('../src/backend/infrastructure/ReadModelStore');
const BlogPostProjection = require('../src/backend/readModels/projections/BlogPostProjection');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

async function fixIAMPostsFlags() {
  let readModelStore;
  try {
    logger.info('Initializing infrastructure...');
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    readModelStore = new ReadModelStore(postgresUri);
    await readModelStore.connect();
    logger.info('Read Model Store connected.');

    const projection = new BlogPostProjection(readModelStore);

    // Find all posts with categoryId='iam'
    const iamPosts = await readModelStore.find('BlogPost', {
      categoryId: 'iam'
    }, {
      limit: 1000
    });

    logger.info(`Found ${iamPosts.length} posts with categoryId='iam'.`);

    let fixedCount = 0;
    for (const post of iamPosts) {
      // Recalculate flags
      const isIAMRelated = projection.isIAMRelated({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        tags: post.tags,
        categoryId: post.categoryId
      });

      const isSecurityRelated = projection.isSecurityRelated({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        tags: post.tags,
        categoryId: post.categoryId
      });

      // Check if flags need updating
      if (post.isIAMRelated !== isIAMRelated || post.isSecurityRelated !== isSecurityRelated) {
        logger.info(`Fixing flags for post: ${post.title}`);
        logger.info(`  Current: isIAMRelated=${post.isIAMRelated}, isSecurityRelated=${post.isSecurityRelated}`);
        logger.info(`  New: isIAMRelated=${isIAMRelated}, isSecurityRelated=${isSecurityRelated}`);

        await readModelStore.updateOne(
          'BlogPost',
          { postId: post.postId },
          {
            $set: {
              isIAMRelated: isIAMRelated,
              isSecurityRelated: isSecurityRelated
            }
          }
        );

        fixedCount++;
      }
    }

    logger.info(`Fixed ${fixedCount} posts with incorrect flags.`);
    logger.info('Flag fix script completed successfully.');
  } catch (error) {
    logger.error('Flag fix script failed:', error);
    process.exit(1);
  } finally {
    if (readModelStore && readModelStore.isConnected) {
      await readModelStore.disconnect();
      logger.info('Read Model Store disconnected.');
    }
  }
}

fixIAMPostsFlags();







