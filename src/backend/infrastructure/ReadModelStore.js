const { Sequelize, Op } = require('sequelize');
const logger = require('../utils/logger');
const { initializeSequelize, getSequelize } = require('../models/index');

// Models will be imported after Sequelize is initialized
let BlogPost = null;
let NewsletterSubscription = null;
let ContactMessage = null;
let User = null;

class ReadModelStore {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.sequelize = null;
    this.models = new Map();
  }

  async connect() {
    try {
      this.sequelize = initializeSequelize(this.connectionString);
      
      // Test connection with timeout
      try {
        await Promise.race([
          this.sequelize.authenticate(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
          )
        ]);
      } catch (authError) {
        logger.error('PostgreSQL authentication failed:', {
          error: authError.message,
          code: authError.code,
          originalError: authError.originalError?.message
        });
        throw authError;
      }
      
      // Import models after Sequelize is initialized (lazy loading)
      if (!BlogPost) {
        BlogPost = require('../models/BlogPost');
        NewsletterSubscription = require('../models/NewsletterSubscription');
        ContactMessage = require('../models/ContactMessage');
        
        // User model needs special handling - use defineUserModel directly
        // The module export might be null if Sequelize wasn't initialized when module loaded,
        // but defineUserModel is always available
        const userModule = require('../models/User');
        if (userModule && userModule.defineUserModel) {
          // Use defineUserModel directly with the sequelize instance we just initialized
          User = userModule.defineUserModel(this.sequelize);
        } else if (userModule && typeof userModule.sync === 'function') {
          // If it's already a model instance (Sequelize was initialized when module loaded)
          User = userModule;
        } else {
          // This shouldn't happen, but provide a clear error
          throw new Error('User model module is not properly exported. Expected defineUserModel function.');
        }
        
        // Ensure User is not null and has sync method
        if (!User) {
          throw new Error('Failed to initialize User model. User is null after initialization.');
        }
        if (typeof User.sync !== 'function') {
          throw new Error('User model is not a valid Sequelize model (missing sync method).');
        }
      }
      
      // Register models
      this.models.set('BlogPost', BlogPost);
      this.models.set('NewsletterSubscription', NewsletterSubscription);
      this.models.set('ContactMessage', ContactMessage);
      this.models.set('User', User);
      
      // Sync models only in development
      // In production, use migrations (run: npm run migrate:up)
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Development mode: syncing models (use migrations in production)');
        await BlogPost.sync({ alter: false });
        await NewsletterSubscription.sync({ alter: false });
        await ContactMessage.sync({ alter: false });
        if (User && typeof User.sync === 'function') {
          await User.sync({ alter: false });
        } else {
          logger.warn('User model not properly initialized, skipping sync');
        }
      } else {
        logger.info('Production mode: skipping model sync (use migrations)');
        // In production, verify tables exist (migrations should have created them)
        try {
          await this.sequelize.query('SELECT 1 FROM blog_posts LIMIT 1');
          await this.sequelize.query('SELECT 1 FROM users LIMIT 1');
          await this.sequelize.query('SELECT 1 FROM newsletter_subscriptions LIMIT 1');
          await this.sequelize.query('SELECT 1 FROM contact_messages LIMIT 1');
          logger.info('All required tables exist');
        } catch (error) {
          logger.error('Required tables missing. Please run migrations: npm run migrate:up');
          throw new Error('Database tables not found. Run migrations first.');
        }
      }
      
      logger.info('Connected to PostgreSQL for Read Models');
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  // Register a model (for backward compatibility, models are pre-registered)
  registerModel(name, schema) {
    // Models are already registered via imports
    // This method is kept for API compatibility
    if (this.models.has(name)) {
      logger.warn(`Model ${name} is already registered`);
      return this.models.get(name);
    }
    logger.info(`Registered read model: ${name}`);
    return this.models.get(name);
  }

  // Get a registered model
  getModel(name) {
    const model = this.models.get(name);
    if (!model) {
      throw new Error(`Model ${name} is not registered`);
    }
    return model;
  }

  // Convert query operators to Sequelize format
  // Also converts camelCase field names to snake_case for database columns
  convertQuery(query) {
    if (!query || typeof query !== 'object') {
      return query;
    }

    const sequelizeQuery = {};
    
    // Helper function to convert camelCase to snake_case
    const toSnakeCase = (str) => {
      return str.replace(/([A-Z])/g, '_$1').toLowerCase();
    };
    
    for (const [key, value] of Object.entries(query)) {
      // Convert camelCase field name to snake_case (e.g., isSecurityRelated -> is_security_related)
      const snakeCaseKey = toSnakeCase(key);
      
      if (value === null || typeof value !== 'object') {
        sequelizeQuery[snakeCaseKey] = value;
      } else if (value.$ne !== undefined) {
        sequelizeQuery[snakeCaseKey] = { [Op.ne]: value.$ne };
      } else if (value.$in !== undefined) {
        sequelizeQuery[snakeCaseKey] = { [Op.in]: value.$in };
      } else if (value.$nin !== undefined) {
        sequelizeQuery[snakeCaseKey] = { [Op.notIn]: value.$nin };
      } else if (value.$gt !== undefined) {
        sequelizeQuery[snakeCaseKey] = { [Op.gt]: value.$gt };
      } else if (value.$gte !== undefined) {
        sequelizeQuery[snakeCaseKey] = { [Op.gte]: value.$gte };
      } else if (value.$lt !== undefined) {
        sequelizeQuery[snakeCaseKey] = { [Op.lt]: value.$lt };
      } else if (value.$lte !== undefined) {
        sequelizeQuery[snakeCaseKey] = { [Op.lte]: value.$lte };
      } else if (value.$regex !== undefined) {
        sequelizeQuery[snakeCaseKey] = { [Op.iLike]: value.$regex };
      } else if (Array.isArray(value) && key === 'tags') {
        // Handle tag array queries
        sequelizeQuery[snakeCaseKey] = { [Op.contains]: value };
      } else {
        sequelizeQuery[snakeCaseKey] = value;
      }
    }
    
    return sequelizeQuery;
  }

  // Generic CRUD operations for read models
  async create(modelName, data) {
    try {
      const Model = this.getModel(modelName);
      logger.debug(`Creating document in ${modelName}`, { data });
      const document = await Model.create(data);
      const jsonDoc = document.toJSON();
      logger.info(`Created document in ${modelName}`, { 
        id: jsonDoc.id || jsonDoc.postId,
        modelName 
      });
      return jsonDoc;
    } catch (error) {
      logger.error(`Error creating document in ${modelName}:`, {
        error: error.message,
        stack: error.stack,
        data,
        errorName: error.name
      });
      throw error;
    }
  }

  async findById(modelName, id) {
    try {
      const Model = this.getModel(modelName);
      const document = await Model.findByPk(id);
      return document ? document.toJSON() : null;
    } catch (error) {
      logger.error(`Error finding document by id in ${modelName}:`, error);
      throw error;
    }
  }

  async findOne(modelName, query) {
    try {
      const Model = this.getModel(modelName);
      const sequelizeQuery = this.convertQuery(query);
      
      // Add query timeout (5 seconds) to prevent hanging queries
      let timeoutId;
      const queryPromise = Model.findOne({ where: sequelizeQuery });
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000);
      });

      try {
        const document = await Promise.race([queryPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        return document ? document.toJSON() : null;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      logger.error(`Error finding document in ${modelName}:`, error);
      throw error;
    }
  }

  async find(modelName, query = {}, options = {}) {
    try {
      const Model = this.getModel(modelName);
      const {
        sort = {},
        limit = 0,
        skip = 0,
        select = null
      } = options;

      const sequelizeQuery = this.convertQuery(query);
      const findOptions = {
        where: sequelizeQuery,
        raw: true
      };

      // Convert sort object to Sequelize order array
      // Convert camelCase field names to snake_case for database columns
      if (Object.keys(sort).length > 0) {
        findOptions.order = Object.entries(sort).map(([field, direction]) => {
          // Convert camelCase to snake_case (e.g., publishedAt -> published_at)
          const snakeCaseField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
          return [snakeCaseField, direction === -1 || direction === 'desc' ? 'DESC' : 'ASC'];
        });
      }

      if (skip) findOptions.offset = skip;
      if (limit) findOptions.limit = limit;
      if (select) findOptions.attributes = Array.isArray(select) ? select : select.split(' ');

      // Add query timeout (5 seconds) to prevent hanging queries
      let timeoutId;
      const queryPromise = Model.findAll(findOptions);
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000);
      });

      try {
        const documents = await Promise.race([queryPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        return documents;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      logger.error(`Error finding documents in ${modelName}:`, error);
      logger.error('Query details:', { modelName, query, options, error: error.message, stack: error.stack });
      throw error;
    }
  }

  async updateById(modelName, id, update) {
    try {
      const Model = this.getModel(modelName);
      // Convert MongoDB-style update operators to Sequelize format
      const sequelizeUpdate = this.convertUpdate(update);
      const [affectedRows] = await Model.update(sequelizeUpdate, {
        where: { [Model.primaryKeyAttribute]: id },
        returning: true
      });
      
      if (affectedRows > 0) {
        const document = await Model.findByPk(id);
        logger.debug(`Updated document in ${modelName}`, { id });
        return document ? document.toJSON() : null;
      }
      
      return null;
    } catch (error) {
      logger.error(`Error updating document in ${modelName}:`, error);
      throw error;
    }
  }

  // Convert update operators to Sequelize format
  // Also converts camelCase field names to snake_case for database columns
  convertUpdate(update) {
    if (!update || typeof update !== 'object') {
      return update;
    }

    if (!this.sequelize) {
      throw new Error('Sequelize not initialized. Call connect() first.');
    }

    // Helper function to convert camelCase to snake_case
    const toSnakeCase = (str) => {
      return str.replace(/([A-Z])/g, '_$1').toLowerCase();
    };

    // Handle update operators
    if (update.$set) {
      const result = {};
      // Convert camelCase field names to snake_case
      for (const [key, value] of Object.entries(update.$set)) {
        const snakeCaseKey = toSnakeCase(key);
        result[snakeCaseKey] = value;
      }
      
      // Handle $inc operator
      if (update.$inc) {
        for (const [key, value] of Object.entries(update.$inc)) {
          const snakeCaseKey = toSnakeCase(key);
          // Sequelize doesn't have direct $inc, so we need to use literal SQL
          result[snakeCaseKey] = this.sequelize.literal(`${snakeCaseKey} + ${value}`);
        }
      }
      return result;
    }

    // Handle $inc separately if no $set
    if (update.$inc) {
      const result = {};
      for (const [key, value] of Object.entries(update.$inc)) {
        const snakeCaseKey = toSnakeCase(key);
        result[snakeCaseKey] = this.sequelize.literal(`${snakeCaseKey} + ${value}`);
      }
      return result;
    }

    // Plain update object - convert field names
    const result = {};
    for (const [key, value] of Object.entries(update)) {
      const snakeCaseKey = toSnakeCase(key);
      result[snakeCaseKey] = value;
    }
    return result;
  }

  async updateOne(modelName, query, update) {
    try {
      const Model = this.getModel(modelName);
      const sequelizeQuery = this.convertQuery(query);
      const sequelizeUpdate = this.convertUpdate(update);
      const [affectedRows] = await Model.update(sequelizeUpdate, {
        where: sequelizeQuery,
        limit: 1
      });
      
      logger.debug(`Updated document in ${modelName}`, { 
        matched: affectedRows,
        modified: affectedRows 
      });
      
      return { matchedCount: affectedRows, modifiedCount: affectedRows };
    } catch (error) {
      logger.error(`Error updating document in ${modelName}:`, error);
      throw error;
    }
  }

  async updateMany(modelName, query, update) {
    try {
      const Model = this.getModel(modelName);
      const sequelizeQuery = this.convertQuery(query);
      const sequelizeUpdate = this.convertUpdate(update);
      const [affectedRows] = await Model.update(sequelizeUpdate, {
        where: sequelizeQuery
      });
      
      logger.debug(`Updated documents in ${modelName}`, { 
        matched: affectedRows,
        modified: affectedRows 
      });
      
      return { matchedCount: affectedRows, modifiedCount: affectedRows };
    } catch (error) {
      logger.error(`Error updating documents in ${modelName}:`, error);
      throw error;
    }
  }

  async deleteById(modelName, id) {
    try {
      const Model = this.getModel(modelName);
      const deleted = await Model.destroy({
        where: { [Model.primaryKeyAttribute]: id }
      });
      
      if (deleted > 0) {
        logger.debug(`Deleted document from ${modelName}`, { id });
        return { deletedCount: deleted };
      }
      
      return { deletedCount: 0 };
    } catch (error) {
      logger.error(`Error deleting document from ${modelName}:`, error);
      throw error;
    }
  }

  async deleteOne(modelName, query) {
    try {
      const Model = this.getModel(modelName);
      const sequelizeQuery = this.convertQuery(query);
      const deleted = await Model.destroy({
        where: sequelizeQuery,
        limit: 1
      });
      
      logger.debug(`Deleted document from ${modelName}`, { 
        deleted 
      });
      
      return { deletedCount: deleted };
    } catch (error) {
      logger.error(`Error deleting document from ${modelName}:`, error);
      throw error;
    }
  }

  async deleteMany(modelName, query) {
    try {
      const Model = this.getModel(modelName);
      const sequelizeQuery = this.convertQuery(query);
      const deleted = await Model.destroy({
        where: sequelizeQuery
      });
      
      logger.debug(`Deleted documents from ${modelName}`, { 
        deleted 
      });
      
      return { deletedCount: deleted };
    } catch (error) {
      logger.error(`Error deleting documents from ${modelName}:`, error);
      throw error;
    }
  }

  // Aggregation operations - convert to Sequelize
  async aggregate(modelName, pipeline) {
    try {
      // This is a simplified version - complex aggregations may need custom SQL
      const Model = this.getModel(modelName);
      
      // Handle simple aggregations
      if (pipeline.length === 1 && pipeline[0].$match) {
        const query = this.convertQuery(pipeline[0].$match);
        return await Model.findAll({ where: query, raw: true });
      }
      
      // For complex aggregations, use raw SQL or Sequelize query builder
      logger.warn('Complex aggregation pipeline not fully supported, using simplified query');
      return [];
    } catch (error) {
      logger.error(`Error in aggregation for ${modelName}:`, error);
      throw error;
    }
  }

  // Count operations
  async count(modelName, query = {}) {
    try {
      const Model = this.getModel(modelName);
      const sequelizeQuery = this.convertQuery(query);
      
      // Add query timeout (5 seconds) to prevent hanging queries
      let timeoutId;
      const queryPromise = Model.count({ where: sequelizeQuery });
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000);
      });

      try {
        const count = await Promise.race([queryPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        return count;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      logger.error(`Error counting documents in ${modelName}:`, error);
      throw error;
    }
  }

  // Bulk operations
  async bulkWrite(modelName, operations) {
    try {
      const Model = this.getModel(modelName);
      const results = {
        insertedCount: 0,
        modifiedCount: 0,
        deletedCount: 0
      };

      for (const op of operations) {
        if (op.insertOne) {
          await Model.create(op.insertOne.document);
          results.insertedCount++;
        } else if (op.updateOne) {
          const [affected] = await Model.update(
            op.updateOne.update,
            { where: this.convertQuery(op.updateOne.filter) }
          );
          results.modifiedCount += affected;
        } else if (op.deleteOne) {
          const deleted = await Model.destroy({
            where: this.convertQuery(op.deleteOne.filter),
            limit: 1
          });
          results.deletedCount += deleted;
        }
      }

      logger.debug(`Bulk operation completed for ${modelName}`, results);
      return results;
    } catch (error) {
      logger.error(`Error in bulk operation for ${modelName}:`, error);
      throw error;
    }
  }

  // Transaction support
  async withTransaction(callback) {
    const transaction = await this.sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Text search - using PostgreSQL full-text search
  async textSearch(modelName, searchText, options = {}) {
    try {
      const Model = this.getModel(modelName);
      const {
        limit = 20,
        skip = 0
      } = options;

      // Use PostgreSQL full-text search
      const documents = await this.sequelize.query(
        `SELECT *, ts_rank(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(excerpt, '')), plainto_tsquery('english', :searchText)) AS rank
         FROM ${Model.tableName}
         WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(excerpt, '')) @@ plainto_tsquery('english', :searchText)
         ORDER BY rank DESC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { searchText, limit, offset: skip },
          type: this.sequelize.QueryTypes.SELECT,
          model: Model
        }
      );

      return documents;
    } catch (error) {
      logger.error(`Error in text search for ${modelName}:`, error);
      // Fallback to simple LIKE search
      return await this.find(modelName, {
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchText}%` } },
          { content: { [Op.iLike]: `%${searchText}%` } },
          { excerpt: { [Op.iLike]: `%${searchText}%` } }
        ]
      }, { limit, skip });
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.sequelize.authenticate();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('Read model store health check failed:', error);
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {
    if (this.sequelize) {
      await this.sequelize.close();
      logger.info('Disconnected from PostgreSQL Read Model Store');
    }
  }
}

module.exports = ReadModelStore;