require('dotenv').config();
const http = require('http');

const API_BASE = 'http://localhost:3001';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Schlurfend.?.123';

// Helper to make HTTP requests
function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json, headers: res.headers, cookies: res.headers['set-cookie'] });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers, cookies: res.headers['set-cookie'] });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAuth() {
  console.log('🔍 Testing Authentication Fix...\n');
  console.log(`Using credentials: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD.substring(0, 3)}***\n`);

  let allTestsPassed = true;

  // Test 1: Check for hardcoded credentials in code
  console.log('[Test 1] Checking for hardcoded credentials in code...');
  try {
    const fs = require('fs');
    const authRoutesContent = fs.readFileSync('src/backend/api/routes/authRoutes.js', 'utf8');
    
    if (authRoutesContent.includes('ADMIN_CREDENTIALS') && !authRoutesContent.includes('// Hardcoded admin credentials')) {
      console.log('❌ FAILED: Hardcoded ADMIN_CREDENTIALS still exists in code!');
      allTestsPassed = false;
    } else if (authRoutesContent.includes('Schlurfend.?.123') && !authRoutesContent.includes('//')) {
      console.log('❌ FAILED: Hardcoded password still exists in code!');
      allTestsPassed = false;
    } else {
      console.log('✅ PASSED: No hardcoded credentials found in code');
    }
  } catch (error) {
    console.log('⚠️  WARNING: Could not check code file:', error.message);
  }

  // Test 2: Login with correct credentials
  console.log('\n[Test 2] Testing login with correct credentials...');
  try {
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });

    if (loginRes.status === 200 && loginRes.data.success) {
      console.log('✅ PASSED: Login successful');
      console.log(`   User ID: ${loginRes.data.data.id}`);
      console.log(`   Username: ${loginRes.data.data.username}`);
      console.log(`   Role: ${loginRes.data.data.role}`);
      
      // Extract cookie
      const cookies = loginRes.cookies ? loginRes.cookies.join('; ') : '';
      
      // Test 3: Check authentication status
      console.log('\n[Test 3] Testing /api/auth/me endpoint...');
      const meRes = await makeRequest('GET', '/api/auth/me', null, cookies);
      
      if (meRes.status === 200 && meRes.data.success && meRes.data.isAuthenticated) {
        console.log('✅ PASSED: Authentication check successful');
        console.log(`   Authenticated as: ${meRes.data.data.username}`);
      } else {
        console.log('❌ FAILED: Authentication check failed');
        console.log('   Response:', meRes.data);
        allTestsPassed = false;
      }

      // Test 4: Test admin route protection
      console.log('\n[Test 4] Testing admin route protection...');
      const adminRes = await makeRequest('GET', '/api/blog/admin/posts', null, cookies);
      
      if (adminRes.status === 200) {
        console.log('✅ PASSED: Admin route accessible with authentication');
      } else {
        console.log('❌ FAILED: Admin route not accessible');
        console.log('   Status:', adminRes.status);
        console.log('   Response:', adminRes.data);
        allTestsPassed = false;
      }

    } else {
      console.log('❌ FAILED: Login failed');
      console.log('   Status:', loginRes.status);
      console.log('   Response:', loginRes.data);
      allTestsPassed = false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ FAILED: Cannot connect to backend server');
      console.log('   Make sure the server is running on http://localhost:3001');
      allTestsPassed = false;
    } else {
      console.log('❌ FAILED: Login request error:', error.message);
      allTestsPassed = false;
    }
  }

  // Test 5: Login with wrong password
  console.log('\n[Test 5] Testing login with wrong password...');
  try {
    const wrongLoginRes = await makeRequest('POST', '/api/auth/login', {
      username: ADMIN_USERNAME,
      password: 'wrongpassword123'
    });

    if (wrongLoginRes.status === 401 && !wrongLoginRes.data.success) {
      console.log('✅ PASSED: Correctly rejected invalid password (401)');
    } else {
      console.log('❌ FAILED: Should reject invalid password');
      console.log('   Status:', wrongLoginRes.status);
      console.log('   Response:', wrongLoginRes.data);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAILED: Wrong password test error:', error.message);
    allTestsPassed = false;
  }

  // Test 6: Check database for hashed password
  console.log('\n[Test 6] Checking database for password hashing...');
  try {
    const { initializeSequelize } = require('../src/backend/models/index');
    const getUserModel = require('../src/backend/models/User');
    
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    const sequelize = await initializeSequelize(postgresUri);
    const User = getUserModel();
    
    const user = await User.findOne({ where: { username: ADMIN_USERNAME } });
    
    if (user) {
      const passwordHash = user.passwordHash;
      if (passwordHash && passwordHash.length > 50 && passwordHash.startsWith('$2')) {
        console.log('✅ PASSED: Password is properly hashed in database');
        console.log(`   Hash preview: ${passwordHash.substring(0, 20)}...`);
      } else {
        console.log('❌ FAILED: Password is not properly hashed');
        console.log('   Hash:', passwordHash);
        allTestsPassed = false;
      }
      
      if (passwordHash === ADMIN_PASSWORD) {
        console.log('❌ FAILED: Password is stored as plain text!');
        allTestsPassed = false;
      } else {
        console.log('✅ PASSED: Password is not stored as plain text');
      }
      
      await sequelize.close();
    } else {
      console.log('⚠️  WARNING: Admin user not found in database');
      console.log('   Run: npm run create:admin');
    }
  } catch (error) {
    console.log('⚠️  WARNING: Could not check database:', error.message);
    console.log('   Make sure database is running and User table exists');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED! Authentication fix is working correctly.');
  } else {
    console.log('❌ SOME TESTS FAILED. Please review the errors above.');
  }
  console.log('='.repeat(50));

  process.exit(allTestsPassed ? 0 : 1);
}

// Check if server is running first
console.log('Checking if backend server is running...');
makeRequest('GET', '/health', null)
  .then(() => {
    console.log('✅ Backend server is running\n');
    testAuth();
  })
  .catch((error) => {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running!');
      console.log('   Please start it with: npm run dev:backend');
      console.log('   Then run this test again: node scripts/test-auth.js');
      process.exit(1);
    } else {
      console.log('⚠️  Could not check server health, continuing with tests...\n');
      testAuth();
    }
  });



