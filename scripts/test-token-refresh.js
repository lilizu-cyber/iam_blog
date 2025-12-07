#!/usr/bin/env node

/**
 * Token Refresh Testing Script
 * 
 * This script tests the JWT token refresh functionality:
 * 1. Logs in to get a token
 * 2. Decodes and displays token info
 * 3. Tests auto-refresh in /me endpoint
 * 4. Tests manual refresh endpoint
 * 5. Verifies new token expiration
 * 
 * Run with: node scripts/test-token-refresh.js
 */

const jwt = require('jsonwebtoken');
const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Schlurfend.?.123';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Cookie storage
let cookies = '';

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

function logTest(name, passed, details = '') {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`${status} - ${name}`);
  if (details) {
    console.log(`  ${details}`);
  }
  return passed;
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, options, (res) => {
      let responseData = '';
      
      // Extract cookies from response
      const setCookieHeaders = res.headers['set-cookie'];
      if (setCookieHeaders) {
        cookies = setCookieHeaders
          .map(cookie => cookie.split(';')[0])
          .join('; ');
      }

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

function decodeToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return {
      header: decoded.header,
      payload: decoded.payload,
      expiresAt: decoded.payload.exp ? new Date(decoded.payload.exp * 1000) : null,
      expiresIn: decoded.payload.exp ? Math.floor((decoded.payload.exp * 1000 - Date.now()) / 1000) : null,
      issuedAt: decoded.payload.iat ? new Date(decoded.payload.iat * 1000) : null
    };
  } catch (error) {
    return null;
  }
}

