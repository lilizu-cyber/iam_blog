const BlogPostAggregate = require('../../domain/aggregates/BlogPostAggregate');
const logger = require('../../utils/logger');
const { CreateBlogPostCommand } = require('../../domain/commands/BlogCommands');

// Lazy load OpenAI service to prevent startup crashes
let openaiService = null;
try {
  openaiService = require('../../services/openaiService');
} catch (error) {
  logger.warn('OpenAI service not available:', error.message);
}

class BlogPostCommandHandlers {
  constructor(eventStore, eventBus) {
    this.eventStore = eventStore;
    this.eventBus = eventBus;
  }

  // Create Blog Post Handler
  async handleCreateBlogPost(command) {
    try {
      logger.info('Handling CreateBlogPost command', { commandId: command.id });

      const aggregate = new BlogPostAggregate();
      const postId = aggregate.create(command.data);

      // Save events to event store
      const streamName = `blogpost-${postId}`;
      const events = aggregate.getUncommittedEvents();
      
      await this.eventStore.appendToStream(streamName, events);
      
      // Publish events to event bus
      for (const event of events) {
        await this.eventBus.publish({
          ...event,
          streamId: streamName
        });
      }

      aggregate.markEventsAsCommitted();

      logger.info('CreateBlogPost command handled successfully', { 
        commandId: command.id,
        postId 
      });

      return { postId, success: true };
    } catch (error) {
      logger.error('Error handling CreateBlogPost command', {
        commandId: command.id,
        error: error.message
      });
      throw error;
    }
  }

  // Update Blog Post Handler
  async handleUpdateBlogPost(command) {
    try {
      logger.info('Handling UpdateBlogPost command', { commandId: command.id });

      const { postId } = command.data;
      const streamName = `blogpost-${postId}`;

      // Load aggregate from events
      const events = await this.eventStore.readStream(streamName);
      if (events.length === 0) {
        throw new Error('Blog post not found');
      }

      // Transform events from event store format to aggregate format
      const transformedEvents = events.map(event => ({
        type: event.eventType, // Event store uses eventType, aggregate expects type
        data: event.data,
        metadata: event.metadata
      }));

      const aggregate = BlogPostAggregate.fromEvents(transformedEvents);
      
      // Extract update fields (exclude postId as it's not needed for update)
      const { postId: _, ...updateData } = command.data;
      aggregate.update(updateData);

      // Save new events
      const newEvents = aggregate.getUncommittedEvents();
      if (newEvents.length > 0) {
        // Use the last event's revision number (eventNumber) as expected revision
        const expectedRevision = events.length > 0 ? events[events.length - 1].revision : -1;
        await this.eventStore.appendToStream(streamName, newEvents, expectedRevision);
        
        // Publish events
        for (const event of newEvents) {
          await this.eventBus.publish({
            ...event,
            streamId: streamName
          });
        }

        aggregate.markEventsAsCommitted();
      }

      logger.info('UpdateBlogPost command handled successfully', { 
        commandId: command.id,
        postId 
      });

      return { postId, success: true };
    } catch (error) {
      logger.error('Error handling UpdateBlogPost command', {
        commandId: command.id,
        error: error.message
      });
      throw error;
    }
  }

  // Publish Blog Post Handler
  async handlePublishBlogPost(command) {
    try {
      logger.info('Handling PublishBlogPost command', { commandId: command.id });

      const { postId, authorId } = command.data;
      const streamName = `blogpost-${postId}`;

      // Load aggregate from events
      const events = await this.eventStore.readStream(streamName);
      if (events.length === 0) {
        throw new Error('Blog post not found');
      }

      // Transform events from event store format to aggregate format
      const transformedEvents = events.map(event => ({
        type: event.eventType, // Event store uses eventType, aggregate expects type
        data: event.data,
        metadata: event.metadata
      }));

      const aggregate = BlogPostAggregate.fromEvents(transformedEvents);
      aggregate.publish(authorId);

      // Save new events
      const newEvents = aggregate.getUncommittedEvents();
      // Use the last event's revision number (eventNumber) as expected revision
      const expectedRevision = events.length > 0 ? events[events.length - 1].revision : -1;
      await this.eventStore.appendToStream(streamName, newEvents, expectedRevision);
      
      // Publish events
      for (const event of newEvents) {
        await this.eventBus.publish({
          ...event,
          streamId: streamName
        });
      }

      aggregate.markEventsAsCommitted();

      logger.info('PublishBlogPost command handled successfully', { 
        commandId: command.id,
        postId 
      });

      return { postId, success: true };
    } catch (error) {
      logger.error('Error handling PublishBlogPost command', {
        commandId: command.id,
        error: error.message
      });
      throw error;
    }
  }

