# Database Migrations Guide

This project uses Sequelize migrations for database schema management. Migrations provide version control for your database schema and are essential for production deployments.

## Overview

- **Development**: Models can auto-sync (creates tables if they don't exist)
- **Production**: **MUST** use migrations - auto-sync is disabled

## Migration Files

All migration files are located in `src/backend/migrations/`:

1. `20250101000001-create-events.js` - Event store table
2. `20250101000002-create-users.js` - Users table
3. `20250101000003-create-blog-posts.js` - Blog posts table
4. `20250101000004-create-newsletter-subscriptions.js` - Newsletter subscriptions table
5. `20250101000005-create-contact-messages.js` - Contact messages table

## Running Migrations

### Check Migration Status

```bash
npm run migrate:status
```

This shows which migrations have been executed and which are pending.

### Run Pending Migrations

```bash
npm run migrate:up
```

This will:
- Connect to your PostgreSQL database
- Check which migrations have already been run
- Execute any pending migrations in order
- Record executed migrations in the `SequelizeMeta` table

## Production Deployment

### Before Deploying

1. **Run migrations on production database**:
   ```bash
   NODE_ENV=production npm run migrate:up
   ```

2. **Verify migration status**:
   ```bash
   NODE_ENV=production npm run migrate:status
   ```

3. **Start the application** - it will verify tables exist but won't auto-sync

### Environment Variables

Ensure these are set in production:
- `POSTGRESQL_URI` or `DATABASE_URL` - Database connection string
- `NODE_ENV=production` - Enables production mode (disables auto-sync)

## Creating New Migrations

When you need to modify the schema:

1. **Create a new migration file**:
   ```bash
   # Create: src/backend/migrations/YYYYMMDDHHMMSS-description.js
   ```

2. **Migration file structure**:
   ```javascript
   'use strict';

   module.exports = {
     async up(queryInterface, Sequelize) {
       // Add columns, create tables, etc.
       await queryInterface.addColumn('blog_posts', 'new_column', {
         type: Sequelize.STRING,
         allowNull: true
       });
     },

     async down(queryInterface, Sequelize) {
       // Reverse the changes
       await queryInterface.removeColumn('blog_posts', 'new_column');
     }
   };
   ```

3. **Test the migration**:
   ```bash
   npm run migrate:up
   ```

4. **Commit the migration file** to version control

## Important Notes

### ⚠️ Never Use `sync()` in Production

The code has been updated to:
- **Development**: Auto-sync enabled (for convenience)
- **Production**: Auto-sync disabled (migrations required)

If you see this error in production:
```
Database tables not found. Run migrations first.
```

Run: `npm run migrate:up`

### Migration Order

Migrations are executed in filename order (timestamp-based). Always use:
- Format: `YYYYMMDDHHMMSS-description.js`
- Example: `20250105120000-add-new-feature.js`

### Rollback

The current migration runner doesn't support automatic rollback. To rollback:
1. Manually reverse changes in the database
2. Remove the migration entry from `SequelizeMeta` table
3. Or create a new migration to reverse the changes

## Troubleshooting

### Migration Already Executed

If a migration fails partway through:
1. Check the database state
2. Manually fix any issues
3. Remove the failed migration from `SequelizeMeta` if needed
4. Re-run: `npm run migrate:up`

### Tables Already Exist

If tables exist from previous `sync()` calls:
1. Migrations will check if tables exist
2. You may need to manually drop and recreate if schema differs
3. **Always backup your database first!**

### Connection Issues

Ensure your database connection string is correct:
```bash
# Check .env file
POSTGRESQL_URI=postgresql://user:password@host:port/database
# or
DATABASE_URL=postgresql://user:password@host:port/database
```

## Best Practices

1. ✅ **Always run migrations before deploying to production**
2. ✅ **Test migrations on a staging environment first**
3. ✅ **Backup your database before running migrations**
4. ✅ **Keep migration files in version control**
5. ✅ **Never modify executed migrations** - create new ones instead
6. ✅ **Use transactions in migrations when possible**
7. ✅ **Document breaking changes in migration files**

## Related Files

- Migration runner: `scripts/run-migrations.js`
- Migration files: `src/backend/migrations/*.js`
- Models: `src/backend/models/*.js`
- Database setup: `scripts/setup-postgresql.js`

