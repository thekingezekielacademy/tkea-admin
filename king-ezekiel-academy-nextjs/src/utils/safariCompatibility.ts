export const isOldSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  
  if (!isSafari) return false;
  
  // Check for Safari version
  const safariVersionMatch = userAgent.match(/Version\/(\d+)/);
  if (safariVersionMatch) {
    const version = parseInt(safariVersionMatch[1], 10);
    return version < 14; // Safari 14+ has better regex support
  }
  
  return false;
};
