# Database Indexing Guide

This document describes the database indexing strategy, verification, and optimization for the IAM Blog application.

## Overview

Proper indexing is critical for database performance. This guide covers:
- **Index verification** - Ensure all required indexes exist
- **Query performance analysis** - Identify slow queries
- **Index optimization** - Add missing indexes based on query patterns

## Index Strategy

### Blog Posts Table

The `blog_posts` table has the following indexes:

#### Single Column Indexes
- **`blog_posts_slug_unique`** - Unique index on `slug` (for fast lookups)
- **`blog_posts_author_id_idx`** - Index on `author_id` (for author queries)
- **`blog_posts_status_idx`** - Index on `status` (for filtering by status)
- **`blog_posts_published_at_idx`** - Index on `published_at` (for date sorting)
- **`blog_posts_is_security_related_idx`** - Index on `is_security_related` (for security posts)
- **`blog_posts_is_iam_related_idx`** - Index on `is_iam_related` (for IAM posts)
- **`blog_posts_popularity_score_idx`** - Index on `popularity_score` (for popular posts)
- **`blog_posts_category_id_idx`** - Index on `category_id` (for category filtering)

#### Composite Indexes (Optimized for Common Queries)
- **`idx_blog_posts_status_published`** - `(status, published_at DESC)` - For published posts listing
- **`idx_blog_posts_security_status_published`** - `(is_security_related, status, published_at DESC)` - For security posts page
- **`idx_blog_posts_iam_status_published`** - `(is_iam_related, status, published_at DESC)` - For IAM posts page
- **`idx_blog_posts_category_status_published`** - `(category_id, status, published_at DESC)` - For category pages
- **`idx_blog_posts_status_popularity`** - `(status, popularity_score DESC)` - For popular posts
- **`idx_blog_posts_author_status_created`** - `(author_id, status, created_at DESC)` - For author posts

#### Special Indexes
- **`blog_posts_tags_idx`** - GIN index on `tags` array (for tag queries)
- **`blog_posts_search_text_idx`** - GIN index on `search_text` (full-text search)

### Other Tables

#### Users Table
- **`users_username_unique`** - Unique index on `username`
- **`users_email_unique`** - Unique index on `email`

#### Newsletter Subscriptions Table
- **`newsletter_subscriptions_email_unique`** - Unique index on `email`
- **`newsletter_subscriptions_status_idx`** - Index on `status`
- **`newsletter_subscriptions_subscribed_at_idx`** - Index on `subscribed_at`

#### Contact Messages Table
- **`contact_messages_email_idx`** - Index on `email`
- **`contact_messages_status_idx`** - Index on `status`
- **`contact_messages_priority_idx`** - Index on `priority`
- **`contact_messages_submitted_at_idx`** - Index on `submitted_at`

#### Events Table
- **`events_stream_id_event_number_unique`** - Unique composite index on `(stream_id, event_number)`
- **`events_stream_id_idx`** - Index on `stream_id`
- **`events_event_type_idx`** - Index on `event_type`
- **`events_timestamp_idx`** - Index on `timestamp`

## Verification

### Verify All Indexes

Check that all expected indexes exist:

```bash
npm run indexes:verify
```

This script will:
- Connect to the database
- Check each table for expected indexes
- Report missing indexes
- Show any unexpected indexes

**Example Output:**
```
[INFO] Verifying indexes for table: blog_posts
[✅]   ✓ blog_posts_slug_unique
[✅]   ✓ blog_posts_author_id_idx
[❌]   ✗ idx_blog_posts_status_published - MISSING
...
```

### Create Missing Indexes

If indexes are missing, create them:

```bash
npm run indexes:create
```

This script will:
- Check which indexes are missing
- Create only the missing indexes
- Skip indexes that already exist

**Note:** This script is safe to run multiple times (uses `IF NOT EXISTS`).

## Performance Analysis

### Analyze Query Performance

Analyze common queries to identify performance issues:

```bash
npm run indexes:analyze
```

This script will:
- Run `EXPLAIN ANALYZE` on common queries
- Show execution time and planning time
- Identify queries using sequential scans (need indexes)
- Flag slow queries (>100ms)

**Example Output:**
```
Analyzing: Get Published Posts
  Execution Time: 12.45 ms
  Planning Time: 0.23 ms
  Total Time: 12.68 ms
  ✓ Uses Index: idx_blog_posts_status_published
  ✓ Good performance (<50ms)

Analyzing: Get IAM Posts
  Execution Time: 145.32 ms
  Planning Time: 0.45 ms
  Total Time: 145.77 ms
  ⚠️  Uses Sequential Scan (consider adding index)
  ⚠️  Slow query (>100ms)
```

### Common Queries Analyzed

