/**
 * Course Scheduler Service
 * 
 * Handles course scheduling functionality:
 * - Checks for courses that should be published
 * - Sends notifications for scheduled courses
 * - Manages course availability transitions
 */

import { supabase } from '../lib/supabase';
import { NotificationService } from './notificationService';

export class CourseScheduler {
  private static instance: CourseScheduler;
  private notificationService: NotificationService;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance(): CourseScheduler {
    if (!CourseScheduler.instance) {
      CourseScheduler.instance = new CourseScheduler();
    }
    return CourseScheduler.instance;
  }

  // Start the scheduler to check for courses that should be published
  startScheduler(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkScheduledCourses();
    }, 5 * 60 * 1000);

    // Also check immediately
    this.checkScheduledCourses();
  }

  // Stop the scheduler
  stopScheduler(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for courses that should be published
  private async checkScheduledCourses(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Find courses that are scheduled and should be published now
      const { data: coursesToPublish, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_scheduled', true)
        .eq('status', 'scheduled')
        .lte('scheduled_for', now);

      if (error) {
        console.error('Error checking scheduled courses:', error);
        return;
      }

      if (coursesToPublish && coursesToPublish.length > 0) {
        console.log(`Found ${coursesToPublish.length} courses to publish`);
        
        for (const course of coursesToPublish) {
          await this.publishCourse(course);
        }
      }

      // Check for courses that are coming up soon (24 hours, 1 hour)
      await this.checkUpcomingCourses();
      
    } catch (error) {
      console.error('Error in checkScheduledCourses:', error);
    }
  }

  // Publish a scheduled course
  private async publishCourse(course: any): Promise<void> {
    try {
      // Update course status to published
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          status: 'published',
          is_scheduled: false,
          scheduled_for: null
        })
        .eq('id', course.id);

      if (updateError) {
        console.error('Error publishing course:', updateError);
        return;
      }

      console.log(`Course "${course.title}" has been published`);

      // Send notification to users who requested notifications for this course
      await this.notifyCourseAvailable(course);

    } catch (error) {
      console.error('Error publishing course:', error);
    }
  }

  // Notify users that a course is now available
  private async notifyCourseAvailable(course: any): Promise<void> {
    try {
      // Get users who requested notifications for this course
      const courseNotifications = JSON.parse(localStorage.getItem('course_notifications') || '[]');
      
      if (courseNotifications.includes(course.id)) {
        // Send notification
        await this.notificationService.sendCourseAvailableNotification(
          course.title,
          course.id
        );
      }
    } catch (error) {
      console.error('Error notifying course available:', error);
    }
  }

  // Check for courses coming up soon and send reminders
  private async checkUpcomingCourses(): Promise<void> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find courses coming up in the next hour
      const { data: coursesInOneHour, error: oneHourError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_scheduled', true)
        .eq('status', 'scheduled')
        .gte('scheduled_for', now.toISOString())
        .lte('scheduled_for', oneHourFromNow.toISOString());

      if (oneHourError) {
        console.error('Error checking courses in one hour:', oneHourError);
      } else if (coursesInOneHour && coursesInOneHour.length > 0) {
        for (const course of coursesInOneHour) {
          await this.sendCourseReminder(course, 1);
        }
      }

      // Find courses coming up in the next day
      const { data: coursesInOneDay, error: oneDayError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_scheduled', true)
        .eq('status', 'scheduled')
        .gte('scheduled_for', now.toISOString())
        .lte('scheduled_for', oneDayFromNow.toISOString())
        .gt('scheduled_for', oneHourFromNow.toISOString());

      if (oneDayError) {
        console.error('Error checking courses in one day:', oneDayError);
      } else if (coursesInOneDay && coursesInOneDay.length > 0) {
        for (const course of coursesInOneDay) {
          const hoursUntil = Math.floor((new Date(course.scheduled_for).getTime() - now.getTime()) / (1000 * 60 * 60));
          await this.sendCourseReminder(course, hoursUntil);
        }
      }

    } catch (error) {
      console.error('Error checking upcoming courses:', error);
    }
  }

  // Send course reminder notification
  private async sendCourseReminder(course: any, hoursUntil: number): Promise<void> {
    try {
      const courseNotifications = JSON.parse(localStorage.getItem('course_notifications') || '[]');
      
      if (courseNotifications.includes(course.id)) {
        await this.notificationService.sendCourseReminderNotification(
          course.title,
          hoursUntil,
          course.id
        );
      }
    } catch (error) {
      console.error('Error sending course reminder:', error);
    }
  }

  // Send notification when a course is scheduled
  async notifyCourseScheduled(courseTitle: string, scheduledDate: string, courseId?: string): Promise<void> {
    try {
      await this.notificationService.sendCourseScheduledNotification(
        courseTitle,
        scheduledDate,
        courseId
      );
    } catch (error) {
      console.error('Error notifying course scheduled:', error);
    }
  }

  // Get scheduled courses for display
  async getScheduledCourses(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_scheduled', true)
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled courses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching scheduled courses:', error);
      return [];
    }
  }
}
