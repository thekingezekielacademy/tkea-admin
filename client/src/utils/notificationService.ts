/**
 * PWA Push Notification Service
 * 
 * Handles all types of notifications to keep users engaged:
 * - Learning reminders and streaks
 * - Course suggestions and new content
 * - XP and achievement notifications
 * - Premium upgrade prompts
 * - Trial expiration warnings
 */

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = Notification.permission;
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Check if notifications are supported and permitted
  isNotificationEnabled(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  // Send a notification
  async sendNotification(notificationData: NotificationData): Promise<void> {
    if (!this.isNotificationEnabled()) {
      console.log('Notifications not enabled');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon || '/favicon.svg',
        badge: notificationData.badge || '/favicon.svg',
        image: notificationData.image,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction || false,
        actions: notificationData.actions || [],
        data: notificationData.data || {},
        vibrate: [200, 100, 200],
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // LEARNING ENGAGEMENT NOTIFICATIONS

  // Streak reminders
  async sendStreakReminder(streakDays: number): Promise<void> {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    const weekdayMessages = [
      `🔥 You're on a ${streakDays}-day learning streak! Keep it going this evening!`,
      `📚 Day ${streakDays} of your learning streak - don't break it now!`,
      `🎯 ${streakDays} days strong! Continue your learning journey this evening.`,
      `💪 Your ${streakDays}-day streak is impressive! Learn something new tonight.`,
      `🌟 ${streakDays} days of dedication! Evening learning time!`,
      `⚡ ${streakDays} days strong! Power up your evening with learning!`
    ];

    const weekendMessages = [
      `🔥 You're on a ${streakDays}-day learning streak! Perfect weekend to keep it going!`,
      `📚 Day ${streakDays} of your learning streak - weekend learning time!`,
      `🎯 ${streakDays} days strong! Continue your learning journey this afternoon.`,
      `💪 Your ${streakDays}-day streak is impressive! Weekend learning session!`,
      `🌟 ${streakDays} days of dedication! Afternoon learning time!`,
      `⚡ ${streakDays} days strong! Weekend learning power!`
    ];

    const messages = isWeekend ? weekendMessages : weekdayMessages;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await this.sendNotification({
      title: isWeekend ? '🔥 Weekend Streak Time!' : '🔥 Evening Streak Reminder',
      body: randomMessage,
      tag: 'streak-reminder',
      requireInteraction: true,
      actions: [
        { action: 'continue', title: 'Continue Learning' },
        { action: 'dismiss', title: 'Later' }
      ]
    });
  }

  // Daily learning reminder
  async sendDailyLearningReminder(): Promise<void> {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    const weekdayMessages = [
      '📚 Ready to continue your learning journey this evening?',
      '🎯 Time for your daily dose of knowledge!',
      '💡 Let\'s learn something new today!',
      '🚀 Your next lesson is waiting for you!',
      '📖 Keep building your skills with King Ezekiel Academy!',
      '🌟 Evening learning session - let\'s make it count!',
      '⚡ Power up your evening with some learning!'
    ];

    const weekendMessages = [
      '📚 Perfect afternoon for some learning!',
      '🎯 Weekend learning time - let\'s do this!',
      '💡 Relax and learn something new this afternoon!',
      '🚀 Your weekend learning adventure awaits!',
      '📖 Make the most of your weekend with King Ezekiel Academy!',
      '🌟 Afternoon learning session - perfect timing!',
      '⚡ Weekend learning power - let\'s go!'
    ];

    const messages = isWeekend ? weekendMessages : weekdayMessages;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await this.sendNotification({
      title: isWeekend ? 'Weekend Learning Time!' : 'Evening Learning Reminder',
      body: randomMessage,
      tag: 'daily-reminder',
      requireInteraction: true,
      actions: [
        { action: 'learn', title: 'Start Learning' },
        { action: 'dismiss', title: 'Not Today' }
      ]
    });
  }

  // XP level up notification
  async sendXPLevelUpNotification(newLevel: number, xpGained: number): Promise<void> {
    await this.sendNotification({
      title: '🎉 Level Up!',
      body: `Congratulations! You've reached Level ${newLevel} and gained ${xpGained} XP!`,
      tag: 'level-up',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Progress' },
        { action: 'continue', title: 'Keep Learning' }
      ]
    });
  }

  // Course continuation reminder
  async sendCourseContinuationReminder(courseTitle: string, progress: number): Promise<void> {
    await this.sendNotification({
      title: '📖 Continue Learning',
      body: `You're ${progress}% through "${courseTitle}" - pick up where you left off!`,
      tag: 'course-continuation',
      requireInteraction: true,
      actions: [
        { action: 'continue', title: 'Continue Course' },
        { action: 'dismiss', title: 'Later' }
      ]
    });
  }

  // CONTENT DISCOVERY NOTIFICATIONS

  // New course announcement
  async sendNewCourseNotification(courseTitle: string, category: string): Promise<void> {
    await this.sendNotification({
      title: '🆕 New Course Available!',
      body: `"${courseTitle}" in ${category} is now available. Start learning today!`,
      tag: 'new-course',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Course' },
        { action: 'dismiss', title: 'Not Interested' }
      ]
    });
  }

  // Top watched courses
  async sendTopCoursesNotification(courseTitle: string, studentCount: number): Promise<void> {
    await this.sendNotification({
      title: '🌟 Trending Course',
      body: `"${courseTitle}" is being watched by ${studentCount}+ students. Join them!`,
      tag: 'trending-course',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Course' },
        { action: 'dismiss', title: 'Not Now' }
      ]
    });
  }

  // Course suggestions
  async sendCourseSuggestion(courseTitle: string, reason: string): Promise<void> {
    await this.sendNotification({
      title: '💡 Course Suggestion',
      body: `Based on your interests: "${courseTitle}" - ${reason}`,
      tag: 'course-suggestion',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Course' },
        { action: 'dismiss', title: 'Not Interested' }
      ]
    });
  }

  // New features
  async sendNewFeatureNotification(featureName: string, description: string): Promise<void> {
    await this.sendNotification({
      title: '✨ New Feature!',
      body: `${featureName}: ${description}`,
      tag: 'new-feature',
      requireInteraction: true,
      actions: [
        { action: 'explore', title: 'Explore Feature' },
        { action: 'dismiss', title: 'Later' }
      ]
    });
  }

  // ACHIEVEMENT NOTIFICATIONS

  // Badge earned
  async sendBadgeEarnedNotification(badgeName: string, description: string): Promise<void> {
    await this.sendNotification({
      title: '🏆 Badge Earned!',
      body: `You earned the "${badgeName}" badge: ${description}`,
      tag: 'badge-earned',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Badge' },
        { action: 'share', title: 'Share Achievement' }
      ]
    });
  }

  // Course completion
  async sendCourseCompletionNotification(courseTitle: string): Promise<void> {
    await this.sendNotification({
      title: '🎓 Course Completed!',
      body: `Congratulations! You've completed "${courseTitle}". Ready for the next challenge?`,
      tag: 'course-completed',
      requireInteraction: true,
      actions: [
        { action: 'certificate', title: 'View Certificate' },
        { action: 'next', title: 'Find Next Course' }
      ]
    });
  }

  // BUSINESS/MONETIZATION NOTIFICATIONS

  // Premium upgrade prompt
  async sendPremiumUpgradePrompt(feature: string): Promise<void> {
    await this.sendNotification({
      title: '⭐ Upgrade to Premium',
      body: `Unlock ${feature} and get unlimited access to all courses!`,
      tag: 'premium-upgrade',
      requireInteraction: true,
      actions: [
        { action: 'upgrade', title: 'Upgrade Now' },
        { action: 'dismiss', title: 'Not Now' }
      ]
    });
  }

  // Trial expiration warning
  async sendTrialExpirationWarning(daysLeft: number): Promise<void> {
    const emoji = daysLeft <= 1 ? '⚠️' : '⏰';
    
    await this.sendNotification({
      title: `${emoji} Trial Expiring Soon`,
      body: `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade to continue learning!`,
      tag: 'trial-expiration',
      requireInteraction: true,
      actions: [
        { action: 'upgrade', title: 'Upgrade Now' },
        { action: 'extend', title: 'Extend Trial' }
      ]
    });
  }

  // Subscription renewal reminder
  async sendSubscriptionRenewalReminder(daysLeft: number): Promise<void> {
    await this.sendNotification({
      title: '🔄 Subscription Renewal',
      body: `Your subscription renews in ${daysLeft} days. Keep your learning streak going!`,
      tag: 'subscription-renewal',
      requireInteraction: true,
      actions: [
        { action: 'manage', title: 'Manage Subscription' },
        { action: 'dismiss', title: 'Remind Later' }
      ]
    });
  }

  // ADDITIONAL STRATEGIC NOTIFICATIONS

  // Weekly learning goal
  async sendWeeklyGoalReminder(progress: number, goal: number): Promise<void> {
    const percentage = Math.round((progress / goal) * 100);
    await this.sendNotification({
      title: '📊 Weekly Goal Progress',
      body: `You're ${percentage}% towards your weekly learning goal (${progress}/${goal} lessons)`,
      tag: 'weekly-goal',
      requireInteraction: true,
      actions: [
        { action: 'continue', title: 'Continue Learning' },
        { action: 'view', title: 'View Progress' }
      ]
    });
  }

  // Community highlight
  async sendCommunityHighlight(message: string): Promise<void> {
    await this.sendNotification({
      title: '👥 Community Update',
      body: message,
      tag: 'community-highlight',
      requireInteraction: false,
      actions: [
        { action: 'view', title: 'View Community' }
      ]
    });
  }

  // Optimal learning time reminder
  async sendOptimalLearningTimeReminder(): Promise<void> {
    await this.sendNotification({
      title: '⏰ Perfect Learning Time',
      body: 'This is your most productive learning time! Ready to learn something new?',
      tag: 'optimal-time',
      requireInteraction: true,
      actions: [
        { action: 'learn', title: 'Start Learning' },
        { action: 'dismiss', title: 'Not Now' }
      ]
    });
  }

  // Course difficulty progression
  async sendDifficultyProgressionNotification(courseTitle: string, nextLevel: string): Promise<void> {
    await this.sendNotification({
      title: '🚀 Ready for the Next Level?',
      body: `You've mastered the basics! Try "${courseTitle}" - ${nextLevel} level course`,
      tag: 'difficulty-progression',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Course' },
        { action: 'dismiss', title: 'Not Ready' }
      ]
    });
  }

  // Social proof notification
  async sendSocialProofNotification(studentCount: number, courseTitle: string): Promise<void> {
    await this.sendNotification({
      title: '🌟 Join the Community',
      body: `${studentCount}+ students are learning "${courseTitle}" right now. Don't miss out!`,
      tag: 'social-proof',
      requireInteraction: true,
      actions: [
        { action: 'join', title: 'Join Them' },
        { action: 'dismiss', title: 'Not Interested' }
      ]
    });
  }

  // SCHEDULED NOTIFICATIONS

  // Schedule a notification for later
  async scheduleNotification(notificationData: NotificationData, delay: number): Promise<void> {
    setTimeout(() => {
      this.sendNotification(notificationData);
    }, delay);
  }

  // Schedule daily learning reminder with weekend/weekday differentiation
  scheduleDailyReminder(): void {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6; // Sunday or Saturday
    
    // Evening times on weekdays (6 PM), afternoon on weekends (2 PM)
    const hour = isWeekend ? 14 : 18; // 2 PM weekends, 6 PM weekdays
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, 0, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    console.log(`📅 Scheduled daily reminder for ${isWeekend ? 'weekend' : 'weekday'} at ${hour}:00`);
    
    setTimeout(() => {
      this.sendDailyLearningReminder();
      // Reschedule for next day
      this.scheduleDailyReminder();
    }, delay);
  }

  // Schedule streak reminder with weekend/weekday differentiation
  scheduleStreakReminder(): void {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6; // Sunday or Saturday
    
    // Evening times on weekdays (8 PM), afternoon on weekends (3 PM)
    const hour = isWeekend ? 15 : 20; // 3 PM weekends, 8 PM weekdays
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, 0, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    console.log(`🔥 Scheduled streak reminder for ${isWeekend ? 'weekend' : 'weekday'} at ${hour}:00`);
    
    setTimeout(() => {
      // Get current streak from localStorage or API
      const streak = parseInt(localStorage.getItem('learning_streak') || '0');
      if (streak > 0) {
        this.sendStreakReminder(streak);
      }
      // Reschedule for next day
      this.scheduleStreakReminder();
    }, delay);
  }

  // Schedule course continuation reminders
  scheduleCourseReminders(): void {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    // Different times for course reminders
    const hour = isWeekend ? 16 : 19; // 4 PM weekends, 7 PM weekdays
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, 0, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    console.log(`📚 Scheduled course reminders for ${isWeekend ? 'weekend' : 'weekday'} at ${hour}:00`);
    
    setTimeout(() => {
      this.checkAndSendCourseReminders();
      // Reschedule for next day
      this.scheduleCourseReminders();
    }, delay);
  }

  // Check and send course continuation reminders
  private async checkAndSendCourseReminders(): Promise<void> {
    try {
      const currentCourse = JSON.parse(localStorage.getItem('current_course') || '{}');
      if (currentCourse && currentCourse.progress > 0 && currentCourse.progress < 100) {
        const lastAccessed = localStorage.getItem(`last_accessed_${currentCourse.id}`);
        if (lastAccessed) {
          const hoursSinceLastAccess = (Date.now() - parseInt(lastAccessed)) / (1000 * 60 * 60);
          if (hoursSinceLastAccess > 24) {
            await this.sendCourseContinuationReminder(currentCourse.title, currentCourse.progress);
          }
        }
      }
    } catch (error) {
      console.error('Error checking course reminders:', error);
    }
  }

  // Initialize all notification schedules
  initializeNotifications(): void {
    if (!this.isNotificationEnabled()) {
      console.log('🔕 Notifications not enabled, skipping initialization');
      return;
    }

    console.log('🔔 Initializing notification schedules...');
    
    // Schedule all notification types
    this.scheduleDailyReminder();
    this.scheduleStreakReminder();
    this.scheduleCourseReminders();
    
    // Schedule immediate check for existing triggers
    setTimeout(() => {
      this.checkImmediateTriggers();
    }, 5000); // Check after 5 seconds
  }

  // Check for immediate notification triggers
  private async checkImmediateTriggers(): Promise<void> {
    try {
      // Check for XP level up
      const previousLevel = parseInt(localStorage.getItem('previous_level') || '1');
      const userStats = JSON.parse(localStorage.getItem('user_stats') || '{"level": 1}');
      const currentLevel = userStats.level || 1;
      
      if (currentLevel > previousLevel) {
        await this.sendXPLevelUpNotification(currentLevel, userStats.xp || 0);
        localStorage.setItem('previous_level', currentLevel.toString());
      }

      // Check for trial expiration
      const trialData = localStorage.getItem('user_trial_status');
      if (trialData) {
        const trial = JSON.parse(trialData);
        if (trial.isActive && trial.daysRemaining <= 3 && trial.daysRemaining > 0) {
          await this.sendTrialExpirationWarning(trial.daysRemaining);
        }
      }

      // Check for premium upgrade opportunity
      const userEngagement = parseInt(localStorage.getItem('user_engagement_score') || '0');
      if (userEngagement > 10) {
        await this.sendPremiumUpgradePrompt('unlimited courses and advanced features');
      }

    } catch (error) {
      console.error('Error checking immediate triggers:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
