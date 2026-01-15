import { createClient } from '@/lib/supabase';

export interface CourseProgressData {
  course_id: string;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  last_accessed: string;
  last_lesson_completed?: string;
}

export class CourseProgressService {
  /**
   * Calculate course progress from lesson progress data
   */
  static async calculateCourseProgress(userId: string): Promise<CourseProgressData[]> {
    try {
      const supabase = createClient();
      console.log('🔍 Calculating course progress for user:', userId);
      
      // Try to use the new view first, fallback to manual calculation
      let progressSummary = null;
      let viewError = null;
      
      try {
        const result = await supabase
          .from('user_progress_summary')
          .select('*')
          .eq('user_id', userId);
        progressSummary = result.data;
        viewError = result.error;
      } catch (error) {
        // Silently handle view not existing
        viewError = error;
      }

      if (viewError) {
        console.log('📊 Progress view not available, using manual calculation');
      } else {
        console.log('📊 Progress summary from view:', { progressSummary });
      }

      if (!viewError && progressSummary && progressSummary.length > 0) {
        return progressSummary.map((item: any) => ({
          course_id: item.course_id,
          course_title: item.course_title,
          total_lessons: item.total_lessons,
          completed_lessons: item.completed_lessons,
          progress_percentage: item.progress_percentage,
          last_accessed: item.last_accessed,
          last_lesson_completed: item.last_lesson_completed
        }));
      }

      console.log('📊 View not available, falling back to manual calculation');

      // Fallback: Get all lesson progress for the user (matches actual schema)
      const { data: lessonProgress, error: lessonError } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, course_id, status, completed_at, started_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      console.log('📊 Raw lesson progress data:', { lessonProgress, lessonError });

      if (lessonError) {
        console.error('Error fetching lesson progress:', lessonError);
        return [];
      }

      if (!lessonProgress || lessonProgress.length === 0) {
        console.log('📊 No lesson progress found for user');
        return [];
      }

      // Group by course and calculate progress
      const courseProgressMap = new Map<string, CourseProgressData>();

      for (const progress of lessonProgress) {
        const courseId = progress.course_id;
        
        // Get course title separately to avoid FK issues
        let courseTitle = 'Unknown Course';
        try {
          const { data: courseData } = await supabase
            .from('courses')
            .select('title')
            .eq('id', courseId)
            .single();
          if (courseData) {
            courseTitle = courseData.title;
          }
        } catch (error) {
          console.log('Could not fetch course title for:', courseId);
        }

        if (!courseProgressMap.has(courseId)) {
          courseProgressMap.set(courseId, {
            course_id: courseId,
            course_title: courseTitle,
            total_lessons: 0,
            completed_lessons: 0,
            progress_percentage: 0,
            last_accessed: progress.started_at || new Date().toISOString(),
          });
        }

        const courseData = courseProgressMap.get(courseId)!;
        
        if (progress.status === 'completed') {
          courseData.completed_lessons++;
          if (!courseData.last_lesson_completed || 
              (progress.completed_at && progress.completed_at > courseData.last_lesson_completed)) {
            courseData.last_lesson_completed = progress.completed_at;
          }
        }
      }

      // Get total lessons count for each course
      for (const [courseId, courseData] of courseProgressMap) {
        console.log('🔍 Getting total lessons for course:', courseId);
        
        // Try lessons table first, then course_videos as fallback
        let totalLessons = 0;
        
        try {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('id', { count: 'exact' })
            .eq('course_id', courseId);

          if (!lessonsError && lessonsData) {
            totalLessons = lessonsData.length;
            console.log('📊 Found lessons in lessons table:', totalLessons);
          }
        } catch (error) {
          console.log('Lessons table query failed, trying course_videos...');
        }

        // Fallback to course_videos table
        if (totalLessons === 0) {
          try {
            const { data: videosData, error: videosError } = await supabase
              .from('course_videos')
              .select('id', { count: 'exact' })
              .eq('course_id', courseId);

            if (!videosError && videosData) {
              totalLessons = videosData.length;
              console.log('📊 Found lessons in course_videos table:', totalLessons);
            }
          } catch (error) {
            console.log('Course_videos table query also failed');
          }
        }

        courseData.total_lessons = totalLessons;
        courseData.progress_percentage = courseData.total_lessons > 0 
          ? Math.round((courseData.completed_lessons / courseData.total_lessons) * 100)
          : 0;
        
        console.log('📊 Updated course data:', courseData);
      }

      return Array.from(courseProgressMap.values());
    } catch (error) {
      console.error('Error calculating course progress:', error);
      return [];
    }
  }

