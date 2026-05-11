-- Migration: Direct publish for user stories
-- Adds moderation_status column and supporting fields
-- Changes publish flow from pending_review → immediate publish + moderation

-- 1. Add new columns
ALTER TABLE user_stories
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (moderation_status IN ('unreviewed', 'reviewed', 'flagged'));

ALTER TABLE user_stories
  ADD COLUMN IF NOT EXISTS hidden_reason text;

ALTER TABLE user_stories
  ADD COLUMN IF NOT EXISTS hidden_by_admin boolean NOT NULL DEFAULT false;

-- 2. Update status constraints to include 'hidden'
-- If there's an existing CHECK constraint on status, drop and recreate
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_stories' AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%status%'
  ) THEN
    ALTER TABLE user_stories DROP CONSTRAINT IF EXISTS user_stories_status_check;
  END IF;
END $$;

ALTER TABLE user_stories
  ADD CONSTRAINT user_stories_status_check
  CHECK (status IN ('draft', 'published', 'hidden', 'pending_review', 'rejected'));

-- 3. Index for moderation queries
CREATE INDEX IF NOT EXISTS idx_user_stories_moderation_status
  ON user_stories (moderation_status)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_user_stories_published
  ON user_stories (status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_user_stories_hidden
  ON user_stories (updated_at DESC)
  WHERE status = 'hidden';

-- 4. Add reported_at column for flagged stories
ALTER TABLE user_stories
  ADD COLUMN IF NOT EXISTS reported_at timestamptz;

-- 5. RLS: Update policies for the new model

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read published stories" ON user_stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON user_stories;
DROP POLICY IF EXISTS "Users can update own stories" ON user_stories;
DROP POLICY IF EXISTS "Admins can update all stories" ON user_stories;

-- Public read: only published stories
CREATE POLICY "Public can read published stories" ON user_stories
  FOR SELECT
  USING (status = 'published');

-- Authenticated users: read their own stories regardless of status
CREATE POLICY "Users can read own stories" ON user_stories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins: read all stories
CREATE POLICY "Admins can read all stories" ON user_stories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email IN ('cheng108@me.com', 'offroady.admin@gmail.com', 'admin@offroady.app')
    )
  );

-- Insert: authenticated users create their own
CREATE POLICY "Users can insert own stories" ON user_stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update: users can edit own stories (with restrictions)
CREATE POLICY "Users can update own stories" ON user_stories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Cannot change user_id
    AND user_id = auth.uid()
    -- Cannot set moderation_status (enforced in app, RLS is second layer)
  );

-- Admins can update any story (for hide/mark-reviewed operations)
CREATE POLICY "Admins can update all stories" ON user_stories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email IN ('cheng108@me.com', 'offroady.admin@gmail.com', 'admin@offroady.app')
    )
  );

-- 6. Storage: photos bucket RLS
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read story photos" ON storage.objects;

CREATE POLICY "Public can read story photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'story-photos');

CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'story-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'story-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can manage all photos" ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email IN ('cheng108@me.com', 'offroady.admin@gmail.com', 'admin@offroady.app')
    )
  );
