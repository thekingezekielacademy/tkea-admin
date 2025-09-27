-- Migration functions for database setup

-- Function to create profiles table
CREATE OR REPLACE FUNCTION create_profiles_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'Profiles table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to create courses table
CREATE OR REPLACE FUNCTION create_courses_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'Courses table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to create lessons table
CREATE OR REPLACE FUNCTION create_lessons_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'Lessons table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to create user_subscriptions table
CREATE OR REPLACE FUNCTION create_user_subscriptions_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'User subscriptions table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to create user_trials table
CREATE OR REPLACE FUNCTION create_user_trials_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'User trials table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to create user_lesson_progress table
CREATE OR REPLACE FUNCTION create_user_lesson_progress_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'User lesson progress table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to create user_achievements table
CREATE OR REPLACE FUNCTION create_user_achievements_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'User achievements table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to create user_streaks table
CREATE OR REPLACE FUNCTION create_user_streaks_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'User streaks table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to create payment_attempts table
CREATE OR REPLACE FUNCTION create_payment_attempts_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'Payment attempts table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to create achievements table
CREATE OR REPLACE FUNCTION create_achievements_table()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'Achievements table creation handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to setup RLS policies
CREATE OR REPLACE FUNCTION setup_rls_policies()
RETURNS void AS $$
BEGIN
  -- This function is already handled in the main migration
  -- but we include it for consistency
  RAISE NOTICE 'RLS policies setup handled in main migration';
END;
$$ LANGUAGE plpgsql;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_courses INTEGER,
  completed_courses INTEGER,
  total_lessons INTEGER,
  completed_lessons INTEGER,
  current_streak INTEGER,
  total_xp INTEGER,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM courses) as total_courses,
    (SELECT COUNT(DISTINCT ulp.lesson_id)::INTEGER 
     FROM user_lesson_progress ulp 
     JOIN lessons l ON ulp.lesson_id = l.id 
     WHERE ulp.user_id = user_uuid AND ulp.is_completed = true) as completed_courses,
    (SELECT COUNT(*)::INTEGER FROM user_lesson_progress WHERE user_id = user_uuid) as total_lessons,
    (SELECT COUNT(*)::INTEGER FROM user_lesson_progress WHERE user_id = user_uuid AND is_completed = true) as completed_lessons,
    (SELECT COALESCE(p.streak_count, 0)::INTEGER FROM profiles p WHERE p.id = user_uuid) as current_streak,
    (SELECT COALESCE(p.xp, 0)::INTEGER FROM profiles p WHERE p.id = user_uuid) as total_xp,
    (SELECT (COALESCE(p.xp, 0) / 100 + 1)::INTEGER FROM profiles p WHERE p.id = user_uuid) as level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users INTEGER,
  total_courses INTEGER,
  total_lessons INTEGER,
  active_users INTEGER,
  subscribed_users INTEGER,
  total_revenue DECIMAL,
  monthly_revenue DECIMAL,
  completion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM profiles) as total_users,
    (SELECT COUNT(*)::INTEGER FROM courses) as total_courses,
    (SELECT COUNT(*)::INTEGER FROM lessons) as total_lessons,
    (SELECT COUNT(*)::INTEGER FROM profiles WHERE last_login >= NOW() - INTERVAL '30 days') as active_users,
    (SELECT COUNT(*)::INTEGER FROM user_subscriptions WHERE is_active = true) as subscribed_users,
    (SELECT COALESCE(SUM(amount), 0) FROM user_subscriptions WHERE is_active = true) as total_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM user_subscriptions WHERE is_active = true AND created_at >= NOW() - INTERVAL '30 days') as monthly_revenue,
    (SELECT 
      CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE is_completed = true)::DECIMAL / COUNT(*)::DECIMAL * 100)
        ELSE 0
      END
     FROM user_lesson_progress) as completion_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user access to course
CREATE OR REPLACE FUNCTION check_course_access(user_uuid UUID, course_uuid TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  course_free BOOLEAN;
  has_trial BOOLEAN;
  has_subscription BOOLEAN;
BEGIN
  -- Check if course is free
  SELECT is_free INTO course_free FROM courses WHERE id = course_uuid;
  
  IF course_free THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active trial
  SELECT EXISTS(
    SELECT 1 FROM user_trials 
    WHERE user_id = user_uuid AND is_active = true AND end_date > NOW()
  ) INTO has_trial;
  
  IF has_trial THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active subscription
  SELECT EXISTS(
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = user_uuid AND is_active = true AND end_date > NOW()
  ) INTO has_subscription;
  
  RETURN has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award XP
CREATE OR REPLACE FUNCTION award_xp(user_uuid UUID, xp_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET xp = xp + xp_amount, updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_streak(user_uuid UUID)
RETURNS void AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  current_streak INTEGER;
BEGIN
  -- Insert or update streak for today
  INSERT INTO user_streaks (user_id, date, lessons_completed)
  VALUES (user_uuid, today_date, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET lessons_completed = user_streaks.lessons_completed + 1;
  
  -- Calculate current streak
  WITH streak_days AS (
    SELECT date, ROW_NUMBER() OVER (ORDER BY date DESC) as day_num
    FROM user_streaks 
    WHERE user_id = user_uuid AND lessons_completed > 0
    ORDER BY date DESC
  )
  SELECT COALESCE(MAX(day_num), 0) INTO current_streak
  FROM streak_days
  WHERE date >= today_date - INTERVAL '30 days';
  
  -- Update profile with current streak
  UPDATE profiles 
  SET streak_count = current_streak, updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(user_uuid UUID)
RETURNS void AS $$
DECLARE
  user_xp INTEGER;
  user_streak INTEGER;
  completed_courses INTEGER;
  completed_lessons INTEGER;
BEGIN
  -- Get user stats
  SELECT xp, streak_count INTO user_xp, user_streak FROM profiles WHERE id = user_uuid;
  SELECT COUNT(*) INTO completed_courses FROM user_lesson_progress WHERE user_id = user_uuid AND is_completed = true;
  SELECT COUNT(*) INTO completed_lessons FROM user_lesson_progress WHERE user_id = user_uuid AND is_completed = true;
  
  -- Award "First Steps" achievement (first lesson completed)
  IF completed_lessons >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT user_uuid, 'achievement-1'
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = user_uuid AND achievement_id = 'achievement-1'
    );
  END IF;
  
  -- Award "Streak Master" achievement (7-day streak)
  IF user_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT user_uuid, 'achievement-2'
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = user_uuid AND achievement_id = 'achievement-2'
    );
  END IF;
  
  -- Award "Course Completer" achievement (first course completed)
  IF completed_courses >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT user_uuid, 'achievement-3'
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = user_uuid AND achievement_id = 'achievement-3'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
