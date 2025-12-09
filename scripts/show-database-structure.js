require('dotenv').config();
const { initializeSequelize } = require('../src/backend/models/index');

async function showDatabaseStructure() {
  try {
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    console.log('📊 Database Structure for Blog Posts\n');
    console.log('=' .repeat(60));
    
    const sequelize = initializeSequelize(postgresUri);
    await sequelize.authenticate();
    console.log('✓ Connected to PostgreSQL\n');
    
    // 1. Show blog_posts table structure
    console.log('1. BLOG_POSTS TABLE (Read Model - Where posts are stored)\n');
    console.log('   This is the main table where all blog post data is stored.');
    console.log('   It\'s updated by projections when events occur.\n');
    
    const [blogPostsColumns] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'blog_posts'
      ORDER BY ordinal_position
    `);
    
    console.log('   Columns:');
    blogPostsColumns.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`     - ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`);
    });
    
    // Show indexes
    const [blogPostsIndexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'blog_posts'
      ORDER BY indexname
    `);
    
    if (blogPostsIndexes.length > 0) {
      console.log('\n   Indexes:');
      blogPostsIndexes.forEach(idx => {
        console.log(`     - ${idx.indexname}`);
      });
    }
    
    // Show sample data
    const [blogPosts] = await sequelize.query(`
      SELECT 
        post_id,
        title,
        status,
        category_id,
        author_id,
        author_name,
        created_at,
        published_at,
        view_count
      FROM blog_posts
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`\n   Sample Data (${blogPosts.length} posts):`);
    if (blogPosts.length > 0) {
      blogPosts.forEach((post, i) => {
        console.log(`\n   Post ${i + 1}:`);
        console.log(`     ID: ${post.post_id}`);
        console.log(`     Title: ${post.title?.substring(0, 50) || 'No title'}...`);
        console.log(`     Status: ${post.status}`);
        console.log(`     Category: ${post.category_id || 'None'}`);
        console.log(`     Author: ${post.author_name || post.author_id}`);
        console.log(`     Created: ${post.created_at ? new Date(post.created_at).toLocaleString() : 'N/A'}`);
        console.log(`     Published: ${post.published_at ? new Date(post.published_at).toLocaleString() : 'Not published'}`);
        console.log(`     Views: ${post.view_count || 0}`);
      });
    } else {
      console.log('     No posts found in database');
    }
    
    // 2. Show events table structure
    console.log('\n\n2. EVENTS TABLE (Event Store - Command history)\n');
    console.log('   This table stores all events (commands) that happened.');
    console.log('   It\'s the source of truth for what happened, when.\n');
    
    const [eventsColumns] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);
    
    console.log('   Columns:');
    eventsColumns.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`     - ${col.column_name}: ${col.data_type}${length} ${nullable}`);
    });
    
    // Show sample events
    const [events] = await sequelize.query(`
      SELECT 
        stream_id,
        event_type,
        event_number,
        timestamp,
        data->>'postId' as post_id,
        data->>'title' as title
      FROM events
      WHERE stream_id LIKE 'blogpost-%'
      ORDER BY timestamp DESC
      LIMIT 10
    `);
    
    console.log(`\n   Sample Events (${events.length} events):`);
    if (events.length > 0) {
      events.forEach((event, i) => {
        console.log(`\n   Event ${i + 1}:`);
        console.log(`     Stream: ${event.stream_id}`);
        console.log(`     Type: ${event.event_type}`);
        console.log(`     Number: ${event.event_number}`);
        console.log(`     Post ID: ${event.post_id || 'N/A'}`);
        console.log(`     Title: ${event.title?.substring(0, 40) || 'N/A'}...`);
        console.log(`     Time: ${new Date(event.timestamp).toLocaleString()}`);
      });
    } else {
      console.log('     No events found');
    }
    
    // 3. Show relationship
    console.log('\n\n3. HOW THEY RELATE\n');
    console.log('   ┌─────────────────────────────────────────────────┐');
    console.log('   │  COMMAND (API Request)                          │');
    console.log('   └──────────────┬────────────────────────────────┘');
    console.log('                  │');
    console.log('                  ▼');
    console.log('   ┌─────────────────────────────────────────────────┐');
    console.log('   │  EVENT STORE (events table)                     │');
    console.log('   │  - Stores: BlogPostCreated, BlogPostPublished  │');
    console.log('   │  - Immutable history of all changes            │');
    console.log('   └──────────────┬────────────────────────────────┘');
    console.log('                  │');
    console.log('                  │ Projection listens to events');
    console.log('                  ▼');
    console.log('   ┌─────────────────────────────────────────────────┐');
    console.log('   │  READ MODEL (blog_posts table)                 │');
    console.log('   │  - Current state of all posts                  │');
    console.log('   │  - Optimized for queries                       │');
    console.log('   │  - Updated by projections                      │');
    console.log('   └─────────────────────────────────────────────────┘');
    
    // 4. Show SQL queries to access data
    console.log('\n\n4. SQL QUERIES TO ACCESS DATA\n');
    console.log('   Get all published posts:');
    console.log('   SELECT * FROM blog_posts WHERE status = \'published\' ORDER BY published_at DESC;');
    console.log('\n   Get all posts (including drafts):');
    console.log('   SELECT * FROM blog_posts ORDER BY created_at DESC;');
    console.log('\n   Get events for a specific post:');
    console.log('   SELECT * FROM events WHERE stream_id = \'blogpost-<POST_ID>\' ORDER BY event_number;');
    console.log('\n   Get all blog post events:');
    console.log('   SELECT * FROM events WHERE stream_id LIKE \'blogpost-%\' ORDER BY timestamp DESC;');
    
    await sequelize.close();
    console.log('\n\n✅ Done!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

showDatabaseStructure();



