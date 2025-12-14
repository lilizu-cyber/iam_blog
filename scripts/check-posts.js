require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');

async function checkPosts() {
  try {
    const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    const sequelize = initializeSequelize(postgresUri);
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');
    
    // Check all posts
    const [allPosts] = await sequelize.query(`
      SELECT 
        post_id, 
        title, 
        status, 
        category_id, 
        is_iam_related, 
        is_security_related,
        created_at
      FROM blog_posts 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    console.log(`\nTotal posts in database: ${allPosts.length}`);
    console.log('\nPosts:');
    allPosts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`);
      console.log(`   Status: ${post.status}, Category: ${post.category_id}, IAM: ${post.is_iam_related}, Security: ${post.is_security_related}`);
    });
    
    // Check published IAM posts
    const [iamPosts] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM blog_posts 
      WHERE status = 'published' 
      AND is_iam_related = true
    `);
    
    console.log(`\nPublished IAM posts: ${iamPosts[0].count}`);
    
    // Check published posts
    const [publishedPosts] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM blog_posts 
      WHERE status = 'published'
    `);
    
    console.log(`Published posts (all): ${publishedPosts[0].count}`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkPosts();







