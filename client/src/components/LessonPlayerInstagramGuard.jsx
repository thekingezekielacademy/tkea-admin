import React, { useState, useEffect } from 'react';

const LessonPlayerInstagramGuard = ({ children }) => {
  const [isInstagramBrowser, setIsInstagramBrowser] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Detect Instagram's in-app browser
    const detectInstagramBrowser = () => {
      if (typeof window === 'undefined') return false;
      
      const userAgent = window.navigator.userAgent.toLowerCase();
      return userAgent.includes('fban') || 
             userAgent.includes('fbav') || 
             userAgent.includes('instagram');
    };

    const isInstagram = detectInstagramBrowser();
    setIsInstagramBrowser(isInstagram);
    
    if (isInstagram) {
      setShowOverlay(true);
    }
  }, []);

  const openInChrome = () => {
    const currentUrl = window.location.href;
    const chromeUrl = `googlechrome://${currentUrl}`;
    
    try {
      window.location.href = chromeUrl;
    } catch (error) {
      console.error('Failed to open in Chrome:', error);
    }
  };

  const openInChromeAndroid = () => {
    const currentUrl = window.location.href;
    const intentUrl = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    
    try {
      window.location.href = intentUrl;
    } catch (error) {
      console.error('Failed to open in Chrome Android:', error);
    }
  };

  const copyToClipboard = async () => {
    const currentUrl = window.location.href;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const dismissOverlay = () => {
    setShowOverlay(false);
  };

  // If not Instagram browser, render children normally
  if (!isInstagramBrowser) {
    return children;
  }

  // If Instagram browser but overlay dismissed, still render children
  if (!showOverlay) {
    return children;
  }

  // Show overlay for Instagram browser
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
        {/* Close button */}
        <button
          onClick={dismissOverlay}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Video Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Open in your browser for the best experience
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Instagram's browser cannot play videos properly. For the full lesson experience with video playback, progress tracking, and interactive features, please open this link in your main browser.
        </p>

        {/* Buttons */}
        <div className="space-y-4">
          {/* Chrome Button */}
          <button
            onClick={openInChrome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Open in Chrome</span>
          </button>

          {/* Android Chrome Button */}
          <button
            onClick={openInChromeAndroid}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Open in Chrome (Android)</span>
          </button>

          {/* Copy Link Button */}
          <button
            onClick={copyToClipboard}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Link copied! Now paste it into your browser.</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Video-specific instructions */}
        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Video Playback Issue:</strong> Instagram's browser blocks video players. Open in your browser to watch lessons, track progress, and access all features.
          </p>
        </div>

        {/* Continue in Instagram button */}
        <button
          onClick={dismissOverlay}
          className="mt-4 text-gray-500 hover:text-gray-700 text-sm underline"
        >
          Continue in Instagram (videos won't play)
        </button>
      </div>
    </div>
  );
};

export default LessonPlayerInstagramGuard;
