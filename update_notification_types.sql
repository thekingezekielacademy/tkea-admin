-- Update notification_type constraint to allow new types
ALTER TABLE batch_class_notifications 
DROP CONSTRAINT IF EXISTS batch_class_notifications_notification_type_check;

ALTER TABLE batch_class_notifications
ADD CONSTRAINT batch_class_notifications_notification_type_check 
CHECK (notification_type IN ('1_hour', 'class_starts'));
