# MongoDB Removal Requirements - Complete Checklist

## Understanding Your Requirements

You want to:
1. ✅ Use PostgreSQL with Docker container
2. ✅ Completely remove MongoDB from codebase
3. ✅ Remove all MongoDB dependencies from other services
4. ✅ Ensure no MongoDB references remain anywhere

## Current MongoDB Usage Analysis

### 1. **Core Infrastructure Files** (MUST REPLACE)

#### A. Event Store
- **File**: `src/backend/infrastructure/MongoEventStore.js`
- **Status**: Currently used for event sourcing
- **Action**: Replace with `PostgresEventStore.js`
- **Dependencies**: Used by `server.js` and `BlogPostCommandHandlers.js`

#### B. Read Model Store
- **File**: `src/backend/infrastructure/ReadModelStore.js`
- **Status**: Uses Mongoose for all read model operations
- **Action**: Replace Mongoose with PostgreSQL client (Sequelize/Knex)
- **Dependencies**: Used by query handlers and projections

### 2. **Schema Files** (MUST CONVERT)

All use Mongoose schemas - need to convert to PostgreSQL tables/models:

- **File**: `src/backend/readModels/schemas/BlogPostReadModel.js`
  - Mongoose schema → PostgreSQL table/model
  
- **File**: `src/backend/readModels/schemas/NewsletterSubscriptionReadModel.js`
  - Mongoose schema → PostgreSQL table/model
  
- **File**: `src/backend/readModels/schemas/ContactMessageReadModel.js`
  - Mongoose schema → PostgreSQL table/model

### 3. **Server Configuration** (MUST UPDATE)

- **File**: `src/backend/server.js`
  - Line 10: `const MongoEventStore = require('./infrastructure/MongoEventStore');`
  - Line 93-95: Event store initialization with `MONGODB_URI`
  - Line 99-101: Read model store initialization with `MONGODB_URI`
  - **Action**: Replace with PostgreSQL equivalents

### 4. **Query Handlers** (MUST UPDATE)

- **File**: `src/backend/application/queryHandlers/BlogPostQueryHandlers.js`
  - Uses MongoDB query syntax (`$ne`, `$in`, etc.)
  - Uses `readModelStore` which uses Mongoose
  - **Action**: Convert all MongoDB queries to SQL/Sequelize queries

### 5. **Projections** (MUST UPDATE)

- **File**: `src/backend/readModels/projections/BlogPostProjection.js`
  - Uses Mongoose operations for updating read models
  - **Action**: Convert to PostgreSQL UPDATE/INSERT operations

### 6. **Command Handlers** (MUST UPDATE)

- **File**: `src/backend/application/commandHandlers/BlogPostCommandHandlers.js`
  - Uses `eventStore` (currently MongoEventStore)
  - References MongoDB event format
  - **Action**: Update to use PostgresEventStore

### 7. **Setup Scripts** (MUST REPLACE/DELETE)

- **File**: `scripts/setup-database.js`
  - Entirely MongoDB-focused
  - **Action**: Replace with PostgreSQL setup script
  
- **File**: `scripts/mongo-init.js`
  - MongoDB initialization script
  - **Action**: DELETE (no longer needed)

- **File**: `test-mongodb-connection.js`
  - MongoDB connection test
  - **Action**: DELETE or replace with PostgreSQL test

### 8. **Package Dependencies** (MUST REMOVE)

- **File**: `package.json`
  - Line 29: `"mongoose": "^8.0.3"` - **REMOVE**
  - **Action**: Remove mongoose, add PostgreSQL packages (`pg`, `sequelize` or `knex`)

### 9. **Docker Configuration** (MUST UPDATE)

- **File**: `docker-compose.yml`
  - Lines 24-36: MongoDB service definition
  - Line 56: `MONGODB_URI` environment variable
  - Line 63: MongoDB dependency
  - **Action**: Remove MongoDB service, update environment variables

### 10. **Environment Variables** (MUST UPDATE)

- **File**: `.env` (your actual file)
  - `MONGODB_URI` - **REMOVE**
  - **Action**: Add `POSTGRESQL_URI` or `DATABASE_URL`

- **File**: `env.example`
  - Already updated with PostgreSQL, but verify MongoDB is removed

### 11. **Documentation Files** (OPTIONAL - CAN DELETE)

- **File**: `MONGODB_ATLAS_SETUP.md`
  - MongoDB setup guide
  - **Action**: DELETE (no longer relevant)

## Prerequisites Before Removal

### ✅ Step 1: PostgreSQL Setup (DONE)
- [x] PostgreSQL added to docker-compose.yml
- [x] PostgreSQL initialization script created
- [x] Environment variables updated in env.example

