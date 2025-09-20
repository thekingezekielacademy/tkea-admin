import { getSEOCompatibilityConfig } from './browserCompatibility';

interface AnalyticsConfig {
  enabled: boolean;
  measurementId?: string;
}

// Extend Window interface for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

class Analytics {
  private config: AnalyticsConfig;
  private gtag: any;

  constructor(config: AnalyticsConfig = { enabled: false }) {
    this.config = config;
    this.gtag = null;
  }

  public async initialize() {
    if (!this.config.enabled || !this.config.measurementId) return;

    // Check if we're in a mini browser
    const ua = navigator.userAgent || '';
    const isMiniBrowser = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(ua);
    
    if (isMiniBrowser) {
      console.log('📱 Mini browser detected - skipping analytics initialization');
      return;
    }

    // Check browser compatibility
    const compatibilityConfig = getSEOCompatibilityConfig();
    if (!compatibilityConfig.enableAnalytics) {
      console.log('Analytics disabled for browser compatibility');
      return;
    }

    try {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`;
      script.async = true;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      this.gtag = function(...args: any[]) {
        window.dataLayer.push(args);
      };
      this.gtag('js', new Date());
      this.gtag('config', this.config.measurementId, {
        page_title: document.title,
        page_location: window.location.href,
      });
    } catch (error) {
      // Silently fail - don't break the app
      console.warn('Analytics initialization failed:', error);
    }
  }

  public trackEvent(eventName: string, parameters?: any) {
    if (!this.gtag || !this.config.enabled) return;

    try {
      this.gtag('event', eventName, parameters);
    } catch (error) {
      // Silently fail - don't break the app
      console.warn('Analytics tracking failed:', error);
    }
  }

  public trackPageView(pagePath: string, pageTitle?: string) {
    if (!this.gtag || !this.config.enabled) return;

    try {
      this.gtag('config', this.config.measurementId, {
        page_path: pagePath,
        page_title: pageTitle || document.title,
      });
    } catch (error) {
      // Silently fail - don't break the app
      console.warn('Analytics page tracking failed:', error);
    }
  }
}

// Create instance with safe defaults
export const analytics = new Analytics({
  enabled: process.env.NODE_ENV === 'production' && !!process.env.REACT_APP_GA_MEASUREMENT_ID,
  measurementId: process.env.REACT_APP_GA_MEASUREMENT_ID,
});

export default analytics;
