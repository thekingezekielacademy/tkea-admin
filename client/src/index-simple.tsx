/**
 * SIMPLE, BULLETPROOF ENTRY POINT
 * Works on ALL browsers including Instagram/Facebook in-app browsers
 * Uses only basic JavaScript and React 17 compatibility
 */

// Basic polyfills - applied immediately
(function() {
  'use strict';
  
  // Basic polyfills that work everywhere
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) return false;
      var n = parseInt(fromIndex) || 0;
      var k = n >= 0 ? n : Math.max(len + n, 0);
      while (k < len) {
        if (O[k] === searchElement) return true;
        k++;
      }
      return false;
    };
  }

  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      var pos = position || 0;
      return this.substring(pos, pos + searchString.length) === searchString;
    };
  }

  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, length) {
      var len = length || this.length;
      return this.substring(len - searchString.length, len) === searchString;
    };
  }

  if (!Object.assign) {
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  // Basic fetch polyfill
  if (!window.fetch) {
    window.fetch = function(input, init) {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        var url = typeof input === 'string' ? input : input.toString();
        
        xhr.open(init && init.method || 'GET', url);
        
        if (init && init.headers) {
          for (var key in init.headers) {
            xhr.setRequestHeader(key, init.headers[key]);
          }
        }
        
        xhr.onload = function() {
          var response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            text: function() { return Promise.resolve(xhr.responseText); }
          };
          resolve(response);
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error'));
        };
        
        xhr.send(init && init.body);
      });
    };
  }

  console.log('✅ Basic polyfills loaded');
})();

// Import React and basic components
import React from 'react';
import ReactDOM from 'react-dom';

// Simple App component that works everywhere
const SimpleApp = function() {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(function() {
    // Detect browser
    var ua = navigator.userAgent || '';
    var isInstagram = /Instagram/i.test(ua);
    var isFacebook = /FBAN|FBAV|FBIOS/i.test(ua);
    var isMiniBrowser = isInstagram || isFacebook || /wv\)/i.test(ua);
    
    console.log('🔍 Browser detected:', {
      isInstagram: isInstagram,
      isFacebook: isFacebook,
      isMiniBrowser: isMiniBrowser,
      userAgent: ua
    });

    // Force hash routing for mini browsers
    if (isMiniBrowser && (!location.hash || location.hash === '#')) {
      location.hash = '/';
    }

    // Simulate loading
    setTimeout(function() {
      setIsLoaded(true);
    }, 1000);
  }, []);

  if (error) {
    return React.createElement('div', {
      style: {
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: { color: '#dc3545', marginBottom: '20px' }
      }, 'App Error'),
      React.createElement('p', {
        key: 'message',
        style: { color: '#6c757d', marginBottom: '20px' }
      }, 'Something went wrong. Please try refreshing the page.'),
      React.createElement('button', {
        key: 'button',
        onClick: function() { window.location.reload(); },
        style: {
          backgroundColor: '#1e3a8a',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }
      }, 'Refresh Page')
    ]);
  }

  if (!isLoaded) {
    return React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#1e3a8a',
        fontFamily: 'Arial, sans-serif'
      }
    }, 'Loading King Ezekiel Academy...');
  }

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }
  }, [
    React.createElement('header', {
      key: 'header',
      style: {
        backgroundColor: '#1e3a8a',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: { margin: '0', fontSize: '24px' }
      }, 'King Ezekiel Academy'),
      React.createElement('p', {
        key: 'subtitle',
        style: { margin: '10px 0 0 0', opacity: '0.9' }
      }, 'Modern Educational Platform')
    ]),
    React.createElement('main', {
      key: 'main',
      style: {
        padding: '40px 20px',
        maxWidth: '800px',
        margin: '0 auto'
      }
    }, [
      React.createElement('div', {
        key: 'welcome',
        style: {
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }
      }, [
        React.createElement('h2', {
          key: 'welcome-title',
          style: { color: '#1e3a8a', marginBottom: '20px' }
        }, 'Welcome to King Ezekiel Academy'),
        React.createElement('p', {
          key: 'welcome-text',
          style: { color: '#6c757d', lineHeight: '1.6', marginBottom: '20px' }
        }, 'Transform your career with our world-class digital skills courses. Learn marketing, sales, programming, and more.'),
        React.createElement('div', {
          key: 'buttons',
          style: { marginTop: '30px' }
        }, [
          React.createElement('button', {
            key: 'signin',
            onClick: function() { alert('Sign In clicked'); },
            style: {
              backgroundColor: '#1e3a8a',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              marginRight: '10px'
            }
          }, 'Sign In'),
          React.createElement('button', {
            key: 'signup',
            onClick: function() { alert('Sign Up clicked'); },
            style: {
              backgroundColor: 'transparent',
              color: '#1e3a8a',
              border: '2px solid #1e3a8a',
              padding: '10px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }
          }, 'Sign Up')
        ])
      ])
    ]),
    React.createElement('footer', {
      key: 'footer',
      style: {
        backgroundColor: '#343a40',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        marginTop: '40px'
      }
    }, [
      React.createElement('p', {
        key: 'footer-text',
        style: { margin: '0', opacity: '0.8' }
      }, '© 2024 King Ezekiel Academy. All rights reserved.')
    ])
  ]);
};

// Render the app
function renderApp() {
  try {
    var rootElement = document.getElementById('root');
    if (!rootElement) {
      rootElement = document.createElement('div');
      rootElement.id = 'root';
      document.body.appendChild(rootElement);
    }

    // Clear any existing content
    rootElement.innerHTML = '';

    // Render using React 17 API (works everywhere)
    ReactDOM.render(React.createElement(SimpleApp), rootElement);
    
    console.log('✅ App rendered successfully');
    
    // Set global flags
    window.__KEA_POLYFILLS_LOADED__ = true;
    window.__KEA_HYDRATION_STATUS__ = 'ok';
    window.__KEA_BOOT_MODE__ = 'simple';
    
  } catch (error) {
    console.error('❌ Failed to render app:', error);
    
    // Show error page
    var rootElement = document.getElementById('root') || document.body;
    rootElement.innerHTML = '<div style="padding:20px;text-align:center;font-family:Arial,sans-serif;background-color:#f8f9fa;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center"><h1 style="color:#dc3545;margin-bottom:20px">App Loading Error</h1><p style="color:#6c757d;margin-bottom:20px">Unable to load the app. Please try refreshing the page.</p><button onclick="window.location.reload()" style="background-color:#1e3a8a;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-size:16px">Refresh Page</button></div>';
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}