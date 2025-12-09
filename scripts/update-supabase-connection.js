const fs = require('fs');
const path = require('path');

/**
 * Update .env file with correct Supabase connection string
 */

// Your Supabase credentials
const SUPABASE_PASSWORD = 'aN*9LQh7kZGj8$Y';
const SUPABASE_HOST = 'db.utdayyicddkouzjjqhqu.supabase.co';
const SUPABASE_PORT = '5432';
const SUPABASE_DB = 'postgres';
const SUPABASE_USER = 'postgres';

// URL-encode the password (special characters: * becomes %2A, $ becomes %24)
const ENCODED_PASSWORD = encodeURIComponent(SUPABASE_PASSWORD);

// Build correct connection string
const CORRECT_CONNECTION_STRING = `postgresql://${SUPABASE_USER}:${ENCODED_PASSWORD}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}`;

console.log('🔧 Updating .env with Supabase connection string...\n');
console.log('Password encoding:');
console.log('  Original:', SUPABASE_PASSWORD);
console.log('  Encoded:', ENCODED_PASSWORD);
console.log('\nConnection string (masked):', CORRECT_CONNECTION_STRING.replace(/:[^:@]+@/, ':****@'));

// Validate format
try {
  const url = new URL(CORRECT_CONNECTION_STRING);
  console.log('✅ Connection string format is valid!');
} catch (error) {
  console.error('❌ Invalid format:', error.message);
  process.exit(1);
}

// Update .env file
const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf-8');

// Backup
const backupPath = envPath + '.backup.' + Date.now();
fs.writeFileSync(backupPath, envContent);
console.log(`\n💾 Backup saved to: ${backupPath}`);

// Replace or add POSTGRESQL_URI
const lines = envContent.split('\n');
let updated = false;
let foundPostgresqlUri = false;

const newLines = lines.map(line => {
  const trimmed = line.trim();
  
  // Update POSTGRESQL_URI if found
  if (trimmed.startsWith('POSTGRESQL_URI=')) {
    foundPostgresqlUri = true;
    updated = true;
    return `POSTGRESQL_URI=${CORRECT_CONNECTION_STRING}`;
  }
  
  // Also update DATABASE_URL if it exists and POSTGRESQL_URI doesn't
  if (trimmed.startsWith('DATABASE_URL=') && !foundPostgresqlUri) {
    foundPostgresqlUri = true;
    updated = true;
    return `DATABASE_URL=${CORRECT_CONNECTION_STRING}`;
  }
  
  return line;
});

// If POSTGRESQL_URI not found, add it after DATABASE Configuration comment
if (!foundPostgresqlUri) {
  let insertIndex = -1;
  for (let i = 0; i < newLines.length; i++) {
    if (newLines[i].includes('# Database Configuration') || 
        newLines[i].includes('# PostgreSQL')) {
      insertIndex = i + 1;
      break;
    }
  }
  
  if (insertIndex > 0) {
    newLines.splice(insertIndex, 0, `POSTGRESQL_URI=${CORRECT_CONNECTION_STRING}`);
  } else {
    newLines.push(`POSTGRESQL_URI=${CORRECT_CONNECTION_STRING}`);
  }
  updated = true;
}

// Write updated file
fs.writeFileSync(envPath, newLines.join('\n'));

if (updated) {
  console.log('✅ .env file updated with Supabase connection string!\n');
  console.log('📝 Next steps:');
  console.log('   1. Test connection: node scripts/test-supabase-connection.js');
  console.log('   2. Check dependencies: npm run check:deps');
} else {
  console.log('ℹ️  Connection string already correct');
}

