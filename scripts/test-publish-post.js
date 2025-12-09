require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testPublish() {
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
  
  const sequelize = new Sequelize(postgresUri, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    // Get a draft post
    const [posts] = await sequelize.query(`
      SELECT post_id, title, status 
      FROM blog_posts 
      WHERE status = 'draft' 
      ORDER BY created_at DESC 
      LIMIT 1;
    `);
    
    if (posts.length === 0) {
      console.log('⚠️  No draft posts found to publish');
      return;
    }
    
    const post = posts[0];
    console.log(`📝 Found draft post: ${post.title}`);
    console.log(`   ID: ${post.post_id}`);
    console.log(`   Current Status: ${post.status}\n`);
    
    // Try to update status directly
    console.log('🔄 Attempting to publish post...');
    const [updated] = await sequelize.query(`
      UPDATE blog_posts 
      SET status = 'published', 
          published_at = NOW(),
          updated_at = NOW()
      WHERE post_id = :postId
      RETURNING post_id, title, status, published_at;
    `, {
      replacements: { postId: post.post_id },
      type: Sequelize.QueryTypes.UPDATE
    });
    
    if (updated && updated.length > 0) {
      console.log('✅ Post published successfully!');
      console.log(`   New Status: ${updated[0].status}`);
      console.log(`   Published At: ${updated[0].published_at}\n`);
    } else {
      console.log('❌ Failed to update post');
    }
    
    // Verify the update
    const [verify] = await sequelize.query(`
      SELECT post_id, title, status, published_at 
      FROM blog_posts 
      WHERE post_id = :postId;
    `, {
      replacements: { postId: post.post_id }
    });
    
    if (verify.length > 0) {
      console.log('📊 Verification:');
      console.log(`   Status: ${verify[0].status}`);
      console.log(`   Published At: ${verify[0].published_at || 'NULL'}`);
    }
    
    // Check published count
    const [counts] = await sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM blog_posts 
      GROUP BY status;
    `);
    
    console.log('\n📊 Posts by Status:');
    counts.forEach(c => {
      console.log(`   ${c.status}: ${c.count}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

testPublish();

