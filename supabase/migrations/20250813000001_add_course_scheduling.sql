-- Add course scheduling fields
-- This migration adds scheduling functionality to courses

-- Add scheduling columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));

-- Add index for scheduled courses queries
CREATE INDEX IF NOT EXISTS idx_courses_scheduled_for ON courses(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_is_scheduled ON courses(is_scheduled);

-- Update existing courses to have proper status
UPDATE courses SET status = 'published' WHERE status IS NULL AND is_scheduled = false;
UPDATE courses SET status = 'draft' WHERE status IS NULL AND is_scheduled = true;

-- Create function to automatically update is_scheduled based on scheduled_for
CREATE OR REPLACE FUNCTION update_course_scheduling_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update is_scheduled based on scheduled_for
  IF NEW.scheduled_for IS NOT NULL THEN
    NEW.is_scheduled = true;
    NEW.status = 'scheduled';
  ELSE
    NEW.is_scheduled = false;
    -- Only change status to draft if it was scheduled
    IF OLD.status = 'scheduled' THEN
      NEW.status = 'draft';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update scheduling status
DROP TRIGGER IF EXISTS trigger_update_course_scheduling_status ON courses;
CREATE TRIGGER trigger_update_course_scheduling_status
  BEFORE INSERT OR UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_course_scheduling_status();

-- Create function to check if a course should be published based on schedule
CREATE OR REPLACE FUNCTION check_scheduled_courses()
RETURNS void AS $$
BEGIN
  -- Update courses that are scheduled and their time has come
  UPDATE courses 
  SET 
    status = 'published',
    is_scheduled = false,
    scheduled_for = NULL
  WHERE 
    is_scheduled = true 
    AND scheduled_for IS NOT NULL 
    AND scheduled_for <= NOW()
    AND status = 'scheduled';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to check for courses that should be published
-- Note: This would typically be handled by a cron job or similar in production
-- For now, we'll create a function that can be called manually or by a scheduled task

COMMENT ON COLUMN courses.scheduled_for IS 'When the course should be published (if scheduled)';
COMMENT ON COLUMN courses.is_scheduled IS 'Whether the course is scheduled for future publication';
COMMENT ON COLUMN courses.status IS 'Current status of the course: draft, scheduled, published, or archived';
