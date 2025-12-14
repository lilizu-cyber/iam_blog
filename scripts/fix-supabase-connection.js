require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Fix Supabase connection string by URL-encoding the password
 */

function urlEncodePassword(connectionString) {
  // Extract password from connection string
  const match = connectionString.match(/postgresql:\/\/[^:]+:([^@]+)@/);
  if (!match) {
    console.error('❌ Could not parse connection string');
    return null;
  }
  
  const password = match[1];
  const encodedPassword = encodeURIComponent(password);
  
  // Replace password with encoded version
  return connectionString.replace(/:[^@]+@/, `:${encodedPassword}@`);
}

function fixEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }
  
  let envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  let updated = false;
  const newLines = lines.map(line => {
    if (line.startsWith('POSTGRESQL_URI=') || line.startsWith('DATABASE_URL=')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1];
        const value = match[2];
        
        // Check if password needs encoding
        if (/[*$#@!%^&()+=\[\]{}|\\:;"'<>?,]/.test(value)) {
          const encoded = urlEncodePassword(value);
          if (encoded) {
            console.log(`✅ Encoding password in ${key}`);
            updated = true;
            return `${key}=${encoded}`;
          }
        }
      }
    }
    return line;
  });
  
  if (updated) {
    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('✅ .env file updated with URL-encoded password');
    console.log('\n⚠️  IMPORTANT: Verify the connection string in Supabase dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard');
    console.log('   2. Settings → Database');
    console.log('   3. Copy the connection string from "URI" tab');
    console.log('   4. Make sure it matches your .env file\n');
  } else {
    console.log('ℹ️  No changes needed - password appears to be properly encoded');
  }
}

fixEnvFile();



