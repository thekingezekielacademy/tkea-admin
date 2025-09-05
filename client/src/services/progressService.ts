import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at?: string;
  progress_percentage: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'paused';
  last_accessed_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  started_at: string;
  completed_at?: string;
  watch_duration: number;
  progress_percentage: number;
  status: 'not_started' | 'started' | 'completed';
  notes?: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  title: string;
  description?: string;
  category: string;
  xp_reward: number;
  earned_at: string;
}

export class ProgressService {
  // Enroll user in a course
  static async enrollInCourse(userId: string, courseId: string): Promise<CourseProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .insert({
          user_id: userId,
          course_id: courseId,
          status: 'enrolled'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      return null;
    }
  }

  // Start a lesson
  static async startLesson(userId: string, courseId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          status: 'started',
          started_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting lesson:', error);
      return null;
    }
  }

  // Complete a lesson
  static async completeLesson(userId: string, courseId: string, lessonId: string, watchDuration: number = 0): Promise<LessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          watch_duration: watchDuration,
          progress_percentage: 100
        })
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .select()
        .single();

      if (error) throw error;

      // Update course progress
      await this.updateCourseProgress(userId, courseId);

      // Check for achievements
      await this.checkAndAwardAchievements(userId, courseId);

      return data;
    } catch (error) {
      console.error('Error completing lesson:', error);
      return null;
    }
  }

  // Update course progress percentage
  static async updateCourseProgress(userId: string, courseId: string): Promise<void> {
    try {
      // Get total lessons in course
      const { data: totalLessons, error: totalError } = await supabase
        .from('course_videos')
        .select('id')
        .eq('course_id', courseId);

      if (totalError) throw totalError;

      // Get completed lessons
      const { data: completedLessons, error: completedError } = await supabase
        .from('user_lesson_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'completed');

      if (completedError) throw completedError;

      const totalCount = totalLessons?.length || 0;
      const completedCount = completedLessons?.length || 0;
      const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      // Update course progress
      await supabase
        .from('user_courses')
        .upsert({
          user_id: userId,
          course_id: courseId,
          progress_percentage: progressPercentage,
          status: progressPercentage === 100 ? 'completed' : 'in_progress',
          last_accessed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  }

  // Check and award achievements
  static async checkAndAwardAchievements(userId: string, courseId: string): Promise<void> {
    try {
      // Get user's lesson progress
      const { data: lessonProgress, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (progressError) throw progressError;

      const completedLessons = lessonProgress?.length || 0;

      // Check for lesson milestones
      const lessonMilestones = [1, 10, 25, 50, 100, 200];
      for (const milestone of lessonMilestones) {
        if (completedLessons >= milestone) {
          await this.awardAchievement(userId, `lesson-${milestone}`, 
            `Lesson ${milestone}`, 
            `Complete ${milestone} lessons`, 
            'learning', 
            50 + (milestone / 10) * 25);
        }
      }

      // Check for first lesson achievement
      if (completedLessons === 1) {
        await this.awardAchievement(userId, 'first-steps', 
          'First Steps', 
          'Complete your first lesson', 
          'learning', 
          50);
      }

    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  // Award an achievement
  static async awardAchievement(
    userId: string, 
    achievementId: string, 
    title: string, 
    description: string, 
    category: string, 
    xpReward: number
  ): Promise<void> {
    try {
      // Check if achievement already exists
      const { data: existing, error: checkError } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // If achievement doesn't exist, award it
      if (!existing) {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            title,
            description,
            category,
            xp_reward: xpReward
          });

        // Award XP to user
        await this.awardXP(userId, xpReward);

        console.log(`🎉 Achievement awarded: ${title} (+${xpReward} XP)`);
      }
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }

  // Award XP to user
  static async awardXP(userId: string, xpAmount: number): Promise<void> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const currentXP = profile?.xp || 0;
      const newXP = currentXP + xpAmount;
      const newLevel = 1 + Math.floor(newXP / 100); // 100 XP per level

      await supabase
        .from('profiles')
        .update({
          xp: newXP,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      console.log(`💎 XP awarded: +${xpAmount} XP (Total: ${newXP}, Level: ${newLevel})`);
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }

  // Get user's course progress
  static async getUserCourseProgress(userId: string): Promise<CourseProgress[]> {
    try {
      console.log('🔍 Fetching course progress for user:', userId);
      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      console.log('📚 Course progress data:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching user course progress:', error);
      return [];
    }
  }

  // Get user's lesson progress
  static async getUserLessonProgress(userId: string): Promise<LessonProgress[]> {
    try {
      console.log('🔍 Fetching lesson progress for user:', userId);
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      console.log('📖 Lesson progress data:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching user lesson progress:', error);
      return [];
    }
  }

  // Get user's achievements
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        // Handle table not found error gracefully
        if (error.code === 'PGRST116' || error.message?.includes('relation "user_achievements" does not exist')) {
          console.log('ℹ️ user_achievements table not found, returning empty array');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, {
        component: 'ProgressService',
        action: 'getUserAchievements',
        userId
      });
      return [];
    }
  }
}
