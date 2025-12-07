const logger = require('../../utils/logger');

class BlogPostProjection {
  constructor(readModelStore) {
    this.readModelStore = readModelStore;
    this.modelName = 'BlogPost';
  }

  // Handle BlogPostCreated event
  async onBlogPostCreated(event) {
    try {
      const { data } = event;
      
      // Create the read model document
      const blogPost = {
        postId: data.postId,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        slug: data.slug,
        authorId: data.authorId,
        authorName: data.authorName || 'Admin', // Default to Admin if not provided
        authorEmail: data.authorEmail || 'admin@example.com', // Default email
        categoryId: data.categoryId,
        tags: data.tags || [],
        status: 'draft',
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        featuredImage: data.featuredImage,
        attachments: data.attachments || [],
        readingTime: data.readingTime,
        wordCount: this.calculateWordCount(data.content),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.createdAt), // Set updatedAt to createdAt initially
        version: 1,
        searchText: this.buildSearchText(data),
        isSecurityRelated: this.isSecurityRelated(data),
        isIAMRelated: this.isIAMRelated(data),
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        commentCount: 0,
        popularityScore: 0
      };

      await this.readModelStore.create(this.modelName, blogPost);
      
      logger.info('BlogPost read model created', { 
        postId: data.postId,
        title: data.title,
        status: blogPost.status,
        categoryId: data.categoryId,
        isIAMRelated: blogPost.isIAMRelated,
        isSecurityRelated: blogPost.isSecurityRelated
      });
    } catch (error) {
      logger.error('Error handling BlogPostCreated event:', {
        postId: data.postId,
        title: data.title,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Handle BlogPostUpdated event
  async onBlogPostUpdated(event) {
    try {
      const { data } = event;
      const { postId, updates } = data;

      // Prepare the update object
      const updateData = { ...updates };
      
      // Handle tags update
      if (updates.tags !== undefined) {
        updateData.tags = updates.tags;
      }
      
      // Handle attachments update
      if (updates.attachments !== undefined) {
        updateData.attachments = updates.attachments;
      }
      
      // Get existing post for flag recalculation
      const existingPost = await this.readModelStore.findOne(this.modelName, { postId });
      
      if (updates.content) {
        updateData.wordCount = this.calculateWordCount(updates.content);
        updateData.searchText = this.buildSearchText({
          title: updates.title !== undefined ? updates.title : (existingPost?.title || ''),
          content: updates.content,
          excerpt: updates.excerpt !== undefined ? updates.excerpt : (existingPost?.excerpt || ''),
          tags: updates.tags !== undefined ? updates.tags : (existingPost?.tags || []),
          categoryId: updates.categoryId !== undefined ? updates.categoryId : (existingPost?.categoryId || null)
        });
        updateData.isSecurityRelated = this.isSecurityRelated({
          ...updates,
          categoryId: updates.categoryId !== undefined ? updates.categoryId : (existingPost?.categoryId || null)
        });
        updateData.isIAMRelated = this.isIAMRelated({
          ...updates,
          categoryId: updates.categoryId !== undefined ? updates.categoryId : (existingPost?.categoryId || null)
        });
      } else if (updates.title || updates.excerpt || updates.tags || updates.categoryId) {
        // Update search text and flags even if content didn't change
        if (existingPost) {
          updateData.searchText = this.buildSearchText({
            title: updates.title !== undefined ? updates.title : existingPost.title,
            content: existingPost.content,
            excerpt: updates.excerpt !== undefined ? updates.excerpt : existingPost.excerpt,
            tags: updates.tags !== undefined ? updates.tags : existingPost.tags,
            categoryId: updates.categoryId !== undefined ? updates.categoryId : existingPost.categoryId
          });
          // Recalculate flags when categoryId, title, excerpt, or tags change
          updateData.isSecurityRelated = this.isSecurityRelated({
            title: updates.title !== undefined ? updates.title : existingPost.title,
            content: existingPost.content,
            excerpt: updates.excerpt !== undefined ? updates.excerpt : existingPost.excerpt,
            tags: updates.tags !== undefined ? updates.tags : existingPost.tags,
            categoryId: updates.categoryId !== undefined ? updates.categoryId : existingPost.categoryId
          });
          updateData.isIAMRelated = this.isIAMRelated({
            title: updates.title !== undefined ? updates.title : existingPost.title,
            content: existingPost.content,
            excerpt: updates.excerpt !== undefined ? updates.excerpt : existingPost.excerpt,
            tags: updates.tags !== undefined ? updates.tags : existingPost.tags,
            categoryId: updates.categoryId !== undefined ? updates.categoryId : existingPost.categoryId
          });
        }
      }

      // Increment version
      await this.readModelStore.updateOne(
        this.modelName,
        { postId },
        { 
          $set: updateData,
          $inc: { version: 1 }
        }
      );

      logger.info('BlogPost read model updated', { postId });
    } catch (error) {
      logger.error('Error handling BlogPostUpdated event:', error);
      throw error;
    }
  }

  // Handle BlogPostPublished event
  async onBlogPostPublished(event) {
    try {
      const { data } = event;
      
      // Get existing post to recalculate flags
      const existingPost = await this.readModelStore.findOne(this.modelName, { postId: data.postId });
      
      if (!existingPost) {
        logger.warn('Post not found when publishing', { postId: data.postId });
        return;
      }
      
      // Recalculate flags based on current post data
      const isIAMRelated = this.isIAMRelated({
        title: existingPost.title,
        content: existingPost.content,
        excerpt: existingPost.excerpt,
        tags: existingPost.tags,
        categoryId: existingPost.categoryId
      });
      
      const isSecurityRelated = this.isSecurityRelated({
        title: existingPost.title,
        content: existingPost.content,
        excerpt: existingPost.excerpt,
        tags: existingPost.tags,
        categoryId: existingPost.categoryId
      });
      
      await this.readModelStore.updateOne(
        this.modelName,
        { postId: data.postId },
        { 
          $set: { 
            status: 'published',
            publishedAt: new Date(data.publishedAt),
            isIAMRelated: isIAMRelated,
            isSecurityRelated: isSecurityRelated
          },
          $inc: { version: 1 }
        }
      );

      logger.info('BlogPost published in read model', { 
        postId: data.postId,
        isIAMRelated,
        isSecurityRelated,
        categoryId: existingPost.categoryId
      });
    } catch (error) {
      logger.error('Error handling BlogPostPublished event:', error);
      throw error;
    }
  }

  // Handle BlogPostUnpublished event
  async onBlogPostUnpublished(event) {
    try {
      const { data } = event;
      
      await this.readModelStore.updateOne(
        this.modelName,
        { postId: data.postId },
        { 
          $set: { 
            status: 'draft',
            publishedAt: null
          },
          $inc: { version: 1 }
        }
      );

      logger.info('BlogPost unpublished in read model', { postId: data.postId });
    } catch (error) {
      logger.error('Error handling BlogPostUnpublished event:', error);
      throw error;
    }
  }

  // Handle BlogPostDeleted event
  async onBlogPostDeleted(event) {
    try {
      const { data } = event;
      
      await this.readModelStore.updateOne(
        this.modelName,
        { postId: data.postId },
        { 
          $set: { status: 'deleted' },
          $inc: { version: 1 }
        }
      );

      logger.info('BlogPost deleted in read model', { postId: data.postId });
    } catch (error) {
      logger.error('Error handling BlogPostDeleted event:', error);
      throw error;
    }
  }

  // Handle TagAddedToBlogPost event
  async onTagAddedToBlogPost(event) {
    try {
      const { data } = event;
      
      await this.readModelStore.updateOne(
        this.modelName,
        { postId: data.postId },
        { 
          $addToSet: { tags: data.tag },
          $inc: { version: 1 }
        }
      );

      // Update search text and categorization
      const post = await this.readModelStore.findOne(this.modelName, { postId: data.postId });
      if (post) {
        const searchText = this.buildSearchText(post);
        const isSecurityRelated = this.isSecurityRelated(post);
        const isIAMRelated = this.isIAMRelated(post);
        
        await this.readModelStore.updateOne(
          this.modelName,
          { postId: data.postId },
          { 
            $set: { 
              searchText,
              isSecurityRelated,
              isIAMRelated
            }
          }
        );
      }

      logger.info('Tag added to BlogPost in read model', { 
        postId: data.postId, 
        tag: data.tag 
      });
    } catch (error) {
      logger.error('Error handling TagAddedToBlogPost event:', error);
      throw error;
    }
  }

  // Handle TagRemovedFromBlogPost event
  async onTagRemovedFromBlogPost(event) {
    try {
      const { data } = event;
      
      await this.readModelStore.updateOne(
        this.modelName,
        { postId: data.postId },
        { 
          $pull: { tags: data.tag },
          $inc: { version: 1 }
        }
      );

      // Update search text and categorization
      const post = await this.readModelStore.findOne(this.modelName, { postId: data.postId });
      if (post) {
        const searchText = this.buildSearchText(post);
        const isSecurityRelated = this.isSecurityRelated(post);
        const isIAMRelated = this.isIAMRelated(post);
        
        await this.readModelStore.updateOne(
          this.modelName,
          { postId: data.postId },
          { 
            $set: { 
              searchText,
              isSecurityRelated,
              isIAMRelated
            }
          }
        );
      }

      logger.info('Tag removed from BlogPost in read model', { 
        postId: data.postId, 
        tag: data.tag 
      });
    } catch (error) {
      logger.error('Error handling TagRemovedFromBlogPost event:', error);
      throw error;
    }
  }

  // Handle BlogPostViewed event
  async onBlogPostViewed(event) {
    try {
      const { data } = event;
      
      const post = await this.readModelStore.findOne(this.modelName, { postId: data.postId });
      if (post) {
        const newViewCount = post.viewCount + 1;
        const popularityScore = this.calculatePopularityScore({
          ...post,
          viewCount: newViewCount
        });

        await this.readModelStore.updateOne(
          this.modelName,
          { postId: data.postId },
          { 
            $inc: { viewCount: 1 },
            $set: { 
              lastViewedAt: new Date(),
              popularityScore
            }
          }
        );
      }

      logger.debug('BlogPost view tracked in read model', { postId: data.postId });
    } catch (error) {
      logger.error('Error handling BlogPostViewed event:', error);
      throw error;
    }
  }

  // Handle UserRegistered event to enrich author information
  async onUserRegistered(event) {
    try {
      const { data } = event;
      
      // Update all posts by this author with their information
      await this.readModelStore.updateMany(
        this.modelName,
        { authorId: data.userId },
        { 
          $set: {
            authorName: data.username,
            authorEmail: data.email,
            authorAvatar: data.avatar
          }
        }
      );

      logger.info('Author information updated in BlogPost read models', { 
        authorId: data.userId 
      });
    } catch (error) {
      logger.error('Error handling UserRegistered event:', error);
      throw error;
    }
  }

  // Handle UserProfileUpdated event
  async onUserProfileUpdated(event) {
    try {
      const { data } = event;
      
      const updateData = {};
      if (data.username) updateData.authorName = data.username;
      if (data.email) updateData.authorEmail = data.email;
      if (data.avatar) updateData.authorAvatar = data.avatar;

      if (Object.keys(updateData).length > 0) {
        await this.readModelStore.updateMany(
          this.modelName,
          { authorId: data.userId },
          { $set: updateData }
        );

        logger.info('Author profile updated in BlogPost read models', { 
          authorId: data.userId 
        });
      }
    } catch (error) {
      logger.error('Error handling UserProfileUpdated event:', error);
      throw error;
    }
  }

  // Utility methods
  calculateWordCount(content) {
    if (!content) return 0;
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }

  buildSearchText(data) {
    const parts = [];
    if (data.title) parts.push(data.title);
    if (data.content) {
      const plainText = data.content.replace(/<[^>]*>/g, '');
      parts.push(plainText);
    }
    if (data.excerpt) parts.push(data.excerpt);
    if (data.tags && Array.isArray(data.tags)) {
      parts.push(data.tags.join(' '));
    }
    return parts.join(' ').toLowerCase();
  }

  isSecurityRelated(data) {
    // Check categoryId first
    if (data.categoryId === 'security') {
      return true;
    }

    const securityKeywords = [
      'security', 'cybersecurity', 'vulnerability', 'threat', 'attack',
      'malware', 'phishing', 'encryption', 'firewall', 'penetration',
      'hacking', 'breach', 'exploit', 'zero-day', 'ransomware',
      'ddos', 'sql injection', 'xss', 'csrf', 'authentication',
      'authorization', 'ssl', 'tls', 'https', 'certificate'
    ];

    const searchText = this.buildSearchText(data);
    return securityKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
  }

  isIAMRelated(data) {
    // Check categoryId first
    if (data.categoryId === 'iam') {
      return true;
    }

    const iamKeywords = [
      'iam', 'identity', 'access management', 'authentication',
      'authorization', 'oauth', 'saml', 'sso', 'single sign-on',
      'ldap', 'active directory', 'rbac', 'role-based',
      'permissions', 'privileges', 'jwt', 'token', 'session',
      'multi-factor', 'mfa', '2fa', 'biometric', 'password',
      'credential', 'federation', 'provisioning', 'deprovisioning'
    ];

    const searchText = this.buildSearchText(data);
    return iamKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
  }

  calculatePopularityScore(post) {
    if (!post.publishedAt) return 0;
    
    const now = new Date();
    const ageInDays = (now - new Date(post.publishedAt)) / (1000 * 60 * 60 * 24);
    const ageFactor = Math.max(0, 1 - (ageInDays / 365)); // Decay over a year
    
    return (
      (post.viewCount * 1) +
      (post.likeCount * 5) +
      (post.shareCount * 10) +
      (post.commentCount * 3)
    ) * ageFactor;
  }
}

module.exports = BlogPostProjection;
