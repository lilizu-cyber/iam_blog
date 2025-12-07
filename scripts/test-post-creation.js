require('dotenv').config();
const PostgresEventStore = require('../src/backend/infrastructure/PostgresEventStore');
const ReadModelStore = require('../src/backend/infrastructure/ReadModelStore');
const { EventBus } = require('../src/backend/infrastructure/EventBus');
const { CommandBus } = require('../src/backend/infrastructure/CommandBus');
const BlogPostCommandHandlers = require('../src/backend/application/commandHandlers/BlogPostCommandHandlers');
const BlogPostProjection = require('../src/backend/readModels/projections/BlogPostProjection');
const logger = require('../src/backend/utils/logger');

async function testPostCreation() {
  let eventStore, readModelStore;
  
  try {
    const postgresUri = process.env.POSTGRESQL_URI || 'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    console.log('1. Connecting to databases...');
    eventStore = new PostgresEventStore(postgresUri);
    await eventStore.connect();
    console.log('   ✓ Event store connected');
    
    readModelStore = new ReadModelStore(postgresUri);
    await readModelStore.connect();
    console.log('   ✓ Read model store connected\n');
    
    console.log('2. Setting up event bus and projections...');
    const eventBus = new EventBus();
    const commandBus = new CommandBus();
    const commandHandlers = new BlogPostCommandHandlers(eventStore, eventBus);
    const projection = new BlogPostProjection(readModelStore);
    
    // Register projection
    eventBus.registerProjection('BlogPostProjection', [
      'BlogPostCreated',
      'BlogPostPublished'
    ], async (event) => {
      try {
        console.log(`   📥 Projection received event: ${event.type}`);
        if (event.type === 'BlogPostCreated') {
          await projection.onBlogPostCreated(event);
          console.log('   ✓ BlogPostCreated projection executed');
        } else if (event.type === 'BlogPostPublished') {
          await projection.onBlogPostPublished(event);
          console.log('   ✓ BlogPostPublished projection executed');
        }
      } catch (error) {
        console.error(`   ❌ Projection error: ${error.message}`);
        console.error(error.stack);
        throw error;
      }
    });
    
    // Register command handler
    commandBus.registerHandler('CreateBlogPost', 
      commandHandlers.handleCreateBlogPost.bind(commandHandlers));
    commandBus.registerHandler('PublishBlogPost', 
      commandHandlers.handlePublishBlogPost.bind(commandHandlers));
    
    console.log('   ✓ Event bus and projections set up\n');
    
    console.log('3. Creating test post...');
    const command = {
      type: 'CreateBlogPost',
      data: {
        title: 'Test Post - ' + new Date().toISOString(),
        content: 'This is a test post to verify projections are working.',
        excerpt: 'Test excerpt',
        authorId: 'test-author-001',
        authorName: 'Test Author',
        authorEmail: 'test@example.com',
        categoryId: 'security',
        tags: ['test', 'debugging']
      },
      metadata: {
        userId: 'test-user',
        timestamp: new Date().toISOString()
      }
    };
    
    const createResult = await commandBus.execute(command);
    console.log(`   ✓ Post created: ${createResult.postId}\n`);
    
    console.log('4. Checking if post was saved to read model...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit for projection
    
    const post = await readModelStore.findOne('BlogPost', { postId: createResult.postId });
    if (post) {
      console.log(`   ✓ Post found in read model!`);
      console.log(`     Title: ${post.title}`);
      console.log(`     Status: ${post.status}`);
    } else {
      console.log('   ❌ Post NOT found in read model!');
      console.log('   This means the projection did not save the post.');
      return;
    }
    
    console.log('\n5. Publishing post...');
    const publishCommand = {
      type: 'PublishBlogPost',
      data: {
        postId: createResult.postId,
        authorId: 'test-author-001'
      },
      metadata: {
        userId: 'test-user',
        timestamp: new Date().toISOString()
      }
    };
    
    await commandBus.execute(publishCommand);
    console.log('   ✓ Publish command executed\n');
    
    console.log('6. Checking if post status was updated...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit for projection
    
    const updatedPost = await readModelStore.findOne('BlogPost', { postId: createResult.postId });
    if (updatedPost && updatedPost.status === 'published') {
      console.log(`   ✓ Post is now published!`);
      console.log(`     Published At: ${updatedPost.publishedAt}`);
    } else {
      console.log(`   ❌ Post status is still: ${updatedPost?.status || 'unknown'}`);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (eventStore) await eventStore.disconnect();
    if (readModelStore) await readModelStore.disconnect();
  }
}

testPostCreation();

