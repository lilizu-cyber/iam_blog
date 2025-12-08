'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contact_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT(2000),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('new', 'read', 'replied', 'archived'),
        defaultValue: 'new',
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal',
        allowNull: false
      },
      submitted_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      replied_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      source: {
        type: Sequelize.STRING,
        defaultValue: 'website'
      },
      admin_notes: {
        type: Sequelize.TEXT,
        defaultValue: ''
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('contact_messages', ['email'], {
      name: 'contact_messages_email_idx'
    });
    await queryInterface.addIndex('contact_messages', ['status'], {
      name: 'contact_messages_status_idx'
    });
    await queryInterface.addIndex('contact_messages', ['priority'], {
      name: 'contact_messages_priority_idx'
    });
    await queryInterface.addIndex('contact_messages', ['submitted_at'], {
      name: 'contact_messages_submitted_at_idx'
    });
    await queryInterface.addIndex('contact_messages', ['name'], {
      name: 'contact_messages_name_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contact_messages');
  }
};


