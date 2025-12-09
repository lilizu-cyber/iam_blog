require('dotenv').config();
const { Sequelize } = require('sequelize');

/**
 * Test if we can write to the database
 */

async function testWrite() {
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
  
  const sequelize = new Sequelize(postgresUri, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Supabase\n');
    
    // Test write to blog_posts table
    console.log('🧪 Testing write operation...');
    
    const [result] = await sequelize.query(`
      INSERT INTO blog_posts (
        "postId", title, content, excerpt, slug, 
        "authorId", "authorName", "authorEmail", 
        status, "createdAt", "updatedAt"
      ) VALUES (
        'test-' || gen_random_uuid()::text,
        'Test Post',
        'This is a test post to verify database writes work.',
        'Test excerpt',
        'test-post-' || gen_random_uuid()::text,
        'test-author',
        'Test Author',
        'test@example.com',
        'draft',
        NOW(),
        NOW()
      )
      RETURNING "postId", title, "createdAt";
    `);
    
    if (result && result.length > 0) {
      console.log('✅ Write test successful!');
      console.log('   Created post:', result[0].title);
      console.log('   Post ID:', result[0].postId);
      
      // Clean up test post
      await sequelize.query(`
        DELETE FROM blog_posts WHERE "postId" = $1;
      `, {
        bind: [result[0].postId]
      });
      console.log('   ✅ Test post cleaned up\n');
      
      console.log('✅ Database is ready to store new posts!');
    } else {
      console.log('⚠️  Write test completed but no result returned');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Write test failed:', error.message);
    if (error.message.includes('permission denied')) {
      console.error('\n💡 Database user might not have write permissions');
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('\n💡 Table structure might be different. Check migrations.');
    }
    await sequelize.close();
    process.exit(1);
  }
}

testWrite();
