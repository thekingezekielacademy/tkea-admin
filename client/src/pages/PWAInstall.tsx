/**
 * PWA Install Instructions Page
 * Provides platform-specific installation instructions
 */

import React, { useEffect, useState } from 'react';
import { detectMiniBrowser, shouldDisablePWA } from '../utils/miniBrowserDetection';

const PWAInstall: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    const info = detectMiniBrowser();
    setBrowserInfo(info);

    // Detect platform
    const userAgent = navigator.userAgent;
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      setPlatform('ios');
    } else if (userAgent.includes('Android')) {
      setPlatform('android');
    } else if (userAgent.includes('Windows')) {
      setPlatform('windows');
    } else if (userAgent.includes('Mac')) {
      setPlatform('mac');
    } else {
      setPlatform('other');
    }
  }, []);

  // Don't show install instructions for mini browsers
  if (shouldDisablePWA()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            PWA Not Available
          </h1>
          <p className="text-gray-600 mb-6">
            PWA installation is not available in this browser. Please open this app in Safari, Chrome, or Edge for the best experience.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const IOSInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Install on iPhone/iPad</h2>
        <p className="text-gray-600">Follow these steps to install the app on your device:</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Open in Safari</h3>
            <p className="text-gray-600">Make sure you're using Safari browser, not Chrome or other browsers.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Tap the Share Button</h3>
            <p className="text-gray-600">Look for the share icon (square with arrow pointing up) at the bottom of Safari.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Select "Add to Home Screen"</h3>
            <p className="text-gray-600">Scroll down and tap "Add to Home Screen" from the share menu.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            4
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Confirm Installation</h3>
            <p className="text-gray-600">Tap "Add" to confirm and install the app on your home screen.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const AndroidInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Install on Android</h2>
        <p className="text-gray-600">Follow these steps to install the app on your Android device:</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Open in Chrome</h3>
            <p className="text-gray-600">Use Chrome browser for the best PWA experience on Android.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Look for Install Banner</h3>
            <p className="text-gray-600">Chrome will show an "Add to Home screen" banner or install prompt.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Tap Install</h3>
            <p className="text-gray-600">Tap "Install" or "Add to Home screen" when prompted.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            4
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Confirm Installation</h3>
            <p className="text-gray-600">Confirm the installation and the app will be added to your home screen.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const DesktopInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">💻</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Install on Desktop</h2>
        <p className="text-gray-600">Follow these steps to install the app on your computer:</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Use Chrome or Edge</h3>
            <p className="text-gray-600">Open this page in Chrome or Microsoft Edge for the best PWA experience.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Look for Install Icon</h3>
            <p className="text-gray-600">Look for the install icon (usually a plus or download icon) in the address bar or toolbar.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Click Install</h3>
            <p className="text-gray-600">Click the install button and confirm the installation.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            4
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Launch from Desktop</h3>
            <p className="text-gray-600">The app will be installed and you can launch it from your desktop or start menu.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInstructions = () => {
    switch (platform) {
      case 'ios':
        return <IOSInstructions />;
      case 'android':
        return <AndroidInstructions />;
      case 'windows':
      case 'mac':
        return <DesktopInstructions />;
      default:
        return <DesktopInstructions />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderInstructions()}
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need Help?
              </h3>
              <p className="text-gray-600 mb-4">
                If you're having trouble installing the app, try these troubleshooting steps:
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-2">
                <li>• Make sure you're using a supported browser (Chrome, Safari, Edge)</li>
                <li>• Check that your browser is up to date</li>
                <li>• Try refreshing the page and attempting installation again</li>
                <li>• Clear your browser cache and cookies</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstall;
