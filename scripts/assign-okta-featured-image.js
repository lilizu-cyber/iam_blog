/**
 * Script to assign Okta featured image to posts that mention "Okta"
 * 
 * Usage: node scripts/assign-okta-featured-image.js
 */

require('dotenv').config();
const { ReadModelStore } = require('../src/backend/infrastructure/ReadModelStore');
const logger = require('../src/backend/utils/logger');

// Okta featured image configuration
const OKTA_FEATURED_IMAGE = {
  url: '/images/okta-featured-image.png', // Update this path after saving the image
  alt: 'Okta Identity and Access Management Platform',
  width: 1200,
  height: 630
};

// Check if post mentions Okta
function mentionsOkta(post) {
  const oktaKeywords = ['okta', 'Okta', 'OKTA'];
  const searchText = `${post.title} ${post.content} ${post.excerpt} ${(post.tags || []).join(' ')}`.toLowerCase();
  return oktaKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
}

async function assignOktaFeaturedImage() {
  try {
    logger.info('Starting Okta featured image assignment...');
    
    // Initialize ReadModelStore
    const readModelStore = new ReadModelStore(process.env.DATABASE_URL);
    await readModelStore.connect();
    
    // Get all published posts
    const posts = await readModelStore.find('BlogPost', { 
      status: 'published' 
    }, {
      sort: { publishedAt: -1 },
      limit: 10000
    });
    
    logger.info(`Found ${posts.length} published posts`);
    
    // Also get draft posts
    const draftPosts = await readModelStore.find('BlogPost', { 
      status: 'draft' 
    }, {
      sort: { createdAt: -1 },
      limit: 10000
    });
    
    logger.info(`Found ${draftPosts.length} draft posts`);
    
    const allPosts = [...posts, ...draftPosts];
    const oktaPosts = allPosts.filter(mentionsOkta);
    
    logger.info(`Found ${oktaPosts.length} posts mentioning Okta`);
    
    // Update each post with Okta featured image
    let updatedCount = 0;
    for (const post of oktaPosts) {
      // Check if post already has a featured image
      if (post.featuredImage && post.featuredImage.url) {
        logger.info(`Post "${post.title}" already has a featured image: ${post.featuredImage.url}`);
        // Optionally, you can skip or overwrite
        // continue; // Skip if you want to keep existing images
      }
      
      // Update the post with Okta featured image
      try {
        await readModelStore.updateById('BlogPost', post.postId, {
          $set: {
            featuredImage: OKTA_FEATURED_IMAGE
          }
        });
        
        updatedCount++;
        logger.info(`✓ Updated post: "${post.title}" (${post.postId})`);
      } catch (error) {
        logger.error(`✗ Failed to update post "${post.title}":`, error.message);
      }
    }
    
    logger.info(`\n✅ Successfully updated ${updatedCount} posts with Okta featured image`);
    logger.info(`\nPosts updated:`);
    oktaPosts.forEach(post => {
      logger.info(`  - ${post.title} (${post.slug})`);
    });
    
    await readModelStore.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error assigning Okta featured image:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  assignOktaFeaturedImage();
}

module.exports = { assignOktaFeaturedImage, mentionsOkta, OKTA_FEATURED_IMAGE };

