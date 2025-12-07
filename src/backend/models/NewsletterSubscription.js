const { DataTypes } = require('sequelize');
const { getSequelize } = require('./index');

const sequelize = getSequelize();

const NewsletterSubscription = sequelize.define('NewsletterSubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'unsubscribed', 'bounced'),
    defaultValue: 'active',
    allowNull: false
  },
  subscribedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  unsubscribedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'website'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'newsletter_subscriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true, // Convert camelCase to snake_case (subscribedAt -> subscribed_at)
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['status'] },
    { fields: ['subscribed_at'] } // Use snake_case for index
  ]
});

module.exports = NewsletterSubscription;

