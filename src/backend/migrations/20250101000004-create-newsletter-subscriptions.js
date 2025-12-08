'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('newsletter_subscriptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('active', 'unsubscribed', 'bounced'),
        defaultValue: 'active',
        allowNull: false
      },
      subscribed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      unsubscribed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      source: {
        type: Sequelize.STRING,
        defaultValue: 'website'
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('newsletter_subscriptions', ['email'], {
      unique: true,
      name: 'newsletter_subscriptions_email_unique'
    });
    await queryInterface.addIndex('newsletter_subscriptions', ['status'], {
      name: 'newsletter_subscriptions_status_idx'
    });
    await queryInterface.addIndex('newsletter_subscriptions', ['subscribed_at'], {
      name: 'newsletter_subscriptions_subscribed_at_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('newsletter_subscriptions');
  }
};


