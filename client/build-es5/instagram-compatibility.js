// Instagram Browser Compatibility Script
// This runs immediately when the page loads, before any React code
// REDIRECTS DISABLED - React app will handle in-app browser experience

(function() {
  'use strict';
  
  // Detect Instagram browser
  function isInstagramBrowser() {
    if (typeof navigator === 'undefined') return false;
    
    var userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('instagram') || 
           userAgent.includes('fbav') || 
           userAgent.includes('fban') ||
           userAgent.includes('fbsv');
  }
  
  // Detect other mini browsers
  function isMiniBrowser() {
    if (typeof navigator === 'undefined') return false;
    
    var userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('instagram') || 
           userAgent.includes('fbav') || 
           userAgent.includes('fban') ||
           userAgent.includes('fbsv') ||
           userAgent.includes('line') ||
           userAgent.includes('whatsapp') ||
           userAgent.includes('telegram');
  }
  
  // DISABLED: Check if we should redirect to fallback
  function shouldRedirectToFallback() {
    // Always return false - no redirects allowed
    return false;
  }
  
  // DISABLED: Redirect to fallback page
  function redirectToFallback() {
    // Do nothing - just log for debugging
    console.log('Instagram redirect disabled - React app will handle in-app browser experience');
  }
  
  // Log browser detection for debugging
  if (isInstagramBrowser()) {
    console.log('Instagram browser detected - React app will load normally');
  }
  
  if (isMiniBrowser()) {
    console.log('Mini browser detected - React app will load normally');
  }
  
  // No redirects - React app loads normally for all browsers
  
})();