### ⏭️ Step 2: Install PostgreSQL Packages
```bash
npm install pg sequelize
npm install --save-dev sequelize-cli
```

### ⏭️ Step 3: Create PostgreSQL Implementations
1. Create `PostgresEventStore.js` (replace MongoEventStore)
2. Update `ReadModelStore.js` to use PostgreSQL
3. Convert all schemas to Sequelize models or SQL tables
4. Create database migration files

### ⏭️ Step 4: Update All Code
1. Update server.js to use PostgreSQL
2. Convert all MongoDB queries to SQL
3. Update projections to use PostgreSQL
4. Test all functionality

### ⏭️ Step 5: Remove MongoDB
1. Remove mongoose from package.json
2. Remove MongoDB service from docker-compose.yml
3. Remove MongoDB scripts
4. Remove MongoDB documentation
5. Remove MONGODB_URI from .env

## Migration Order (Recommended)

### Phase 1: Setup PostgreSQL (BEFORE removing MongoDB)
1. ✅ PostgreSQL Docker container ready
2. Install PostgreSQL packages
3. Create PostgresEventStore.js
4. Update ReadModelStore.js for PostgreSQL
5. Convert schemas to PostgreSQL
6. Create database tables

### Phase 2: Parallel Run (Both databases)
1. Keep MongoDB running
2. Start using PostgreSQL for new operations
3. Migrate existing data (if any)
4. Test thoroughly

### Phase 3: Complete Migration
1. All code uses PostgreSQL
2. All tests pass
3. Verify no MongoDB references remain

### Phase 4: Cleanup
1. Remove MongoDB from docker-compose.yml
2. Remove mongoose from package.json
3. Delete MongoDB scripts
4. Remove MONGODB_URI from .env
5. Delete MongoDB documentation

## Files That Will Be Deleted

1. `src/backend/infrastructure/MongoEventStore.js` → Replaced by `PostgresEventStore.js`
2. `scripts/mongo-init.js` → No longer needed
3. `scripts/setup-database.js` → Replaced by PostgreSQL setup
4. `test-mongodb-connection.js` → Replaced by PostgreSQL test
5. `MONGODB_ATLAS_SETUP.md` → No longer relevant

## Files That Will Be Modified

1. `src/backend/infrastructure/ReadModelStore.js` - Replace Mongoose with PostgreSQL
2. `src/backend/server.js` - Update imports and initialization
3. `src/backend/readModels/schemas/*.js` - Convert to Sequelize models
4. `src/backend/application/queryHandlers/BlogPostQueryHandlers.js` - Convert queries
5. `src/backend/readModels/projections/BlogPostProjection.js` - Convert operations
6. `src/backend/application/commandHandlers/BlogPostCommandHandlers.js` - Update event store usage
7. `package.json` - Remove mongoose, add PostgreSQL packages
8. `docker-compose.yml` - Remove MongoDB service
9. `.env` - Remove MONGODB_URI

## Critical Dependencies to Check

### Event Store Interface
- `MongoEventStore` implements methods:
  - `connect()`
  - `appendToStream(streamName, events, expectedRevision)`
  - `readStream(streamName, options)`
  - `getStreamRevision(streamName)`
  - `disconnect()`
- **PostgresEventStore MUST implement same interface**

### Read Model Store Interface
- `ReadModelStore` implements methods:
  - `connect()`
  - `registerModel(name, schema)`
  - `getModel(name)`
  - `create(modelName, data)`
  - `findById(modelName, id)`
  - `findOne(modelName, query)`
  - `find(modelName, query, options)`
  - `update(modelName, query, update)`
  - `delete(modelName, query)`
  - `disconnect()`
- **PostgreSQL version MUST implement same interface**

## Testing Requirements

Before removing MongoDB, ensure:
1. ✅ PostgreSQL connection works
2. ✅ Event store operations work (append, read)
3. ✅ Read model operations work (CRUD)
4. ✅ All queries work correctly
5. ✅ Projections update correctly
6. ✅ All API endpoints work
7. ✅ No errors in logs

## Summary

**Total Files to Modify**: 9 files
**Total Files to Delete**: 5 files
**Total Files to Create**: 3-5 files (PostgresEventStore, migrations, etc.)

**Estimated Effort**: 1-2 weeks for complete migration and testing

---

## Confirmation

Before I proceed with changes, please confirm:

1. ✅ You understand all files that need to be changed
2. ✅ You want to use Sequelize for PostgreSQL (or prefer Knex/raw pg?)
3. ✅ You're okay with the migration order (setup PostgreSQL first, then remove MongoDB)
4. ✅ You understand that existing data in MongoDB will need migration (if any exists)
5. ✅ You're ready to proceed with the implementation

**Please confirm your understanding and I'll proceed with the implementation!**




