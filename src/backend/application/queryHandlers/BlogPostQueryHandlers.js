const logger = require('../../utils/logger');
const site = require('../../config/site');

class BlogPostQueryHandlers {
  constructor(readModelStore) {
    this.readModelStore = readModelStore;
    this.modelName = 'BlogPost';
  }

  // Get blog post by ID
  async handleGetBlogPostById(query) {
    try {
      const { postId } = query.parameters;
      
      const post = await this.readModelStore.findOne(this.modelName, { 
        postId,
        status: { $ne: 'deleted' }
      });

      if (!post) {
        return null;
      }

      // Debug: Log content field to diagnose missing content issue
      logger.debug('Retrieved blog post by ID', { 
        postId,
        hasContent: !!post.content,
        contentLength: post.content ? post.content.length : 0,
        status: post.status
      });
      
      return this.formatBlogPost(post);
    } catch (error) {
      logger.error('Error handling GetBlogPostById query:', error);
      throw error;
    }
  }

  // Get blog post by slug
  async handleGetBlogPostBySlug(query) {
    try {
      const { slug } = query.parameters;
      
      const post = await this.readModelStore.findOne(this.modelName, { 
        slug,
        status: 'published'
      });

      if (!post) {
        return null;
      }

      // Debug: Log content field to diagnose missing content issue
      logger.debug('Retrieved blog post by slug', { 
        slug,
        postId: post.postId,
        hasContent: !!post.content,
        contentLength: post.content ? post.content.length : 0,
        contentPreview: post.content ? post.content.substring(0, 100) : 'NO CONTENT'
      });
      
      // If content is missing, try to retrieve it from the post by ID (without status filter)
      // This handles cases where content might be missing from published posts
      if (!post.content || post.content.trim() === '') {
        logger.warn('Content missing for published post, attempting to retrieve by ID', {
          postId: post.postId,
          slug
        });
        
        const postById = await this.readModelStore.findOne(this.modelName, { 
          postId: post.postId,
          status: { $ne: 'deleted' }
        });
        
        if (postById && postById.content && postById.content.trim() !== '') {
          logger.info('Retrieved missing content from post by ID', {
            postId: post.postId,
            contentLength: postById.content.length
          });
          // Merge the content from the ID query into the slug query result
          post.content = postById.content;
        }
      }
      
      return this.formatBlogPost(post);
    } catch (error) {
      logger.error('Error handling GetBlogPostBySlug query:', error);
      throw error;
    }
  }