  // Unpublish Blog Post Handler
  async handleUnpublishBlogPost(command) {
    try {
      logger.info('Handling UnpublishBlogPost command', { commandId: command.id });

      const { postId, authorId } = command.data;
      const streamName = `blogpost-${postId}`;

      // Load aggregate from events
      const events = await this.eventStore.readStream(streamName);
      if (events.length === 0) {
        throw new Error('Blog post not found');
      }

      // Transform events from event store format to aggregate format
      const transformedEvents = events.map(event => ({
        type: event.eventType, // Event store uses eventType, aggregate expects type
        data: event.data,
        metadata: event.metadata
      }));

      const aggregate = BlogPostAggregate.fromEvents(transformedEvents);
      aggregate.unpublish(authorId);

      // Save new events
      const newEvents = aggregate.getUncommittedEvents();
      // Use the last event's revision number (eventNumber) as expected revision
      const expectedRevision = events.length > 0 ? events[events.length - 1].revision : -1;
      await this.eventStore.appendToStream(streamName, newEvents, expectedRevision);
      
      // Publish events
      for (const event of newEvents) {
        await this.eventBus.publish({
          ...event,
          streamId: streamName
        });
      }

      aggregate.markEventsAsCommitted();

      logger.info('UnpublishBlogPost command handled successfully', { 
        commandId: command.id,
        postId 
      });

      return { postId, success: true };
    } catch (error) {
      logger.error('Error handling UnpublishBlogPost command', {
        commandId: command.id,
        error: error.message
      });
      throw error;
    }
  }

  // Delete Blog Post Handler
  async handleDeleteBlogPost(command) {
    try {
      logger.info('Handling DeleteBlogPost command', { commandId: command.id });

      const { postId, authorId } = command.data;
      const streamName = `blogpost-${postId}`;

      // Load aggregate from events
      const events = await this.eventStore.readStream(streamName);
      if (events.length === 0) {
        throw new Error('Blog post not found');
      }

      // Transform events from event store format to aggregate format
      const transformedEvents = events.map(event => ({
        type: event.eventType, // Event store uses eventType, aggregate expects type
        data: event.data,
        metadata: event.metadata
      }));

      const aggregate = BlogPostAggregate.fromEvents(transformedEvents);
      aggregate.delete(authorId);

      // Save new events
      const newEvents = aggregate.getUncommittedEvents();
      // Use the last event's revision number (eventNumber) as expected revision
      const expectedRevision = events.length > 0 ? events[events.length - 1].revision : -1;
      await this.eventStore.appendToStream(streamName, newEvents, expectedRevision);
      
      // Publish events
      for (const event of newEvents) {
        await this.eventBus.publish({
          ...event,
          streamId: streamName
        });
      }

      aggregate.markEventsAsCommitted();

      logger.info('DeleteBlogPost command handled successfully', { 
        commandId: command.id,
        postId 
      });

      return { postId, success: true };
    } catch (error) {
      logger.error('Error handling DeleteBlogPost command', {
        commandId: command.id,
        error: error.message
      });
      throw error;
    }
  }

  // Add Tag to Blog Post Handler
  async handleAddTagToBlogPost(command) {
    try {
      logger.info('Handling AddTagToBlogPost command', { commandId: command.id });

      const { postId, tag } = command.data;
      const streamName = `blogpost-${postId}`;

      // Load aggregate from events
      const events = await this.eventStore.readStream(streamName);
      if (events.length === 0) {
        throw new Error('Blog post not found');
      }

      // Transform events from event store format to aggregate format
      const transformedEvents = events.map(event => ({
        type: event.eventType, // Event store uses eventType, aggregate expects type
        data: event.data,
        metadata: event.metadata
      }));

      const aggregate = BlogPostAggregate.fromEvents(transformedEvents);
      aggregate.addTag(tag);

      // Save new events
      const newEvents = aggregate.getUncommittedEvents();
      if (newEvents.length > 0) {
        // Use the last event's revision number (eventNumber) as expected revision
        const expectedRevision = events.length > 0 ? events[events.length - 1].revision : -1;
        await this.eventStore.appendToStream(streamName, newEvents, expectedRevision);
        
        // Publish events
        for (const event of newEvents) {
          await this.eventBus.publish({
            ...event,
            streamId: streamName
          });
        }

        aggregate.markEventsAsCommitted();
      }

      logger.info('AddTagToBlogPost command handled successfully', { 
        commandId: command.id,
        postId,
        tag 
      });

      return { postId, tag, success: true };
    } catch (error) {
      logger.error('Error handling AddTagToBlogPost command', {
        commandId: command.id,
        error: error.message
      });
      throw error;
    }
  }

