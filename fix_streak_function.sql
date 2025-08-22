-- Fix for the update_user_xp_and_streak function
-- This resolves the syntax error and improves streak logic

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS update_user_xp_and_streak(UUID, INTEGER, TEXT);

-- Create the corrected XP update function
CREATE OR REPLACE FUNCTION update_user_xp_and_streak(
  user_id UUID,
  xp_to_add INTEGER,
  activity_type TEXT DEFAULT 'general'
)
RETURNS JSON AS $$
DECLARE
  current_streak INTEGER;
  current_xp INTEGER;
  last_activity DATE;
  streak_bonus INTEGER;
  total_xp_gained INTEGER;
  new_streak INTEGER;
BEGIN
  -- Get current user stats
  SELECT xp, streak_count, last_activity_date 
  INTO current_xp, current_streak, last_activity
  FROM profiles 
  WHERE id = user_id;
  
  -- Handle NULL values
  IF current_xp IS NULL THEN current_xp := 0; END IF;
  IF current_streak IS NULL THEN current_streak := 0; END IF;
  IF last_activity IS NULL THEN last_activity := CURRENT_DATE - INTERVAL '2 days'; END IF;
  
  -- Calculate streak bonus (10 × streak_count)
  streak_bonus := current_streak * 10;
  
  -- Check if streak should continue or reset
  IF last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Yesterday - continue streak
    new_streak := current_streak + 1;
  ELSIF last_activity = CURRENT_DATE THEN
    -- Already active today - maintain streak
    new_streak := current_streak;
  ELSE
    -- Older than yesterday - reset streak
    new_streak := 1;
  END IF;
  
  -- Calculate total XP gained
  total_xp_gained := xp_to_add + streak_bonus;
  
  -- Update user profile
  UPDATE profiles 
  SET 
    xp = current_xp + total_xp_gained,
    streak_count = new_streak,
    last_activity_date = CURRENT_DATE
  WHERE id = user_id;
  
  -- Return updated stats
  RETURN json_build_object(
    'xp_gained', total_xp_gained,
    'base_xp', xp_to_add,
    'streak_bonus', streak_bonus,
    'new_streak', new_streak,
    'new_total_xp', current_xp + total_xp_gained,
    'activity_type', activity_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_xp_and_streak(UUID, INTEGER, TEXT) TO authenticated;

-- Test the function (optional - remove in production)
-- SELECT update_user_xp_and_streak('your-user-id-here', 50, 'lesson_completed');
