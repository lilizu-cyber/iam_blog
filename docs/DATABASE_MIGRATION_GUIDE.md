# Database Migration Guide

## Current Situation

You've switched from local PostgreSQL to Supabase. The Supabase database has the table structure but no data.

## Why Posts Are Missing

- **Old posts** were stored in your local PostgreSQL database (`localhost:5432`)
- **New database** (Supabase) is empty - tables exist but no data
- **No migration** was performed to copy data from local to Supabase

## Will Future Posts Be Stored?

✅ **YES!** Future posts will be stored correctly. Here's how:

1. **Create Post** → Event created in `events` table
2. **Projection** → Reads event and creates record in `blog_posts` table  
3. **Query** → Reads from `blog_posts` table to display posts

## Options to Restore Old Posts

### Option 1: Start Fresh (Recommended for now)
- Accept that old posts are gone
- Create new posts going forward
- They will be stored in Supabase

### Option 2: Migrate Data from Local Database
If your local database still has the data:

1. **Export from local database:**
   ```bash
   pg_dump -h localhost -U postgres -d iam_blog_db > local_backup.sql
   ```

2. **Import to Supabase:**
   - Go to Supabase Dashboard → SQL Editor
   - Or use psql to connect and import

3. **Note:** You'll need to adjust connection strings and ensure table structures match

### Option 3: Re-create Important Posts
- Manually re-create any critical posts through the admin dashboard
- Future posts will be stored automatically

## Verify System is Working

Test creating a new post:

1. **Start backend:**
   ```bash
   npm run dev:backend
   ```

2. **Create a test post** through admin dashboard

3. **Check database:**
   ```bash
   node scripts/check-database-content.js
   ```

## Next Steps

1. ✅ Verify backend can connect to Supabase
2. ✅ Create a test post to verify storage works
3. ✅ Check admin dashboard shows new posts
4. ⚠️ Decide if you want to migrate old data or start fresh



