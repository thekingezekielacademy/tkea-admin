-- Add youtube_link field to blog_posts table for embedding YouTube videos
-- This allows blog posts to display videos using the AdvancedVideoPlayer component

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS youtube_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.youtube_link IS 'YouTube video URL or ID for displaying video player in blog post';

-- Add button fields to blog_posts table for displaying CTA buttons before conclusion
-- This allows blog posts to have a call-to-action button with custom text and URL

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS button_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN blog_posts.button_text IS 'Text to display on the CTA button (shown before conclusion section)';
COMMENT ON COLUMN blog_posts.button_url IS 'URL to navigate to when button is clicked';

-- Add button_click_count field to blog_posts table for tracking CTA button clicks
-- This allows tracking how many times users click the CTA button in blog posts

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS button_click_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.button_click_count IS 'Number of times the CTA button has been clicked';

-- Create index for analytics
CREATE INDEX IF NOT EXISTS idx_blog_posts_button_click_count ON blog_posts(button_click_count);

-- Ensure RLS policies allow public updates to count fields (view_count, like_count, button_click_count)
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public can update counts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update view counts" ON blog_posts;
DROP POLICY IF EXISTS "Public can update view counts" ON blog_posts;

-- Create policy that allows anyone (including anonymous) to update count fields for published posts
-- Note: This allows updates to all fields, but application code should only update count fields
CREATE POLICY "Public can update counts" ON blog_posts
  FOR UPDATE 
  USING (
    -- Allow updates for published posts (for count tracking)
    status = 'published' OR
    -- Admins can update all posts
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) OR
    -- Authors can update their own posts
    auth.uid() = author_id
  )
  WITH CHECK (
    -- Same conditions for the updated row
    status = 'published' OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) OR
    auth.uid() = author_id
  );
