/**
 * User Agent Detection for Mini Browsers
 * 
 * Detects Instagram, Facebook, and other mini browsers that require
 * ES5-compatible builds for proper functionality.
 */

/**
 * Check if the user agent is an Instagram in-app browser
 * @param {string} userAgent - The user agent string
 * @returns {boolean}
 */
function isInstagramBrowser(userAgent) {
  if (!userAgent) return false;
  
  const ua = userAgent.toLowerCase();
  return ua.includes('instagram') || 
         ua.includes('fbav') || 
         ua.includes('fban') || 
         ua.includes('fbios');
}

/**
 * Check if the user agent is a Facebook in-app browser
 * @param {string} userAgent - The user agent string
 * @returns {boolean}
 */
function isFacebookBrowser(userAgent) {
  if (!userAgent) return false;
  
  const ua = userAgent.toLowerCase();
  return ua.includes('fbav') || 
         ua.includes('fban') || 
         ua.includes('fbios') ||
         ua.includes('fbsv');
}

/**
 * Check if the user agent is any mini browser
 * @param {string} userAgent - The user agent string
 * @returns {boolean}
 */
function isMiniBrowser(userAgent) {
  if (!userAgent) return false;
  
  const ua = userAgent.toLowerCase();
  return ua.includes('instagram') || 
         ua.includes('fbav') || 
         ua.includes('fban') || 
         ua.includes('fbios') ||
         ua.includes('fbsv') ||
         ua.includes('line') ||
         ua.includes('whatsapp') ||
         ua.includes('telegram') ||
         ua.includes('twitter') ||
         ua.includes('linkedin') ||
         ua.includes('wv)'); // WebView indicator
}

/**
 * Check if the user agent is an old browser that needs ES5 compatibility
 * @param {string} userAgent - The user agent string
 * @returns {boolean}
 */
function isOldBrowser(userAgent) {
  if (!userAgent) return false;
  
  const ua = userAgent.toLowerCase();
  
  // Old Safari (before version 13)
  const isOldSafari = ua.includes('safari') && 
                     !ua.includes('chrome') && 
                     /version\/([0-9]+)/.test(ua) &&
                     parseInt(ua.match(/version\/([0-9]+)/)[1]) < 13;
  
  // Old Chrome (before version 60)
  const isOldChrome = ua.includes('chrome/') && 
                     /chrome\/[0-5][0-9]/.test(ua);
  
  // Old Firefox (before version 60)
  const isOldFirefox = ua.includes('firefox/') && 
                      /firefox\/[0-5][0-9]/.test(ua);
  
  // Old Edge (before version 79)
  const isOldEdge = ua.includes('edge/') && 
                   /edge\/[0-7][0-9]/.test(ua);
  
  return isOldSafari || isOldChrome || isOldFirefox || isOldEdge;
}

/**
 * Check if the user agent requires the ES5 fallback build
 * @param {string} userAgent - The user agent string
 * @returns {boolean}
 */
function requiresES5Fallback(userAgent) {
  if (!userAgent) return false;
  
  return isMiniBrowser(userAgent) || isOldBrowser(userAgent);
}

/**
 * Get detailed browser information
 * @param {string} userAgent - The user agent string
 * @returns {object}
 */
function getBrowserInfo(userAgent) {
  if (!userAgent) {
    return {
      isInstagram: false,
      isFacebook: false,
      isMiniBrowser: false,
      isOldBrowser: false,
      requiresES5Fallback: false,
      userAgent: 'unknown'
    };
  }
  
  return {
    isInstagram: isInstagramBrowser(userAgent),
    isFacebook: isFacebookBrowser(userAgent),
    isMiniBrowser: isMiniBrowser(userAgent),
    isOldBrowser: isOldBrowser(userAgent),
    requiresES5Fallback: requiresES5Fallback(userAgent),
    userAgent: userAgent
  };
}

/**
 * Express middleware to detect browser type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
function browserDetectionMiddleware(req, res, next) {
  const userAgent = req.get('User-Agent') || '';
  const browserInfo = getBrowserInfo(userAgent);
  
  // Attach browser info to request object
  req.browserInfo = browserInfo;
  
  // Log for debugging
  if (browserInfo.requiresES5Fallback) {
    console.log('🔍 ES5 Fallback Required:', {
      userAgent: userAgent,
      isInstagram: browserInfo.isInstagram,
      isFacebook: browserInfo.isFacebook,
      isMiniBrowser: browserInfo.isMiniBrowser,
      isOldBrowser: browserInfo.isOldBrowser
    });
  }
  
  next();
}

module.exports = {
  isInstagramBrowser,
  isFacebookBrowser,
  isMiniBrowser,
  isOldBrowser,
  requiresES5Fallback,
  getBrowserInfo,
  browserDetectionMiddleware
};
