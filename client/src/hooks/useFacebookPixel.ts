import { useEffect, useCallback } from 'react';
import ReactPixel from 'react-facebook-pixel';
import { useLocation } from 'react-router-dom';
import {
  FACEBOOK_PIXEL_ID,
  PIXEL_OPTIONS,
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
 */
export const useFacebookPixel = () => {
  const location = useLocation();

  // Initialize Facebook Pixel
  useEffect(() => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      ReactPixel.init(FACEBOOK_PIXEL_ID, undefined, PIXEL_OPTIONS);
      ReactPixel.pageView();
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      ReactPixel.pageView();
    }
  }, [location.pathname]);

  // Standard page view tracking
  const trackPageView = useCallback(() => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      ReactPixel.pageView();
    }
  }, []);

  // Lead tracking
  const trackLead = useCallback((leadType: string = 'course_inquiry', value: number = 0, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getLeadEventParams(leadType, value, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.LEAD, params);
    }
  }, []);

  // Course view tracking
  const trackCourseView = useCallback((courseId: string, courseTitle: string, coursePrice: number = 0, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getCourseEventParams(courseId, courseTitle, coursePrice, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.VIEW_CONTENT, params);
      ReactPixel.track(FB_PIXEL_EVENTS.COURSE_VIEW, params);
    }
  }, []);

  // Course enrollment tracking
  const trackCourseEnroll = useCallback((courseId: string, courseTitle: string, coursePrice: number = 0, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getCourseEventParams(courseId, courseTitle, coursePrice, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.COURSE_ENROLL, params);
    }
  }, []);

  // Course completion tracking
  const trackCourseComplete = useCallback((courseId: string, courseTitle: string, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getCourseEventParams(courseId, courseTitle, 0, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.COURSE_COMPLETE, params);
    }
  }, []);

  // Purchase tracking
  const trackPurchase = useCallback((transactionId: string, value: number, currency: string = 'NGN', additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getPurchaseEventParams(transactionId, value, currency, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.PURCHASE, params);
    }
  }, []);

  // Subscription tracking
  const trackSubscription = useCallback((planName: string, planPrice: number, subscriptionId: string, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getPurchaseEventParams(subscriptionId, planPrice, 'NGN', {
        plan_name: planName,
        subscription_id: subscriptionId,
        ...additionalParams
      });
      ReactPixel.track(FB_PIXEL_EVENTS.PURCHASE, params);
    }
  }, []);

  // Trial start tracking
  const trackTrialStart = useCallback((trialDays: number = 7, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getTrialEventParams(trialDays, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.START_TRIAL, params);
    }
  }, []);

  // Registration tracking
  const trackRegistration = useCallback((registrationMethod: string = 'email', additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getRegistrationEventParams(registrationMethod, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.COMPLETE_REGISTRATION, params);
      ReactPixel.track(FB_PIXEL_EVENTS.SIGN_UP, params);
    }
  }, []);

  // Login tracking
  const trackLogin = useCallback((loginMethod: string = 'email', additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getStandardEventParams({
        login_method: loginMethod,
        ...additionalParams
      });
      ReactPixel.track(FB_PIXEL_EVENTS.LOGIN, params);
    }
  }, []);

  // Blog view tracking
  const trackBlogView = useCallback((blogId: string, blogTitle: string, blogCategory: string = 'digital_marketing', additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getBlogEventParams(blogId, blogTitle, blogCategory, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.VIEW_CONTENT, params);
      ReactPixel.track(FB_PIXEL_EVENTS.BLOG_VIEW, params);
    }
  }, []);

  // Blog share tracking
  const trackBlogShare = useCallback((blogId: string, blogTitle: string, sharePlatform: string, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getBlogEventParams(blogId, blogTitle, 'digital_marketing', {
        share_platform: sharePlatform,
        ...additionalParams
      });
      ReactPixel.track(FB_PIXEL_EVENTS.BLOG_SHARE, params);
    }
  }, []);

  // Video play tracking
  const trackVideoPlay = useCallback((videoId: string, videoTitle: string, videoDuration: number, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getVideoEventParams(videoId, videoTitle, videoDuration, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.VIDEO_PLAY, params);
    }
  }, []);

  // Video complete tracking
  const trackVideoComplete = useCallback((videoId: string, videoTitle: string, videoDuration: number, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getVideoEventParams(videoId, videoTitle, videoDuration, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.VIDEO_COMPLETE, params);
    }
  }, []);

  // Search tracking
  const trackSearch = useCallback((searchTerm: string, searchResults: number, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getSearchEventParams(searchTerm, searchResults, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.SEARCH, params);
    }
  }, []);

  // Contact tracking
  const trackContact = useCallback((contactMethod: string = 'contact_form', additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getContactEventParams(contactMethod, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.CONTACT, params);
    }
  }, []);

  // Download tracking
  const trackDownload = useCallback((downloadType: string, fileName: string, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getStandardEventParams({
        content_type: 'download',
        content_category: downloadType,
        content_name: fileName,
        ...additionalParams
      });
      ReactPixel.track(FB_PIXEL_EVENTS.DOWNLOAD, params);
    }
  }, []);

  // Custom event tracking
  const trackCustomEvent = useCallback((eventName: string, parameters: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getStandardEventParams(parameters);
      ReactPixel.track(eventName, params);
    }
  }, []);

  // Add to cart tracking (for course enrollment intent)
  const trackAddToCart = useCallback((courseId: string, courseTitle: string, coursePrice: number = 0, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getCourseEventParams(courseId, courseTitle, coursePrice, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.ADD_TO_CART, params);
    }
  }, []);

  // Initiate checkout tracking
  const trackInitiateCheckout = useCallback((courseId: string, courseTitle: string, coursePrice: number = 0, additionalParams: Record<string, any> = {}) => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      const params = getCourseEventParams(courseId, courseTitle, coursePrice, additionalParams);
      ReactPixel.track(FB_PIXEL_EVENTS.INITIATE_CHECKOUT, params);
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
