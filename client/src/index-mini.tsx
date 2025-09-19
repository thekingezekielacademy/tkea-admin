/**
 * Mini Browser Entry Point
 * Optimized for Instagram, Facebook, and other in-app browsers
 * Uses React 17 compatibility mode and simplified routing
 */

// Apply polyfills FIRST - before any other imports
import { applyMiniBrowserPolyfills } from './utils/miniBrowserPolyfills';
import { detectMiniBrowser, shouldDisableServiceWorker, logWithPrefix } from './utils/miniBrowserDetection';

// Apply polyfills immediately
applyMiniBrowserPolyfills();

// Import React and other dependencies
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'plyr/dist/plyr.css';

// Import the mini browser app
import MiniBrowserApp from './components/MiniBrowserApp';

// Global error handlers for mini browsers
window.onerror = function(message, source, lineno, colno, error) {
  logWithPrefix(`Global Error: ${message} at ${source}:${lineno}:${colno}`, error);
  return false;
};

window.onunhandledrejection = function(event) {
  logWithPrefix('Unhandled Promise Rejection:', event.reason);
  event.preventDefault();
};

/**
 * Main app loading function for mini browsers
 */
async function loadMiniBrowserApp(): Promise<void> {
  try {
    const info = detectMiniBrowser();
    logWithPrefix('Starting mini browser app...');
    
    // Ensure DOM is ready
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      });
    }

    // Handle service worker for mini browsers
    if (shouldDisableServiceWorker()) {
      logWithPrefix('Disabling service worker for mini browser');
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
          logWithPrefix('Service worker unregistered');
        }
      } catch (error) {
        logWithPrefix('Service worker cleanup failed:', error);
      }
    }

    // Get root element
    let rootEl = document.getElementById('root');
    if (!rootEl) {
      rootEl = document.createElement('div');
      rootEl.id = 'root';
      document.body.appendChild(rootEl);
      logWithPrefix('Created root element');
    }

    // Clear any existing content
    rootEl.innerHTML = '';

    // Force hash routing for mini browsers
    if (!location.hash || location.hash === '#') {
      location.hash = '/';
      logWithPrefix('Set initial hash route');
    }

    // Render the app using React 17 compatibility mode
    logWithPrefix('Rendering app with React 17 compatibility...');
    ReactDOM.render(<MiniBrowserApp />, rootEl, () => {
      logWithPrefix('App rendered successfully!');
      
      // Set global flags for debugging
      (window as any).__KEA_POLYFILLS_LOADED__ = true;
      (window as any).__KEA_HYDRATION_STATUS__ = 'ok';
      (window as any).__KEA_BOOT_MODE__ = 'mini-browser';
      (window as any).__KEA_BROWSER_INFO__ = info;
    });

  } catch (error) {
    logWithPrefix('Failed to load mini browser app:', error);
    
    // Show fallback UI
    const rootEl = document.getElementById('root') || document.body;
    rootEl.innerHTML = `
      <div style="
        padding: 20px;
        text-align: center;
        font-family: Arial, sans-serif;
        background-color: #f8f9fa;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      ">
        <h1 style="color: #dc3545; margin-bottom: 20px;">
          📱 App Loading Error
        </h1>
        <p style="color: #6c757d; margin-bottom: 20px;">
          Unable to load the app in this browser. Please try opening in Safari or Chrome.
        </p>
        <button
          onclick="window.location.reload()"
          style="
            background-color: #1e3a8a;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          "
        >
          Try Again
        </button>
      </div>
    `;
  }
}

// Start the app
loadMiniBrowserApp().catch(error => {
  console.error('Critical error in mini browser app:', error);
});
