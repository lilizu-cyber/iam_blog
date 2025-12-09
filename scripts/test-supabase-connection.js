require('dotenv').config();
const { Sequelize } = require('sequelize');

/**
 * Test Supabase connection
 * This script helps diagnose connection issues
 */

function urlEncodePassword(connectionString) {
  // Extract password from connection string
  const match = connectionString.match(/postgresql:\/\/[^:]+:([^@]+)@/);
  if (!match) {
    return connectionString; // Return as-is if can't parse
  }
  
  const password = match[1];
  const encodedPassword = encodeURIComponent(password);
  
  // Replace password with encoded version
  return connectionString.replace(/:[^@]+@/, `:${encodedPassword}@`);
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  let postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
  
  if (!postgresUri) {
    console.error('❌ POSTGRESQL_URI or DATABASE_URL not found in .env file');
    process.exit(1);
  }
  
  // Check if password needs encoding
  const hasSpecialChars = /[*$#@!%^&()+=\[\]{}|\\:;"'<>?,]/.test(postgresUri);
  
  if (hasSpecialChars) {
    console.log('⚠️  Password contains special characters - encoding...');
    postgresUri = urlEncodePassword(postgresUri);
    console.log('✅ Password encoded\n');
  }
  
  // Mask password for display
  const maskedUri = postgresUri.replace(/:[^:@]+@/, ':****@');
  console.log('Connection string:', maskedUri);
  console.log('Host:', postgresUri.match(/@([^:]+):/)?.[1] || 'unknown');
  console.log('Port:', postgresUri.match(/:(\d+)\//)?.[1] || '5432');
  console.log('Database:', postgresUri.match(/\/([^?]+)/)?.[1] || 'unknown');
  console.log('');
  
  const sequelize = new Sequelize(postgresUri, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      connectTimeout: 15000, // 15 seconds
      ssl: {
        require: true,
        rejectUnauthorized: false // Supabase uses SSL
      }
    },
    retry: {
      max: 2
    }
  });
  
  try {
    console.log('⏳ Attempting to connect...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT version()');
    console.log('✅ Database query successful');
    console.log('PostgreSQL version:', results[0]?.version || 'unknown');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code || 'N/A');
    
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    
    // Provide helpful error messages
    if (error.message.includes('getaddrinfo ENOENT')) {
      console.error('\n💡 DNS resolution failed. Possible issues:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify the hostname is correct');
      console.error('   3. Try pinging the hostname: ping db.utdayyicddkouzjjqhqu.supabase.co');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Authentication failed. Possible issues:');
      console.error('   1. Password might need URL encoding (special characters)');
      console.error('   2. Verify password is correct in Supabase dashboard');
      console.error('   3. Try resetting the password in Supabase');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Connection timeout. Possible issues:');
      console.error('   1. Firewall blocking connection');
      console.error('   2. Network connectivity issues');
      console.error('   3. Supabase database might be paused (free tier)');
    } else if (error.message.includes('SSL')) {
      console.error('\n💡 SSL connection issue. The script should handle this automatically.');
    }
    
    await sequelize.close();
    process.exit(1);
  }
}

testConnection();

