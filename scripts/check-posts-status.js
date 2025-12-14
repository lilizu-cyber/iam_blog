require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkPosts() {
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
    console.log('✅ Connected to Supabase\n');
    
    // Check all posts with their status
    const [posts] = await sequelize.query(`
      SELECT post_id, title, status, created_at, published_at 
      FROM blog_posts 
      ORDER BY created_at DESC;
    `);
    
    console.log(`📝 Total Blog Posts: ${posts.length}\n`);
    
    if (posts.length === 0) {
      console.log('⚠️  No posts found in database');
      return;
    }
    
    // Group by status
    const byStatus = {
      published: posts.filter(p => p.status === 'published'),
      draft: posts.filter(p => p.status === 'draft'),
      archived: posts.filter(p => p.status === 'archived'),
      deleted: posts.filter(p => p.status === 'deleted')
    };
    
    console.log('📊 Posts by Status:');
    console.log(`   Published: ${byStatus.published.length} (visible on frontend)`);
    console.log(`   Draft: ${byStatus.draft.length} (only visible in admin)`);
    console.log(`   Archived: ${byStatus.archived.length}`);
    console.log(`   Deleted: ${byStatus.deleted.length}\n`);
    
    if (byStatus.published.length > 0) {
      console.log('✅ Published Posts (visible on frontend):');
      byStatus.published.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.title}`);
        console.log(`      ID: ${p.post_id}, Published: ${p.published_at || 'N/A'}`);
      });
    }
    
    if (byStatus.draft.length > 0) {
      console.log('\n📝 Draft Posts (not visible on frontend):');
      byStatus.draft.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.title}`);
        console.log(`      ID: ${p.post_id}, Created: ${p.created_at}`);
      });
      console.log('\n💡 To make drafts visible:');
      console.log('   1. Go to admin dashboard');
      console.log('   2. Edit the post');
      console.log('   3. Change status to "published"');
    }
    
    // Check newsletter subscriptions
    const [newsletter] = await sequelize.query('SELECT COUNT(*) as count FROM newsletter_subscriptions;');
    console.log(`\n📧 Newsletter Subscriptions: ${newsletter[0]?.count || 0}`);
    
    // Check contact messages
    const [messages] = await sequelize.query('SELECT COUNT(*) as count FROM contact_messages;');
    console.log(`💬 Contact Messages: ${messages[0]?.count || 0}`);
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkPosts();



