interface HubSpotConfig {
  enabled: boolean;
  portalId?: string;
}

// Extend Window interface for HubSpot
declare global {
  interface Window {
    _hsq: any[];
    HubSpotConversations?: any;
  }
}

class HubSpotTracking {
  private config: HubSpotConfig;
  private _hsq: any[];

  constructor(config: HubSpotConfig = { enabled: false }) {
    this.config = config;
    this._hsq = [];
  }

  public async initialize() {
    if (!this.config.enabled || !this.config.portalId) return;

    try {
      // Initialize HubSpot tracking queue
      window._hsq = window._hsq || [];
      this._hsq = window._hsq;

      // Load HubSpot tracking script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.id = 'hs-script-loader';
      script.async = true;
      script.defer = true;
      script.src = `//js.hs-scripts.com/${this.config.portalId}.js`;
      document.body.appendChild(script);

      console.log('✅ HubSpot tracking initialized');
    } catch (error) {
      // Silently fail - don't break the app
      console.warn('HubSpot initialization failed:', error);
    }
  }

  public trackPageView(pagePath?: string) {
    if (!this.config.enabled) return;

    try {
      this._hsq.push(['setPath', pagePath || window.location.pathname]);
      this._hsq.push(['trackPageView']);
    } catch (error) {
      console.warn('HubSpot page tracking failed:', error);
    }
  }

  public trackEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.config.enabled) return;

    try {
      this._hsq.push(['trackEvent', {
        id: eventName,
        value: properties
      }]);
    } catch (error) {
      console.warn('HubSpot event tracking failed:', error);
    }
  }

  public identifyUser(email: string, properties?: Record<string, any>) {
    if (!this.config.enabled) return;

    try {
      const userProperties = {
        email,
        ...properties
      };
      
      this._hsq.push(['identify', userProperties]);
    } catch (error) {
      console.warn('HubSpot user identification failed:', error);
    }
  }

  public trackCustomBehavioralEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.config.enabled) return;

    try {
      this._hsq.push(['trackCustomBehavioralEvent', {
        name: eventName,
        properties: properties || {}
      }]);
    } catch (error) {
      console.warn('HubSpot custom event tracking failed:', error);
    }
  }

  // Track form submission
  public trackFormSubmit(formId: string, portalId?: string) {
    if (!this.config.enabled) return;

    try {
      this._hsq.push(['trackEvent', {
        id: 'form_submission',
        value: {
          formId,
          portalId: portalId || this.config.portalId
        }
      }]);
    } catch (error) {
      console.warn('HubSpot form tracking failed:', error);
    }
  }

  // Track course enrollment
  public trackCourseEnrollment(courseId: string, courseName: string, userEmail?: string) {
    if (!this.config.enabled) return;

    try {
      this.trackCustomBehavioralEvent('course_enrollment', {
        course_id: courseId,
        course_name: courseName,
        enrollment_date: new Date().toISOString()
      });

      if (userEmail) {
        this.identifyUser(userEmail, {
          enrolled_course: courseName,
          enrollment_date: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('HubSpot course enrollment tracking failed:', error);
    }
  }

  // Track lesson completion
  public trackLessonComplete(courseId: string, lessonId: string, lessonName: string) {
    if (!this.config.enabled) return;

    try {
      this.trackCustomBehavioralEvent('lesson_completed', {
        course_id: courseId,
        lesson_id: lessonId,
        lesson_name: lessonName,
        completion_date: new Date().toISOString()
      });
    } catch (error) {
      console.warn('HubSpot lesson completion tracking failed:', error);
    }
  }

  // Track payment/subscription
  public trackSubscription(plan: string, amount: number, currency: string = 'NGN') {
    if (!this.config.enabled) return;

    try {
      this.trackCustomBehavioralEvent('subscription_purchase', {
        plan_name: plan,
        amount: amount,
        currency: currency,
        purchase_date: new Date().toISOString()
      });
    } catch (error) {
      console.warn('HubSpot subscription tracking failed:', error);
    }
  }
}

// Create instance with safe defaults
export const hubspot = new HubSpotTracking({
  enabled: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
  portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
});

export default hubspot;

