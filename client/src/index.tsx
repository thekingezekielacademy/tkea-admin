import './utils/polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'plyr/dist/plyr.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Comprehensive Safari polyfills for older versions
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Additional polyfills for Safari < 12 compatibility
if (typeof window !== 'undefined') {
  // Polyfill for String.prototype.replaceAll (Safari < 13)
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(search: string | RegExp, replace: string | Function): string {
      if (typeof search === 'string') {
        return this.split(search).join(replace as string);
      } else {
        return this.replace(new RegExp(search.source, 'g'), replace as any);
      }
    };
  }

  // Polyfill for Object.fromEntries (Safari < 12.1)
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries: any) {
      const result: any = {};
      const entriesArray = Array.isArray(entries) ? entries : Array.from(entries);
      for (let i = 0; i < entriesArray.length; i++) {
        const [key, value] = entriesArray[i];
        result[key] = value;
      }
      return result;
    };
  }

  // Polyfill for Array.prototype.flat (Safari < 12)
  if (!Array.prototype.flat) {
    Array.prototype.flat = function(depth: number = 1): any[] {
      const result: any[] = [];
      const flatten = (arr: any[], currentDepth: number) => {
        for (const item of arr) {
          if (Array.isArray(item) && currentDepth > 0) {
            flatten(item, currentDepth - 1);
          } else {
            result.push(item);
          }
        }
      };
      flatten(this as any[], depth);
      return result;
    };
  }

  // Polyfill for Array.prototype.flatMap (Safari < 12)
  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function(callback: any, thisArg?: any): any[] {
      return (this as any[]).map(callback, thisArg).flat();
    };
  }
}

// Enhanced in-app browser detection and PWA compatibility
if (typeof window !== 'undefined') {
  const ua = navigator.userAgent + ' ' + (navigator.vendor || '') + ' ' + ((window as any).opera || '');
  const isInApp = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isSafariOld = isSafari && /Version\/([0-9]+)/.test(ua) && parseInt(ua.match(/Version\/([0-9]+)/)[1]) < 12;
  
  // Store browser info globally for use throughout the app
  (window as any).browserInfo = {
    isInApp,
    isSafari,
    isSafariOld,
    userAgent: ua,
    supportsServiceWorker: 'serviceWorker' in navigator && !isInApp,
    supportsPWA: 'serviceWorker' in navigator && 'PushManager' in window && !isInApp
  };
  
  if (isInApp) {
    console.log('📱 In-app browser detected - PWA features disabled');
    console.log('User Agent:', ua);
    console.log('PWA features will be skipped for optimal compatibility');
    
    // Add visual indicator for debugging
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:blue;color:white;padding:5px;z-index:9999;font-family:monospace;font-size:12px;text-align:center;';
    debugDiv.textContent = `📱 In-App Browser - PWA Disabled for Compatibility`;
    document.body.appendChild(debugDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (debugDiv.parentNode) {
        debugDiv.parentNode.removeChild(debugDiv);
      }
    }, 3000);
  } else if (isSafariOld) {
    console.log('🍎 Old Safari detected - Enhanced compatibility mode');
    console.log('User Agent:', ua);
    console.log('Applying Safari < 12 compatibility fixes');
  } else {
    console.log('🌐 Regular browser detected - Full PWA features enabled');
    console.log('User Agent:', ua);
  }
}

// Global error logging for Safari and in-app browser debugging
window.onerror = function (message, source, lineno, colno, error) {
  const userAgent = navigator.userAgent;
  const isInstagram = /Instagram/i.test(userAgent);
  const isFacebook = /FBAN|FBAV|FBIOS/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  console.error("❌ Global Error:", {
    message,
    source,
    lineno,
    colno,
    error: error?.stack || error,
    userAgent,
    isInstagram,
    isFacebook,
    isSafari,
    timestamp: new Date().toISOString()
  });
  
  // Also log to a more visible location for debugging
  if (typeof document !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
    
    let browserType = 'Safari';
    if (isInstagram) browserType = 'Instagram Browser';
    else if (isFacebook) browserType = 'Facebook Browser';
    else if (isSafari) browserType = 'Safari';
    
    errorDiv.textContent = `${browserType} Error: ${message} at ${source}:${lineno}:${colno}`;
    document.body.appendChild(errorDiv);
    
    // Remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }
};

window.onunhandledrejection = function (event) {
  const userAgent = navigator.userAgent;
  const isInstagram = /Instagram/i.test(userAgent);
  const isFacebook = /FBAN|FBAV|FBIOS/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  console.error("❌ Unhandled Promise Rejection:", {
    reason: event.reason,
    promise: event.promise,
    userAgent,
    isInstagram,
    isFacebook,
    isSafari,
    timestamp: new Date().toISOString()
  });
  
  // Also log to a more visible location for debugging
  if (typeof document !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:50px;left:0;right:0;background:orange;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
    
    let browserType = 'Safari';
    if (isInstagram) browserType = 'Instagram Browser';
    else if (isFacebook) browserType = 'Facebook Browser';
    else if (isSafari) browserType = 'Safari';
    
    errorDiv.textContent = `${browserType} Promise Rejection: ${event.reason}`;
    document.body.appendChild(errorDiv);
    
    // Remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
