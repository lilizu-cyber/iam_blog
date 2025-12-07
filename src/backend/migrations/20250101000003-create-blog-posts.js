'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blog_posts', {
      post_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      excerpt: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      author_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      author_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      author_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      author_avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      category_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      category_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      category_slug: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived', 'deleted'),
        defaultValue: 'draft',
        allowNull: false
      },
      seo_title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      seo_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      featured_image: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      reading_time: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      word_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      like_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      share_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      comment_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      search_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      topics: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      sentiment: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_security_related: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_iam_related: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      security_level: {
        type: Sequelize.ENUM('public', 'internal', 'confidential'),
        defaultValue: 'public'
      },
      moderation_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'approved'
      },
      moderated_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      moderated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_viewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      popularity_score: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      }
    });

    // Create indexes
    await queryInterface.addIndex('blog_posts', ['slug'], {
      unique: true,
      name: 'blog_posts_slug_unique'
    });
    await queryInterface.addIndex('blog_posts', ['author_id'], {
      name: 'blog_posts_author_id_idx'
    });
    await queryInterface.addIndex('blog_posts', ['status'], {
      name: 'blog_posts_status_idx'
    });
    await queryInterface.addIndex('blog_posts', ['published_at'], {
      name: 'blog_posts_published_at_idx'
    });
    await queryInterface.addIndex('blog_posts', ['is_security_related'], {
      name: 'blog_posts_is_security_related_idx'
    });
    await queryInterface.addIndex('blog_posts', ['is_iam_related'], {
      name: 'blog_posts_is_iam_related_idx'
    });
    await queryInterface.addIndex('blog_posts', ['popularity_score'], {
      name: 'blog_posts_popularity_score_idx'
    });
    await queryInterface.addIndex('blog_posts', ['category_id'], {
      name: 'blog_posts_category_id_idx'
    });
    // GIN index for tags array
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS blog_posts_tags_idx ON blog_posts USING GIN (tags);
    `);
    // Full-text search index
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS blog_posts_search_text_idx ON blog_posts USING GIN (to_tsvector('english', COALESCE(search_text, '')));
    `);
    
    // Composite indexes for common query patterns (optimize WHERE + ORDER BY)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published 
      ON blog_posts(status, published_at DESC);
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_security_status_published 
      ON blog_posts(is_security_related, status, published_at DESC);
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_iam_status_published 
      ON blog_posts(is_iam_related, status, published_at DESC);
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_category_status_published 
      ON blog_posts(category_id, status, published_at DESC);
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_status_popularity 
      ON blog_posts(status, popularity_score DESC);
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_author_status_created 
      ON blog_posts(author_id, status, created_at DESC);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('blog_posts');
  }
};

