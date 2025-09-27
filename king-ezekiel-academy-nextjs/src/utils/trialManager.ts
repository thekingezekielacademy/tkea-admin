export interface TrialStatus {
  isActive: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  totalDays: number;
  isExpired: boolean;
}

class TrialManager {
  static calculateDaysRemaining(endDate: string): number {
    const now = new Date();
    const end = new Date(endDate);
    const timeDiff = end.getTime() - now.getTime();
    return Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
  }

  static async hasTrialAccess(userId: string): Promise<boolean> {
    try {
      const trialStatus = await this.getTrialStatusStatic(userId);
      return trialStatus?.isActive && trialStatus?.daysRemaining > 0 || false;
    } catch (error) {
      console.error('Error checking trial access:', error);
      return false;
    }
  }

  // Instance method for backward compatibility 
  async getTrialStatus(): Promise<TrialStatus> {
    try {
      const localTrial = localStorage.getItem('user_trial_status');
      if (localTrial) {
        const parsedTrial = JSON.parse(localTrial);
        const daysRemaining = TrialManager.calculateDaysRemaining(parsedTrial.endDate);
        return {
          ...parsedTrial,
          daysRemaining,
          isExpired: daysRemaining <= 0
        };
      }
      return {
        isActive: false,
        startDate: '',
        endDate: '',
        daysRemaining: 0,
        totalDays: 0,
        isExpired: true
      };
    } catch (error) {
      console.error('Error getting trial status:', error);
      return {
        isActive: false,
        startDate: '',
        endDate: '',
        daysRemaining: 0,
        totalDays: 0,
        isExpired: true
      };
    }
  }

  static async getTrialStatusStatic(userId?: string): Promise<TrialStatus | null> {
    try {
      const localTrial = localStorage.getItem('user_trial_status');
      if (localTrial) {
      const parsedTrial = JSON.parse(localTrial);
      const daysRemaining = this.calculateDaysRemaining(parsedTrial.endDate);
        return {
        ...parsedTrial,
        daysRemaining,
        isExpired: daysRemaining <= 0
      };
      }
      return null;
    } catch (error) {
      console.error('Error getting trial status:', error);
      return null;
    }
  }

  static async createTrial(userId: string): Promise<TrialStatus> {
      const startDate = new Date();
      const endDate = new Date();
    endDate.setDate(startDate.getDate() + 6); // 7 days total
      endDate.setHours(23, 59, 59, 999);
      
    const trialStatus: TrialStatus = {
        isActive: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      daysRemaining: 7,
      totalDays: 7,
        isExpired: false
      };
      
    localStorage.setItem('user_trial_status', JSON.stringify(trialStatus));
    return trialStatus;
  }
}

export default TrialManager;