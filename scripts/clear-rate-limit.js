require('dotenv').config();
const redis = require('redis');

async function clearRateLimit() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('⚠️  REDIS_URL not set - rate limiting is using memory store');
    console.log('💡 To clear memory-based rate limits, restart the backend server');
    return;
  }
  
  try {
    const client = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: false
      }
    });
    
    await client.connect();
    console.log('✅ Connected to Redis\n');
    
    // Find all rate limit keys
    const keys = await client.keys('rl:*');
    
    if (keys.length === 0) {
      console.log('✅ No rate limit keys found');
    } else {
      console.log(`📊 Found ${keys.length} rate limit keys`);
      
      // Delete all rate limit keys
      if (keys.length > 0) {
        await client.del(keys);
        console.log('✅ Cleared all rate limit keys');
      }
    }
    
    await client.quit();
    console.log('\n✅ Rate limit cache cleared');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 If Redis is not available, restart the backend server to clear memory-based rate limits');
  }
}

clearRateLimit();



