/**
 * Mini Browser Detection Utility
 * Detects Instagram, Facebook, and other in-app browsers that need special handling
 */

export interface MiniBrowserInfo {
  isMiniBrowser: boolean;
  isInstagram: boolean;
  isFacebook: boolean;
  isTikTok: boolean;
  isTwitter: boolean;
  isSnapchat: boolean;
  userAgent: string;
  needsLegacyMode: boolean;
}

/**
 * Comprehensive mini browser detection
 * Covers Instagram, Facebook, TikTok, Twitter, Snapchat, and other in-app browsers
 */
export function detectMiniBrowser(): MiniBrowserInfo {
  const ua = navigator.userAgent || '';
  const vendor = (navigator as any).vendor || '';
  const opera = (window as any).opera || '';
  
  // Instagram detection
  const isInstagram = /Instagram/i.test(ua) || 
                     /FBAN|FBAV|FBIOS/i.test(ua) ||
                     /InstagramApp/i.test(ua);
  
  // Facebook detection
  const isFacebook = /FBAN|FBAV|FBIOS/i.test(ua) ||
                    /FB_IAB|FBAN/i.test(ua) ||
                    /FBAN/i.test(ua);
  
  // TikTok detection
  const isTikTok = /TikTok/i.test(ua) ||
                  /musical_ly/i.test(ua) ||
                  /aweme/i.test(ua);
  
  // Twitter detection
  const isTwitter = /Twitter/i.test(ua) ||
                   /TwitterAndroid/i.test(ua) ||
                   /TwitteriOS/i.test(ua);
  
  // Snapchat detection
  const isSnapchat = /Snapchat/i.test(ua) ||
                     /SnapchatApp/i.test(ua);
  
  // General in-app browser detection
  const isInApp = isInstagram || isFacebook || isTikTok || isTwitter || isSnapchat ||
                  /wv\)/i.test(ua) || // Android WebView
                  /Version\/.*Safari.*Mobile/i.test(ua) && !/Chrome/i.test(ua) ||
                  /iPhone.*Safari/i.test(ua) && !/Chrome/i.test(ua) ||
                  /iPad.*Safari/i.test(ua) && !/Chrome/i.test(ua);
  
  // Legacy mode needed for mini browsers
  const needsLegacyMode = isInApp || 
                         /Safari/i.test(ua) && /Version\/([0-9]+)/.test(ua) && 
                         parseInt(RegExp.$1, 10) <= 12;
  
  return {
    isMiniBrowser: isInApp,
    isInstagram,
    isFacebook,
    isTikTok,
    isTwitter,
    isSnapchat,
    userAgent: ua,
    needsLegacyMode
  };
}

/**
 * Check if current environment needs React 17 compatibility mode
 */
export function needsReact17Mode(): boolean {
  const info = detectMiniBrowser();
  return info.needsLegacyMode || info.isMiniBrowser;
}

/**
 * Get browser-specific console prefix for debugging
 */
export function getConsolePrefix(): string {
  const info = detectMiniBrowser();
  if (info.isInstagram) return '📸 [IG]';
  if (info.isFacebook) return '📘 [FB]';
  if (info.isTikTok) return '🎵 [TT]';
  if (info.isTwitter) return '🐦 [TW]';
  if (info.isSnapchat) return '👻 [SC]';
  if (info.isMiniBrowser) return '📱 [Mini]';
  return '🌐 [Web]';
}

/**
 * Log with browser-specific prefix
 */
export function logWithPrefix(message: string, ...args: any[]): void {
  const prefix = getConsolePrefix();
  console.log(`${prefix} ${message}`, ...args);
}

/**
 * Check if service worker should be disabled
 */
export function shouldDisableServiceWorker(): boolean {
  const info = detectMiniBrowser();
  return info.isMiniBrowser || info.needsLegacyMode;
}

/**
 * Check if PWA features should be disabled
 */
export function shouldDisablePWA(): boolean {
  const info = detectMiniBrowser();
  return info.isMiniBrowser || info.needsLegacyMode;
}