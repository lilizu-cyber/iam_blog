const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please create it first from env.example');
  process.exit(1);
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace JWT_SECRET line
const jwtSecretRegex = /^JWT_SECRET=.*$/m;
if (jwtSecretRegex.test(envContent)) {
  envContent = envContent.replace(jwtSecretRegex, `JWT_SECRET=${jwtSecret}`);
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Updated JWT_SECRET in .env file');
  console.log('   Your new JWT_SECRET has been generated and saved.');
} else {
  // Add JWT_SECRET if it doesn't exist
  envContent += `\nJWT_SECRET=${jwtSecret}\n`;
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Added JWT_SECRET to .env file');
  console.log('   Your new JWT_SECRET has been generated and saved.');
}

console.log('\n⚠️  Keep your .env file secure and never commit it to version control!');



