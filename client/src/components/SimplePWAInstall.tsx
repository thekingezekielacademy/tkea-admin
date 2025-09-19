/**
 * Simple PWA Install Component
 * A minimal component that provides a direct install link
 */

import React from 'react';
import { detectMiniBrowser, shouldDisablePWA } from '../utils/miniBrowserDetection';

interface SimplePWAInstallProps {
  text?: string;
  className?: string;
}

const SimplePWAInstall: React.FC<SimplePWAInstallProps> = ({
  text = "Install App",
  className = ""
}) => {
  const browserInfo = detectMiniBrowser();

  // Don't show for mini browsers
  if (shouldDisablePWA()) {
    return null;
  }

  const handleInstall = () => {
    // Check if we can trigger the install prompt
    if ('serviceWorker' in navigator && 'beforeinstallprompt' in window) {
      // The browser will handle the install prompt
      window.location.href = window.location.origin + '?install=pwa';
    } else {
      // Fallback: redirect to install instructions
      window.location.href = '/#/install';
    }
  };

  return (
    <button
      onClick={handleInstall}
      className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${className}`}
    >
      <svg 
        className="w-5 h-5 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 18l9-5-9-5-9 5 9 5z" 
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 18l0-10" 
        />
      </svg>
      {text}
    </button>
  );
};

export default SimplePWAInstall;
