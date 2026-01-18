-- ============================================
-- BLOG POSTS MIGRATIONS
-- Apply these in Supabase SQL Editor
-- ============================================

-- Migration 1: Update blog_posts schema (from content to body)
-- File: supabase/migrations/20250813000000_update_blog_posts_schema.sql

-- First, add new columns that match user requirements (allow NULL initially)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS header TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS conclusion TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image TEXT;

-- Add additional relevant fields
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS viewers INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 1;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Migrate data from old columns to new columns (only if old columns exist)
DO $$
BEGIN
  -- Migrate excerpt -> header
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog_posts' AND column_name = 'excerpt') THEN
    UPDATE blog_posts SET header = COALESCE(header, excerpt) WHERE header IS NULL;
  END IF;
  
  -- Migrate content -> body
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog_posts' AND column_name = 'content') THEN
    UPDATE blog_posts SET body = COALESCE(body, content) WHERE body IS NULL;
  END IF;
  
  -- Migrate featured_image_url -> image
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog_posts' AND column_name = 'featured_image_url') THEN
    UPDATE blog_posts SET image = COALESCE(image, featured_image_url) WHERE image IS NULL;
  END IF;
END $$;

-- Set defaults for any remaining NULL values
UPDATE blog_posts SET 
  header = COALESCE(header, ''),
  body = COALESCE(body, ''),
  conclusion = COALESCE(conclusion, '')
WHERE header IS NULL OR body IS NULL;

-- Make the new required fields NOT NULL after setting defaults
ALTER TABLE blog_posts ALTER COLUMN header SET DEFAULT '';
ALTER TABLE blog_posts ALTER COLUMN body SET DEFAULT '';
ALTER TABLE blog_posts ALTER COLUMN header SET NOT NULL;
ALTER TABLE blog_posts ALTER COLUMN body SET NOT NULL;

-- Now drop the old columns that are no longer needed
ALTER TABLE blog_posts DROP COLUMN IF EXISTS slug;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_keywords;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS featured_image_url;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_blog_posts_header ON blog_posts(header);
CREATE INDEX IF NOT EXISTS idx_blog_posts_viewers ON blog_posts(viewers);
CREATE INDEX IF NOT EXISTS idx_blog_posts_likes ON blog_posts(likes);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_reading_time ON blog_posts(reading_time);

-- Update RLS policies to work with new schema
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Add policy for viewing blog post details (for view counting)
CREATE POLICY "Public can view blog post details" ON blog_posts
  FOR SELECT USING (true);

-- Add policy for updating view counts
CREATE POLICY "Public can update view counts" ON blog_posts
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================
-- Migration 2: Add YouTube link and button fields
-- File: supabase/migrations/20250814000000_add_youtube_link_to_blog_posts.sql
-- ============================================

-- Add youtube_link field to blog_posts table for embedding YouTube videos
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS youtube_link TEXT;
COMMENT ON COLUMN blog_posts.youtube_link IS 'YouTube video URL or ID for displaying video player in blog post';

-- Add button fields to blog_posts table for displaying CTA buttons before conclusion
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS button_url TEXT;
COMMENT ON COLUMN blog_posts.button_text IS 'Text to display on the CTA button (shown before conclusion section)';
COMMENT ON COLUMN blog_posts.button_url IS 'URL to navigate to when button is clicked';

-- Add button click count to track CTA button clicks
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS button_click_count INTEGER DEFAULT 0;
COMMENT ON COLUMN blog_posts.button_click_count IS 'Number of times the CTA button has been clicked';

-- Create index for analytics
CREATE INDEX IF NOT EXISTS idx_blog_posts_button_click_count ON blog_posts(button_click_count);

-- Ensure RLS policies allow public updates to count fields
DROP POLICY IF EXISTS "Public can update counts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update view counts" ON blog_posts;
DROP POLICY IF EXISTS "Public can update view counts" ON blog_posts;

-- Create policy that allows anyone (including anonymous) to update count fields for published posts
CREATE POLICY "Public can update counts" ON blog_posts
  FOR UPDATE 
  USING (
    status = 'published' OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) OR
    auth.uid() = author_id
  )
  WITH CHECK (
    status = 'published' OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) OR
    auth.uid() = author_id
  );
