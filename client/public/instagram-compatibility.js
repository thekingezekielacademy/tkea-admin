/**
 * Instagram In-App Browser Compatibility Script
 * Handles specific issues with Instagram's WebView
 */

(function() {
  'use strict';
  
  // Detect Instagram in-app browser
  const isInstagram = /Instagram/.test(navigator.userAgent);
  const isFacebook = /FBAN|FBAV/.test(navigator.userAgent);
  const isInAppBrowser = isInstagram || isFacebook || /Line|WhatsApp|Twitter/.test(navigator.userAgent);
  
  if (isInAppBrowser) {
    console.log('In-app browser detected:', { isInstagram, isFacebook, userAgent: navigator.userAgent });
    
    // Fix viewport issues
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }
    
    // Disable problematic features
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // Fix localStorage issues
    if (!window.localStorage) {
      window.localStorage = {
        _data: {},
        setItem: function(key, value) {
          this._data[key] = String(value);
        },
        getItem: function(key) {
          return this._data[key] || null;
        },
        removeItem: function(key) {
          delete this._data[key];
        },
        clear: function() {
          this._data = {};
        }
      };
    }
    
    // Fix sessionStorage issues
    if (!window.sessionStorage) {
      window.sessionStorage = {
        _data: {},
        setItem: function(key, value) {
          this._data[key] = String(value);
        },
        getItem: function(key) {
          return this._data[key] || null;
        },
        removeItem: function(key) {
          delete this._data[key];
        },
        clear: function() {
          this._data = {};
        }
      };
    }
    
    // Add Instagram-specific CSS fixes
    const style = document.createElement('style');
    style.textContent = `
      /* Instagram in-app browser fixes */
      body {
        -webkit-overflow-scrolling: touch;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Fix for Instagram's status bar */
      @supports (padding: max(0px)) {
        body {
          padding-top: max(env(safe-area-inset-top), 20px);
        }
      }
      
      /* Ensure proper scrolling */
      html, body {
        height: 100%;
        overflow-x: hidden;
      }
      
      /* Fix for Instagram's navigation */
      .instagram-notice {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        padding: 12px;
        text-align: center;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .instagram-notice button {
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        margin-left: 10px;
      }
    `;
    document.head.appendChild(style);
    
    // Show Instagram notice
    if (isInstagram) {
      const notice = document.createElement('div');
      notice.className = 'instagram-notice';
      notice.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
          <span>📱 For the best experience, open in Chrome or Safari</span>
          <button onclick="this.parentElement.parentElement.style.display='none'">✕</button>
        </div>
      `;
      document.body.appendChild(notice);
      
      // Adjust body padding
      document.body.style.paddingTop = '50px';
    }
    
    // Fix touch events
    document.addEventListener('touchstart', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    // Fix orientation changes
    window.addEventListener('orientationchange', function() {
      setTimeout(function() {
        window.scrollTo(0, 0);
      }, 100);
    });
    
    // Fix resize issues
    window.addEventListener('resize', function() {
      setTimeout(function() {
        window.scrollTo(0, 0);
      }, 100);
    });
    
    console.log('Instagram compatibility fixes applied');
  }
})();
