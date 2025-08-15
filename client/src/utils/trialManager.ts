import { supabase } from '../lib/supabase';

export interface TrialStatus {
  isActive: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  totalDays: number;
  isExpired: boolean;
}

export class TrialManager {
  private static TRIAL_DURATION_DAYS = 7;
  private static TRIAL_STORAGE_KEY = 'user_trial_status';

  /**
   * Initialize trial for a new user
   */
  static async initializeTrial(userId: string): Promise<TrialStatus> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      
      // Set start date to beginning of today
      startDate.setHours(0, 0, 0, 0);
      
      // Set end date to end of the 7th day (23:59:59)
      endDate.setDate(startDate.getDate() + this.TRIAL_DURATION_DAYS);
      endDate.setHours(23, 59, 59, 999);

      const trialData = {
        user_id: userId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Try to save to database first
      try {
        const { error } = await supabase
          .from('user_trials')
          .insert(trialData);

        if (error) {
          console.log('Could not save trial to database, using localStorage fallback');
        }
      } catch (dbError) {
        console.log('Database not available, using localStorage fallback');
      }

      // Always save to localStorage as fallback
      const trialStatus: TrialStatus = {
        isActive: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysRemaining: this.TRIAL_DURATION_DAYS,
        totalDays: this.TRIAL_DURATION_DAYS,
        isExpired: false
      };

      localStorage.setItem(this.TRIAL_STORAGE_KEY, JSON.stringify(trialStatus));
      
      console.log('✅ Trial initialized for user:', userId, trialStatus);
      return trialStatus;
    } catch (error) {
      console.error('Failed to initialize trial:', error);
      throw error;
    }
  }

  /**
   * Get current trial status for a user
   */
  static async getTrialStatus(userId: string): Promise<TrialStatus> {
    try {
      // Try database first
      try {
        const { data: trialData, error } = await supabase
          .from('user_trials')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (!error && trialData) {
          const status = this.calculateTrialStatus(trialData.start_date, trialData.end_date);
          console.log('✅ Found trial status in database:', status);
          return status;
        }
      } catch (dbError) {
        console.log('Database query failed, checking localStorage fallback');
      }

      // Fallback to localStorage
      const localTrial = localStorage.getItem(this.TRIAL_STORAGE_KEY);
      if (localTrial) {
        try {
          const trialStatus: TrialStatus = JSON.parse(localTrial);
          // Recalculate days remaining
          const updatedStatus = this.calculateTrialStatus(trialStatus.startDate, trialStatus.endDate);
          
          // Update localStorage with recalculated status
          localStorage.setItem(this.TRIAL_STORAGE_KEY, JSON.stringify(updatedStatus));
          
          console.log('✅ Using localStorage trial status:', updatedStatus);
          return updatedStatus;
        } catch (parseError) {
          console.log('Failed to parse localStorage trial data');
        }
      }

      // No trial found
      const noTrialStatus: TrialStatus = {
        isActive: false,
        startDate: '',
        endDate: '',
        daysRemaining: 0,
        totalDays: 0,
        isExpired: true
      };

      console.log('No trial found for user:', userId);
      return noTrialStatus;
    } catch (error) {
      console.error('Failed to get trial status:', error);
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

  /**
   * Check if user has active trial access
   */
  static async hasTrialAccess(userId: string): Promise<boolean> {
    try {
      const trialStatus = await this.getTrialStatus(userId);
      return trialStatus.isActive && !trialStatus.isExpired;
    } catch (error) {
      console.error('Failed to check trial access:', error);
      return false;
    }
  }

  /**
   * Calculate trial status based on dates
   */
  private static calculateTrialStatus(startDate: string, endDate: string): TrialStatus {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const isExpired = now > end;
    
    // Calculate days remaining more intuitively
    // If today is the start date, show full trial duration
    // If we're in the middle, show remaining days
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const startOfTrial = new Date(start);
    startOfTrial.setHours(0, 0, 0, 0); // Start of trial day
    
    let daysRemaining: number;
    
    if (today.getTime() === startOfTrial.getTime()) {
      // Today is the first day of trial, show full duration
      daysRemaining = this.TRIAL_DURATION_DAYS;
    } else {
      // Calculate remaining days including partial days
      const timeDiff = end.getTime() - now.getTime();
      const remainingDays = timeDiff / (1000 * 60 * 60 * 24);
      
      // Round up to include partial days (e.g., if 6.8 days left, show 7)
      daysRemaining = Math.max(0, Math.ceil(remainingDays));
    }
    
    return {
      isActive: !isExpired,
      startDate,
      endDate,
      daysRemaining,
      totalDays: this.TRIAL_DURATION_DAYS,
      isExpired
    };
  }

  /**
   * Extend trial (for admin use)
   */
  static async extendTrial(userId: string, additionalDays: number): Promise<TrialStatus> {
    try {
      const currentStatus = await this.getTrialStatus(userId);
      
      if (!currentStatus.isActive) {
        throw new Error('Cannot extend expired trial');
      }

      const newEndDate = new Date(currentStatus.endDate);
      newEndDate.setDate(newEndDate.getDate() + additionalDays);

      const updatedStatus: TrialStatus = {
        ...currentStatus,
        endDate: newEndDate.toISOString(),
        daysRemaining: currentStatus.daysRemaining + additionalDays
      };

      // Update database
      try {
        const { error } = await supabase
          .from('user_trials')
          .update({
            end_date: newEndDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('is_active', true);

        if (error) {
          console.log('Could not update trial in database');
        }
      } catch (dbError) {
        console.log('Database not available for trial extension');
      }

      // Update localStorage
      localStorage.setItem(this.TRIAL_STORAGE_KEY, JSON.stringify(updatedStatus));
      
      console.log('✅ Trial extended for user:', userId, 'by', additionalDays, 'days');
      return updatedStatus;
    } catch (error) {
      console.error('Failed to extend trial:', error);
      throw error;
    }
  }

  /**
   * End trial early (for admin use)
   */
  static async endTrial(userId: string): Promise<void> {
    try {
      // Update database
      try {
        const { error } = await supabase
          .from('user_trials')
          .update({
            is_active: false,
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('is_active', true);

        if (error) {
          console.log('Could not end trial in database');
        }
      } catch (dbError) {
        console.log('Database not available for ending trial');
      }

      // Remove from localStorage
      localStorage.removeItem(this.TRIAL_STORAGE_KEY);
      
      console.log('✅ Trial ended for user:', userId);
    } catch (error) {
      console.error('Failed to end trial:', error);
      throw error;
    }
  }

  /**
   * Get trial expiration message
   */
  static getTrialExpirationMessage(daysRemaining: number): string {
    if (daysRemaining === 0) {
      return 'Your free trial has expired. Subscribe now to continue learning!';
    } else if (daysRemaining === 1) {
      return 'Your free trial expires tomorrow. Subscribe now to keep learning!';
    } else if (daysRemaining <= 3) {
      return `Your free trial expires in ${daysRemaining} days. Subscribe now to keep learning!`;
    } else {
      return `You have ${daysRemaining} days left in your free trial.`;
    }
  }

  /**
   * Check if user needs trial banner
   */
  static shouldShowTrialBanner(daysRemaining: number): boolean {
    return daysRemaining <= 3 && daysRemaining > 0;
  }

  /**
   * Reset trial for testing purposes (for admin use)
   */
  static resetTrialForTesting(userId: string): void {
    try {
      // Clear existing trial data
      localStorage.removeItem(this.TRIAL_STORAGE_KEY);
      
      // Initialize a fresh trial
      const startDate = new Date();
      const endDate = new Date();
      
      // Set start date to beginning of today
      startDate.setHours(0, 0, 0, 0);
      
      // Set end date to end of the 7th day (23:59:59)
      endDate.setDate(startDate.getDate() + this.TRIAL_DURATION_DAYS);
      endDate.setHours(23, 59, 59, 999);
      
      const newTrialStatus: TrialStatus = {
        isActive: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysRemaining: this.TRIAL_DURATION_DAYS,
        totalDays: this.TRIAL_DURATION_DAYS,
        isExpired: false
      };
      
      localStorage.setItem(this.TRIAL_STORAGE_KEY, JSON.stringify(newTrialStatus));
      console.log('✅ Trial reset for testing:', newTrialStatus);
    } catch (error) {
      console.error('Failed to reset trial for testing:', error);
    }
  }
}

export default TrialManager;
