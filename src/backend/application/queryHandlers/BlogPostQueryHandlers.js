const logger = require('../../utils/logger');

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

      logger.debug('Retrieved blog post by ID', { postId });
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

      logger.debug('Retrieved blog post by slug', { slug });
      return this.formatBlogPost(post);
    } catch (error) {
      logger.error('Error handling GetBlogPostBySlug query:', error);
      throw error;
    }
  }

  // Get published blog posts with pagination
  async handleGetPublishedBlogPosts(query) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'publishedAt', 
        sortOrder = 'desc' 
      } = query.parameters;

      const skip = (page - 1) * limit;
      // sortBy is in camelCase (e.g., 'publishedAt'), ReadModelStore.find will convert to snake_case
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const posts = await this.readModelStore.find(
        this.modelName,
        { status: 'published' },
        { sort, limit, skip }
      );

      const total = await this.readModelStore.count(this.modelName, { 
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

      logger.debug('Retrieved published blog posts', { 
        count: posts.length, 
        page, 
        total 
      });

      return result;
    } catch (error) {
      logger.error('Error handling GetPublishedBlogPosts query:', error);
      logger.error('Query parameters:', query.parameters);
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
    return {
      id: post.postId,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      slug: post.slug,
      author: {
        id: post.authorId,
        name: post.authorName,
        email: post.authorEmail,
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
        publishedAt: post.publishedAt,
        lastViewedAt: post.lastViewedAt
      },
      version: post.version
    };
  }
}

module.exports = BlogPostQueryHandlers;
