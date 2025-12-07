const { DataTypes } = require('sequelize');
const { getSequelize } = require('./index');

// Get Sequelize instance (will be initialized by ReadModelStore or setup script)
// This will throw if Sequelize isn't initialized, which is expected
const sequelize = getSequelize();

const BlogPost = sequelize.define('BlogPost', {
  // Using postId as primary key instead of auto-increment id
  postId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // Author information
  authorId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authorEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authorAvatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Category information
  categoryId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  categoryName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  categorySlug: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Tags as JSONB array
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  // Status
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived', 'deleted'),
    defaultValue: 'draft',
    allowNull: false
  },
  // SEO fields
  seoTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  seoDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Featured image as JSONB
  featuredImage: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Attachments as JSONB array
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Metadata
  readingTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  wordCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Engagement metrics
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shareCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Timestamps
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Version for optimistic locking
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Search optimization (stored as text, but we'll use tsvector for indexing)
  searchText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Content analysis (for AI features) as JSONB
  topics: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  sentiment: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Security and IAM related flags
  isSecurityRelated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isIAMRelated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  securityLevel: {
    type: DataTypes.ENUM('public', 'internal', 'confidential'),
    defaultValue: 'public'
  },
  // Moderation
  moderationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'approved'
  },
  moderatedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  moderatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Analytics
  lastViewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  popularityScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
}, {
  tableName: 'blog_posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true, // Ensure snake_case conversion
  // Note: With underscored: true, Sequelize converts camelCase to snake_case
  // But for indexes, we need to use the actual DB column names (snake_case)
  // Indexes will be created manually in setup script to avoid naming issues
  indexes: []
});

// Instance methods
BlogPost.prototype.incrementViewCount = async function() {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  this.popularityScore = this.calculatePopularityScore();
  await this.save();
  return this;
};

BlogPost.prototype.calculatePopularityScore = function() {
  const now = new Date();
  const ageInDays = (now - this.publishedAt) / (1000 * 60 * 60 * 24);
  const ageFactor = Math.max(0, 1 - (ageInDays / 365)); // Decay over a year
  
  return parseFloat((
    (this.viewCount * 1) +
    (this.likeCount * 5) +
    (this.shareCount * 10) +
    (this.commentCount * 3)
  ) * ageFactor).toFixed(2);
};

// Static methods
BlogPost.findPublished = function(options = {}) {
  const { limit = 10, offset = 0, order = [['publishedAt', 'DESC']] } = options;
  
  return this.findAll({
    where: { status: 'published' },
    order,
    limit,
    offset
  });
};

BlogPost.findByTag = function(tag, options = {}) {
  const { limit = 10, offset = 0 } = options;
  
  return this.findAll({
    where: {
      tags: { [require('sequelize').Op.contains]: [tag] },
      status: 'published'
    },
    order: [['publishedAt', 'DESC']],
    limit,
    offset
  });
};

BlogPost.findByCategory = function(categoryId, options = {}) {
  const { limit = 10, offset = 0 } = options;
  
  return this.findAll({
    where: {
      categoryId,
      status: 'published'
    },
    order: [['publishedAt', 'DESC']],
    limit,
    offset
  });
};

BlogPost.findByAuthor = function(authorId, options = {}) {
  const { limit = 10, offset = 0, includeUnpublished = false } = options;
  
  const where = { authorId };
  if (!includeUnpublished) {
    where.status = 'published';
  }
  
  return this.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

BlogPost.searchPosts = function(searchText, options = {}) {
  const { limit = 10, offset = 0 } = options;
  const { Op } = require('sequelize');
  
  return this.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.iLike]: `%${searchText}%` } },
        { content: { [Op.iLike]: `%${searchText}%` } },
        { excerpt: { [Op.iLike]: `%${searchText}%` } },
        { searchText: { [Op.iLike]: `%${searchText}%` } }
      ],
      status: 'published'
    },
    order: [['publishedAt', 'DESC']],
    limit,
    offset
  });
};

BlogPost.findSecurityPosts = function(options = {}) {
  const { limit = 10, offset = 0 } = options;
  
  return this.findAll({
    where: {
      isSecurityRelated: true,
      status: 'published'
    },
    order: [['publishedAt', 'DESC']],
    limit,
    offset
  });
};

BlogPost.findIAMPosts = function(options = {}) {
  const { limit = 10, offset = 0 } = options;
  
  return this.findAll({
    where: {
      isIAMRelated: true,
      status: 'published'
    },
    order: [['publishedAt', 'DESC']],
    limit,
    offset
  });
};

BlogPost.getPopularPosts = function(options = {}) {
  const { limit = 10, offset = 0, timeframe = 30 } = options;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframe);
  
  return this.findAll({
    where: {
      status: 'published',
      publishedAt: { [require('sequelize').Op.gte]: cutoffDate }
    },
    order: [['popularityScore', 'DESC']],
    limit,
    offset
  });
};

BlogPost.getTrendingPosts = function(options = {}) {
  const { limit = 10, offset = 0 } = options;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // Last 7 days
  
  return this.findAll({
    where: {
      status: 'published',
      lastViewedAt: { [require('sequelize').Op.gte]: cutoffDate }
    },
    order: [['viewCount', 'DESC'], ['lastViewedAt', 'DESC']],
    limit,
    offset
  });
};

module.exports = BlogPost;

