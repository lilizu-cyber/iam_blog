require('dotenv').config();
const PostgresEventStore = require('../src/backend/infrastructure/PostgresEventStore');
const ReadModelStore = require('../src/backend/infrastructure/ReadModelStore');
const { initializeSequelize } = require('../src/backend/models/index');

async function diagnose() {
  try {
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    console.log('🔍 Diagnosing AI-generated posts...\n');
    
    // Check event store
    console.log('1. Checking Event Store...');
    const eventStore = new PostgresEventStore(postgresUri);
    await eventStore.connect();
    
    const sequelize = initializeSequelize(postgresUri);
    await sequelize.authenticate();
    
    const [events] = await sequelize.query(`
      SELECT stream_id, event_type, event_number, timestamp, data
      FROM events
      WHERE stream_id LIKE 'blogpost-%'
      ORDER BY timestamp DESC
      LIMIT 20
    `);
    
    console.log(`   Found ${events.length} blog post events\n`);
    
    if (events.length > 0) {
      console.log('   Recent events:');
      events.slice(0, 5).forEach(event => {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const title = data.title ? data.title.substring(0, 50) : 'No title';
        console.log(`     - ${event.event_type}: ${title} (${new Date(event.timestamp).toLocaleString()})`);
      });
    }
    
    await eventStore.disconnect();
    
    // Check read model
    console.log('\n2. Checking Read Model (Database)...');
    const readModelStore = new ReadModelStore(postgresUri);
    await readModelStore.connect();
    
    const allPosts = await readModelStore.find('BlogPost', {}, { 
      sort: { createdAt: -1 },
      limit: 20 
    });
    
    console.log(`   Found ${allPosts.length} posts in read model\n`);
    
    if (allPosts.length > 0) {
      console.log('   Recent posts:');
      allPosts.slice(0, 5).forEach(post => {
        console.log(`     - ${post.title.substring(0, 50)}`);
        console.log(`       Status: ${post.status}, Created: ${new Date(post.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('   ⚠️  No posts found in read model!');
      console.log('   This means projections are not saving posts to the database.');
    }
    
    // Check for mismatch
    console.log('\n3. Analysis...');
    const eventStreams = new Set(events.map(e => e.stream_id));
    const readModelPostIds = new Set(allPosts.map(p => p.postId));
    
    const eventsWithoutReadModel = Array.from(eventStreams).filter(streamId => {
      const postId = streamId.replace('blogpost-', '');
      return !readModelPostIds.has(postId);
    });
    
    if (eventsWithoutReadModel.length > 0) {
      console.log(`   ⚠️  Found ${eventsWithoutReadModel.length} posts in event store but NOT in read model:`);
      eventsWithoutReadModel.forEach(streamId => {
        const postId = streamId.replace('blogpost-', '');
        const streamEvents = events.filter(e => e.stream_id === streamId);
        const createdEvent = streamEvents.find(e => e.event_type === 'BlogPostCreated');
        const data = createdEvent ? (typeof createdEvent.data === 'string' ? JSON.parse(createdEvent.data) : createdEvent.data) : {};
        console.log(`     - ${postId}: ${data.title || 'Unknown title'}`);
        console.log(`       Events: ${streamEvents.map(e => e.event_type).join(', ')}`);
      });
      console.log('\n   💡 This indicates projection errors. Check backend logs for projection errors.');
    } else if (events.length === 0 && allPosts.length === 0) {
      console.log('   ❌ No posts found in either event store or read model!');
      console.log('   This means posts are not being created at all.');
      console.log('   Possible causes:');
      console.log('     - API calls are failing');
      console.log('     - Commands are not being executed');
      console.log('     - Authentication issues');
    } else if (events.length > 0 && allPosts.length === 0) {
      console.log('   ❌ Events exist but no read models!');
      console.log('   This means projections are completely failing.');
    } else {
      console.log('   ✅ Posts are being saved correctly!');
    }
    
    await readModelStore.disconnect();
    await sequelize.close();
    
    console.log('\n✅ Diagnosis complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

diagnose();