  /**
   * Update user_courses table with calculated progress
   */
  static async updateUserCoursesProgress(userId: string): Promise<boolean> {
    try {
      const courseProgressData = await this.calculateCourseProgress(userId);

      for (const courseData of courseProgressData) {
        const supabase = createClient();
        const { error } = await supabase
          .from('user_courses')
          .upsert({
            user_id: userId,
            course_id: courseData.course_id,
            progress: courseData.progress_percentage,
            completed_lessons: courseData.completed_lessons,
            total_lessons: courseData.total_lessons,
            last_accessed: courseData.last_accessed,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,course_id'
          });

        if (error) {
          console.error(`Error updating course progress for course ${courseData.course_id}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating user courses progress:', error);
      return false;
    }
  }

  /**
   * Get user's current course progress for dashboard
   * Includes both courses with progress AND purchased courses without progress
   */
  static async getUserCourseProgress(userId: string): Promise<CourseProgressData[]> {
    try {
      console.log('🔍 Getting user course progress for user:', userId);
      const supabase = createClient();
      
      // Step 1: Get courses with progress (from user_progress_summary or manual calculation)
      let progressSummary = null;
      let viewError = null;
      
      try {
        const result = await supabase
          .from('user_progress_summary')
          .select('*')
          .eq('user_id', userId)
          .order('last_accessed', { ascending: false });
        progressSummary = result.data;
        viewError = result.error;
      } catch (error) {
        viewError = error;
      }

      let coursesWithProgress: CourseProgressData[] = [];
      
      if (!viewError && progressSummary && progressSummary.length > 0) {
        coursesWithProgress = progressSummary.map((item: any) => ({
          course_id: item.course_id,
          course_title: item.course_title,
          total_lessons: item.total_lessons || 0,
          completed_lessons: item.completed_lessons || 0,
          progress_percentage: item.progress_percentage || 0,
          last_accessed: item.last_accessed || new Date().toISOString(),
          last_lesson_completed: item.last_lesson_completed
        }));
      } else {
        // Fallback: Calculate progress manually
        coursesWithProgress = await this.calculateCourseProgress(userId);
      }

      // Step 2: Get user's email for fallback query
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      // Step 3: Get ALL purchased courses from product_purchases (including those without progress)
      // First try by buyer_id
      let { data: purchases, error: purchasesError } = await supabase
        .from('product_purchases')
        .select('product_id, product_type, access_granted_at')
        .eq('buyer_id', userId)
        .eq('product_type', 'course')
        .eq('payment_status', 'success')
        .eq('access_granted', true);

      // If no purchases found by buyer_id, try by email (for guest purchases not yet linked)
      if ((!purchases || purchases.length === 0) && userProfile?.email) {
        console.log('📧 No purchases found by buyer_id, checking by email:', userProfile.email);
        const { data: emailPurchases, error: emailError } = await supabase
          .from('product_purchases')
          .select('product_id, product_type, access_granted_at')
          .eq('buyer_email', userProfile.email.toLowerCase().trim())
          .eq('product_type', 'course')
          .eq('payment_status', 'success')
          .eq('access_granted', true)
          .is('buyer_id', null); // Only get guest purchases (not yet linked)

        if (!emailError && emailPurchases && emailPurchases.length > 0) {
          console.log('📧 Found guest purchases by email, attempting to link...');
          purchases = emailPurchases;
          
          // Try to link guest purchases to user account
          try {
            const { error: linkError } = await supabase.rpc('link_guest_purchases_to_user', {
              p_user_id: userId,
              p_user_email: userProfile.email
            });
            
            if (linkError) {
              console.warn('Could not link guest purchases (function may not exist):', linkError);
              // Manually link if function doesn't exist
              await supabase
                .from('product_purchases')
                .update({ buyer_id: userId })
                .eq('buyer_email', userProfile.email.toLowerCase().trim())
                .is('buyer_id', null);
            } else {
              console.log('✅ Successfully linked guest purchases to user account');
            }
          } catch (linkErr) {
            console.warn('Error linking guest purchases:', linkErr);
          }
        }
      }

      if (purchasesError) {
        console.error('Error fetching purchased courses:', purchasesError);
      }

      // Step 4: Get course details for purchased courses
      const purchasedCourseIds = purchases?.map(p => p.product_id) || [];
      const coursesWithProgressIds = new Set(coursesWithProgress.map(c => c.course_id));
      
      // Find purchased courses that don't have progress yet
      const missingCourseIds = purchasedCourseIds.filter(id => !coursesWithProgressIds.has(id));
      
      if (missingCourseIds.length > 0) {
        console.log('📚 Found purchased courses without progress:', missingCourseIds);
        
        // Fetch course details for purchased courses without progress
        const { data: purchasedCourses, error: coursesError } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', missingCourseIds);

        if (!coursesError && purchasedCourses) {
          // Add purchased courses with 0% progress
          for (const course of purchasedCourses) {
            const purchase = purchases?.find(p => p.product_id === course.id);
            coursesWithProgress.push({
              course_id: course.id,
              course_title: course.title,
              total_lessons: 0,
              completed_lessons: 0,
              progress_percentage: 0,
              last_accessed: purchase?.access_granted_at || new Date().toISOString(),
            });
          }
        }
      }

      // Step 5: Update user_courses table with all courses (with and without progress)
      for (const progress of coursesWithProgress) {
        await supabase
          .from('user_courses')
          .upsert({
            user_id: userId,
            course_id: progress.course_id,
            progress: progress.progress_percentage,
            completed_lessons: progress.completed_lessons,
            total_lessons: progress.total_lessons,
            last_accessed: progress.last_accessed,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,course_id'
          });
      }

      return coursesWithProgress;
    } catch (error) {
      console.error('Error getting user course progress:', error);
      return [];
    }
  }

  /**
   * Update course progress when a lesson is completed
   */
  static async onLessonCompleted(userId: string, courseId: string, lessonId: string): Promise<boolean> {
    try {
      console.log('🔄 Updating course progress after lesson completion:', { userId, courseId, lessonId });

      // Update the specific course progress
      await this.updateUserCoursesProgress(userId);

      // Also update user's XP and streak
      await this.updateUserStats(userId);

      return true;
    } catch (error) {
      console.error('Error updating course progress on lesson completion:', error);
      return false;
    }
  }

  /**
   * Update user stats (XP, streak) when lessons are completed
   */
  static async updateUserStats(userId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      // Calculate total completed lessons for XP (matches actual schema)
      const { data: completedLessons, error: lessonsError } = await supabase
        .from('user_lesson_progress')
        .select('completed_at', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (lessonsError) {
        console.error('Error counting completed lessons:', lessonsError);
        return false;
      }

      const totalCompleted = completedLessons?.length || 0;
      const xpReward = totalCompleted * 50; // 50 XP per lesson

      // Calculate current streak
      const today = new Date().toISOString().split('T')[0];
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('date')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      let currentStreak = 0;
      if (streakData && streakData.length > 0) {
        let checkDate = new Date(today);
        for (let i = 0; i < 30; i++) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const hasActivity = streakData.some(day => day.date === dateStr);
          
          if (hasActivity) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          xp: xpReward,
          current_streak: currentStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return false;
    }
  }
}
