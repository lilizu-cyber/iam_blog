require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');
const ReadModelStore = require('../src/backend/infrastructure/ReadModelStore');

async function checkPosts() {
  try {
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    console.log('Connecting to database...');
    const readModelStore = new ReadModelStore(postgresUri);
    await readModelStore.connect();
    console.log('✓ Connected to database\n');
    
    // Check all posts
    console.log('Checking all posts in database...');
    const allPosts = await readModelStore.find('BlogPost', {}, { limit: 100 });
    console.log(`Found ${allPosts.length} posts total\n`);
    
    if (allPosts.length === 0) {
      console.log('❌ No posts found in database!');
      console.log('\nPossible issues:');
      console.log('1. Posts were created but projections failed to save them');
      console.log('2. Events were published but projections were not triggered');
      console.log('3. Database connection issue during projection');
      return;
    }
    
    // Show post details
    allPosts.forEach((post, index) => {
      console.log(`\nPost ${index + 1}:`);
      console.log(`  ID: ${post.postId}`);
      console.log(`  Title: ${post.title}`);
      console.log(`  Status: ${post.status}`);
      console.log(`  Published At: ${post.publishedAt || 'Not published'}`);
      console.log(`  Created At: ${post.createdAt}`);
      console.log(`  Category: ${post.categoryId || 'None'}`);
      console.log(`  Security Related: ${post.isSecurityRelated || false}`);
      console.log(`  IAM Related: ${post.isIAMRelated || false}`);
    });
    
    // Check published posts
    const publishedPosts = allPosts.filter(p => p.status === 'published');
    console.log(`\n\nPublished posts: ${publishedPosts.length}`);
    
    // Check draft posts
    const draftPosts = allPosts.filter(p => p.status === 'draft');
    console.log(`Draft posts: ${draftPosts.length}`);
    
    if (draftPosts.length > 0 && publishedPosts.length === 0) {
      console.log('\n⚠️  WARNING: You have draft posts but no published posts!');
      console.log('   This means posts were created but not published, or');
      console.log('   the publish event/projection is not working correctly.');
    }
    
    await readModelStore.disconnect();
    console.log('\n✓ Disconnected from database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkPosts();



