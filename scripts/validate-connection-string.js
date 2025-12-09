require('dotenv').config();

/**
 * Validate and fix PostgreSQL connection string
 */

function validateConnectionString(uri) {
  if (!uri) {
    console.error('❌ Connection string is empty');
    return null;
  }
  
  // Check if it's a valid PostgreSQL URI format
  if (!uri.startsWith('postgresql://') && !uri.startsWith('postgres://')) {
    console.error('❌ Connection string must start with postgresql:// or postgres://');
    return null;
  }
  
  try {
    // Try to parse it as a URL
    const url = new URL(uri);
    
    if (!url.hostname) {
      console.error('❌ Connection string missing hostname');
      return null;
    }
    
    if (!url.pathname || url.pathname === '/') {
      console.error('❌ Connection string missing database name');
      return null;
    }
    
    console.log('✅ Connection string format is valid');
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port || '5432 (default)');
    console.log('   Database:', url.pathname.slice(1));
    console.log('   Username:', url.username || 'not set');
    console.log('   Password:', url.password ? '***' + url.password.slice(-2) : 'not set');
    
    return uri;
  } catch (error) {
    console.error('❌ Invalid connection string format:', error.message);
    console.error('   Connection string:', uri.replace(/:[^:@]+@/, ':****@'));
    
    // Try to identify the issue
    if (uri.includes('\n') || uri.includes('\r')) {
      console.error('   ⚠️  Connection string contains line breaks - remove them');
    }
    
    if (uri.includes(' ')) {
      console.error('   ⚠️  Connection string contains spaces - remove them');
    }
    
    if (uri.length > 500) {
      console.error('   ⚠️  Connection string seems too long - check for extra characters');
    }
    
    return null;
  }
}

function main() {
  console.log('🔍 Validating PostgreSQL connection string...\n');
  
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
  
  if (!postgresUri) {
    console.error('❌ POSTGRESQL_URI or DATABASE_URL not found in .env file');
    process.exit(1);
  }
  
  console.log('Connection string (masked):', postgresUri.replace(/:[^:@]+@/, ':****@'));
  console.log('Length:', postgresUri.length, 'characters\n');
  
  const validated = validateConnectionString(postgresUri);
  
  if (!validated) {
    console.error('\n❌ Connection string validation failed');
    console.error('\n💡 Fix your .env file:');
    console.error('   1. Make sure POSTGRESQL_URI is on a single line');
    console.error('   2. No spaces or line breaks');
    console.error('   3. Format: postgresql://user:password@host:port/database');
    console.error('   4. Special characters in password should be URL-encoded');
    process.exit(1);
  }
  
  console.log('\n✅ Connection string is valid!');
  process.exit(0);
}

main();

