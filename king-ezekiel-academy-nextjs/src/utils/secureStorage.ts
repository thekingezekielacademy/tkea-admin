class SecureStorage {
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && 'localStorage' in window;
  }

  setSubscriptionActive(isActive: boolean): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem('subscription_active', isActive.toString());
    } catch (error) {
      console.error('Error setting subscription active:', error);
    }
  }

  isSubscriptionActive(): boolean {
    if (!this.isAvailable()) return false;
    try {
      const value = localStorage.getItem('subscription_active');
      return value === 'true';
    } catch (error) {
      console.error('Error getting subscription active:', error);
      return false;
    }
  }

  getItem(key: string): string | null {
    if (!this.isAvailable()) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item:', error);
    }
  }

  setSubscriptionId(subscriptionId: string): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem('subscription_id', subscriptionId);
    } catch (error) {
      console.error('Error setting subscription ID:', error);
    }
  }

  getSubscriptionId(): string | null {
    if (!this.isAvailable()) return null;
    try {
      return localStorage.getItem('subscription_id');
    } catch (error) {
      console.error('Error getting subscription ID:', error);
      return null;
    }
  }

  clearSubscriptionData(): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.removeItem('subscription_active');
      localStorage.removeItem('subscription_id');
      localStorage.removeItem('flutterwave_subscription_id');
      localStorage.removeItem('flutterwave_customer_code');
    } catch (error) {
      console.error('Error clearing subscription data:', error);
    }
  }

  // SECURITY: Clear all user-specific data to prevent cross-contamination
  clearAllUserData(): void {
    if (!this.isAvailable()) return;
    try {
      this.clearSubscriptionData();
      localStorage.removeItem('user_profile');
      localStorage.removeItem('user_trial_status');
      localStorage.removeItem('supabase-auth.token');
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing all user data:', error);
    }
  }
}

export default new SecureStorage();