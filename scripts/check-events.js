require('dotenv').config();
const PostgresEventStore = require('../src/backend/infrastructure/PostgresEventStore');

async function checkEvents() {
  try {
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    console.log('Connecting to event store...');
    const eventStore = new PostgresEventStore(postgresUri);
    await eventStore.connect();
    console.log('✓ Connected to event store\n');
    
    // Get all blog post streams
    console.log('Checking for blog post events...');
    
    // We need to query the events table directly since we don't have a listStreams method
    const { initializeSequelize } = require('../src/backend/models/index');
    const sequelize = initializeSequelize(postgresUri);
    await sequelize.authenticate();
    
    const [events] = await sequelize.query(`
      SELECT stream_id, event_type, event_number, timestamp, data
      FROM events
      WHERE stream_id LIKE 'blogpost-%'
      ORDER BY stream_id, event_number
      LIMIT 50
    `);
    
    console.log(`Found ${events.length} events in event store\n`);
    
    if (events.length === 0) {
      console.log('❌ No blog post events found in event store!');
      console.log('   This means posts were never created, or events were not saved.');
      return;
    }
    
    // Group by stream
    const streams = {};
    events.forEach(event => {
      if (!streams[event.stream_id]) {
        streams[event.stream_id] = [];
      }
      streams[event.stream_id].push(event);
    });
    
    console.log(`Found ${Object.keys(streams).length} blog post streams:\n`);
    
    Object.entries(streams).forEach(([streamId, streamEvents]) => {
      const postId = streamId.replace('blogpost-', '');
      console.log(`Stream: ${streamId}`);
      console.log(`  Post ID: ${postId}`);
      console.log(`  Events: ${streamEvents.length}`);
      streamEvents.forEach(event => {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log(`    - ${event.event_type} (event #${event.event_number})`);
        if (data.title) {
          console.log(`      Title: ${data.title}`);
        }
        if (data.status) {
          console.log(`      Status: ${data.status}`);
        }
      });
      console.log('');
    });
    
    await eventStore.disconnect();
    console.log('✓ Disconnected from event store');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkEvents();

