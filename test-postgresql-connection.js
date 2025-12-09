require('dotenv').config();
const { Sequelize } = require('sequelize');

const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/iam_blog_db';

console.log('Testing PostgreSQL connection...');
console.log('Connection string:', postgresUri.replace(/:[^:@]+@/, ':****@'));

const sequelize = new Sequelize(postgresUri, {
  dialect: 'postgres',
  logging: false
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ Successfully connected to PostgreSQL!');
    sequelize.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to connect to PostgreSQL:');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      console.error('\n💡 PostgreSQL is not running or not accessible.');
      console.error('   Options:');
      console.error('   1. Start PostgreSQL with Docker: docker-compose up -d postgresql');
      console.error('   2. Or install PostgreSQL locally and start the service');
      console.error('   3. Or use a cloud PostgreSQL service (Supabase, Neon, etc.)');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Authentication failed. Check your username and password.');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('\n💡 Database does not exist. Create it first or run: npm run setup:db');
    }
    
    process.exit(1);
  });