1. **Get Published Posts** - Main blog listing
2. **Get IAM Posts** - IAM posts page
3. **Get Security Posts** - Security posts page
4. **Get Popular Posts** - Popular posts query
5. **Get Posts by Author** - Author posts query
6. **Get Posts by Category** - Category posts query
7. **Search Posts** - Text search query
8. **Get Post by Slug** - Single post lookup

## Index Best Practices

### 1. Composite Indexes

Use composite indexes for queries with multiple WHERE conditions and ORDER BY:

```sql
-- Query pattern
WHERE status = 'published' AND is_iam_related = true
ORDER BY published_at DESC

-- Optimal index
CREATE INDEX idx_blog_posts_iam_status_published 
ON blog_posts(is_iam_related, status, published_at DESC);
```

**Column Order Matters:**
- Put equality conditions first (`is_iam_related`, `status`)
- Put range/ordering columns last (`published_at DESC`)

### 2. Covering Indexes

Include frequently selected columns in indexes to avoid table lookups:

```sql
-- If you often SELECT only title and published_at
CREATE INDEX idx_blog_posts_status_published_covering 
ON blog_posts(status, published_at DESC) 
INCLUDE (title, excerpt);
```

### 3. Partial Indexes

Create indexes only for relevant rows (e.g., only published posts):

```sql
-- Only index published posts
CREATE INDEX idx_blog_posts_published_only 
ON blog_posts(published_at DESC) 
WHERE status = 'published';
```

### 4. GIN Indexes for Arrays

Use GIN indexes for array columns and full-text search:

```sql
-- For tag queries
CREATE INDEX blog_posts_tags_idx 
ON blog_posts USING GIN (tags);

-- For full-text search
CREATE INDEX blog_posts_search_text_idx 
ON blog_posts USING GIN (to_tsvector('english', COALESCE(search_text, '')));
```

## Monitoring

### Check Index Usage

Query to see which indexes are being used:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Check Unused Indexes

Find indexes that are never used:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
  AND indexname NOT LIKE '%_unique'
ORDER BY tablename, indexname;
```

### Check Index Size

Monitor index sizes:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Maintenance

### Reindex

Rebuild indexes to reclaim space and improve performance:

```sql
-- Reindex a specific table
REINDEX TABLE blog_posts;

-- Reindex all tables
REINDEX DATABASE iam_blog_db;
```

### Analyze Tables

Update statistics for the query planner:

```sql
-- Analyze a specific table
ANALYZE blog_posts;

-- Analyze all tables
ANALYZE;
```

### Vacuum

Reclaim space and update statistics:

```sql
-- Vacuum a specific table
VACUUM ANALYZE blog_posts;

-- Vacuum all tables
VACUUM ANALYZE;
```

## Troubleshooting

### Slow Queries

1. **Run EXPLAIN ANALYZE:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM blog_posts WHERE status = 'published';
   ```

2. **Check for Sequential Scans:**
   - If you see `Seq Scan`, consider adding an index
   - Look for `Index Scan` or `Index Only Scan` (good)

3. **Check Execution Time:**
   - < 10ms: Excellent
   - 10-50ms: Good
   - 50-100ms: Moderate (consider optimization)
   - > 100ms: Slow (needs optimization)

### Missing Indexes

If `indexes:verify` reports missing indexes:

1. **Check migration status:**
   ```bash
   npm run migrate:status
   ```

2. **Run migrations:**
   ```bash
   npm run migrate:up
   ```

3. **Create missing indexes manually:**
   ```bash
   npm run indexes:create
   ```

### Index Not Used

If a query doesn't use an expected index:

1. **Check statistics are up to date:**
   ```sql
   ANALYZE blog_posts;
   ```

2. **Check index condition matches query:**
   - Index column order must match query pattern
   - Data types must match

3. **Check for function calls:**
   - `WHERE LOWER(title) = 'test'` won't use `title` index
   - Use `WHERE title ILIKE 'test'` instead

## Production Checklist

- [x] All required indexes created
- [x] Composite indexes for common query patterns
- [x] GIN indexes for arrays and full-text search
- [x] Indexes verified with `indexes:verify`
- [x] Query performance analyzed with `indexes:analyze`
- [x] No sequential scans on common queries
- [x] All queries execute in < 100ms
- [ ] Index usage monitored regularly
- [ ] Unused indexes identified and removed
- [ ] Statistics updated regularly (ANALYZE)
- [ ] Indexes rebuilt periodically (REINDEX)

## Related Files

- Index verification: `scripts/verify-indexes.js`
- Index creation: `scripts/create-missing-indexes.js`
- Performance analysis: `scripts/analyze-query-performance.js`
- Migrations: `src/backend/migrations/`
- Database models: `src/backend/models/`



