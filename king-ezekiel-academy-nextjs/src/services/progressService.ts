import { createClient } from '@/lib/supabase/client';

export interface CourseProgress {
  course_id: string;
  course_title: string;
  progress_percentage: number;
  lessons_completed: number;
  total_lessons: number;
  last_accessed: string;
}

export interface LessonProgress {
  lesson_id: string;
  lesson_title: string;
  course_id: string;
  course_title: string;
  completed: boolean;
  completion_date?: string;
  time_spent: number;
}

export interface AchievementProgress {
  achievement_id: string;
  achievement_title: string;
  progress: number;
  max_progress: number;
  earned: boolean;
  earned_date?: string;
}

export class ProgressService {
  // Get user's course progress
  static async getUserCourseProgress(userId: string): Promise<CourseProgress[]> {
    try {
      const { data, error } = await supabase
        .from('user_course_progress')
        .select(`
          course_id,
          progress_percentage,
          lessons_completed,
          total_lessons,
          last_accessed,
          courses (
            id,
            title
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.log('Error fetching course progress:', error);
        return [];
      }

      return data?.map((item: any) => ({
        course_id: item.course_id,
        course_title: item.courses?.title || 'Unknown Course',
        progress_percentage: item.progress_percentage || 0,
        lessons_completed: item.lessons_completed || 0,
        total_lessons: item.total_lessons || 0,
        last_accessed: item.last_accessed || new Date().toISOString()
      })) || [];
    } catch (error) {
      console.log('ProgressService not available yet:', error);
      return [];
    }
  }

  // Get user's lesson progress
  static async getUserLessonProgress(userId: string): Promise<LessonProgress[]> {
    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select(`
          lesson_id,
          completed,
          completion_date,
          time_spent,
          lessons (
            id,
            title,
            course_id,
            courses (
              id,
              title
            )
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.log('Error fetching lesson progress:', error);
        return [];
      }

      return data?.map((item: any) => ({
        lesson_id: item.lesson_id,
        lesson_title: item.lessons?.title || 'Unknown Lesson',
        course_id: item.lessons?.course_id || '',
        course_title: item.lessons?.courses?.title || 'Unknown Course',
        completed: item.completed || false,
        completion_date: item.completion_date,
        time_spent: item.time_spent || 0
      })) || [];
    } catch (error) {
      console.log('ProgressService not available yet:', error);
      return [];
    }
  }

  // Get user's achievements
  static async getUserAchievements(userId: string): Promise<AchievementProgress[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          achievement_id,
          progress,
          max_progress,
          earned,
          earned_date,
          achievements (
            id,
            title
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.log('Error fetching achievements:', error);
        return [];
      }

      return data?.map((item: any) => ({
        achievement_id: item.achievement_id,
        achievement_title: item.achievements?.title || 'Unknown Achievement',
        progress: item.progress || 0,
        max_progress: item.max_progress || 1,
        earned: item.earned || false,
        earned_date: item.earned_date
      })) || [];
    } catch (error) {
      console.log('ProgressService not available yet:', error);
      return [];
    }
  }

  // Update course progress
  static async updateCourseProgress(
    userId: string, 
    courseId: string, 
    progress: number, 
    lessonsCompleted: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          progress_percentage: progress,
          lessons_completed: lessonsCompleted,
          last_accessed: new Date().toISOString()
        });

      if (error) {
        console.log('Error updating course progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.log('ProgressService not available yet:', error);
      return false;
    }
  }

  // Update lesson progress
  static async updateLessonProgress(
    userId: string,
    lessonId: string,
    completed: boolean,
    timeSpent: number = 0
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          completed,
          completion_date: completed ? new Date().toISOString() : null,
          time_spent: timeSpent
        });

      if (error) {
        console.log('Error updating lesson progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.log('ProgressService not available yet:', error);
      return false;
    }
  }

  // Update achievement progress
  static async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number,
    maxProgress: number
  ): Promise<boolean> {
    try {
      const earned = progress >= maxProgress;
      
      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          achievement_id: achievementId,
          progress,
          max_progress: maxProgress,
          earned,
          earned_date: earned ? new Date().toISOString() : null
        });

      if (error) {
        console.log('Error updating achievement progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.log('ProgressService not available yet:', error);
      return false;
    }
  }
}