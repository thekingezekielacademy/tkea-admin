/**
 * SIMPLE INDEX - Instagram/Facebook Browser Compatible
 * 
 * This is a minimal, ES5-compatible entry point that will work
 * in Instagram and Facebook in-app browsers.
 */

// Basic polyfills first
if (typeof window !== 'undefined') {
  // Basic fetch polyfill
  if (!window.fetch) {
    window.fetch = function(url: any, options: any) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(options?.method || 'GET', url, true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              text: () => Promise.resolve(xhr.responseText),
              json: () => Promise.resolve(JSON.parse(xhr.responseText))
            } as any);
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(options?.body || null);
      });
    };
  }

  // Basic Promise polyfill
  if (!window.Promise) {
    window.Promise = function(executor: any) {
      const self = this as any;
      self.state = 'pending';
      self.value = undefined;
      self.handlers = [];

      function resolve(result: any) {
        if (self.state === 'pending') {
          self.state = 'fulfilled';
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function reject(error: any) {
        if (self.state === 'pending') {
          self.state = 'rejected';
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function handle(handler: any) {
        if (self.state === 'pending') {
          self.handlers.push(handler);
        } else {
          if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
            handler.onFulfilled(self.value);
          }
          if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
            handler.onRejected(self.value);
          }
        }
      }

      this.then = function(onFulfilled: any, onRejected: any) {
        return new (window as any).Promise(function(resolve: any, reject: any) {
          handle({
            onFulfilled: function(result: any) {
              try {
                resolve(onFulfilled ? onFulfilled(result) : result);
              } catch (ex) {
                reject(ex);
              }
            },
            onRejected: function(error: any) {
              try {
                resolve(onRejected ? onRejected(error) : error);
              } catch (ex) {
                reject(ex);
              }
            }
          });
        });
      };

      executor(resolve, reject);
    } as any;
  }

  // Basic Object.assign
  if (!Object.assign) {
    Object.assign = function(target: any, ...sources: any[]) {
      if (target == null) throw new TypeError('Cannot convert undefined or null to object');
      const to = Object(target);
      for (let i = 0; i < sources.length; i++) {
        const src = sources[i];
        if (src != null) {
          for (const key in src) {
            if (Object.prototype.hasOwnProperty.call(src, key)) {
              to[key] = src[key];
            }
          }
        }
      }
      return to;
    };
  }

  console.log('✅ Basic polyfills loaded');
}

// Import React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import the main App component
import App from './App';

// Simple, reliable mounting function
function mountApp() {
  try {
    console.log('🚀 Starting simple app mount...');
    
    // Get root element
    let rootElement = document.getElementById('root');
    if (!rootElement) {
      console.log('⚠️ Root element not found, creating one...');
      rootElement = document.createElement('div');
      rootElement.id = 'root';
      document.body.appendChild(rootElement);
    }

    // Clear any existing content
    rootElement.innerHTML = '';

    // Create root using createRoot (React 18+)
    const root = ReactDOM.createRoot(rootElement);
    
    // Render the app
    root.render(React.createElement(App));
    
    console.log('✅ App mounted successfully!');
    
    // Set a global flag to indicate successful mount
    (window as any).__KEA_APP_MOUNTED__ = true;
    
  } catch (error) {
    console.error('❌ Failed to mount app:', error);
    
    // Show fallback UI
    const rootElement = document.getElementById('root') || document.body;
    rootElement.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
        text-align: center;
        padding: 2rem;
      ">
        <div>
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            King Ezekiel Academy
          </h1>
          <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">
            Welcome! For the best experience, please open this link in your regular browser.
          </p>
          <div style="margin-bottom: 2rem;">
            <button 
              onclick="window.location.reload()" 
              style="
                background: rgba(255,255,255,0.2);
                color: white;
                border: 2px solid white;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                margin: 0 10px;
                transition: all 0.3s;
              "
              onmouseover="this.style.background='rgba(255,255,255,0.3)'"
              onmouseout="this.style.background='rgba(255,255,255,0.2)'"
            >
              Refresh Page
            </button>
            <a 
              href="https://app.thekingezekielacademy.com" 
              style="
                background: white;
                color: #667eea;
                border: 2px solid white;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                text-decoration: none;
                display: inline-block;
                margin: 0 10px;
                transition: all 0.3s;
              "
              onmouseover="this.style.background='#f8f9fa'"
              onmouseout="this.style.background='white'"
            >
              Open in Browser
            </a>
          </div>
          <p style="font-size: 0.9rem; opacity: 0.7;">
            You can also try refreshing the page or using a different browser.
          </p>
        </div>
      </div>
    `;
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

// Export for potential external use
export default mountApp;
