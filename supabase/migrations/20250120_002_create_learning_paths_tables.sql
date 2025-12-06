-- =====================================================
-- LEARNING PATHS TABLES MIGRATION
-- =====================================================
-- This migration creates tables for Learning Paths
-- Learning Paths are collections of courses that can be
-- purchased as a bundle (similar to individual courses)
-- =====================================================

-- 1. Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_photo_url TEXT, -- Cover image URL (matches courses table naming)
  gradient TEXT, -- CSS gradient class (e.g., 'from-purple-700 to-pink-700')
  category TEXT DEFAULT 'business-entrepreneurship', -- Category for filtering/grouping
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert', 'mastery')), -- Difficulty level
  instructor TEXT, -- Primary instructor or instructor name
  duration TEXT, -- e.g., '30 days', '4 weeks'
  estimated_course_count INTEGER DEFAULT 0,
  purchase_price DECIMAL(10, 2) DEFAULT 0, -- Price in NGN
  access_type TEXT DEFAULT 'purchase' CHECK (access_type IN ('free', 'purchase')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create learning_path_courses table (junction table)
-- Links learning paths to courses with order
CREATE TABLE IF NOT EXISTS learning_path_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0, -- Order of course in the path
  is_required BOOLEAN DEFAULT true, -- Whether this course is required for path completion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(learning_path_id, course_id) -- Prevent duplicate course in same path
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON learning_paths(status);
CREATE INDEX IF NOT EXISTS idx_learning_paths_access_type ON learning_paths(access_type);
CREATE INDEX IF NOT EXISTS idx_learning_paths_category ON learning_paths(category);
CREATE INDEX IF NOT EXISTS idx_learning_paths_level ON learning_paths(level);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created_at ON learning_paths(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_path_id ON learning_path_courses(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_course_id ON learning_path_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_order ON learning_path_courses(learning_path_id, order_index);

-- 4. Enable Row Level Security
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for learning_paths
-- Public read access for published paths
CREATE POLICY "Anyone can view published learning paths" ON learning_paths
  FOR SELECT USING (status = 'published');

-- Users can view their own draft paths (if created_by matches)
-- Note: This policy allows users to see their own drafts, but admins can see all via the admin policy
CREATE POLICY "Users can view own draft learning paths" ON learning_paths
  FOR SELECT USING (
    auth.uid() = created_by AND status = 'draft'
  );

-- Admins can do everything (view, insert, update, delete)
CREATE POLICY "Admins can view all learning paths" ON learning_paths
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert learning paths" ON learning_paths
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update learning paths" ON learning_paths
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete learning paths" ON learning_paths
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 6. Create RLS policies for learning_path_courses
-- Public read access for courses in published paths
CREATE POLICY "Anyone can view courses in published paths" ON learning_path_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_paths 
      WHERE learning_paths.id = learning_path_courses.learning_path_id 
      AND learning_paths.status = 'published'
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all learning path courses" ON learning_path_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_paths_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updated_at
CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_paths_updated_at();

-- 9. Create function to update estimated_course_count
CREATE OR REPLACE FUNCTION update_learning_path_course_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE learning_paths
    SET estimated_course_count = (
      SELECT COUNT(*) FROM learning_path_courses
      WHERE learning_path_id = NEW.learning_path_id
    )
    WHERE id = NEW.learning_path_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE learning_paths
    SET estimated_course_count = (
      SELECT COUNT(*) FROM learning_path_courses
      WHERE learning_path_id = OLD.learning_path_id
    )
    WHERE id = OLD.learning_path_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to auto-update course count
CREATE TRIGGER update_learning_path_course_count_trigger
  AFTER INSERT OR DELETE ON learning_path_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_path_course_count();

-- 11. Add comments for documentation
COMMENT ON TABLE learning_paths IS 'Learning paths are collections of courses that can be purchased as bundles';
COMMENT ON TABLE learning_path_courses IS 'Junction table linking learning paths to courses with ordering';
COMMENT ON COLUMN learning_paths.cover_photo_url IS 'Cover image URL for the learning path (matches courses table naming)';
COMMENT ON COLUMN learning_paths.category IS 'Category for filtering and grouping learning paths';
COMMENT ON COLUMN learning_paths.level IS 'Difficulty level: beginner, intermediate, advanced, expert, mastery';
COMMENT ON COLUMN learning_paths.instructor IS 'Primary instructor or instructor name for the learning path';
COMMENT ON COLUMN learning_paths.purchase_price IS 'Price in NGN for purchasing the entire learning path';
COMMENT ON COLUMN learning_paths.access_type IS 'free: accessible to all, purchase: requires purchase';
COMMENT ON COLUMN learning_path_courses.order_index IS 'Order of course within the learning path';
COMMENT ON COLUMN learning_path_courses.is_required IS 'Whether this course is required for path completion';

-- =====================================================
-- NOTES
-- =====================================================
-- Learning Paths can be purchased via product_purchases table:
-- - product_type = 'learning_path'
-- - product_id = learning_paths.id
-- - When purchased, user gets access to all courses in the path
--
-- Access control for Learning Paths:
-- 1. Check if path is free (access_type = 'free') → Grant access
-- 2. Check product_purchases for buyer_id + product_id + product_type='learning_path'
-- 3. Verify payment_status = 'success' and access_granted = true
-- 4. If access granted, user can access all courses in the path
-- =====================================================

