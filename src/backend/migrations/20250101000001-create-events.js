'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      event_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      stream_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      event_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('events', ['stream_id', 'event_number'], {
      unique: true,
      name: 'events_stream_id_event_number_unique'
    });
    await queryInterface.addIndex('events', ['stream_id'], {
      name: 'events_stream_id_idx'
    });
    await queryInterface.addIndex('events', ['event_type'], {
      name: 'events_event_type_idx'
    });
    await queryInterface.addIndex('events', ['timestamp'], {
      name: 'events_timestamp_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('events');
  }
};

