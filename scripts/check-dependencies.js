require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logger = require('../src/backend/utils/logger');

const MAX_RETRIES = 10;
const RETRY_DELAY = 2000; // 2 seconds

async function checkPostgreSQL(retries = MAX_RETRIES) {
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
  
  const sequelize = new Sequelize(postgresUri, {
    dialect: 'postgres',
    logging: false,
    retry: {
      max: 1
    }
  });

  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ PostgreSQL is ready');
      await sequelize.close();
      return true;
    } catch (error) {
      if (i < retries - 1) {
        console.log(`⏳ Waiting for PostgreSQL... (attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error('❌ PostgreSQL connection failed:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
          console.error('\n💡 PostgreSQL is not running.');
          console.error('   Attempting to auto-start PostgreSQL...');
          
          // Try to auto-start PostgreSQL
          try {
            const { execSync } = require('child_process');
            const autoStartScript = require.resolve('./auto-start-postgres.js');
            execSync(`node "${autoStartScript}"`, { stdio: 'inherit' });
            
            // Wait a bit and retry
            console.log('⏳ Waiting for PostgreSQL to start...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Retry connection
            try {
              await sequelize.authenticate();
              console.log('✅ PostgreSQL is ready (auto-started)');
              await sequelize.close();
              return true;
            } catch (retryError) {
              console.error('❌ Still cannot connect after auto-start attempt');
            }
          } catch (autoStartError) {
            console.error('   Auto-start failed. Please start PostgreSQL manually:');
            console.error('   docker-compose up -d postgresql');
            console.error('   OR');
            console.error('   npm run start:postgres');
          }
        }
        await sequelize.close();
        return false;
      }
    }
  }
  return false;
}

function checkEnvironmentFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'env.example');
  
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env file not found');
    if (fs.existsSync(envExamplePath)) {
      console.warn('   Creating .env from env.example...');
      try {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('   ✅ Created .env file');
        console.warn('   ⚠️  Please update JWT_SECRET in .env before continuing');
        return false; // Need to reload env
      } catch (error) {
        console.error('   ❌ Failed to create .env:', error.message);
        console.error('\n   Please manually copy env.example to .env');
        return false;
      }
    } else {
      console.error('   ❌ env.example file not found');
      return false;
    }
  }
  return true;
}

async function checkEnvironment() {
  // Check if .env file exists
  const envFileExists = checkEnvironmentFile();
  if (!envFileExists) {
    // Reload environment if we just created the file
    delete require.cache[require.resolve('dotenv')];
    require('dotenv').config();
  }
  
  const required = ['JWT_SECRET'];
  const missing = [];
  const needsUpdate = [];
  const invalid = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    } else if (process.env[key].includes('change-this') || 
               process.env[key].includes('your-') ||
               process.env[key] === 'your-super-secret-jwt-key-change-in-production' ||
               process.env[key] === 'your-super-secret-jwt-key-change-this-in-production') {
      needsUpdate.push(key);
    } else if (process.env[key].length < 32) {
      invalid.push({ key, reason: `too short (${process.env[key].length} characters, minimum 32 required)` });
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('\n   Please set these in your .env file:');
    missing.forEach(key => {
      console.error(`   ${key}=your-secret-value-here`);
    });
    console.error('\n   Generate a secure secret with: npm run generate:jwt');
    return false;
  }
  
  if (invalid.length > 0) {
    console.error('❌ Invalid environment variables:');
    invalid.forEach(({ key, reason }) => {
      console.error(`   ${key}: ${reason}`);
    });
    console.error('\n   Generate a secure secret with: npm run generate:jwt');
    return false;
  }
  
  if (needsUpdate.length > 0) {
    console.error('❌ Environment variables using default/example values:', needsUpdate.join(', '));
    console.error('   These MUST be changed for security.');
    console.error('   Generate a secure secret with: npm run generate:jwt');
    return false;
  }
  
  console.log('✅ Environment variables configured');
  return true;
}

async function main() {
  console.log('🔍 Checking dependencies before starting backend...\n');
  
  const envReady = await checkEnvironment();
  const pgReady = await checkPostgreSQL();
  
  console.log('');
  
  if (!envReady) {
    console.error('\n❌ Environment check failed. Please fix the issues above.');
    console.error('   The backend will not start until environment variables are configured.');
    process.exit(1);
  }
  
  if (!pgReady) {
    console.error('❌ Dependencies check failed. Backend will not start.');
    process.exit(1);
  }
  
  console.log('✅ All dependencies ready. Starting backend...\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Dependency check error:', error);
  process.exit(1);
});


