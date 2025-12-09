const fs = require('fs');
const path = require('path');

/**
 * Update .env to use Supabase Session Pooler (IPv4 compatible)
 * 
 * Usage: node scripts/update-to-pooler.js [POOLER_CONNECTION_STRING]
 */

const poolerConnectionString = process.argv[2];

if (!poolerConnectionString) {
  console.error('❌ Please provide the Session Pooler connection string');
  console.error('\nUsage: node scripts/update-to-pooler.js "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"');
  console.error('\nTo get the connection string:');
  console.error('   1. Go to Supabase Dashboard → Settings → Database');
  console.error('   2. Click "Session" tab (not "URI")');
  console.error('   3. Copy the connection string');
  process.exit(1);
}

// Validate format
if (!poolerConnectionString.startsWith('postgresql://')) {
  console.error('❌ Connection string must start with postgresql://');
  process.exit(1);
}

if (!poolerConnectionString.includes('pooler.supabase.com')) {
  console.error('⚠️  Warning: This doesn\'t look like a pooler connection string');
  console.error('   Pooler strings should contain "pooler.supabase.com"');
}

if (!poolerConnectionString.includes(':6543')) {
  console.error('⚠️  Warning: Pooler connection should use port 6543');
}

try {
  const url = new URL(poolerConnectionString);
  console.log('✅ Connection string format is valid!');
  console.log('   Host:', url.hostname);
  console.log('   Port:', url.port || '6543');
  console.log('   Database:', url.pathname.slice(1));
} catch (error) {
  console.error('❌ Invalid connection string format:', error.message);
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
let foundPostgresqlUri = false;

const newLines = lines.map(line => {
  const trimmed = line.trim();
  
  if (trimmed.startsWith('POSTGRESQL_URI=')) {
    foundPostgresqlUri = true;
    updated = true;
    return `POSTGRESQL_URI=${poolerConnectionString}`;
  }
  
  if (trimmed.startsWith('DATABASE_URL=') && !foundPostgresqlUri) {
    foundPostgresqlUri = true;
    updated = true;
    return `DATABASE_URL=${poolerConnectionString}`;
  }
  
  return line;
});

// If not found, add it
if (!foundPostgresqlUri) {
  let insertIndex = -1;
  for (let i = 0; i < newLines.length; i++) {
    if (newLines[i].includes('# Database Configuration')) {
      insertIndex = i + 1;
      break;
    }
  }
  
  if (insertIndex > 0) {
    newLines.splice(insertIndex, 0, `POSTGRESQL_URI=${poolerConnectionString}`);
  } else {
    newLines.push(`POSTGRESQL_URI=${poolerConnectionString}`);
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