  // Get published blog posts with pagination
  async handleGetPublishedBlogPosts(query) {
    const queryTimeout = 20000; // 20 seconds total timeout for the query
    const startTime = Date.now();
    
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = query.parameters;

      const skip = (page - 1) * limit;
      // sortBy is in camelCase (e.g., 'publishedAt'), ReadModelStore.find will convert to snake_case
      // Use -1 for DESC (newest first), 1 for ASC (oldest first)
      // Default to DESC for publishedAt to show newest posts first
      let normalizedSortOrder = sortOrder;
      if (!normalizedSortOrder && sortBy === 'publishedAt') {
        normalizedSortOrder = 'desc'; // Default to newest first for publishedAt
      }
      const sortDirection = normalizedSortOrder === 'desc' || normalizedSortOrder === 'DESC' ? -1 : 1;
      const sort = { [sortBy]: sortDirection };
      
      logger.debug('Sorting configuration', {
        sortBy,
        sortOrder,
        normalizedSortOrder,
        sortDirection,
        sortObject: sort,
        willSortDesc: sortDirection === -1
      });

      // Wrap database operations in a timeout to prevent hanging
      const queryPromise = (async () => {
        // Execute find and count in parallel for better performance
        const [posts, total] = await Promise.all([
          this.readModelStore.find(
            this.modelName,
            { status: 'published' },
            { sort, limit, skip }
          ),
          this.readModelStore.count(this.modelName, { 
            status: 'published' 
          })
        ]);

        // Log for debugging - check if posts have publishedAt dates and verify sort order
        if (posts.length > 0) {
          logger.debug('Sample published posts (first 3)', {
            sortBy,
            sortOrder,
            sampleCount: Math.min(3, posts.length),
            samplePosts: posts.slice(0, 3).map(p => ({
              postId: p.postId,
              title: p.title,
              status: p.status,
              publishedAt: p.publishedAt,
              hasPublishedAt: !!p.publishedAt,
              publishedAtISO: p.publishedAt ? new Date(p.publishedAt).toISOString() : null
            }))
          });
          
          // Also log last 3 posts to verify sorting
          if (posts.length > 3) {
            logger.debug('Sample published posts (last 3)', {
              samplePosts: posts.slice(-3).map(p => ({
                postId: p.postId,
                title: p.title,
                publishedAt: p.publishedAt,
                publishedAtISO: p.publishedAt ? new Date(p.publishedAt).toISOString() : null
              }))
            });
          }
        }

        return { posts, total };
      })();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timeout after ${queryTimeout}ms`));
        }, queryTimeout);
      });

      const { posts, total } = await Promise.race([queryPromise, timeoutPromise]);

      const result = {
        posts: posts.map(post => this.formatBlogPost(post)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      const duration = Date.now() - startTime;
      logger.debug('Retrieved published blog posts', { 
        count: posts.length, 
        page, 
        total,
        duration: `${duration}ms`
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Error handling GetPublishedBlogPosts query:', {
        error: error.message,
        stack: error.stack,
        queryParameters: query.parameters,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  // Get blog posts by author
  async handleGetBlogPostsByAuthor(query) {
    try {
      const { 
        authorId, 
        page = 1, 
        limit = 10, 
        includeUnpublished = false 
      } = query.parameters;

      const skip = (page - 1) * limit;
      const filter = { authorId };
      
      if (!includeUnpublished) {
        filter.status = 'published';
      } else {
        filter.status = { $ne: 'deleted' };
      }

      const posts = await this.readModelStore.find(
        this.modelName,
        filter,
        { 
          sort: { createdAt: -1 }, 
          limit, 
          skip 
        }
      );

      const total = await this.readModelStore.count(this.modelName, filter);

      const result = {
        posts: posts.map(post => this.formatBlogPost(post)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      logger.debug('Retrieved blog posts by author', { 
        authorId, 
        count: posts.length 
      });

      return result;
    } catch (error) {
      logger.error('Error handling GetBlogPostsByAuthor query:', error);
      throw error;
    }
  }

  // Get blog posts by category
  async handleGetBlogPostsByCategory(query) {
    try {
      const { 
        categoryId, 
        page = 1, 
        limit = 10 
      } = query.parameters;

      const skip = (page - 1) * limit;

      const posts = await this.readModelStore.find(
        this.modelName,
        { 
          categoryId, 
          status: 'published' 
        },
        { 
          sort: { publishedAt: -1 }, 
          limit, 
          skip 
        }
      );

      const total = await this.readModelStore.count(this.modelName, { 
        categoryId, 
        status: 'published' 
      });

      const result = {
        posts: posts.map(post => this.formatBlogPost(post)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      logger.debug('Retrieved blog posts by category', { 
        categoryId, 
        count: posts.length 
      });

      return result;
    } catch (error) {
      logger.error('Error handling GetBlogPostsByCategory query:', error);
      throw error;
    }
  }

  // Get blog posts by tag
  async handleGetBlogPostsByTag(query) {
    try {
      const { 
        tag, 
        page = 1, 
        limit = 10 
      } = query.parameters;

      const skip = (page - 1) * limit;

      const posts = await this.readModelStore.find(
        this.modelName,
        { 
          tags: tag, 
          status: 'published' 
        },
        { 
          sort: { publishedAt: -1 }, 
          limit, 
          skip 
        }
      );

      const total = await this.readModelStore.count(this.modelName, { 
        tags: tag, 
        status: 'published' 
      });

      const result = {
        posts: posts.map(post => this.formatBlogPost(post)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      logger.debug('Retrieved blog posts by tag', { 
        tag, 
        count: posts.length 
      });

      return result;
    } catch (error) {
      logger.error('Error handling GetBlogPostsByTag query:', error);
      throw error;
    }
  }

  // Search blog posts
  async handleSearchBlogPosts(query) {
    try {
      const { 
        searchText, 
        page = 1, 
        limit = 10,
        filters = {}
      } = query.parameters;

      const skip = (page - 1) * limit;
      
      // Build search query
      const searchQuery = {
        $text: { $search: searchText },
        status: 'published'
      };

      // Apply additional filters
      if (filters.categoryId) {
        searchQuery.categoryId = filters.categoryId;
      }
      if (filters.authorId) {
        searchQuery.authorId = filters.authorId;
      }
      if (filters.tags && filters.tags.length > 0) {
        searchQuery.tags = { $in: filters.tags };
      }
      if (filters.isSecurityRelated !== undefined) {
        searchQuery.isSecurityRelated = filters.isSecurityRelated;
      }
      if (filters.isIAMRelated !== undefined) {
        searchQuery.isIAMRelated = filters.isIAMRelated;
      }

      const posts = await this.readModelStore.aggregate(this.modelName, [
        { 
          $match: searchQuery 
        },
        { 
          $addFields: { 
            score: { $meta: 'textScore' } 
          } 
        },
        { 
          $sort: { 
            score: { $meta: 'textScore' },
            publishedAt: -1 
          } 
        },
        { $skip: skip },
        { $limit: limit }
      ]);

      const totalResult = await this.readModelStore.aggregate(this.modelName, [
        { $match: searchQuery },
        { $count: 'total' }
      ]);

      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      const result = {
        posts: posts.map(post => this.formatBlogPost(post)),
        searchText,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      logger.debug('Search blog posts completed', { 
        searchText, 
        count: posts.length,
        total 
      });

      return result;
    } catch (error) {
      logger.error('Error handling SearchBlogPosts query:', error);
      throw error;
    }
  }

  // Get popular blog posts
  async handleGetPopularBlogPosts(query) {
    try {
      const { 
        page = 1, 
        limit = 10,
        timeframe = 30 // days
      } = query.parameters;

      const skip = (page - 1) * limit;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeframe);

      const posts = await this.readModelStore.find(
        this.modelName,
        { 
          status: 'published',
          publishedAt: { $gte: cutoffDate }
        },
        { 
          sort: { popularityScore: -1, publishedAt: -1 }, 
          limit, 
          skip 
        }
      );

      const total = await this.readModelStore.count(this.modelName, { 
        status: 'published',
        publishedAt: { $gte: cutoffDate }
      });

      const result = {
        posts: posts.map(post => this.formatBlogPost(post)),
        timeframe,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      logger.debug('Retrieved popular blog posts', { 
        timeframe, 
        count: posts.length 
      });

      return result;
    } catch (error) {
      logger.error('Error handling GetPopularBlogPosts query:', error);
      throw error;
    }
  }

  // Get security-related blog posts
  async handleGetSecurityBlogPosts(query) {
    try {
      const { 
        page = 1, 
        limit = 10 
      } = query.parameters;

      const skip = (page - 1) * limit;

      const posts = await this.readModelStore.find(
        this.modelName,
        { 
          isSecurityRelated: true, 
          status: 'published' 
        },
        { 
          sort: { publishedAt: -1 }, 
          limit, 
          skip 
        }
      );

      const total = await this.readModelStore.count(this.modelName, { 
        isSecurityRelated: true, 
        status: 'published' 
      });

      const result = {
        posts: posts.map(post => this.formatBlogPost(post)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      logger.debug('Retrieved security blog posts', { count: posts.length });
      return result;
    } catch (error) {
      logger.error('Error handling GetSecurityBlogPosts query:', error);
      throw error;
    }
  }

  // Get IAM-related blog posts
  async handleGetIAMBlogPosts(query) {
    try {
      const { 
        page = 1, 
        limit = 10 
      } = query.parameters;

      const skip = (page - 1) * limit;

      const posts = await this.readModelStore.find(
        this.modelName,
        { 
          isIAMRelated: true, 
          status: 'published' 
        },
        { 
          sort: { publishedAt: -1 }, 
          limit, 
          skip 
        }
      );

      const total = await this.readModelStore.count(this.modelName, { 
        isIAMRelated: true, 
        status: 'published' 
      });

      const result = {
        posts: posts.map(post => this.formatBlogPost(post)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      logger.debug('Retrieved IAM blog posts', { count: posts.length });
      return result;
    } catch (error) {
      logger.error('Error handling GetIAMBlogPosts query:', error);
      throw error;
    }
  }

  // Get blog post statistics
  async handleGetBlogPostStats(query) {
    try {
      const stats = await this.readModelStore.aggregate(this.modelName, [
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalViews: { $sum: '$viewCount' },
            totalLikes: { $sum: '$likeCount' },
            totalShares: { $sum: '$shareCount' },
            totalComments: { $sum: '$commentCount' }
          }
        }
      ]);

      const categoryStats = await this.readModelStore.aggregate(this.modelName, [
        {
          $match: { status: 'published' }
        },
        {
          $group: {
            _id: '$categoryId',
            count: { $sum: 1 },
            categoryName: { $first: '$categoryName' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const tagStats = await this.readModelStore.aggregate(this.modelName, [
        {
          $match: { status: 'published' }
        },
        {
          $unwind: '$tags'
        },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 20
        }
      ]);

      const result = {
        statusStats: stats,
        categoryStats,
        tagStats: tagStats.map(tag => ({
          tag: tag._id,
          count: tag.count
        })),
        securityPostsCount: await this.readModelStore.count(this.modelName, {
          isSecurityRelated: true,
          status: 'published'
        }),
        iamPostsCount: await this.readModelStore.count(this.modelName, {
          isIAMRelated: true,
          status: 'published'
        })
      };

      logger.debug('Retrieved blog post statistics');
      return result;
    } catch (error) {
      logger.error('Error handling GetBlogPostStats query:', error);
      throw error;
    }
  }

  // Format blog post for response
  formatBlogPost(post) {
    // Ensure content is always a string (handle null/undefined)
    const content = post.content || '';
    
    // Log warning if content is missing
    if (!post.content || post.content.trim() === '') {
      logger.warn('Blog post has empty or missing content', {
        postId: post.postId,
        slug: post.slug,
        status: post.status,
        title: post.title
      });
    }
    
    return {
      id: post.postId,
      title: post.title,
      content: content,
      excerpt: post.excerpt,
      slug: post.slug,
      author: {
        id: post.authorId,
        name: post.authorName || site.authorName,
        email: post.authorEmail || site.authorEmail,
        avatar: post.authorAvatar
      },
      category: post.categoryId ? {
        id: post.categoryId,
        name: post.categoryName,
        slug: post.categorySlug
      } : null,
      tags: post.tags,
      status: post.status,
      seo: {
        title: post.seoTitle,
        description: post.seoDescription
      },
      featuredImage: post.featuredImage,
      metadata: {
        readingTime: post.readingTime,
        wordCount: post.wordCount,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        shareCount: post.shareCount,
        commentCount: post.commentCount,
        popularityScore: post.popularityScore
      },
      flags: {
        isSecurityRelated: post.isSecurityRelated,
        isIAMRelated: post.isIAMRelated
      },
      timestamps: {
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        publishedAt: post.publishedAt || (post.status === 'published' ? post.createdAt : null),
        lastViewedAt: post.lastViewedAt
      },
      version: post.version
    };
  }
}

module.exports = BlogPostQueryHandlers;
