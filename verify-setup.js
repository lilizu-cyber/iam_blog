require('dotenv').config();
const { initializeSequelize } = require('./src/backend/models/index');

async function verify() {
  try {
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    console.log('🔍 Verifying PostgreSQL setup...\n');
    
    const sequelize = initializeSequelize(postgresUri);
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL\n');
    
    // Check tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📊 Tables found:');
    if (tables.length === 0) {
      console.log('  ⚠️  No tables found!');
      console.log('  Run: npm run setup:db');
    } else {
      tables.forEach(t => console.log(`  ✅ ${t.table_name}`));
    }
    
    // Check indexes on blog_posts
    if (tables.some(t => t.table_name === 'blog_posts')) {
      const [indexes] = await sequelize.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'blog_posts'
        ORDER BY indexname;
      `);
      console.log(`\n📑 Indexes on blog_posts: ${indexes.length}`);
      indexes.slice(0, 5).forEach(idx => console.log(`  - ${idx.indexname}`));
      if (indexes.length > 5) console.log(`  ... and ${indexes.length - 5} more`);
    }
    
    await sequelize.close();
    console.log('\n✅ Setup verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:');
    console.error('Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 PostgreSQL is not running. Start it with:');
      console.error('   docker-compose up -d postgresql');
    }
    process.exit(1);
  }
}

verify();



