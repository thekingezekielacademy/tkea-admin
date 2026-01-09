-- Add support for multiple videos in standalone live classes
-- Similar to course_videos, but for standalone live classes

CREATE TABLE IF NOT EXISTS standalone_live_class_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_title TEXT,
  video_description TEXT,
  duration TEXT,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(live_class_id, order_index)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_standalone_videos_live_class_id 
  ON standalone_live_class_videos(live_class_id);

CREATE INDEX IF NOT EXISTS idx_standalone_videos_order 
  ON standalone_live_class_videos(live_class_id, order_index);

-- Add RLS policies
ALTER TABLE standalone_live_class_videos ENABLE ROW LEVEL SECURITY;

-- Public can view all standalone live class videos
DROP POLICY IF EXISTS "Public can view standalone live class videos" ON standalone_live_class_videos;
CREATE POLICY "Public can view standalone live class videos" 
  ON standalone_live_class_videos
  FOR SELECT 
  USING (true);

-- Admins can manage standalone live class videos
DROP POLICY IF EXISTS "Admins can manage standalone live class videos" ON standalone_live_class_videos;
CREATE POLICY "Admins can manage standalone live class videos" 
  ON standalone_live_class_videos
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

COMMENT ON TABLE standalone_live_class_videos IS 'Videos for standalone live classes (not tied to courses)';
