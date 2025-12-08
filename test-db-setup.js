require('dotenv').config();
const { initializeSequelize } = require('./src/backend/models/index');

async function test() {
  try {
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    console.log('Connecting to:', postgresUri.replace(/:[^:@]+@/, ':****@'));
    
    const sequelize = initializeSequelize(postgresUri);
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
    
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tables found:');
    tables.forEach(t => console.log('  -', t.table_name));
    
    if (tables.length === 0) {
      console.log('\n⚠️  No tables found. Run: npm run setup:db');
    } else {
      console.log(`\n✅ Found ${tables.length} table(s)`);
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();




