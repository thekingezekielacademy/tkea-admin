import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface WebVitalsConfig {
  enabled: boolean;
  endpoint?: string;
}

class WebVitalsMonitor {
  private config: WebVitalsConfig;

  constructor(config: WebVitalsConfig = { enabled: true }) {
    this.config = config;
  }

  private sendToAnalytics(metric: any) {
    if (!this.config.enabled) return;

    // Send to your analytics endpoint
    if (this.config.endpoint) {
      fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(() => {
        // Silently fail - don't break the app
      });
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', metric);
    }
  }

  public startMonitoring() {
    if (!this.config.enabled) return;

    try {
      getCLS(this.sendToAnalytics);
      getFID(this.sendToAnalytics);
      getFCP(this.sendToAnalytics);
      getLCP(this.sendToAnalytics);
      getTTFB(this.sendToAnalytics);
    } catch (error) {
      // Silently fail - don't break the app
      console.warn('Web Vitals monitoring failed:', error);
    }
  }
}

// Create instance with safe defaults
export const webVitals = new WebVitalsMonitor({
  enabled: process.env.NODE_ENV === 'production',
  endpoint: process.env.REACT_APP_ANALYTICS_ENDPOINT,
});

export default webVitals;
