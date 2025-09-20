/**
 * PWA Install Utilities
 * Helper functions for generating PWA install links and handling installation
 */

import { getBrowserInfo } from './simpleBrowserDetection';

/**
 * Generate a PWA install link based on the current browser and platform
 */
export function generatePWAInstallLink(): string {
  const browserInfo = getBrowserInfo();
  const currentUrl = window.location.origin;
  
  // Don't generate install links for mini browsers
  if (browserInfo.isInApp) {
    return '';
  }

  // Check platform and generate appropriate link
  if (browserInfo.isIOS) {
    // iOS Safari - redirect to install instructions
    return `${currentUrl}/#/install?platform=ios`;
  } else if (browserInfo.isAndroid) {
    // Android Chrome - try to trigger install prompt
    return `${currentUrl}/#/install?platform=android`;
  } else {
    // Desktop Chrome/Edge - try to trigger install prompt
    return `${currentUrl}/#/install?platform=desktop`;
  }
}

/**
 * Generate a direct install link that can be shared
 */
export function generateShareableInstallLink(): string {
  const currentUrl = window.location.origin;
  return `${currentUrl}/#/install`;
}

/**
 * Check if the current browser supports PWA installation
 */
export function canInstallPWA(): boolean {
  const browserInfo = getBrowserInfo();
  
  // Don't allow PWA installation in mini browsers
  if (browserInfo.isInApp) {
    return false;
  }

  // Check for beforeinstallprompt support
  if ('serviceWorker' in navigator && 'beforeinstallprompt' in window) {
    return true;
  }

  // Check for iOS Safari (can be added to home screen)
  if (browserInfo.isIOS) {
    return true;
  }

  return false;
}

/**
 * Get the appropriate install button text based on platform
 */
export function getInstallButtonText(): string {
  const browserInfo = getBrowserInfo();
  
  if (browserInfo.isIOS) {
    return 'Add to Home Screen';
  } else if (browserInfo.isAndroid) {
    return 'Install App';
  } else {
    return 'Install App';
  }
}

/**
 * Handle PWA installation with fallback
 */
export function handlePWAInstall(): void {
  if (!canInstallPWA()) {
    // Redirect to install instructions
    window.location.href = generateShareableInstallLink();
    return;
  }

  // Check if we can trigger the install prompt
  if ('beforeinstallprompt' in window) {
    // The browser will handle the install prompt
    window.location.href = generatePWAInstallLink();
  } else {
    // Fallback to install instructions
    window.location.href = generateShareableInstallLink();
  }
}

/**
 * Create a PWA install link element
 */
export function createPWAInstallLink(text?: string, className?: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = generatePWAInstallLink();
  link.textContent = text || getInstallButtonText();
  link.className = className || 'pwa-install-link';
  link.setAttribute('data-pwa-install', 'true');
  
  return link;
}

/**
 * Add PWA install link to a specific element
 */
export function addPWAInstallLinkToElement(elementId: string, text?: string, className?: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id "${elementId}" not found`);
    return;
  }

  const installLink = createPWAInstallLink(text, className);
  element.appendChild(installLink);
}

/**
 * Get PWA install instructions for the current platform
 */
export function getInstallInstructions(): {
  platform: string;
  steps: string[];
  icon: string;
} {
  const browserInfo = getBrowserInfo();
  
  if (browserInfo.isIOS) {
    return {
      platform: 'iOS',
      icon: '📱',
      steps: [
        'Open this page in Safari',
        'Tap the Share button (square with arrow)',
        'Select "Add to Home Screen"',
        'Tap "Add" to confirm'
      ]
    };
  } else if (browserInfo.isAndroid) {
    return {
      platform: 'Android',
      icon: '🤖',
      steps: [
        'Open this page in Chrome',
        'Look for the "Add to Home screen" banner',
        'Tap "Install" or "Add to Home screen"',
        'Confirm the installation'
      ]
    };
  } else {
    return {
      platform: 'Desktop',
      icon: '💻',
      steps: [
        'Use Chrome or Edge browser',
        'Look for the install icon in the address bar',
        'Click the install button',
        'Confirm the installation'
      ]
    };
  }
}
