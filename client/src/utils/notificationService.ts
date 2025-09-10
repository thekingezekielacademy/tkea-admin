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
    const messages = [
      `🔥 You're on a ${streakDays}-day learning streak! Keep it going!`,
      `📚 Day ${streakDays} of your learning streak - don't break it now!`,
      `🎯 ${streakDays} days strong! Continue your learning journey today.`,
      `💪 Your ${streakDays}-day streak is impressive! Learn something new today.`
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await this.sendNotification({
      title: '🔥 Learning Streak',
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
    const messages = [
      '📖 Have you learned something new today?',
      '🎓 Your daily learning session is waiting!',
      '💡 Time to level up your skills!',
      '🚀 Ready for your next lesson?',
      '📚 Knowledge is power - learn something new today!'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await this.sendNotification({
      title: '📚 Daily Learning',
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

  // Schedule daily learning reminder
  scheduleDailyReminder(hour: number = 9): void {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, 0, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendDailyLearningReminder();
      // Reschedule for next day
      this.scheduleDailyReminder(hour);
    }, delay);
  }

  // Schedule streak reminder
  scheduleStreakReminder(hour: number = 20): void {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, 0, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      // Get current streak from localStorage or API
      const streak = parseInt(localStorage.getItem('learning_streak') || '0');
      if (streak > 0) {
        this.sendStreakReminder(streak);
      }
      // Reschedule for next day
      this.scheduleStreakReminder(hour);
    }, delay);
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
