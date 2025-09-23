import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// ULTRA-SIMPLE: Minimal compatibility fixes
(function() {
  // Check if we need simple mode
  var needsSimpleMode = (window as any).__KEA_SIMPLE_BROWSER__?.needsSimpleMode || false;
  
  if (needsSimpleMode) {
    // Disable complex features for mini browsers and iOS
    if (typeof window !== 'undefined') {
      // Disable Flutterwave fingerprinting
      (window as any).FlutterwaveDisableFingerprinting = true;
      (window as any).FlutterwaveDisableTracking = true;
      (window as any).FlutterwaveDisableAnalytics = true;
      
      // Disable Sentry for mini browsers
      (window as any).__SENTRY_DISABLED__ = true;
    }
  }
})();

// ULTRA-SIMPLE: React 16 render with error boundary
var rootElement = document.getElementById('root');
if (rootElement) {
  try {
    ReactDOM.render(React.createElement(App), rootElement);
  } catch (error) {
    console.error('React render error:', error);
    // Fallback: Show simple error message
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;"><h2>King Ezekiel Academy</h2><p>Loading error. Please refresh the page.</p><button onclick="window.location.reload()" style="padding: 10px 20px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">Refresh</button></div>';
  }
} else {
  console.error('Root element not found');
}