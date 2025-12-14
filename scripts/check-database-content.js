require('dotenv').config();
const { Sequelize } = require('sequelize');

/**
 * Check what's in the Supabase database
 */

async function checkDatabase() {
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
  
  if (!postgresUri) {
    console.error('❌ POSTGRESQL_URI not found');
    process.exit(1);
  }
  
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
    console.log('🔍 Checking Supabase database content...\n');
    
    // Check connection
    await sequelize.authenticate();
    console.log('✅ Connected to Supabase\n');
    
    // Check if tables exist
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 Tables found:', tables.length);
    tables.forEach(t => console.log('   -', t.table_name));
    console.log('');
    
    // Check blog_posts table
    const [blogPostsCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM blog_posts;
    `);
    console.log('📝 Blog Posts:', blogPostsCount[0]?.count || 0);
    
    if (blogPostsCount[0]?.count > 0) {
      const [recentPosts] = await sequelize.query(`
        SELECT id, title, "createdAt" 
        FROM blog_posts 
        ORDER BY "createdAt" DESC 
        LIMIT 5;
      `);
      console.log('   Recent posts:');
      recentPosts.forEach(p => {
        console.log(`   - ${p.title} (ID: ${p.id}, Created: ${p.createdAt})`);
      });
    }
    
    // Check newsletter_subscriptions
    const [newsletterCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM newsletter_subscriptions;
    `);
    console.log('\n📧 Newsletter Subscriptions:', newsletterCount[0]?.count || 0);
    
    // Check contact_messages
    const [messagesCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM contact_messages;
    `);
    console.log('💬 Contact Messages:', messagesCount[0]?.count || 0);
    
    // Check users
    const [usersCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users;
    `);
    console.log('👤 Users:', usersCount[0]?.count || 0);
    
    // Check events table (Event Store)
    const [eventsCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM events;
    `);
    console.log('📦 Events (Event Store):', eventsCount[0]?.count || 0);
    
    console.log('\n✅ Database check complete');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('\n💡 Tables do not exist. You need to run migrations:');
      console.error('   npm run migrate:up');
    }
    await sequelize.close();
    process.exit(1);
  }
}

checkDatabase();



