require('dotenv').config();
const { Sequelize } = require('sequelize');

/**
 * Test both username formats for Session Pooler
 */

const PASSWORD = 'Differentialsensor.1634';
const HOST = 'aws-1-eu-west-1.pooler.supabase.com';
const PORT = '5432';
const DATABASE = 'postgres';

// Option 1: Just "postgres" as username
const URI1 = `postgresql://postgres:${PASSWORD}@${HOST}:${PORT}/${DATABASE}`;

// Option 2: "postgres.projectref" as username
const URI2 = `postgresql://postgres.utdayyicddkouzjjqhqu:${PASSWORD}@${HOST}:${PORT}/${DATABASE}`;

async function testConnection(uri, label) {
  console.log(`\n🔍 Testing ${label}...`);
  console.log('Connection string (masked):', uri.replace(/:[^:@]+@/, ':****@'));
  
  const sequelize = new Sequelize(uri, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      connectTimeout: 10000,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    retry: { max: 1 }
  });
  
  try {
    await sequelize.authenticate();
    console.log(`✅ ${label} - Connection successful!`);
    await sequelize.close();
    return true;
  } catch (error) {
    console.log(`❌ ${label} - Failed:`, error.message);
    await sequelize.close();
    return false;
  }
}

async function main() {
  console.log('Testing both Session Pooler username formats...\n');
  
  const result1 = await testConnection(URI1, 'Format 1: postgres');
  const result2 = await testConnection(URI2, 'Format 2: postgres.utdayyicddkouzjjqhqu');
  
  if (result1) {
    console.log('\n✅ Use Format 1: postgresql://postgres:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres');
  } else if (result2) {
    console.log('\n✅ Use Format 2: postgresql://postgres.utdayyicddkouzjjqhqu:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres');
  } else {
    console.log('\n❌ Both formats failed. Please verify:');
    console.log('   1. Password is correct: Differentialsensor.1634');
    console.log('   2. Database is not paused in Supabase');
    console.log('   3. Connection string from Supabase Session Pooler tab');
  }
}

main();

