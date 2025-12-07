#!/usr/bin/env node

/**
 * Security Headers Test Script
 * 
 * Tests that security headers are properly configured
 * Run with: node scripts/test-security-headers.js
 */

const http = require('http');

// Configuration
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

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

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Security-Headers-Test/1.0',
      },
    };

    const req = http.request(url, options, (res) => {
      const headers = res.headers;
      resolve({ status: res.statusCode, headers });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Expected security headers
const expectedHeaders = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'x-xss-protection': '1; mode=block',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-dns-prefetch-control': 'off',
  'x-permitted-cross-domain-policies': 'none',
};

// Headers that should be present (but values may vary)
const optionalHeaders = {
  'content-security-policy': true,
  'strict-transport-security': process.env.NODE_ENV === 'production',
};

async function testSecurityHeaders() {
  let passed = 0;
  let failed = 0;

  logSection('Security Headers Test Suite');

  try {
    logSection('1. Testing Security Headers');
    
    const response = await makeRequest('/health');
    
    if (response.status !== 200) {
      logTest('Server is reachable', false, `Status: ${response.status}`);
      failed++;
      log(`${colors.red}Cannot test headers - server not reachable${colors.reset}`);
      process.exit(1);
    }
    
    logTest('Server is reachable', true, `Status: ${response.status}`);
    passed++;

    // Test expected headers
    logSection('2. Checking Required Headers');
    
    for (const [headerName, expectedValue] of Object.entries(expectedHeaders)) {
      const actualValue = response.headers[headerName.toLowerCase()];
      const headerPassed = actualValue && actualValue.toLowerCase() === expectedValue.toLowerCase();
      
      if (headerPassed) {
        logTest(`${headerName}`, true, `Value: ${actualValue}`);
        passed++;
      } else {
        logTest(`${headerName}`, false, 
          actualValue 
            ? `Expected: ${expectedValue}, Got: ${actualValue}` 
            : 'Header not present');
        failed++;
      }
    }

    // Test optional headers
    logSection('3. Checking Optional Headers');
    
    for (const [headerName, shouldBePresent] of Object.entries(optionalHeaders)) {
      const actualValue = response.headers[headerName.toLowerCase()];
      const headerPassed = shouldBePresent ? !!actualValue : true;
      
      if (headerPassed) {
        if (shouldBePresent && actualValue) {
          logTest(`${headerName}`, true, `Present: ${actualValue.substring(0, 100)}...`);
        } else if (!shouldBePresent) {
          logTest(`${headerName}`, true, 'Not required in this environment');
        }
        passed++;
      } else {
        logTest(`${headerName}`, false, 
          shouldBePresent 
            ? 'Header not present (expected in production)' 
            : 'Header present (not expected)');
        failed++;
      }
    }

    // Test that X-Powered-By is removed
    logSection('4. Checking Header Removal');
    
    const poweredBy = response.headers['x-powered-by'];
    if (!poweredBy) {
      logTest('X-Powered-By removed', true, 'Header not present (good)');
      passed++;
    } else {
      logTest('X-Powered-By removed', false, `Header present: ${poweredBy}`);
      failed++;
    }

    // Display CSP if present
    const csp = response.headers['content-security-policy'];
    if (csp) {
      logSection('5. Content Security Policy');
      console.log(`${colors.blue}CSP Directive:${colors.reset}`);
      console.log(`  ${csp}`);
      console.log('');
      console.log(`${colors.yellow}Note:${colors.reset} CSP is environment-specific:`);
      console.log(`  - Development: Allows 'unsafe-inline' and 'unsafe-eval' for Vite HMR`);
      console.log(`  - Production: Strict CSP without unsafe directives`);
    }

  } catch (error) {
    logTest('Connection test', false, `Error: ${error.message}`);
    failed++;
    log(`\n${colors.red}Error:${colors.reset} Could not connect to ${BASE_URL}`);
    log(`Make sure the backend server is running.`);
    process.exit(1);
  }

  // Summary
  logSection('Test Summary');
  console.log(`${colors.blue}Total Tests:${colors.reset} ${passed + failed}`);
  console.log(`${colors.green}Passed:${colors.reset} ${passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${failed}`);
  console.log('');

  if (failed === 0) {
    log('All security headers are properly configured! ✓', 'green');
    console.log('');
    process.exit(0);
  } else {
    log('Some security headers are missing or incorrect. Please review the output above.', 'red');
    console.log('');
    process.exit(1);
  }
}

// Run tests
testSecurityHeaders().catch(error => {
  console.error(`${colors.red}Test suite error:${colors.reset}`, error);
  process.exit(1);
});

