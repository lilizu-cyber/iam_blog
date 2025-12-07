const { v4: uuidv4 } = require('uuid');
const {
  BlogPostCreatedEvent,
  BlogPostUpdatedEvent,
  BlogPostPublishedEvent,
  BlogPostUnpublishedEvent,
  BlogPostDeletedEvent,
  TagAddedToBlogPostEvent,
  TagRemovedFromBlogPostEvent
} = require('../events/BlogEvents');

class BlogPostAggregate {
  constructor() {
    this.id = null;
    this.title = null;
    this.content = null;
    this.excerpt = null;
    this.authorId = null;
    this.categoryId = null;
    this.tags = [];
    this.attachments = [];
    this.status = 'draft'; // draft, published, archived, deleted
    this.slug = null;
    this.featuredImage = null;
    this.seoTitle = null;
    this.seoDescription = null;
    this.readingTime = 0;
    this.createdAt = null;
    this.updatedAt = null;
    this.publishedAt = null;
    this.version = 0;
    this.uncommittedEvents = [];
  }

  // Static factory method to create from events
  static fromEvents(events) {
    const aggregate = new BlogPostAggregate();
    events.forEach(event => aggregate.apply(event));
    aggregate.uncommittedEvents = [];
    return aggregate;
  }

  // Create a new blog post
  create(data) {
    if (this.id) {
      throw new Error('Blog post already exists');
    }

    const {
      title,
      content,
      excerpt,
      authorId,
      authorName,
      authorEmail,
      categoryId,
      tags = [],
      attachments = [],
      slug,
      featuredImage,
      seoTitle,
      seoDescription
    } = data;

    if (!title || !content || !authorId) {
      throw new Error('Title, content, and authorId are required');
    }

    const postId = uuidv4();
    const now = new Date().toISOString();
    const readingTime = this.calculateReadingTime(content);

    const event = new BlogPostCreatedEvent({
      postId,
      title,
      content,
      excerpt: excerpt || this.generateExcerpt(content),
      authorId,
      authorName: authorName || 'Admin',
      authorEmail: authorEmail || 'admin@example.com',
      categoryId,
      tags,
      attachments,
      slug: slug || this.generateSlug(title),
      featuredImage,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt,
      readingTime,
      createdAt: now
    });

    this.raiseEvent(event);
    return postId;
  }

  // Update blog post
  update(data) {
    if (!this.id) {
      throw new Error('Blog post does not exist');
    }

    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted blog post');
    }

    const {
      title,
      content,
      excerpt,
      categoryId,
      featuredImage,
      seoTitle,
      seoDescription,
      tags,
      attachments
    } = data;

    const updates = {};
    if (title && title !== this.title) updates.title = title;
    if (content && content !== this.content) {
      updates.content = content;
      updates.readingTime = this.calculateReadingTime(content);
    }
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (featuredImage !== undefined) updates.featuredImage = featuredImage;
    if (seoTitle !== undefined) updates.seoTitle = seoTitle;
    if (seoDescription !== undefined) updates.seoDescription = seoDescription;
    if (tags !== undefined && Array.isArray(tags)) {
      // Compare tags arrays
      const currentTagsStr = [...this.tags].sort().join(',');
      const newTagsStr = [...tags].sort().join(',');
      if (currentTagsStr !== newTagsStr) {
        updates.tags = tags;
      }
    }
    if (attachments !== undefined && Array.isArray(attachments)) {
      updates.attachments = attachments;
    }

    if (Object.keys(updates).length === 0) {
      return; // No changes
    }

    updates.updatedAt = new Date().toISOString();

    const event = new BlogPostUpdatedEvent({
      postId: this.id,
      updates
    });

