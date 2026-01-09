-- Add access_type to live_classes table
-- FREE: All classes accessible for free, forever
-- PAID: First 2 classes free, rest require payment

ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'paid' CHECK (access_type IN ('free', 'paid'));

COMMENT ON COLUMN live_classes.access_type IS 'Access type: free (all classes free forever) or paid (first 2 classes free, rest require payment)';

-- Update existing standalone live classes to default to 'paid'
UPDATE live_classes 
SET access_type = 'paid' 
WHERE course_id IS NULL AND access_type IS NULL;

-- Update existing course-based live classes to default to 'paid'
UPDATE live_classes 
SET access_type = 'paid' 
WHERE course_id IS NOT NULL AND access_type IS NULL;
