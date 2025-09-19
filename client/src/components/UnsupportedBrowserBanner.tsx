/**
 * Unsupported Browser Banner Component
 * 
 * Shows a user-friendly message when the browser is not supported
 * or when all fallback rendering methods have failed.
 */

import React, { useState } from 'react';

interface UnsupportedBrowserBannerProps {
  browserType?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const UnsupportedBrowserBanner: React.FC<UnsupportedBrowserBannerProps> = ({
  browserType = 'current',
  errorMessage,
  onRetry,
  onDismiss
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleRetry = () => {
    onRetry?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4">
          <svg 
            className="w-8 h-8 text-yellow-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
          Browser Compatibility Issue
        </h2>

        {/* Message */}
        <div className="text-gray-600 text-center mb-6">
          <p className="mb-2">
            We've detected that you're using{' '}
            <span className="font-semibold">
              {browserType === 'instagram' && 'Instagram'}
              {browserType === 'facebook' && 'Facebook'}
              {browserType === 'mini' && 'an in-app browser'}
              {!['instagram', 'facebook', 'mini'].includes(browserType) && browserType}
            </span>
            {' '}which may not fully support our application.
          </p>
          
          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded border">
              <strong>Error:</strong> {errorMessage}
            </p>
          )}
          
          <p className="mt-4 text-sm">
            For the best experience, please open this link in:
          </p>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="font-medium">Safari (iOS/Mac)</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="font-medium">Chrome (Android/Desktop)</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="font-medium">Firefox (Desktop)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Continue Anyway
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            Having trouble? Try copying the link and opening it in your default browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnsupportedBrowserBanner;