    this.raiseEvent(event);
  }

  // Publish blog post
  publish(authorId) {
    if (!this.id) {
      throw new Error('Blog post does not exist');
    }

    if (this.authorId !== authorId) {
      throw new Error('Only the author can publish this post');
    }

    if (this.status === 'published') {
      throw new Error('Blog post is already published');
    }

    if (this.status === 'deleted') {
      throw new Error('Cannot publish deleted blog post');
    }

    const event = new BlogPostPublishedEvent({
      postId: this.id,
      authorId,
      publishedAt: new Date().toISOString()
    });

    this.raiseEvent(event);
  }

  // Unpublish blog post
  unpublish(authorId) {
    if (!this.id) {
      throw new Error('Blog post does not exist');
    }

    if (this.authorId !== authorId) {
      throw new Error('Only the author can unpublish this post');
    }

    if (this.status !== 'published') {
      throw new Error('Blog post is not published');
    }

    const event = new BlogPostUnpublishedEvent({
      postId: this.id,
      authorId,
      unpublishedAt: new Date().toISOString()
    });

    this.raiseEvent(event);
  }

  // Delete blog post
  delete(authorId) {
    if (!this.id) {
      throw new Error('Blog post does not exist');
    }

    if (this.authorId !== authorId) {
      throw new Error('Only the author can delete this post');
    }

    if (this.status === 'deleted') {
      throw new Error('Blog post is already deleted');
    }

    const event = new BlogPostDeletedEvent({
      postId: this.id,
      authorId,
      deletedAt: new Date().toISOString()
    });

    this.raiseEvent(event);
  }

  // Add tag
  addTag(tag) {
    if (!this.id) {
      throw new Error('Blog post does not exist');
    }

    if (this.status === 'deleted') {
      throw new Error('Cannot add tag to deleted blog post');
    }

    if (this.tags.includes(tag)) {
      throw new Error('Tag already exists on this post');
    }

    const event = new TagAddedToBlogPostEvent({
      postId: this.id,
      tag
    });

    this.raiseEvent(event);
  }

  // Remove tag
  removeTag(tag) {
    if (!this.id) {
      throw new Error('Blog post does not exist');
    }

    if (this.status === 'deleted') {
      throw new Error('Cannot remove tag from deleted blog post');
    }

    if (!this.tags.includes(tag)) {
      throw new Error('Tag does not exist on this post');
    }

    const event = new TagRemovedFromBlogPostEvent({
      postId: this.id,
      tag
    });

    this.raiseEvent(event);
  }

  // Apply event to aggregate state
  apply(event) {
    switch (event.type) {
      case 'BlogPostCreated':
        this.onBlogPostCreated(event);
        break;
      case 'BlogPostUpdated':
        this.onBlogPostUpdated(event);
        break;
      case 'BlogPostPublished':
        this.onBlogPostPublished(event);
        break;
      case 'BlogPostUnpublished':
        this.onBlogPostUnpublished(event);
        break;
      case 'BlogPostDeleted':
        this.onBlogPostDeleted(event);
        break;
      case 'TagAddedToBlogPost':
        this.onTagAdded(event);
        break;
      case 'TagRemovedFromBlogPost':
        this.onTagRemoved(event);
        break;
      default:
        // Ignore unknown events
        break;
    }
    this.version++;
  }

  // Event handlers
  onBlogPostCreated(event) {
    const { data } = event;
    this.id = data.postId;
    this.title = data.title;
    this.content = data.content;
    this.excerpt = data.excerpt;
    this.authorId = data.authorId;
    this.categoryId = data.categoryId;
    this.tags = [...(data.tags || [])];
    this.attachments = [...(data.attachments || [])];
    this.slug = data.slug;
    this.featuredImage = data.featuredImage;
    this.seoTitle = data.seoTitle;
    this.seoDescription = data.seoDescription;
    this.readingTime = data.readingTime;
    this.createdAt = data.createdAt;
    this.status = 'draft';
  }

  onBlogPostUpdated(event) {
    const { updates } = event.data;
    Object.keys(updates).forEach(key => {
      if (key === 'tags' && Array.isArray(updates[key])) {
        this.tags = [...updates[key]]; // Create a new array
      } else if (key === 'attachments' && Array.isArray(updates[key])) {
        this.attachments = [...updates[key]]; // Create a new array
      } else {
        this[key] = updates[key];
      }
    });
  }

  onBlogPostPublished(event) {
    this.status = 'published';
    this.publishedAt = event.data.publishedAt;
  }

  onBlogPostUnpublished(event) {
    this.status = 'draft';
    this.publishedAt = null;
  }

  onBlogPostDeleted(event) {
    this.status = 'deleted';
  }

  onTagAdded(event) {
    this.tags.push(event.data.tag);
  }

  onTagRemoved(event) {
    this.tags = this.tags.filter(tag => tag !== event.data.tag);
  }

  // Utility methods
  raiseEvent(event) {
    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents() {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted() {
    this.uncommittedEvents = [];
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  generateExcerpt(content, maxLength = 200) {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  // Validation methods
  isPublished() {
    return this.status === 'published';
  }

  isDraft() {
    return this.status === 'draft';
  }

  isDeleted() {
    return this.status === 'deleted';
  }

  canBeModified() {
    return this.status !== 'deleted';
  }

  toSnapshot() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      excerpt: this.excerpt,
      authorId: this.authorId,
      categoryId: this.categoryId,
      tags: [...this.tags],
      status: this.status,
      slug: this.slug,
      featuredImage: this.featuredImage,
      seoTitle: this.seoTitle,
      seoDescription: this.seoDescription,
      readingTime: this.readingTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      publishedAt: this.publishedAt,
      version: this.version
    };
  }
}

module.exports = BlogPostAggregate;
