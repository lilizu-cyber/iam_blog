const BlogPostQueryHandlers = require('../../../src/backend/application/queryHandlers/BlogPostQueryHandlers');
const { mockReadModelStore } = require('../../helpers/mocks');

describe('BlogPostQueryHandlers', () => {
  let handlers;
  let readModelStore;

  beforeEach(() => {
    readModelStore = { ...mockReadModelStore };
    handlers = new BlogPostQueryHandlers(readModelStore);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('handleGetBlogPostById', () => {
    it('should return a blog post by ID', async () => {
      const mockPost = {
        postId: 'post-123',
        title: 'Test Post',
        content: 'Test content',
        status: 'published'
      };

      readModelStore.findOne.mockResolvedValue(mockPost);

      const query = {
        type: 'GetBlogPostById',
        parameters: {
          postId: 'post-123'
        }
      };

      const result = await handlers.handleGetBlogPostById(query);

      expect(result).toHaveProperty('id', 'post-123');
      expect(result).toHaveProperty('title', 'Test Post');
      expect(readModelStore.findOne).toHaveBeenCalledWith('BlogPost', {
        postId: 'post-123',
        status: { $ne: 'deleted' }
      });
    });

    it('should return null if post not found', async () => {
      readModelStore.findOne.mockResolvedValue(null);

      const query = {
        type: 'GetBlogPostById',
        parameters: {
          postId: 'non-existent'
        }
      };

      const result = await handlers.handleGetBlogPostById(query);

      expect(result).toBeNull();
    });
  });

  describe('handleGetBlogPostBySlug', () => {
    it('should return a blog post by slug', async () => {
      const mockPost = {
        postId: 'post-123',
        slug: 'test-post',
        title: 'Test Post',
        status: 'published'
      };

      readModelStore.findOne.mockResolvedValue(mockPost);

      const query = {
        type: 'GetBlogPostBySlug',
        parameters: {
          slug: 'test-post'
        }
      };

      const result = await handlers.handleGetBlogPostBySlug(query);

      expect(result).toHaveProperty('id', 'post-123');
      expect(result).toHaveProperty('slug', 'test-post');
      expect(readModelStore.findOne).toHaveBeenCalledWith('BlogPost', {
        slug: 'test-post',
        status: 'published'
      });
    });
  });

  describe('handleGetPublishedBlogPosts', () => {
    it('should return paginated published posts', async () => {
      const mockPosts = [
        {
          postId: 'post-1',
          title: 'Post 1',
          status: 'published'
        },
        {
          postId: 'post-2',
          title: 'Post 2',
          status: 'published'
        }
      ];

      readModelStore.find.mockResolvedValue(mockPosts);
      readModelStore.count.mockResolvedValue(10);

      const query = {
        type: 'GetPublishedBlogPosts',
        parameters: {
          page: 1,
          limit: 10,
          sortBy: 'publishedAt',
          sortOrder: 'desc'
        }
      };

      const result = await handlers.handleGetPublishedBlogPosts(query);

      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('pagination');
      expect(result.posts).toHaveLength(2);
      expect(result.pagination.total).toBe(10);
      expect(readModelStore.find).toHaveBeenCalledWith(
        'BlogPost',
        { status: 'published' },
        expect.objectContaining({
          limit: 10,
          skip: 0
        })
      );
    });

    it('should handle pagination correctly', async () => {
      readModelStore.find.mockResolvedValue([]);
      readModelStore.count.mockResolvedValue(25);

      const query = {
        type: 'GetPublishedBlogPosts',
        parameters: {
          page: 2,
          limit: 10
        }
      };

      const result = await handlers.handleGetPublishedBlogPosts(query);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pages).toBe(3); // 25 / 10 = 3 pages
      expect(readModelStore.find).toHaveBeenCalledWith(
        'BlogPost',
        { status: 'published' },
        expect.objectContaining({
          skip: 10 // (page 2 - 1) * 10
        })
      );
    });
  });

  describe('handleGetBlogPostsByAuthor', () => {
    it('should return posts by author', async () => {
      const mockPosts = [
        {
          postId: 'post-1',
          authorId: 'user-123',
          title: 'Post 1'
        }
      ];

      readModelStore.find.mockResolvedValue(mockPosts);
      readModelStore.count.mockResolvedValue(1);

      const query = {
        type: 'GetBlogPostsByAuthor',
        parameters: {
          authorId: 'user-123',
          page: 1,
          limit: 10
        }
      };

      const result = await handlers.handleGetBlogPostsByAuthor(query);

      expect(result.posts).toHaveLength(1);
      expect(readModelStore.find).toHaveBeenCalledWith(
        'BlogPost',
        { authorId: 'user-123', status: { $ne: 'deleted' } },
        expect.any(Object)
      );
    });
  });
});

