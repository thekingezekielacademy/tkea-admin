/**
 * Simplified App Bootstrap Component
 * 
 * Simple bootstrap that works reliably across all browsers
 */

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { getBrowserInfo } from '../utils/simpleBrowserDetection';

type BootstrapStatus = 'loading' | 'success' | 'error';

interface AppBootstrapProps {
  onBootstrapComplete?: (status: BootstrapStatus) => void;
}

const AppBootstrap: React.FC<AppBootstrapProps> = ({ onBootstrapComplete }) => {
  const [status, setStatus] = useState<BootstrapStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting simplified app bootstrap...');
        
        // Get browser info
        const browserInfo = getBrowserInfo();
        console.log('🔍 Browser Info:', browserInfo);
        
        // Fix hash for mini browsers
        if (browserInfo.isInApp && (!location.hash || location.hash === '#')) {
          location.hash = '#/';
          console.log('🔧 Fixed hash for mini browser:', location.hash);
        }
        
        // Get root element
        let rootElement = document.getElementById('root');
        if (!rootElement) {
          rootElement = document.createElement('div');
          rootElement.id = 'root';
          document.body.appendChild(rootElement);
        }
        
        // Clear any existing content
        rootElement.innerHTML = '';
        
        // Render the app
        const root = createRoot(rootElement);
        root.render(<App />);
        
        console.log('✅ App rendered successfully');
        setStatus('success');
        onBootstrapComplete?.('success');
        
      } catch (error) {
        console.error('❌ App bootstrap failed:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setStatus('error');
        onBootstrapComplete?.('error');
      }
    };

    initializeApp();
  }, [onBootstrapComplete]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading King Ezekiel Academy...</h2>
          <p className="text-gray-600 mt-2">Please wait while we prepare your learning experience</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">King Ezekiel Academy</h1>
          <p className="text-gray-600 mb-6">Failed to load the application. Please refresh the page.</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => setStatus('loading')} 
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
          </div>
          {error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
              <pre className="mt-2 text-xs text-gray-400 bg-gray-100 p-2 rounded overflow-auto">
                {error}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return null; // App is rendered directly to root
};

export default AppBootstrap;