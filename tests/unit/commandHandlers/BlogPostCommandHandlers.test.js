const BlogPostCommandHandlers = require('../../../src/backend/application/commandHandlers/BlogPostCommandHandlers');
const { mockEventStore, mockEventBus } = require('../../helpers/mocks');

describe('BlogPostCommandHandlers', () => {
  let handlers;
  let eventStore;
  let eventBus;

  beforeEach(() => {
    eventStore = { ...mockEventStore };
    eventBus = { ...mockEventBus };
    handlers = new BlogPostCommandHandlers(eventStore, eventBus);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('handleCreateBlogPost', () => {
    it('should create a blog post successfully', async () => {
      const command = {
        id: 'cmd-123',
        data: {
          title: 'Test Post',
          content: 'Test content',
          excerpt: 'Test excerpt',
          authorId: 'user-123',
          authorName: 'Test User',
          authorEmail: 'test@example.com'
        }
      };

      const result = await handlers.handleCreateBlogPost(command);

      expect(result).toHaveProperty('postId');
      expect(result.success).toBe(true);
      expect(eventStore.appendToStream).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      eventStore.appendToStream.mockRejectedValue(new Error('Database error'));

      const command = {
        id: 'cmd-123',
        data: {
          title: 'Test Post',
          content: 'Test content'
        }
      };

      await expect(handlers.handleCreateBlogPost(command)).rejects.toThrow();
    });

    it('should require title and content', async () => {
      const command = {
        id: 'cmd-123',
        data: {
          title: '', // Empty title
          content: 'Test content'
        }
      };

      // The aggregate should validate and throw
      await expect(handlers.handleCreateBlogPost(command)).rejects.toThrow();
    });
  });

  describe('handleUpdateBlogPost', () => {
    it('should update a blog post successfully', async () => {
      const existingEvents = [
        {
          eventType: 'BlogPostCreated',
          data: {
            postId: 'post-123',
            title: 'Original Title',
            content: 'Original content'
          }
        }
      ];

      eventStore.readStream.mockResolvedValue(existingEvents);

      const command = {
        id: 'cmd-123',
        data: {
          postId: 'post-123',
          title: 'Updated Title'
        }
      };

      const result = await handlers.handleUpdateBlogPost(command);

      expect(result).toHaveProperty('postId', 'post-123');
      expect(eventStore.appendToStream).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should throw error if post not found', async () => {
      eventStore.readStream.mockResolvedValue([]);

      const command = {
        id: 'cmd-123',
        data: {
          postId: 'non-existent',
          title: 'Updated Title'
        }
      };

      await expect(handlers.handleUpdateBlogPost(command)).rejects.toThrow();
    });
  });

  describe('handlePublishBlogPost', () => {
    it('should publish a blog post successfully', async () => {
      const existingEvents = [
        {
          eventType: 'BlogPostCreated',
          data: {
            postId: 'post-123',
            title: 'Test Post',
            content: 'Test content'
          }
        }
      ];

      eventStore.readStream.mockResolvedValue(existingEvents);

      const command = {
        id: 'cmd-123',
        data: {
          postId: 'post-123'
        }
      };

      const result = await handlers.handlePublishBlogPost(command);

      expect(result).toHaveProperty('postId', 'post-123');
      expect(eventStore.appendToStream).toHaveBeenCalled();
    });
  });

  describe('handleDeleteBlogPost', () => {
    it('should delete a blog post successfully', async () => {
      const existingEvents = [
        {
          eventType: 'BlogPostCreated',
          data: {
            postId: 'post-123',
            title: 'Test Post'
          }
        }
      ];

      eventStore.readStream.mockResolvedValue(existingEvents);

      const command = {
        id: 'cmd-123',
        data: {
          postId: 'post-123'
        }
      };

      const result = await handlers.handleDeleteBlogPost(command);

      expect(result).toHaveProperty('postId', 'post-123');
      expect(eventStore.appendToStream).toHaveBeenCalled();
    });
  });
});



