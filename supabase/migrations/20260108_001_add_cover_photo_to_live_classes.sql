-- Add cover_photo_url column to live_classes table
-- This allows standalone live classes to have cover images like courses

ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;

COMMENT ON COLUMN live_classes.cover_photo_url IS 'Cover image URL for the live class (stored in course-covers bucket)';
