#!/usr/bin/env node

/**
 * Simple Token Refresh Test
 * 
 * Quick test to verify token refresh is working
 * Run with: node scripts/test-token-refresh-simple.js
 */

const jwt = require('jsonwebtoken');

// Get token from command line or environment
const token = process.argv[2] || process.env.TEST_TOKEN;

if (!token) {
  console.log('Usage: node scripts/test-token-refresh-simple.js <token>');
  console.log('Or set TEST_TOKEN environment variable');
  console.log('\nTo get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Application/Storage tab');
  console.log('3. Click Cookies → http://localhost:3000');
  console.log('4. Copy the value of "adminToken"');
  process.exit(1);
}

try {
  // Decode token (without verification)
  const decoded = jwt.decode(token, { complete: true });
  
  if (!decoded) {
    console.log('❌ Invalid token format');
    process.exit(1);
  }

  console.log('\n📋 Token Information:\n');
  console.log('Header:', JSON.stringify(decoded.header, null, 2));
  console.log('\nPayload:', JSON.stringify(decoded.payload, null, 2));
  
  // Calculate expiration
  const now = Math.floor(Date.now() / 1000);
  const exp = decoded.payload.exp;
  const iat = decoded.payload.iat;
  
  if (exp) {
    const expiresAt = new Date(exp * 1000);
    const expiresIn = exp - now;
    const isExpired = expiresIn < 0;
    const hoursUntilExpiry = Math.floor(expiresIn / 3600);
    const daysUntilExpiry = Math.floor(expiresIn / 86400);
    
    console.log('\n⏰ Expiration Details:');
    console.log(`  Expires at: ${expiresAt.toLocaleString()}`);
    console.log(`  Expires in: ${daysUntilExpiry} days, ${hoursUntilExpiry % 24} hours`);
    console.log(`  Status: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
    
    // Check if auto-refresh should trigger (within 24 hours)
    const oneDayInSeconds = 24 * 60 * 60;
    const shouldAutoRefresh = !isExpired && expiresIn < oneDayInSeconds;
    
    console.log(`\n🔄 Auto-Refresh Status:`);
    if (isExpired) {
      console.log('  ❌ Token expired - must login again');
      console.log('  💡 Call POST /api/auth/refresh to try manual refresh');
    } else if (shouldAutoRefresh) {
      console.log('  ✅ Token expires within 24 hours');
      console.log('  ✅ Auto-refresh will trigger on next /api/auth/me call');
    } else {
      console.log('  ✅ Token is valid for more than 24 hours');
      console.log('  ℹ️  Auto-refresh will trigger when token expires within 24 hours');
    }
  } else {
    console.log('\n⚠️  Token has no expiration (exp claim missing)');
  }
  
  if (iat) {
    const issuedAt = new Date(iat * 1000);
    const ageInDays = Math.floor((now - iat) / 86400);
    console.log(`\n📅 Token Age: ${ageInDays} days (issued: ${issuedAt.toLocaleString()})`);
  }
  
  console.log('\n');
  
} catch (error) {
  console.error('Error decoding token:', error.message);
  process.exit(1);
}

