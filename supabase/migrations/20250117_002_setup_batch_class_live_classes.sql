-- =====================================================
-- SETUP LIVE CLASSES FOR BATCH CLASS SYSTEM
-- =====================================================
-- This migration creates live_classes for the 5 batch classes
-- Run this AFTER creating batch_classes and ensuring courses exist
-- =====================================================

-- Create live_classes for each batch class
-- Option 1: Link to existing courses (if courses exist with matching titles)
INSERT INTO live_classes (course_id, is_active, access_type, title)
SELECT 
  c.id as course_id,
  true as is_active,
  CASE 
    WHEN bc.class_name = 'CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE' THEN 'free'
    ELSE 'paid'
  END as access_type,
  bc.class_name as title
FROM batch_classes bc
LEFT JOIN courses c ON c.title = bc.class_name
WHERE bc.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM live_classes lc 
  WHERE (lc.course_id = c.id OR lc.title = bc.class_name)
)
ON CONFLICT DO NOTHING;

-- Option 2: Create standalone live_classes if courses don't exist
-- This creates live_classes with titles matching batch_class names
INSERT INTO live_classes (title, is_active, access_type)
SELECT 
  class_name as title,
  true as is_active,
  CASE 
    WHEN class_name = 'CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE' THEN 'free'
    ELSE 'paid'
  END as access_type
FROM batch_classes
WHERE is_active = true
AND NOT EXISTS (
  SELECT 1 FROM live_classes lc 
  WHERE lc.title = batch_classes.class_name
)
ON CONFLICT DO NOTHING;

-- Update batch_classes to link to live_classes (if not already linked)
UPDATE batch_classes bc
SET course_id = lc.course_id
FROM live_classes lc
WHERE (lc.title = bc.class_name OR lc.course_id IS NOT NULL)
AND bc.course_id IS NULL
AND EXISTS (
  SELECT 1 FROM courses c 
  WHERE c.id = lc.course_id 
  AND c.title = bc.class_name
);

-- Verify setup
DO $$
DECLARE
  live_class_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO live_class_count
  FROM live_classes lc
  INNER JOIN batch_classes bc ON (
    lc.title = bc.class_name OR 
    (lc.course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = lc.course_id 
      AND c.title = bc.class_name
    ))
  )
  WHERE bc.is_active = true
  AND lc.is_active = true;
  
  IF live_class_count < 5 THEN
    RAISE WARNING 'Only % live_classes found for batch classes. Expected 5.', live_class_count;
  ELSE
    RAISE NOTICE '✅ Successfully created/verified % live_classes for batch classes', live_class_count;
  END IF;
END $$;

-- Comments
COMMENT ON TABLE live_classes IS 'Live classes can be linked to courses OR standalone. Batch classes require live_classes to exist.';
