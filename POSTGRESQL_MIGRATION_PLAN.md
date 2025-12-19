# PostgreSQL Migration Plan

## Overview
This document outlines the requirements and steps to migrate from MongoDB to PostgreSQL for the IAM Blog application.

## Requirements

### 1. PostgreSQL Database
- **Local Installation**: PostgreSQL 12+ installed and running
- **OR Cloud Service**: PostgreSQL database (AWS RDS, Azure Database, Heroku Postgres, Supabase, etc.)
- **Connection String Format**: `postgresql://username:password@host:port/database`

### 2. Node.js Packages
You'll need to install these packages:
```bash
npm install pg sequelize
# OR
npm install pg knex
# OR (if using TypeORM)
npm install typeorm pg reflect-metadata
```

**Recommended**: Use **Sequelize** or **Knex.js** for easier migration from Mongoose.

### 3. Environment Variables
Update `.env` file:
- Replace `MONGODB_URI` with `POSTGRESQL_URI` or `DATABASE_URL`
- Format: `postgresql://user:password@localhost:5432/iam_blog_db`

## Files That Need to Be Changed

### Core Infrastructure Files (High Priority)
1. **`src/backend/infrastructure/MongoEventStore.js`** → `PostgresEventStore.js`
   - Replace Mongoose with PostgreSQL client
   - Convert event schema to SQL table
   - Rewrite all queries to SQL

2. **`src/backend/infrastructure/ReadModelStore.js`**
   - Replace Mongoose with PostgreSQL client (Sequelize/Knex)
   - Convert schema registration to Sequelize models or Knex migrations

3. **`src/backend/server.js`**
   - Update connection string variable
   - Update initialization code

### Schema Files (High Priority)
4. **`src/backend/readModels/schemas/BlogPostReadModel.js`**
   - Convert Mongoose schema to Sequelize model or SQL table definition

5. **`src/backend/readModels/schemas/NewsletterSubscriptionReadModel.js`**
   - Convert to PostgreSQL schema

6. **`src/backend/readModels/schemas/ContactMessageReadModel.js`**
   - Convert to PostgreSQL schema

### Query Handlers (Medium Priority)
7. **`src/backend/application/queryHandlers/BlogPostQueryHandlers.js`**
   - Convert MongoDB queries to SQL queries
   - Update aggregation pipelines to SQL JOINs/GROUP BY

### Projections (Medium Priority)
8. **`src/backend/readModels/projections/BlogPostProjection.js`**
   - Update all MongoDB operations to PostgreSQL operations
   - Convert update queries to SQL UPDATE statements

### Setup Scripts (Low Priority)
9. **`scripts/setup-database.js`**
   - Rewrite to create PostgreSQL tables and indexes
   - Convert MongoDB index creation to PostgreSQL CREATE INDEX

10. **`scripts/mongo-init.js`** → Delete or convert to PostgreSQL init script

### Configuration Files
11. **`docker-compose.yml`**
   - Replace MongoDB service with PostgreSQL service
   - Update environment variables

12. **`package.json`**
   - Remove `mongoose` dependency
   - Add PostgreSQL client library

13. **`env.example`**
   - Update connection string format

## Migration Strategy

### Option 1: Using Sequelize (Recommended for easier migration)
**Pros:**
- Similar API to Mongoose
- Automatic migrations
- Model definitions similar to Mongoose schemas
- Built-in validations

**Cons:**
- Additional abstraction layer
- Slightly more overhead

### Option 2: Using Knex.js (Recommended for more control)
**Pros:**
- Query builder similar to MongoDB queries
- Better control over SQL
- Migration system
- Can use raw SQL when needed

**Cons:**
- More manual work
- Less automatic than Sequelize

### Option 3: Using pg (Raw PostgreSQL client)
**Pros:**
- Full control
- No abstraction overhead
- Direct SQL queries

**Cons:**
- Most manual work
- Need to write all SQL manually
- No automatic migrations

## Step-by-Step Implementation Plan

### Phase 1: Setup PostgreSQL
1. Install PostgreSQL locally or set up cloud instance
2. Create database: `iam_blog_db`
3. Create user with appropriate permissions
4. Update `.env` with PostgreSQL connection string

### Phase 2: Install Dependencies
```bash
npm install pg sequelize
npm install --save-dev sequelize-cli
```

### Phase 3: Create Database Schema
1. Create SQL migration files or Sequelize models for:
   - Events table (for event store)
   - blog_posts table
   - newsletter_subscriptions table
   - contact_messages table

### Phase 4: Replace Event Store
1. Create `PostgresEventStore.js`
2. Implement same interface as `MongoEventStore`
3. Convert all MongoDB operations to SQL

### Phase 5: Replace Read Model Store
1. Update `ReadModelStore.js` to use Sequelize/Knex
2. Convert all Mongoose operations to Sequelize/Knex operations

### Phase 6: Update Schemas
1. Convert all Mongoose schemas to Sequelize models
2. Ensure all indexes are created

### Phase 7: Update Query Handlers
1. Convert MongoDB queries to SQL
2. Test all query operations

### Phase 8: Update Projections
1. Convert MongoDB update operations to SQL UPDATE statements
2. Test event projections

### Phase 9: Update Configuration
1. Update `docker-compose.yml`
2. Update `package.json`
3. Update `env.example`

### Phase 10: Testing
1. Test all CRUD operations
2. Test event sourcing
3. Test projections
4. Test queries and aggregations

## Key Differences: MongoDB vs PostgreSQL

### Data Types
- **MongoDB Mixed/JSON** → **PostgreSQL JSONB** (for flexible schemas)
- **MongoDB Arrays** → **PostgreSQL ARRAY** or **JSONB**
- **MongoDB ObjectId** → **PostgreSQL UUID** or **SERIAL**

### Queries
- **MongoDB `.find()`** → **PostgreSQL `SELECT`**
- **MongoDB `.findOne()`** → **POSTGRESQL `SELECT ... LIMIT 1`**
- **MongoDB `.updateOne()`** → **PostgreSQL `UPDATE ... WHERE`**
- **MongoDB `.deleteOne()`** → **PostgreSQL `DELETE ... WHERE`**
- **MongoDB `.aggregate()`** → **PostgreSQL `GROUP BY`, `JOIN`, etc.**

### Indexes
- **MongoDB compound indexes** → **PostgreSQL composite indexes**
- **MongoDB text indexes** → **PostgreSQL full-text search (tsvector)**

### Transactions
- PostgreSQL has native ACID transactions (better than MongoDB)

## Estimated Effort

- **Small**: 2-3 days for experienced developer
- **Medium**: 1 week for developer familiar with both databases
- **Large**: 2-3 weeks if learning PostgreSQL along the way

## Risks and Considerations

1. **Data Migration**: If you have existing data, need migration script
2. **Performance**: Some MongoDB queries may need optimization for PostgreSQL
3. **Text Search**: MongoDB text search → PostgreSQL full-text search (different syntax)
4. **Array Operations**: MongoDB array operations → PostgreSQL array functions or JSONB
5. **Testing**: Comprehensive testing needed to ensure feature parity

## Next Steps

1. Choose ORM/Query Builder (Sequelize, Knex, or raw pg)
2. Set up PostgreSQL database
3. Start with Event Store migration (most critical)
4. Then migrate Read Models
5. Test thoroughly before deploying








