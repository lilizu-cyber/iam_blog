const fs = require('fs');
const path = require('path');

/**
 * Update .env with Session Pooler connection string using new password
 */

// New password (no special characters, so no encoding needed)
const NEW_PASSWORD = 'Differentialsensor.1634';

// Session Pooler connection details
const POOLER_HOST = 'aws-1-eu-west-1.pooler.supabase.com';
const POOLER_PORT = '5432';
const DATABASE = 'postgres';
const USERNAME = 'postgres.utdayyicddkouzjjqhqu'; // Session Pooler format

// Build Session Pooler connection string (password doesn't need encoding - no special chars)
const POOLER_CONNECTION_STRING = `postgresql://${USERNAME}:${NEW_PASSWORD}@${POOLER_HOST}:${POOLER_PORT}/${DATABASE}`;

console.log('🔧 Updating .env with Session Pooler connection string...\n');
console.log('Using new password:', NEW_PASSWORD);
console.log('Connection string (masked):', POOLER_CONNECTION_STRING.replace(/:[^:@]+@/, ':****@'));

// Validate format
try {
  const url = new URL(POOLER_CONNECTION_STRING);
  console.log('✅ Connection string format is valid!');
  console.log('   Host:', url.hostname);
  console.log('   Port:', url.port || '5432');
  console.log('   Database:', url.pathname.slice(1));
  console.log('   Username:', url.username);
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

// Replace POSTGRESQL_URI
const lines = envContent.split('\n');
let updated = false;

const newLines = lines.map(line => {
  const trimmed = line.trim();
  
  if (trimmed.startsWith('POSTGRESQL_URI=')) {
    updated = true;
    return `POSTGRESQL_URI=${POOLER_CONNECTION_STRING}`;
  }
  
  if (trimmed.startsWith('DATABASE_URL=') && !updated) {
    updated = true;
    return `DATABASE_URL=${POOLER_CONNECTION_STRING}`;
  }
  
  return line;
});

// If not found, add it
if (!updated) {
  let insertIndex = -1;
  for (let i = 0; i < newLines.length; i++) {
    if (newLines[i].includes('# Database Configuration') || 
        newLines[i].includes('# PostgreSQL')) {
      insertIndex = i + 1;
      break;
    }
  }
  
  if (insertIndex > 0) {
    newLines.splice(insertIndex, 0, `POSTGRESQL_URI=${POOLER_CONNECTION_STRING}`);
  } else {
    newLines.push(`POSTGRESQL_URI=${POOLER_CONNECTION_STRING}`);
  }
  updated = true;
}

// Write updated file
fs.writeFileSync(envPath, newLines.join('\n'));

if (updated) {
  console.log('✅ .env file updated with Session Pooler connection string!\n');
  console.log('📝 Next steps:');
  console.log('   1. Test connection: node scripts/test-supabase-connection.js');
  console.log('   2. Check dependencies: npm run check:deps');
} else {
  console.log('ℹ️  Connection string already correct');
}



