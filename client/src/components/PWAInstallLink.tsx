/**
 * PWA Install Link Component
 * Provides a direct link to install the PWA app
 */

import React, { useState, useEffect } from 'react';
import { getBrowserInfo } from '../utils/simpleBrowserDetection';

interface PWAInstallLinkProps {
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  variant?: 'button' | 'link' | 'banner';
}

const PWAInstallLink: React.FC<PWAInstallLinkProps> = ({
  className = '',
  children,
  showIcon = true,
  variant = 'button'
}) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installUrl, setInstallUrl] = useState('');

  useEffect(() => {
    const browserInfo = getBrowserInfo();
    
    // Skip PWA features for mini browsers
    if (browserInfo.isInApp) {
      return;
    }

    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS Safari
      if (browserInfo.userAgent.includes('iPhone') || browserInfo.userAgent.includes('iPad')) {
        // For iOS, we can't detect installation, but we can provide instructions
        setCanInstall(true);
        setInstallUrl('#ios-install');
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Check installation status
    checkInstalled();

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Generate install URL for different platforms
    const generateInstallUrl = () => {
      const currentUrl = window.location.origin;
      
      if (browserInfo.userAgent.includes('iPhone') || browserInfo.userAgent.includes('iPad')) {
        return '#ios-install';
      } else if (browserInfo.userAgent.includes('Android')) {
        return `${currentUrl}?install=android`;
      } else {
        return `${currentUrl}?install=pwa`;
      }
    };

    setInstallUrl(generateInstallUrl());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isInstalled) {
      return;
    }

    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA install accepted');
      } else {
        console.log('❌ PWA install dismissed');
      }
      
      setDeferredPrompt(null);
    } else {
      // Fallback: open install instructions
      window.open(installUrl, '_blank');
    }
  };

  // Don't show install link for mini browsers
  const browserInfo = getBrowserInfo();
  if (browserInfo.isInApp) {
    return null;
  }

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if can't install
  if (!canInstall) {
    return null;
  }

  const getButtonContent = () => {
    if (children) return children;
    
    return (
      <>
        {showIcon && (
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
        )}
        Install App
      </>
    );
  };

  const getClassName = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-200';
    
    switch (variant) {
      case 'button':
        return `${baseClasses} px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`;
      case 'link':
        return `${baseClasses} text-blue-600 hover:text-blue-800 underline ${className}`;
      case 'banner':
        return `${baseClasses} w-full px-4 py-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 hover:bg-blue-100 ${className}`;
      default:
        return `${baseClasses} ${className}`;
    }
  };

  return (
    <button
      onClick={handleInstall}
      className={getClassName()}
      aria-label="Install King Ezekiel Academy App"
    >
      {getButtonContent()}
    </button>
  );
};

export default PWAInstallLink;
