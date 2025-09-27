'use client';
import React, { useState, useEffect } from 'react';
import { FaDownload, FaMobile, FaCheck, FaTimes } from 'react-icons/fa';

interface PWAInstallProps {
  className?: string;
}

const PWAInstall: React.FC<PWAInstallProps> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // Check if in-app browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isInApp = /instagram|facebook|twitter|linkedin|whatsapp|telegram|wechat|line|kakao/i.test(userAgent);
    setIsInAppBrowser(isInApp);
    
    // Don't show PWA install in in-app browsers
    if (isInApp) {
      console.log('🚫 PWA install component disabled for in-app browser');
      return;
    }

    // Check if mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS Safari
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
      
      setIsInstalled(false);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation dismissed');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // Don't show if in-app browser, not mobile, already installed, or no install prompt
  if (isInAppBrowser || !isMobile || isInstalled || (!showInstallPrompt && !deferredPrompt)) {
    return null;
  }

  return (
    <section className={`py-8 bg-gradient-to-r from-blue-600 to-blue-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaMobile className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Install App</h3>
                <p className="text-sm text-gray-600">Get the full experience</p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <FaCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Faster loading & offline access</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <FaCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Native app experience</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <FaCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Push notifications for new courses</span>
            </div>
          </div>

          {showInstallPrompt && deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold text-base hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <FaDownload className="w-4 h-4" />
              <span>Install App Now</span>
            </button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Look for the install button in your browser menu
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <span>Chrome: ⋮ → Install</span>
                <span>Safari: Share → Add to Home</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PWAInstall;
