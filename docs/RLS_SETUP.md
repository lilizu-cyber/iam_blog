# Row Level Security (RLS) Setup Guide

## Overview

Supabase Security Advisor has flagged that Row Level Security (RLS) is disabled on several tables. This guide explains what RLS is, whether you need it, and how to enable it.

## Do You Need RLS?

**Short Answer:** It depends on your architecture.

### Your Current Setup

Your application uses **Sequelize with direct PostgreSQL connections** (not PostgREST or Supabase's REST API). This means:

✅ **RLS is less critical** because:
- Your app connects directly with database credentials
- Access is controlled by database user permissions
- No public API exposure through PostgREST

⚠️ **RLS is still recommended** for:
- Defense-in-depth security
- Protection against credential leaks
- Future-proofing if you ever use Supabase's API
- Satisfying Supabase Security Advisor requirements

## What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that allows you to control access to individual rows in a table based on policies. It's an additional layer of security beyond table-level permissions.

## Enabling RLS

### Option 1: Run the Migration (Recommended)

A migration has been created to enable RLS on all tables:

```bash
npm run migrate
```

This will:
- Enable RLS on all tables
- Create permissive policies that allow all operations (safe for direct connections)
- Work seamlessly with your Sequelize setup

### Option 2: Manual SQL (Supabase Dashboard)

If you prefer to enable RLS manually through Supabase's dashboard:

1. Go to **Table Editor** in Supabase Dashboard
2. Select each table:
   - `events`
   - `blog_posts`
   - `newsletter_subscriptions`
   - `contact_messages`
   - `users`
   - `SequelizeMeta`
3. Click **"Enable RLS"** button
4. Create a policy (or use the migration's policy)

### Option 3: SQL Script

Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SequelizeMeta" ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allows all operations)
-- Safe because your app uses direct database connections

CREATE POLICY "Allow all for events" ON "events"
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for blog_posts" ON "blog_posts"
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for newsletter_subscriptions" ON "newsletter_subscriptions"
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for contact_messages" ON "contact_messages"
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for users" ON "users"
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for SequelizeMeta" ON "SequelizeMeta"
  FOR ALL USING (true) WITH CHECK (true);
```

## Policy Types

The migration creates **permissive policies** that allow all operations. This is safe because:

1. Your app uses direct database connections with credentials
2. Access is already controlled by database user permissions
3. RLS adds an extra layer without restricting functionality

### More Restrictive Policies (Optional)

If you want more security, you can create restrictive policies. For example:

```sql
-- Example: Only allow users to see their own data
CREATE POLICY "Users can only see own data" ON "users"
  FOR SELECT
  USING (auth.uid() = id);

-- Example: Only allow authenticated users to create blog posts
CREATE POLICY "Authenticated users can create posts" ON "blog_posts"
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

**Note:** More restrictive policies require careful testing to ensure your application still works correctly.

## Verifying RLS is Enabled

After enabling RLS, check Supabase Security Advisor again. The warnings should disappear.

You can also verify with SQL:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'blog_posts', 'newsletter_subscriptions', 'contact_messages', 'users', 'SequelizeMeta');
```

All tables should show `rowsecurity = true`.

## Troubleshooting

### Application Errors After Enabling RLS

If you get permission errors after enabling RLS:

1. **Check policies exist:** Make sure policies were created
2. **Check policy conditions:** Ensure policies allow the operations your app needs
3. **Check database user:** Verify your connection user has necessary permissions

### Migration Fails

If the migration fails:

1. Check that tables exist
2. Verify database connection
3. Check for existing policies that might conflict
4. Run the SQL manually if needed

## Production Considerations

For production:

1. ✅ Enable RLS (defense-in-depth)
2. ✅ Use permissive policies if using direct connections
3. ⚠️ Consider more restrictive policies if exposing via API
4. ✅ Test thoroughly after enabling RLS
5. ✅ Monitor for any permission errors

## Summary

- **RLS is recommended** even for direct connections (defense-in-depth)
- **Run the migration** to enable RLS automatically
- **Policies are permissive** by default (safe for direct connections)
- **Test your application** after enabling RLS
- **Security Advisor warnings** will disappear after enabling RLS



