/**
 * Facebook Pixel Configuration
 * 
 * This file contains Facebook Pixel setup and tracking events
 * for King Ezekiel Academy's digital marketing education platform.
 * 
 * Replace 'YOUR_PIXEL_ID' with your actual Facebook Pixel ID
 */

export const FACEBOOK_PIXEL_ID = '1991898708291767'; // King Ezekiel Academy Pixel ID

// Pixel initialization options
export const PIXEL_OPTIONS = {
  autoConfig: true,
  debug: process.env.NODE_ENV === 'development'
};

// Standard events for education platform
export const FB_PIXEL_EVENTS = {
  // Page View Events
  PAGE_VIEW: 'PageView',
  
  // Lead Generation Events
  LEAD: 'Lead',
  COMPLETE_REGISTRATION: 'CompleteRegistration',
  
  // Course Engagement Events
  VIEW_CONTENT: 'ViewContent',
  SEARCH: 'Search',
  ADD_TO_CART: 'AddToCart',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  PURCHASE: 'Purchase',
  
  // User Engagement Events
  CONTACT: 'Contact',
  SUBSCRIBE: 'Subscribe',
  START_TRIAL: 'StartTrial',
  
  // Custom Events
  COURSE_VIEW: 'CourseView',
  COURSE_ENROLL: 'CourseEnroll',
  COURSE_COMPLETE: 'CourseComplete',
  BLOG_VIEW: 'BlogView',
  BLOG_SHARE: 'BlogShare',
  VIDEO_PLAY: 'VideoPlay',
  VIDEO_COMPLETE: 'VideoComplete',
  DOWNLOAD: 'Download',
  SIGN_UP: 'SignUp',
  LOGIN: 'Login',
  LOGOUT: 'Logout'
};

// Event parameters for better tracking
export const EVENT_PARAMETERS = {
  // Course parameters
  COURSE_ID: 'course_id',
  COURSE_TITLE: 'course_title',
  COURSE_CATEGORY: 'course_category',
  COURSE_PRICE: 'course_price',
  COURSE_CURRENCY: 'course_currency',
  
  // User parameters
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  USER_ROLE: 'user_role',
  
  // Content parameters
  CONTENT_TYPE: 'content_type',
  CONTENT_TITLE: 'content_title',
  CONTENT_CATEGORY: 'content_category',
  
  // Subscription parameters
  PLAN_NAME: 'plan_name',
  PLAN_PRICE: 'plan_price',
  SUBSCRIPTION_ID: 'subscription_id',
  
  // Page parameters
  PAGE_URL: 'page_url',
  PAGE_TITLE: 'page_title',
  REFERRER: 'referrer',
  
  // Custom parameters
  TRIAL_DAYS: 'trial_days',
  PAYMENT_METHOD: 'payment_method',
  COUPON_CODE: 'coupon_code'
};

// Helper function to get standard event parameters
export const getStandardEventParams = (additionalParams: Record<string, any> = {}) => {
  return {
    content_type: 'product',
    content_category: 'education',
    currency: 'NGN',
    value: 0,
    ...additionalParams
  };
};

// Course-specific event parameters
export const getCourseEventParams = (
  courseId: string,
  courseTitle: string,
  coursePrice: number = 0,
  additionalParams: Record<string, any> = {}
) => {
  return getStandardEventParams({
    content_type: 'course',
    content_category: 'digital_marketing_education',
    content_ids: [courseId],
    content_name: courseTitle,
    value: coursePrice,
    currency: 'NGN',
    ...additionalParams
  });
};

// Purchase event parameters
export const getPurchaseEventParams = (
  transactionId: string,
  value: number,
  currency: string = 'NGN',
  additionalParams: Record<string, any> = {}
) => {
  return {
    content_type: 'product',
    content_category: 'subscription',
    value: value,
    currency: currency,
    transaction_id: transactionId,
    ...additionalParams
  };
};

// Lead event parameters
export const getLeadEventParams = (
  leadType: string = 'course_inquiry',
  value: number = 0,
  additionalParams: Record<string, any> = {}
) => {
  return getStandardEventParams({
    content_type: 'lead',
    content_category: leadType,
    value: value,
    ...additionalParams
  });
};

// Blog event parameters
export const getBlogEventParams = (
  blogId: string,
  blogTitle: string,
  blogCategory: string = 'digital_marketing',
  additionalParams: Record<string, any> = {}
) => {
  return getStandardEventParams({
    content_type: 'article',
    content_category: blogCategory,
    content_ids: [blogId],
    content_name: blogTitle,
    ...additionalParams
  });
};

// User registration event parameters
export const getRegistrationEventParams = (
  registrationMethod: string = 'email',
  additionalParams: Record<string, any> = {}
) => {
  return getStandardEventParams({
    content_type: 'registration',
    content_category: registrationMethod,
    ...additionalParams
  });
};

// Trial start event parameters
export const getTrialEventParams = (
  trialDays: number = 7,
  additionalParams: Record<string, any> = {}
) => {
  return getStandardEventParams({
    content_type: 'trial',
    content_category: 'free_trial',
    trial_days: trialDays,
    ...additionalParams
  });
};

// Video engagement event parameters
export const getVideoEventParams = (
  videoId: string,
  videoTitle: string,
  videoDuration: number,
  additionalParams: Record<string, any> = {}
) => {
  return getStandardEventParams({
    content_type: 'video',
    content_category: 'course_video',
    content_ids: [videoId],
    content_name: videoTitle,
    video_duration: videoDuration,
    ...additionalParams
  });
};

// Search event parameters
export const getSearchEventParams = (
  searchTerm: string,
  searchResults: number,
  additionalParams: Record<string, any> = {}
) => {
  return getStandardEventParams({
    content_type: 'search',
    content_category: 'course_search',
    search_string: searchTerm,
    search_results: searchResults,
    ...additionalParams
  });
};

// Contact event parameters
export const getContactEventParams = (
  contactMethod: string = 'contact_form',
  additionalParams: Record<string, any> = {}
) => {
  return getStandardEventParams({
    content_type: 'contact',
    content_category: contactMethod,
    ...additionalParams
  });
};

// Export default configuration
export default {
  FACEBOOK_PIXEL_ID,
  PIXEL_OPTIONS,
  FB_PIXEL_EVENTS,
  EVENT_PARAMETERS,
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
};
