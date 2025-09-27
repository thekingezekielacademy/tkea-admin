class NotificationService {
  private isEnabled: boolean = false;

  constructor() {
    this.checkPermission();
  }

  private checkPermission(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.isEnabled = Notification.permission === 'granted';
    }
  }

  public isNotificationEnabled(): boolean {
    return this.isEnabled;
  }

  public async initializeNotifications(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      this.isEnabled = true;
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.isEnabled = permission === 'granted';
    }
  }

  public async sendXPLevelUpNotification(level: number, xp: number): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const notification = new Notification('🎉 Level Up!', {
        body: `Congratulations! You've reached level ${level} with ${xp} XP!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'level-up',
        requireInteraction: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error sending level up notification:', error);
    }
  }

  public async sendCourseContinuationReminder(courseTitle: string, progress: number): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const notification = new Notification('📚 Continue Learning', {
        body: `You're ${progress}% through "${courseTitle}". Pick up where you left off!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'course-reminder',
        requireInteraction: false
      });

      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error sending course continuation reminder:', error);
    }
  }

  public async sendStreakReminder(streak: number): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const notification = new Notification('🔥 Keep Your Streak!', {
        body: `You've learned for ${streak} days in a row! Don't break the chain!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'streak-reminder',
        requireInteraction: false
      });

      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error sending streak reminder:', error);
    }
  }

  public async sendTrialExpirationWarning(daysRemaining: number): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const notification = new Notification('⏰ Trial Ending Soon', {
        body: `Your trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Upgrade now to keep learning!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'trial-expiration',
        requireInteraction: true
      });

      setTimeout(() => {
        notification.close();
      }, 10000);
    } catch (error) {
      console.error('Error sending trial expiration warning:', error);
    }
  }

  public async sendPremiumUpgradePrompt(features: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const notification = new Notification('⭐ Upgrade to Premium', {
        body: `Unlock ${features} with a premium subscription!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'premium-upgrade',
        requireInteraction: false
      });

      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error sending premium upgrade prompt:', error);
    }
  }

  public async sendAchievementNotification(achievementTitle: string, xpReward: number): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const notification = new Notification('🏆 Achievement Unlocked!', {
        body: `You earned "${achievementTitle}" and gained ${xpReward} XP!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'achievement',
        requireInteraction: false
      });

      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
