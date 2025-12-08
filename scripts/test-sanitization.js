#!/usr/bin/env node

/**
 * Manual Sanitization Testing Script
 * 
 * This script allows you to manually test the sanitization functions
 * Run with: node scripts/test-sanitization.js
 */

const {
  sanitizeHTML,
  sanitizeText,
  sanitizeSQL,
  sanitizeFilename,
  sanitizeURL,
  sanitizeObject
} = require('../src/backend/utils/sanitizer');

const {
  containsSQLInjection
} = require('../src/backend/utils/sqlInjectionCheck');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function logTest(name, input, expected, actual) {
  const passed = actual === expected || (typeof expected === 'function' ? expected(actual) : false);
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`\n${colors.cyan}Test: ${name}${colors.reset}`);
  console.log(`  Input:    ${colors.yellow}${input}${colors.reset}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${colors.blue}${actual}${colors.reset}`);
  console.log(`  Status:   ${status}`);
  
  return passed;
}

console.log(`${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║   Sanitization Testing Suite          ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

let passed = 0;
let failed = 0;

// Test 1: XSS Prevention (HTML Sanitization)
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.cyan}1. XSS Prevention Tests${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

const xssTests = [
  {
    name: 'Remove script tags',
    input: '<script>alert("XSS")</script><p>Safe</p>',
    expected: (actual) => !actual.includes('<script>') && actual.includes('Safe')
  },
  {
    name: 'Remove event handlers',
    input: '<div onclick="alert(\'XSS\')">Click</div>',
    expected: (actual) => !actual.includes('onclick')
  },
  {
    name: 'Remove javascript: protocol',
    input: '<a href="javascript:alert(\'XSS\')">Link</a>',
    expected: (actual) => !actual.includes('javascript:')
  },
  {
    name: 'Allow safe HTML',
    input: '<p>Paragraph</p><strong>Bold</strong>',
    expected: (actual) => actual.includes('<p>') && actual.includes('<strong>')
  }
];

xssTests.forEach(test => {
  const result = sanitizeHTML(test.input);
  if (logTest(test.name, test.input, test.expected, result)) {
    passed++;
  } else {
    failed++;
  }
});

// Test 2: SQL Injection Detection
console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.cyan}2. SQL Injection Detection Tests${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

const sqlTests = [
  {
    name: 'Detect UNION SELECT',
    input: "' UNION SELECT * FROM users--",
    expected: true
  },
  {
    name: 'Detect boolean injection',
    input: "admin' OR '1'='1",
    expected: true
  },
  {
    name: 'Detect DROP statement',
    input: "'; DROP TABLE users;--",
    expected: true
  },
  {
    name: 'Allow safe input',
    input: 'normal text',
    expected: false
  },
  {
    name: 'Allow email',
    input: 'user@example.com',
    expected: false
  }
];

sqlTests.forEach(test => {
  const result = containsSQLInjection(test.input);
  if (logTest(test.name, test.input, test.expected, result)) {
    passed++;
  } else {
    failed++;
  }
});

// Test 3: Path Traversal Prevention
console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.cyan}3. Path Traversal Prevention Tests${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

const pathTests = [
  {
    name: 'Prevent path traversal',
    input: '../../../etc/passwd',
    expected: (actual) => !actual.includes('..') && !actual.includes('/')
  },
  {
    name: 'Sanitize special characters',
    input: 'file<script>.txt',
    expected: (actual) => !actual.includes('<') && !actual.includes('>')
  },
  {
    name: 'Keep valid filename',
    input: 'my-file_123.pdf',
    expected: (actual) => actual.includes('my-file_123.pdf')
  }
];

pathTests.forEach(test => {
  const result = sanitizeFilename(test.input);
  if (logTest(test.name, test.input, test.expected, result)) {
    passed++;
  } else {
    failed++;
  }
});

// Test 4: URL Sanitization
console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.cyan}4. URL Sanitization Tests${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

const urlTests = [
  {
    name: 'Block javascript: protocol',
    input: 'javascript:alert("XSS")',
    expected: ''
  },
  {
    name: 'Block data: protocol',
    input: 'data:text/html,<script>alert("XSS")</script>',
    expected: ''
  },
  {
    name: 'Allow http URLs',
    input: 'http://example.com',
    expected: (actual) => actual.includes('http://')
  },
  {
    name: 'Allow https URLs',
    input: 'https://example.com',
    expected: (actual) => actual.includes('https://')
  }
];

urlTests.forEach(test => {
  const result = sanitizeURL(test.input);
  if (logTest(test.name, test.input, test.expected, result)) {
    passed++;
  } else {
    failed++;
  }
});

// Test 5: Text Sanitization
console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.cyan}5. Text Sanitization Tests${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

const textTests = [
  {
    name: 'Remove HTML tags',
    input: '<p>Text</p><script>alert("XSS")</script>',
    expected: (actual) => !actual.includes('<') && !actual.includes('>')
  },
  {
    name: 'Limit length',
    input: 'a'.repeat(200),
    expected: (actual) => actual.length === 100
  },
  {
    name: 'Trim whitespace',
    input: '  text  ',
    expected: 'text'
  }
];

textTests.forEach(test => {
  const result = sanitizeText(test.input, test.name.includes('length') ? { maxLength: 100 } : {});
  if (logTest(test.name, test.input, test.expected, result)) {
    passed++;
  } else {
    failed++;
  }
});

// Test 6: Object Sanitization
console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.cyan}6. Object Sanitization Tests${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

const objInput = {
  title: '<script>alert("XSS")</script>',
  content: '<p>Safe</p>',
  nested: {
    value: '<img src=x onerror=alert(1)>'
  }
};

const objResult = sanitizeObject(objInput, { sanitizeHTML: true });
const objTest = {
  name: 'Sanitize nested objects',
  input: JSON.stringify(objInput),
  expected: (actual) => {
    const parsed = typeof actual === 'string' ? JSON.parse(actual) : actual;
    return !parsed.title.includes('<script>') && 
           !parsed.nested.value.includes('onerror');
  }
};

if (logTest(objTest.name, objTest.input, objTest.expected, JSON.stringify(objResult))) {
  passed++;
} else {
  failed++;
}

// Summary
console.log(`\n${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║           Test Summary                  ║${colors.reset}`);
console.log(`${colors.blue}╠════════════════════════════════════════╣${colors.reset}`);
console.log(`${colors.blue}║${colors.reset}  Total:  ${passed + failed}`);
console.log(`${colors.blue}║${colors.reset}  ${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`${colors.blue}║${colors.reset}  ${colors.red}Failed: ${failed}${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

if (failed === 0) {
  console.log(`${colors.green}All tests passed! ✓${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}Some tests failed. Please review the output above.${colors.reset}\n`);
  process.exit(1);
}