  // Remove Tag from Blog Post Handler
  async handleRemoveTagFromBlogPost(command) {
    try {
      logger.info('Handling RemoveTagFromBlogPost command', { commandId: command.id });

      const { postId, tag } = command.data;
      const streamName = `blogpost-${postId}`;

      // Load aggregate from events
      const events = await this.eventStore.readStream(streamName);
      if (events.length === 0) {
        throw new Error('Blog post not found');
      }

      // Transform events from event store format to aggregate format
      const transformedEvents = events.map(event => ({
        type: event.eventType, // Event store uses eventType, aggregate expects type
        data: event.data,
        metadata: event.metadata
      }));

      const aggregate = BlogPostAggregate.fromEvents(transformedEvents);
      aggregate.removeTag(tag);

      // Save new events
      const newEvents = aggregate.getUncommittedEvents();
      if (newEvents.length > 0) {
        // Use the last event's revision number (eventNumber) as expected revision
        const expectedRevision = events.length > 0 ? events[events.length - 1].revision : -1;
        await this.eventStore.appendToStream(streamName, newEvents, expectedRevision);
        
        // Publish events
        for (const event of newEvents) {
          await this.eventBus.publish({
            ...event,
            streamId: streamName
          });
        }

        aggregate.markEventsAsCommitted();
      }

      logger.info('RemoveTagFromBlogPost command handled successfully', { 
        commandId: command.id,
        postId,
        tag 
      });

      return { postId, tag, success: true };
    } catch (error) {
      logger.error('Error handling RemoveTagFromBlogPost command', {
        commandId: command.id,
        error: error.message
      });
      throw error;
    }
  }

  // Generate Blog Post Handler (using OpenAI)
  async handleGenerateBlogPost(command) {
    try {
      logger.info('Handling GenerateBlogPost command', { commandId: command.id });

      // Lazy load OpenAI service if not already loaded
      if (!openaiService) {
        try {
          openaiService = require('../../services/openaiService');
        } catch (error) {
          logger.error('Failed to load OpenAI service:', error);
          throw new Error('OpenAI service is not available. Please ensure the openai package is installed.');
        }
      }

      // Check if OpenAI is configured
      if (!openaiService || !openaiService.isConfigured()) {
        throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY in environment variables.');
      }

      const { prompt, categoryId, authorId, authorName, authorEmail } = command.data;

      // Generate blog post using OpenAI
      logger.info('Generating blog post with AI', { prompt: prompt.substring(0, 100) });
      const generatedData = await openaiService.generateBlogPost(prompt, categoryId);

      // Create a blog post using the generated data
      const createCommand = new CreateBlogPostCommand({
        title: generatedData.title,
        content: generatedData.content,
        excerpt: generatedData.excerpt,
        tags: generatedData.tags,
        categoryId: generatedData.categoryId || categoryId || null,
        authorId: authorId,
        authorName: authorName || 'Admin',
        authorEmail: authorEmail || 'admin@example.com',
        seoTitle: generatedData.seoTitle,
        seoDescription: generatedData.seoDescription,
        featuredImage: null // Can be added later
      }, command.metadata);

      // Use the existing create handler to save the post
      const result = await this.handleCreateBlogPost(createCommand);

      logger.info('GenerateBlogPost command handled successfully', { 
        commandId: command.id,
        postId: result.postId,
        title: generatedData.title
      });

      return { 
        postId: result.postId, 
        success: true,
        generatedData: {
          title: generatedData.title,
          excerpt: generatedData.excerpt,
          tags: generatedData.tags
        }
      };
    } catch (error) {
      logger.error('Error handling GenerateBlogPost command', {
        commandId: command.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = BlogPostCommandHandlers;
