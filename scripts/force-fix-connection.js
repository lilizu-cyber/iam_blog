require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Force fix the connection string by properly encoding the password
 */

// Your connection string components
const HOST = 'db.utdayyicddkouzjjqhqu.supabase.co';
const PORT = '5432';
const DATABASE = 'postgres';
const USERNAME = 'postgres';
const PASSWORD = 'aN*9LQh7kZGj8$Y'; // Your actual password

// URL-encode the password
const ENCODED_PASSWORD = encodeURIComponent(PASSWORD);

// Build the correct connection string
const CORRECT_URI = `postgresql://${USERNAME}:${ENCODED_PASSWORD}@${HOST}:${PORT}/${DATABASE}`;

console.log('🔧 Fixing connection string...\n');
console.log('Original password:', PASSWORD);
console.log('Encoded password:', ENCODED_PASSWORD);
console.log('\nCorrect connection string (masked):', CORRECT_URI.replace(/:[^:@]+@/, ':****@'));

// Validate it can be parsed
try {
  const url = new URL(CORRECT_URI);
  console.log('✅ Connection string format is valid!');
  console.log('   Host:', url.hostname);
  console.log('   Port:', url.port);
  console.log('   Database:', url.pathname.slice(1));
} catch (error) {
  console.error('❌ Still invalid:', error.message);
  process.exit(1);
}

// Update .env file
const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf-8');

// Backup
const backupPath = envPath + '.backup.' + Date.now();
fs.writeFileSync(backupPath, envContent);
console.log(`\n💾 Backup saved to: ${backupPath}`);

// Replace POSTGRESQL_URI line
const lines = envContent.split('\n');
let found = false;
const newLines = lines.map(line => {
  if (line.trim().startsWith('POSTGRESQL_URI=')) {
    found = true;
    return `POSTGRESQL_URI=${CORRECT_URI}`;
  }
  if (line.trim().startsWith('DATABASE_URL=') && !found) {
    found = true;
    return `DATABASE_URL=${CORRECT_URI}`;
  }
  return line;
});

// If not found, add it
if (!found) {
  newLines.push(`POSTGRESQL_URI=${CORRECT_URI}`);
  console.log('⚠️  POSTGRESQL_URI not found, adding it...');
}

// Write updated file
fs.writeFileSync(envPath, newLines.join('\n'));
console.log('✅ .env file updated!\n');

// Verify
delete require.cache[require.resolve('dotenv')];
require('dotenv').config();

const verifyUri = process.env.POSTGRESQL_URI;
if (verifyUri === CORRECT_URI) {
  console.log('✅ Verification successful!');
  console.log('\n📝 Next steps:');
  console.log('   1. Test connection: node scripts/test-supabase-connection.js');
  console.log('   2. Check dependencies: npm run check:deps');
} else {
  console.error('❌ Verification failed - connection string mismatch');
  console.error('Expected:', CORRECT_URI.replace(/:[^:@]+@/, ':****@'));
  console.error('Got:', verifyUri?.replace(/:[^:@]+@/, ':****@') || 'undefined');
}

