require('dotenv').config();
const ReadModelStore = require('../src/backend/infrastructure/ReadModelStore');
const BlogPostProjection = require('../src/backend/readModels/projections/BlogPostProjection');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

async function verifyAndFixIAMPosts() {
  let readModelStore;
  try {
    logger.info('Initializing ReadModelStore...');
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    readModelStore = new ReadModelStore(postgresUri);
    await readModelStore.connect();
    logger.info('ReadModelStore connected.');

    const projection = new BlogPostProjection(readModelStore);

    // Step 1: Find all posts with categoryId='iam'
    logger.info('Step 1: Finding posts with categoryId="iam"...');
    const iamCategoryPosts = await readModelStore.find('BlogPost', {
      categoryId: 'iam'
    }, {
      limit: 1000
    });

    logger.info(`Found ${iamCategoryPosts.length} posts with categoryId='iam'.`);

    if (iamCategoryPosts.length === 0) {
      logger.warn('No posts found with categoryId="iam". Posts may not have been created yet.');
      logger.info('You may need to run: node scripts/create-iam-posts-simple.js');
      return;
    }

    // Step 2: Check status and flags
    logger.info('\nStep 2: Checking post status and flags...');
    const publishedIAM = iamCategoryPosts.filter(p => p.status === 'published');
    const draftIAM = iamCategoryPosts.filter(p => p.status === 'draft');
    const withCorrectFlag = iamCategoryPosts.filter(p => p.isIAMRelated === true);
    const withWrongFlag = iamCategoryPosts.filter(p => p.isIAMRelated === false);

    logger.info(`  Published: ${publishedIAM.length}`);
    logger.info(`  Draft: ${draftIAM.length}`);
    logger.info(`  With isIAMRelated=true: ${withCorrectFlag.length}`);
    logger.info(`  With isIAMRelated=false: ${withWrongFlag.length}`);

    // Step 3: Display details
    console.log('\n=== Post Details ===');
    iamCategoryPosts.forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.title}`);
      console.log(`   Post ID: ${post.postId}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Category ID: ${post.categoryId}`);
      console.log(`   isIAMRelated: ${post.isIAMRelated}`);
      console.log(`   isSecurityRelated: ${post.isSecurityRelated}`);
      console.log(`   Published At: ${post.publishedAt || 'Not published'}`);
    });

    // Step 4: Fix flags for all IAM posts
    logger.info('\nStep 3: Fixing flags for all IAM posts...');
    let fixedCount = 0;
    for (const post of iamCategoryPosts) {
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
        logger.info(`Fixing flags for: ${post.title}`);
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

    logger.info(`\nFixed ${fixedCount} posts with incorrect flags.`);

    // Step 5: Verify query works
    logger.info('\nStep 4: Testing IAM posts query...');
    const iamQueryResult = await readModelStore.find('BlogPost', {
      isIAMRelated: true,
      status: 'published'
    }, {
      limit: 10,
      sort: { publishedAt: -1 }
    });

    logger.info(`Query for published IAM posts returned: ${iamQueryResult.length} posts`);
    if (iamQueryResult.length > 0) {
      logger.info('Posts that should be visible:');
      iamQueryResult.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title} (published: ${post.publishedAt})`);
      });
    } else {
      logger.warn('No published IAM posts found! This means they won\'t appear on the website.');
      logger.warn('Make sure the posts are published by running the create script or publishing them manually.');
    }

    logger.info('\nVerification and fix completed successfully.');
  } catch (error) {
    logger.error('Script failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (readModelStore && readModelStore.isConnected) {
      await readModelStore.disconnect();
      logger.info('ReadModelStore disconnected.');
    }
  }
}

verifyAndFixIAMPosts();







