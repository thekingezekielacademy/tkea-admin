import { supabase } from '@/lib/supabase';
import { CourseProgressService } from '@/services/courseProgressService';

/**
 * Utility functions for testing progress tracking
 */
export class ProgressTestUtils {
  /**
   * Manually update course progress for testing
   */
  static async testProgressUpdate(userId: string): Promise<boolean> {
    try {
      console.log('🧪 Testing progress update for user:', userId);
      
      // Force update course progress
      const result = await CourseProgressService.updateUserCoursesProgress(userId);
      
      if (result) {
        console.log('✅ Progress update test successful');
        return true;
      } else {
        console.log('❌ Progress update test failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Progress update test error:', error);
      return false;
    }
  }

  /**
   * Get debug info about user's progress
   */
  static async getProgressDebugInfo(userId: string): Promise<any> {
    try {
      console.log('🔍 Getting progress debug info for user:', userId);

      // Get lesson progress
      const { data: lessonProgress, error: lessonError } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId);

      // Get course progress
      const { data: courseProgress, error: courseError } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', userId);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('xp, current_streak, last_activity_date')
        .eq('id', userId)
        .single();

      // Check what lessons exist in the database
      const { data: allLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, course_id, title')
        .limit(10);

      // Check what course_videos exist
      const { data: allCourseVideos, error: courseVideosError } = await supabase
        .from('course_videos')
        .select('id, course_id, name')
        .limit(10);

      const debugInfo = {
        userId,
        lessonProgress: {
          data: lessonProgress,
          error: lessonError,
          count: lessonProgress?.length || 0
        },
        courseProgress: {
          data: courseProgress,
          error: courseError,
          count: courseProgress?.length || 0
        },
        profile: {
          data: profile,
          error: profileError
        },
        databaseStructure: {
          lessons: {
            data: allLessons,
            error: lessonsError,
            count: allLessons?.length || 0
          },
          courseVideos: {
            data: allCourseVideos,
            error: courseVideosError,
            count: allCourseVideos?.length || 0
          }
        }
      };

      console.log('📊 Progress debug info:', debugInfo);
      return debugInfo;
    } catch (error) {
      console.error('❌ Error getting progress debug info:', error);
      return { error: error.message };
    }
  }

  /**
   * Clear all progress data for testing (use with caution!)
   */
  static async clearProgressData(userId: string): Promise<boolean> {
    try {
      console.log('⚠️ Clearing progress data for user:', userId);

      // Clear lesson progress
      const { error: lessonError } = await supabase
        .from('user_lesson_progress')
        .delete()
        .eq('user_id', userId);

      // Clear course progress
      const { error: courseError } = await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', userId);

      // Reset profile stats
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          xp: 0,
          current_streak: 0,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', userId);

      if (lessonError || courseError || profileError) {
        console.error('❌ Error clearing progress data:', { lessonError, courseError, profileError });
        return false;
      }

      console.log('✅ Progress data cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Error clearing progress data:', error);
      return false;
    }
  }
}
