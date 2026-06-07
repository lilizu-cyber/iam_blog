const BlogPostProjection = require('../../../src/backend/readModels/projections/BlogPostProjection');
const { mockReadModelStore } = require('../../helpers/mocks');

describe('BlogPostProjection', () => {
  let projection;
  let readModelStore;

  beforeEach(() => {
    readModelStore = { ...mockReadModelStore };
    projection = new BlogPostProjection(readModelStore);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('onBlogPostCreated', () => {
    it('should create a read model when BlogPostCreated event is received', async () => {
      const event = {
        eventType: 'BlogPostCreated',
        data: {
          postId: 'post-123',
          title: 'Test Post',
          content: 'Test content',
          excerpt: 'Test excerpt',
          slug: 'test-post',
          authorId: 'user-123',
          authorName: 'Test User',
          authorEmail: 'test@example.com',
          categoryId: 'iam',
          tags: ['test', 'iam'],
          createdAt: new Date().toISOString()
        }
      };

      readModelStore.create.mockResolvedValue({ id: 'post-123' });

      await projection.onBlogPostCreated(event);

      expect(readModelStore.create).toHaveBeenCalledWith(
        'BlogPost',
        expect.objectContaining({
          postId: 'post-123',
          title: 'Test Post',
          status: 'draft',
          authorName: 'Test User',
          authorEmail: 'test@example.com'
        })
      );
    });

    it('should set default author info if not provided', async () => {
      const event = {
        eventType: 'BlogPostCreated',
        data: {
          postId: 'post-123',
          title: 'Test Post',
          content: 'Test content',
          createdAt: new Date().toISOString()
        }
      };

      await projection.onBlogPostCreated(event);

      expect(readModelStore.create).toHaveBeenCalledWith(
        'BlogPost',
        expect.objectContaining({
          authorName: 'Ilirijana Zuka',
          authorEmail: 'admin@example.com'
        })
      );
    });

    it('should calculate word count and reading time', async () => {
      const event = {
        eventType: 'BlogPostCreated',
        data: {
          postId: 'post-123',
          title: 'Test Post',
          content: 'This is a test content with multiple words. '.repeat(50), // ~300 words
          createdAt: new Date().toISOString()
        }
      };

      await projection.onBlogPostCreated(event);

      const createCall = readModelStore.create.mock.calls[0];
      expect(createCall[1]).toHaveProperty('wordCount');
      expect(createCall[1]).toHaveProperty('readingTime');
      expect(createCall[1].wordCount).toBeGreaterThan(0);
    });

    it('should set security and IAM flags correctly', async () => {
      const event = {
        eventType: 'BlogPostCreated',
        data: {
          postId: 'post-123',
          title: 'IAM Best Practices',
          content: 'Identity and Access Management content',
          categoryId: 'iam',
          createdAt: new Date().toISOString()
        }
      };

      await projection.onBlogPostCreated(event);

      const createCall = readModelStore.create.mock.calls[0];
      expect(createCall[1].isIAMRelated).toBe(true);
    });
  });

  describe('onBlogPostUpdated', () => {
    it('should update read model when BlogPostUpdated event is received', async () => {
      const event = {
        eventType: 'BlogPostUpdated',
        data: {
          postId: 'post-123',
          updates: {
            title: 'Updated Title',
            content: 'Updated content'
          }
        }
      };

      readModelStore.findOne.mockResolvedValue({ postId: 'post-123', version: 1 });
      readModelStore.updateById.mockResolvedValue({ id: 'post-123' });

      await projection.onBlogPostUpdated(event);

      expect(readModelStore.updateById).toHaveBeenCalledWith(
        'BlogPost',
        'post-123',
        expect.objectContaining({
          $set: expect.objectContaining({
            title: 'Updated Title',
            content: 'Updated content'
          }),
          $inc: { version: 1 }
        })
      );
    });
  });

  describe('onBlogPostPublished', () => {
    it('should update status to published', async () => {
      const event = {
        eventType: 'BlogPostPublished',
        data: {
          postId: 'post-123',
          publishedAt: new Date().toISOString()
        }
      };

      readModelStore.findOne.mockResolvedValue({ 
        postId: 'post-123', 
        title: 'Test Post',
        content: 'Test content',
        excerpt: 'Test excerpt',
        tags: [],
        categoryId: null
      });

      await projection.onBlogPostPublished(event);

      expect(readModelStore.updateById).toHaveBeenCalledWith(
        'BlogPost',
        'post-123',
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'published'
          }),
          $inc: { version: 1 }
        })
      );
    });
  });

  describe('onBlogPostDeleted', () => {
    it('should mark post as deleted', async () => {
      const event = {
        eventType: 'BlogPostDeleted',
        data: {
          postId: 'post-123'
        }
      };

      await projection.onBlogPostDeleted(event);

      expect(readModelStore.updateById).toHaveBeenCalledWith(
        'BlogPost',
        'post-123',
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'deleted'
          }),
          $inc: { version: 1 }
        })
      );
    });
  });
});


