'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const [tables] = await queryInterface.sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'blog_posts';
    `);
    
    const tableExists = tables.length > 0;
    
    if (!tableExists) {
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
    }
    
    // Get the actual column name for IAM (could be is_iam_related or is_i_a_m_related)
    const [iamColumns] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'blog_posts' 
      AND (column_name = 'is_iam_related' OR column_name = 'is_i_a_m_related')
      LIMIT 1;
    `);
    
    const iamColumnName = iamColumns.length > 0 ? iamColumns[0].column_name : 'is_i_a_m_related';

    // Create indexes (skip if they already exist)
    const createIndexIfNotExists = async (table, columns, options) => {
      try {
        await queryInterface.addIndex(table, columns, options);
      } catch (error) {
        if (error.message && (error.message.includes('already exists') || error.parent?.code === '42P07')) {
          // Index already exists, skip
          return;
        }
        throw error;
      }
    };
    
    await createIndexIfNotExists('blog_posts', ['slug'], {
      unique: true,
      name: 'blog_posts_slug_unique'
    });
    await createIndexIfNotExists('blog_posts', ['author_id'], {
      name: 'blog_posts_author_id_idx'
    });
    await createIndexIfNotExists('blog_posts', ['status'], {
      name: 'blog_posts_status_idx'
    });
    await createIndexIfNotExists('blog_posts', ['published_at'], {
      name: 'blog_posts_published_at_idx'
    });
    await createIndexIfNotExists('blog_posts', ['is_security_related'], {
      name: 'blog_posts_is_security_related_idx'
    });
    // Create index on IAM column (use actual column name)
    await createIndexIfNotExists('blog_posts', [iamColumnName], {
      name: 'blog_posts_is_iam_related_idx'
    });
    await createIndexIfNotExists('blog_posts', ['popularity_score'], {
      name: 'blog_posts_popularity_score_idx'
    });
    await createIndexIfNotExists('blog_posts', ['category_id'], {
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
    // Create composite index with IAM column (use actual column name)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_iam_status_published 
      ON blog_posts(${iamColumnName}, status, published_at DESC);
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

