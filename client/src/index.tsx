/**
 * ULTRA-SIMPLE ENTRY POINT - WORKS IN ALL BROWSERS
 * No complex detection, no dynamic imports, just works
 */

// Apply polyfills FIRST
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

// Basic polyfills for older browsers
if (typeof window !== 'undefined') {
  // Object.assign
  if (!Object.assign) {
    Object.assign = function(target, ...sources) {
      if (target == null) throw new TypeError('Cannot convert undefined or null to object');
      const to = Object(target);
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (source != null) {
          for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              to[key] = source[key];
            }
          }
        }
      }
      return to;
    };
  }

  // Array.includes
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      if (this == null) throw new TypeError('Array.prototype.includes called on null or undefined');
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (len === 0) return false;
      const n = parseInt(String(fromIndex)) || 0;
      let k = n >= 0 ? n : Math.max(len + n, 0);
      while (k < len) {
        if (O[k] === searchElement) return true;
        k++;
      }
      return false;
    };
  }

  // String.includes
  if (!String.prototype.includes) {
    String.prototype.includes = function(searchString, position) {
      return this.indexOf(searchString, position) !== -1;
    };
  }

  // String.startsWith
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      const pos = position || 0;
      return this.substring(pos, pos + searchString.length) === searchString;
    };
  }

  // String.endsWith
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, length) {
      const len = length || this.length;
      return this.substring(len - searchString.length, len) === searchString;
    };
  }

  // Promise polyfill
  if (!window.Promise) {
    window.Promise = require('es6-promise').Promise;
  }

  // Fetch polyfill
  if (!window.fetch) {
    window.fetch = require('whatwg-fetch').fetch;
  }

  console.log('✅ Polyfills loaded');
}

// Import React and App
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// Global error handlers
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', message, 'at', source + ':' + lineno + ':' + colno, error);
  return false;
};

window.onunhandledrejection = function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
  event.preventDefault();
};

// Main app loading function
function loadApp() {
  try {
    console.log('🚀 Starting app load...');
    
    // Get root element
    let rootEl = document.getElementById('root');
    if (!rootEl) {
      rootEl = document.createElement('div');
      rootEl.id = 'root';
      document.body.appendChild(rootEl);
    }

    // Clear any existing content
    rootEl.innerHTML = '';

    // Detect browser type
    const ua = navigator.userAgent || '';
    const isMini = /Instagram|FBAN|FBAV|FBIOS|TikTok|Twitter|Snapchat|wv\)/i.test(ua);
    const isOldSafari = /Safari/i.test(ua) && /Version\/([0-9]+)/.test(ua) && parseInt(RegExp.$1) <= 12;
    
    console.log('🔍 Browser detection:', { isMini, isOldSafari, ua });

    // Force hash routing for mini browsers
    if (isMini && (!location.hash || location.hash === '#')) {
      location.hash = '/';
      console.log('📱 Set hash route for mini browser');
    }

    // Disable service worker for mini browsers
    if (isMini && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(reg) {
          reg.unregister().catch(function() {});
        });
        console.log('🛑 Disabled service worker for mini browser');
      }).catch(function() {});
    }

    // Render the app using ReactDOM.render (works everywhere)
    console.log('⚛️ Rendering app...');
    ReactDOM.render(React.createElement(App), rootEl, function() {
      console.log('✅ App rendered successfully!');
      
      // Set global flags
      (window as any).__KEA_POLYFILLS_LOADED__ = true;
      (window as any).__KEA_HYDRATION_STATUS__ = 'ok';
      (window as any).__KEA_BOOT_MODE__ = isMini ? 'mini-browser' : 'standard';
      
      console.log('🎉 App fully loaded and ready!');
    });

  } catch (error) {
    console.error('❌ Failed to load app:', error);
    
    // Show simple error message
    const rootEl = document.getElementById('root') || document.body;
    rootEl.innerHTML = '<div style="padding:20px;text-align:center;font-family:Arial,sans-serif;"><h1>Loading Error</h1><p>Please refresh the page or try a different browser.</p><button onclick="window.location.reload()" style="padding:10px 20px;background:#1e3a8a;color:white;border:none;border-radius:5px;cursor:pointer;">Refresh</button></div>';
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadApp);
} else {
  loadApp();
}