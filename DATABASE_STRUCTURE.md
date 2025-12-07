# Database Structure for Blog Posts

## Overview

Your blog posts are stored in **two main places** in PostgreSQL:

1. **`blog_posts` table** - The read model (current state of all posts)
2. **`events` table** - The event store (immutable history of all changes)

## 1. Blog Posts Table (Read Model)

**Table Name:** `blog_posts`

**Purpose:** This is where all current blog post data is stored. It's optimized for queries and is what your application reads from.

**Key Columns:**
- `post_id` (PRIMARY KEY) - Unique identifier for each post
- `title` - Post title
- `content` - Full post content (TEXT)
- `excerpt` - Post excerpt/summary
- `slug` - URL-friendly slug (UNIQUE)
- `author_id`, `author_name`, `author_email` - Author information
- `category_id`, `category_name` - Category information
- `tags` - Array of tags
- `status` - Enum: 'draft', 'published', 'archived', 'deleted'
- `published_at` - When the post was published
- `created_at`, `updated_at` - Timestamps
- `view_count`, `like_count`, `share_count` - Engagement metrics
- `is_security_related`, `is_iam_related` - Content flags
- `popularity_score` - Calculated popularity score

**Location in Code:**
- Model: `src/backend/models/BlogPost.js`
- Updated by: `src/backend/readModels/projections/BlogPostProjection.js`

## 2. Events Table (Event Store)

**Table Name:** `events`

**Purpose:** This stores all events (commands) that happened. It's the immutable source of truth.

**Key Columns:**
- `event_id` (PRIMARY KEY) - Unique event identifier
- `stream_id` - Stream identifier (e.g., `blogpost-<post-id>`)
- `event_type` - Type of event (e.g., 'BlogPostCreated', 'BlogPostPublished')
- `event_number` - Sequence number within the stream
- `data` - JSONB containing event data
- `metadata` - JSONB containing metadata
- `timestamp` - When the event occurred

**Event Types for Blog Posts:**
- `BlogPostCreated` - When a post is first created
- `BlogPostUpdated` - When a post is updated
- `BlogPostPublished` - When a post is published
- `BlogPostUnpublished` - When a post is unpublished
- `BlogPostDeleted` - When a post is deleted
- `TagAddedToBlogPost` - When a tag is added
- `TagRemovedFromBlogPost` - When a tag is removed
- `BlogPostViewed` - When a post is viewed

**Location in Code:**
- Event Store: `src/backend/infrastructure/PostgresEventStore.js`
- Events: `src/backend/domain/events/BlogEvents.js`

## How Data Flows

```
1. User creates post via API
   ↓
2. Command Handler processes command
   ↓
3. Event is saved to EVENTS table
   ↓
4. Event is published to Event Bus
   ↓
5. Projection listens to event
   ↓
6. Projection updates BLOG_POSTS table
   ↓
7. Application queries BLOG_POSTS table
```

## SQL Queries

### Get All Published Posts
```sql
SELECT * FROM blog_posts 
WHERE status = 'published' 
ORDER BY published_at DESC;
```

### Get All Posts (Including Drafts)
```sql
SELECT * FROM blog_posts 
ORDER BY created_at DESC;
```

### Get Posts by Category
```sql
SELECT * FROM blog_posts 
WHERE category_id = 'security' 
AND status = 'published'
ORDER BY published_at DESC;
```

### Get Events for a Specific Post
```sql
SELECT * FROM events 
WHERE stream_id = 'blogpost-<POST_ID>' 
ORDER BY event_number;
```

### Get All Blog Post Events
```sql
SELECT * FROM events 
WHERE stream_id LIKE 'blogpost-%' 
ORDER BY timestamp DESC;
```

### Count Posts by Status
```sql
SELECT status, COUNT(*) as count 
FROM blog_posts 
GROUP BY status;
```

## Accessing the Database

### Using psql (Command Line)
```bash
psql -U postgres -d iam_blog_db
```

### Using pgAdmin or DBeaver
- Host: localhost
- Port: 5432
- Database: iam_blog_db
- Username: postgres
- Password: postgres (or from your .env file)

### Using Node.js Scripts
Run the diagnostic scripts:
```bash
# Show database structure
node scripts/show-database-structure.js

# Check posts in database
node scripts/check-posts-in-db.js

# Check events
node scripts/check-events.js
```

## Important Notes

1. **Read Model (`blog_posts`)**: This is what your application reads from. It's updated by projections automatically when events occur.

2. **Event Store (`events`)**: This is the source of truth. All changes are recorded here first, then projections update the read model.

3. **CQRS Pattern**: This architecture uses Command Query Responsibility Segregation:
   - **Commands** (writes) → Events → Event Store
   - **Queries** (reads) → Read Model (blog_posts table)

4. **Projections**: If projections fail, events will be in the event store but not in the read model. Check backend logs for projection errors.

## Troubleshooting

### Posts Not Showing Up?

1. **Check Event Store**: Are events being created?
   ```sql
   SELECT * FROM events WHERE stream_id LIKE 'blogpost-%';
   ```

2. **Check Read Model**: Are posts in the database?
   ```sql
   SELECT * FROM blog_posts;
   ```

3. **Check Projections**: Look for errors in backend logs when events are published.

4. **Check Status**: Make sure posts are published:
   ```sql
   SELECT * FROM blog_posts WHERE status = 'published';
   ```

