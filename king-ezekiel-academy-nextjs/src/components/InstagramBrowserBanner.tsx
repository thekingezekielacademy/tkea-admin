import React, { useState, useEffect } from 'react';
import { isInstagramBrowser } from '../utils/instagramBrowserFix';

const InstagramBrowserBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner for Instagram browser users
    if (isInstagramBrowser()) {
      setShowBanner(true);
    }
  }, []);

  if (!showBanner) return null;

  return (
    <div className="bg-blue-600 text-white p-3 text-center text-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2">📱</span>
          <span>
            For the best experience, tap "Open in Chrome" or "Open in Safari"
          </span>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="ml-4 text-white hover:text-gray-200"
          aria-label="Close banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default InstagramBrowserBanner;
