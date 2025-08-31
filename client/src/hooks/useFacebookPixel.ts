import { useCallback } from 'react';
import {
  FACEBOOK_PIXEL_ID,
  FB_PIXEL_EVENTS,
  getStandardEventParams,
  getCourseEventParams,
  getPurchaseEventParams,
  getLeadEventParams,
  getBlogEventParams,
  getRegistrationEventParams,
  getTrialEventParams,
  getVideoEventParams,
  getSearchEventParams,
  getContactEventParams
} from '../config/facebookPixel';

/**
 * Custom Hook for Facebook Pixel Tracking
 * 
 * Provides comprehensive Facebook Pixel tracking functionality
 * for King Ezekiel Academy's education platform.
 * Uses standard fbq function for compatibility.
 */
export const useFacebookPixel = () => {
  // Note: Page view tracking is now handled by FacebookPixelProvider component
  // This hook only provides tracking functions for specific events

  // Helper function to check if fbq is available
  const isFbqAvailable = () => {
    return typeof window !== 'undefined' && (window as any).fbq;
  };

  // Standard page view tracking
  const trackPageView = useCallback(() => {
    if (isFbqAvailable()) {
      (window as any).fbq('track', 'PageView');
    }
  }, []);

  // Lead tracking
  const trackLead = useCallback((leadType: string = 'course_inquiry', value: number = 0, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getLeadEventParams(leadType, value, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.LEAD, params);
    }
  }, []);

  // Course view tracking
  const trackCourseView = useCallback((courseId: string, courseTitle: string, coursePrice: number = 0, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getCourseEventParams(courseId, courseTitle, coursePrice, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.VIEW_CONTENT, params);
      (window as any).fbq('track', FB_PIXEL_EVENTS.COURSE_VIEW, params);
    }
  }, []);

  // Course enrollment tracking
  const trackCourseEnroll = useCallback((courseId: string, courseTitle: string, coursePrice: number = 0, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getCourseEventParams(courseId, courseTitle, coursePrice, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.COURSE_ENROLL, params);
    }
  }, []);

  // Course completion tracking
  const trackCourseComplete = useCallback((courseId: string, courseTitle: string, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getCourseEventParams(courseId, courseTitle, 0, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.COURSE_COMPLETE, params);
    }
  }, []);

  // Purchase tracking
  const trackPurchase = useCallback((transactionId: string, value: number, currency: string = 'NGN', additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getPurchaseEventParams(transactionId, value, currency, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.PURCHASE, params);
    }
  }, []);

  // Subscription tracking
  const trackSubscription = useCallback((planName: string, planPrice: number, subscriptionId: string, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getPurchaseEventParams(subscriptionId, planPrice, 'NGN', {
        plan_name: planName,
        subscription_id: subscriptionId,
        ...additionalParams
      });
      (window as any).fbq('track', FB_PIXEL_EVENTS.PURCHASE, params);
    }
  }, []);

  // Trial start tracking
  const trackTrialStart = useCallback((trialDays: number = 7, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getTrialEventParams(trialDays, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.START_TRIAL, params);
    }
  }, []);

  // Registration tracking
  const trackRegistration = useCallback((registrationMethod: string = 'email', additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getRegistrationEventParams(registrationMethod, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.COMPLETE_REGISTRATION, params);
      (window as any).fbq('track', FB_PIXEL_EVENTS.SIGN_UP, params);
    }
  }, []);

  // Login tracking
  const trackLogin = useCallback((loginMethod: string = 'email', additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getStandardEventParams({
        login_method: loginMethod,
        ...additionalParams
      });
      (window as any).fbq('track', FB_PIXEL_EVENTS.LOGIN, params);
    }
  }, []);

  // Blog view tracking
  const trackBlogView = useCallback((blogId: string, blogTitle: string, blogCategory: string = 'digital_marketing', additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getBlogEventParams(blogId, blogTitle, blogCategory, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.VIEW_CONTENT, params);
      (window as any).fbq('track', FB_PIXEL_EVENTS.BLOG_VIEW, params);
    }
  }, []);

  // Blog share tracking
  const trackBlogShare = useCallback((blogId: string, blogTitle: string, sharePlatform: string, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getBlogEventParams(blogId, blogTitle, 'digital_marketing', {
        share_platform: sharePlatform,
        ...additionalParams
      });
      (window as any).fbq('track', FB_PIXEL_EVENTS.BLOG_SHARE, params);
    }
  }, []);

  // Video play tracking
  const trackVideoPlay = useCallback((videoId: string, videoTitle: string, videoDuration: number, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getVideoEventParams(videoId, videoTitle, videoDuration, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.VIDEO_PLAY, params);
    }
  }, []);

  // Video complete tracking
  const trackVideoComplete = useCallback((videoId: string, videoTitle: string, videoDuration: number, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getVideoEventParams(videoId, videoTitle, videoDuration, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.VIDEO_COMPLETE, params);
    }
  }, []);

  // Search tracking
  const trackSearch = useCallback((searchTerm: string, searchResults: number, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getSearchEventParams(searchTerm, searchResults, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.SEARCH, params);
    }
  }, []);

  // Contact tracking
  const trackContact = useCallback((contactMethod: string = 'contact_form', additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getContactEventParams(contactMethod, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.CONTACT, params);
    }
  }, []);

  // Download tracking
  const trackDownload = useCallback((downloadType: string, fileName: string, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getStandardEventParams({
        content_type: 'download',
        content_category: downloadType,
        content_name: fileName,
        ...additionalParams
      });
      (window as any).fbq('track', FB_PIXEL_EVENTS.DOWNLOAD, params);
    }
  }, []);

  // Custom event tracking
  const trackCustomEvent = useCallback((eventName: string, parameters: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getStandardEventParams(parameters);
      (window as any).fbq('track', eventName, params);
    }
  }, []);

  // Add to cart tracking (for course enrollment intent)
  const trackAddToCart = useCallback((courseId: string, courseTitle: string, coursePrice: number = 0, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getCourseEventParams(courseId, courseTitle, coursePrice, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.ADD_TO_CART, params);
    }
  }, []);

  // Initiate checkout tracking
  const trackInitiateCheckout = useCallback((courseId: string, courseTitle: string, coursePrice: number = 0, additionalParams: Record<string, any> = {}) => {
    if (isFbqAvailable()) {
      const params = getCourseEventParams(courseId, courseTitle, coursePrice, additionalParams);
      (window as any).fbq('track', FB_PIXEL_EVENTS.INITIATE_CHECKOUT, params);
    }
  }, []);

  return {
    // Core tracking functions
    trackPageView,
    trackLead,
    trackCourseView,
    trackCourseEnroll,
    trackCourseComplete,
    trackPurchase,
    trackSubscription,
    trackTrialStart,
    trackRegistration,
    trackLogin,
    trackBlogView,
    trackBlogShare,
    trackVideoPlay,
    trackVideoComplete,
    trackSearch,
    trackContact,
    trackDownload,
    trackCustomEvent,
    trackAddToCart,
    trackInitiateCheckout,
    
    // Constants
    FB_PIXEL_EVENTS,
    FACEBOOK_PIXEL_ID
  };
};

export default useFacebookPixel;
