require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Fix PostgreSQL connection string by properly URL-encoding the password
 */

function encodeConnectionString(connectionString) {
  try {
    // Extract components
    const match = connectionString.match(/^(postgresql:\/\/)([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    
    if (!match) {
      console.error('❌ Could not parse connection string format');
      return null;
    }
    
    const protocol = match[1];
    const username = match[2];
    const password = match[3]; // This needs encoding
    const host = match[4];
    const port = match[5];
    const database = match[6];
    
    // URL-encode the password
    const encodedPassword = encodeURIComponent(password);
    
    // Reconstruct the connection string
    const fixed = `${protocol}${username}:${encodedPassword}@${host}:${port}/${database}`;
    
    return fixed;
  } catch (error) {
    console.error('❌ Error encoding connection string:', error.message);
    return null;
  }
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
  const newLines = lines.map((line, index) => {
    // Check for POSTGRESQL_URI or DATABASE_URL
    if (line.trim().startsWith('POSTGRESQL_URI=') || line.trim().startsWith('DATABASE_URL=')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        
        // Check if password needs encoding (contains unencoded special chars)
        // If it already has % encoding, skip
        if (value.includes('://') && !value.match(/:[^:@]*%[0-9A-Fa-f]{2}/)) {
          console.log(`\n📝 Found ${key} with password that may need encoding`);
          console.log(`   Original (masked): ${value.replace(/:[^:@]+@/, ':****@')}`);
          
          const fixed = encodeConnectionString(value);
          if (fixed) {
            console.log(`   Fixed (masked): ${fixed.replace(/:[^:@]+@/, ':****@')}`);
            updated = true;
            return `${key}=${fixed}`;
          }
        } else if (value.match(/:[^:@]*%[0-9A-Fa-f]{2}/)) {
          console.log(`✅ ${key} already has URL-encoded password`);
        }
      }
    }
    return line;
  });
  
  if (updated) {
    // Backup original
    const backupPath = envPath + '.backup';
    fs.writeFileSync(backupPath, envContent);
    console.log(`\n💾 Backup saved to: ${backupPath}`);
    
    // Write updated content
    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('✅ .env file updated with properly encoded connection string\n');
    
    // Validate the new connection string
    console.log('🔍 Validating updated connection string...');
    delete require.cache[require.resolve('dotenv')];
    require('dotenv').config();
    
    const testUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
    try {
      const url = new URL(testUri);
      console.log('✅ Connection string format is now valid!');
      console.log('   Host:', url.hostname);
      console.log('   Database:', url.pathname.slice(1));
    } catch (error) {
      console.error('❌ Still invalid after fix:', error.message);
    }
  } else {
    console.log('\nℹ️  No changes needed');
    console.log('   Connection string appears to be properly formatted');
  }
}

fixEnvFile();



