/**
 * Rate Limiting Handler
 * Handles rate limiting gracefully without blocking users
 */

interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  ip: string;
}

class RateLimitHandler {
  private static instance: RateLimitHandler;
  private rateLimitInfo: RateLimitInfo | null = null;
  private lastCheck: number = 0;
  private checkInterval: number = 30000; // Check every 30 seconds

  static getInstance(): RateLimitHandler {
    if (!RateLimitHandler.instance) {
      RateLimitHandler.instance = new RateLimitHandler();
    }
    return RateLimitHandler.instance;
  }

  /**
   * Check rate limit status
   */
  async checkRateLimit(): Promise<RateLimitInfo | null> {
    const now = Date.now();
    
    // Don't check too frequently
    if (now - this.lastCheck < this.checkInterval) {
      return this.rateLimitInfo;
    }

    try {
      const response = await fetch('/api/rate-limit', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.rateLimitInfo = {
          remaining: data.remaining,
          resetTime: data.resetTime,
          ip: data.ip
        };
        this.lastCheck = now;
        return this.rateLimitInfo;
      } else if (response.status === 429) {
        // Rate limited
        const errorData = await response.json();
        this.rateLimitInfo = {
          remaining: 0,
          resetTime: Date.now() + (errorData.retryAfter * 1000),
          ip: 'unknown'
        };
        this.lastCheck = now;
        return this.rateLimitInfo;
      }
    } catch (error) {
      console.warn('Rate limit check failed:', error);
      // Don't block the app if rate limit check fails
    }

    return null;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Check if user is rate limited
   */
  isRateLimited(): boolean {
    if (!this.rateLimitInfo) return false;
    return this.rateLimitInfo.remaining <= 0 && Date.now() < this.rateLimitInfo.resetTime;
  }

  /**
   * Get time until rate limit resets
   */
  getTimeUntilReset(): number {
    if (!this.rateLimitInfo) return 0;
    return Math.max(0, this.rateLimitInfo.resetTime - Date.now());
  }

  /**
   * Show rate limit notification
   */
  showRateLimitNotification(): void {
    const timeUntilReset = this.getTimeUntilReset();
    const minutes = Math.ceil(timeUntilReset / 60000);
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <span>⚠️ Rate limit reached. Please wait ${minutes} minute(s).</span>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

export default RateLimitHandler;