function formatTime(seconds) {
  if (!seconds) return 'unknown';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function testTokenRefresh() {
  let passed = 0;
  let failed = 0;

  logSection('JWT Token Refresh Test Suite');

  // Test 1: Login
  logSection('1. Login and Get Token');
  
  try {
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      logTest('Login successful', true, `User: ${loginResponse.data.data.username}`);
      passed++;
    } else {
      logTest('Login successful', false, `Status: ${loginResponse.status}, Message: ${loginResponse.data.message}`);
      failed++;
      log(`${colors.red}Cannot continue without authentication token${colors.reset}`);
      process.exit(1);
    }
  } catch (error) {
    logTest('Login successful', false, `Error: ${error.message}`);
    failed++;
    process.exit(1);
  }

  // Extract token from cookies
  const tokenMatch = cookies.match(/adminToken=([^;]+)/);
  if (!tokenMatch) {
    log(`${colors.red}No token found in cookies${colors.reset}`);
    process.exit(1);
  }

  const initialToken = tokenMatch[1];
  const initialTokenInfo = decodeToken(initialToken);

  logSection('2. Initial Token Information');
  console.log(`${colors.blue}Token Payload:${colors.reset}`);
  console.log(JSON.stringify(initialTokenInfo.payload, null, 2));
  console.log(`\n${colors.blue}Expiration:${colors.reset}`);
  console.log(`  Expires at: ${initialTokenInfo.expiresAt}`);
  console.log(`  Expires in: ${formatTime(initialTokenInfo.expiresIn)}`);
  console.log(`  Issued at: ${initialTokenInfo.issuedAt}`);

  // Test 2: Check Auth Status (should auto-refresh if close to expiring)
  logSection('3. Test Auto-Refresh in /me Endpoint');
  
  try {
    const meResponse = await makeRequest('GET', '/api/auth/me');
    
    if (meResponse.status === 200 && meResponse.data.success) {
      const tokenRefreshed = meResponse.data.tokenRefreshed === true;
      const newTokenMatch = cookies.match(/adminToken=([^;]+)/);
      const newToken = newTokenMatch ? newTokenMatch[1] : initialToken;
      const tokenChanged = newToken !== initialToken;
      
      if (tokenRefreshed || tokenChanged) {
        logTest('Auto-refresh triggered', true, 
          tokenRefreshed 
            ? 'Token refreshed (tokenRefreshed: true)' 
            : 'Token changed (new token issued)'
        );
        passed++;
        
        if (tokenChanged) {
          const newTokenInfo = decodeToken(newToken);
          console.log(`\n${colors.green}New Token Expiration:${colors.reset}`);
          console.log(`  Expires at: ${newTokenInfo.expiresAt}`);
          console.log(`  Expires in: ${formatTime(newTokenInfo.expiresIn)}`);
        }
      } else {
        const timeUntilExpiry = initialTokenInfo.expiresIn;
        const oneDayInSeconds = 24 * 60 * 60;
        
        if (timeUntilExpiry && timeUntilExpiry > oneDayInSeconds) {
          logTest('Auto-refresh not needed', true, 
            `Token expires in ${formatTime(timeUntilExpiry)} (more than 24 hours)`);
          passed++;
        } else {
          logTest('Auto-refresh should have triggered', false, 
            `Token expires in ${formatTime(timeUntilExpiry)} (less than 24 hours)`);
          failed++;
        }
      }
    } else {
      logTest('Auth status check', false, `Status: ${meResponse.status}`);
      failed++;
    }
  } catch (error) {
    logTest('Auth status check', false, `Error: ${error.message}`);
    failed++;
  }

  // Test 3: Manual Token Refresh
  logSection('4. Test Manual Refresh Endpoint');
  
  try {
    const refreshResponse = await makeRequest('POST', '/api/auth/refresh');
    
    if (refreshResponse.status === 200 && refreshResponse.data.success) {
      logTest('Manual refresh successful', true, refreshResponse.data.message);
      passed++;
      
      // Check if token changed
      const newTokenMatch = cookies.match(/adminToken=([^;]+)/);
      const newToken = newTokenMatch ? newTokenMatch[1] : initialToken;
      const tokenChanged = newToken !== initialToken;
      
      if (tokenChanged) {
        const newTokenInfo = decodeToken(newToken);
        console.log(`\n${colors.green}Refreshed Token Information:${colors.reset}`);
        console.log(`  Expires at: ${newTokenInfo.expiresAt}`);
        console.log(`  Expires in: ${formatTime(newTokenInfo.expiresIn)}`);
        console.log(`  Issued at: ${newTokenInfo.issuedAt}`);
        
        // Verify new token has fresh expiration
        const timeUntilExpiry = newTokenInfo.expiresIn;
        const expectedMinExpiry = 6 * 24 * 60 * 60; // At least 6 days (if 7d expiration)
        
        if (timeUntilExpiry && timeUntilExpiry > expectedMinExpiry) {
          logTest('New token has fresh expiration', true, 
            `Token expires in ${formatTime(timeUntilExpiry)}`);
          passed++;
        } else {
          logTest('New token has fresh expiration', false, 
            `Token expires in ${formatTime(timeUntilExpiry)} (expected > 6 days)`);
          failed++;
        }
      } else {
        logTest('Token changed after refresh', false, 'Token did not change');
        failed++;
      }
    } else {
      logTest('Manual refresh successful', false, 
        `Status: ${refreshResponse.status}, Message: ${refreshResponse.data.message}`);
      failed++;
    }
  } catch (error) {
    logTest('Manual refresh', false, `Error: ${error.message}`);
    failed++;
  }

  // Test 4: Verify refreshed token works
  logSection('5. Verify Refreshed Token Works');
  
  try {
    const verifyResponse = await makeRequest('GET', '/api/auth/me');
    
    if (verifyResponse.status === 200 && verifyResponse.data.success && verifyResponse.data.isAuthenticated) {
      logTest('Refreshed token is valid', true, 
        `Authenticated as: ${verifyResponse.data.data.username}`);
      passed++;
    } else {
      logTest('Refreshed token is valid', false, 
        `Status: ${verifyResponse.status}, Authenticated: ${verifyResponse.data.isAuthenticated}`);
      failed++;
    }
  } catch (error) {
    logTest('Token verification', false, `Error: ${error.message}`);
    failed++;
  }

  // Summary
  logSection('Test Summary');
  console.log(`${colors.blue}Total Tests:${colors.reset} ${passed + failed}`);
  console.log(`${colors.green}Passed:${colors.reset} ${passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${failed}`);
  console.log('');

  if (failed === 0) {
    log('All tests passed! Token refresh is working correctly. ✓', 'green');
    console.log('');
    process.exit(0);
  } else {
    log('Some tests failed. Please review the output above.', 'red');
    console.log('');
    process.exit(1);
  }
}

// Run tests
testTokenRefresh().catch(error => {
  console.error(`${colors.red}Test suite error:${colors.reset}`, error);
  process.exit(1);
});

