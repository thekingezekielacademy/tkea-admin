// Instagram Browser Compatibility Script
// This runs immediately when the page loads, before any React code

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
  
  // Check if we should redirect to fallback
  function shouldRedirectToFallback() {
    // Only redirect if we're in Instagram browser
    if (!isInstagramBrowser()) return false;
    
    // Check if we're already on the fallback page
    if (window.location.pathname.includes('instagram-fallback')) return false;
    
    return true;
  }
  
  // Redirect to fallback page
  function redirectToFallback() {
    try {
      var fallbackUrl = window.location.origin + '/instagram-fallback.html';
      window.location.replace(fallbackUrl);
    } catch (error) {
      // If redirect fails, show a basic message
      document.body.innerHTML = '<div style="padding:20px;text-align:center;font-family:Arial,sans-serif;"><h1>King Ezekiel Academy</h1><p>For the best experience, please open this link in your browser.</p><a href="https://thekingezekielacademy.com" style="color:#007bff;text-decoration:underline;">Open in Browser</a></div>';
    }
  }
  
  // Run the check immediately
  if (shouldRedirectToFallback()) {
    // Small delay to ensure page is ready
    setTimeout(redirectToFallback, 100);
  }
  
  // Also check when DOM is ready as a backup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (shouldRedirectToFallback()) {
        redirectToFallback();
      }
    });
  }
  
})();