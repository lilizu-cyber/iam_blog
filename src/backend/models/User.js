const { DataTypes } = require('sequelize');
const { getSequelize } = require('./index');
const bcrypt = require('bcryptjs');

// User model will be defined after Sequelize is initialized
let User = null;

function defineUserModel(sequelize) {
  if (User) {
    return User;
  }

  User = sequelize.define('User', {
  userId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'user_id'
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'author', 'user'),
    defaultValue: 'user',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'users',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email'],
      where: {
        email: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    }
  ],
  hooks: {
    beforeUpdate: (user) => {
      user.updatedAt = new Date();
    }
  }
});

  // Instance method to check password
  User.prototype.checkPassword = async function(password) {
    return bcrypt.compare(password, this.passwordHash);
  };

  // Instance method to set password (hashes it)
  User.prototype.setPassword = async function(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.passwordHash = await bcrypt.hash(password, rounds);
  };

  // Static method to create user with hashed password
  User.createWithPassword = async function(userData) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(userData.password, rounds);
    
    const { password, ...userDataWithoutPassword } = userData;
    return User.create({
      ...userDataWithoutPassword,
      passwordHash
    });
  };

  return User;
}

// Export function to get User model (lazy initialization)
function getUserModel() {
  if (!User) {
    const sequelize = getSequelize();
    User = defineUserModel(sequelize);
  }
  return User;
}

// For backward compatibility, try to get model if Sequelize is already initialized
try {
  const sequelize = getSequelize();
  User = defineUserModel(sequelize);
} catch (error) {
  // Sequelize not initialized yet - will be initialized later
}

module.exports = getUserModel();
module.exports.defineUserModel = defineUserModel;

