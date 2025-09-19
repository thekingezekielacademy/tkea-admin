/**
 * Main Entry Point with Mini Browser Detection
 * Automatically routes to appropriate rendering mode based on browser capabilities
 */

// Import mini browser detection first
import { detectMiniBrowser, needsReact17Mode, shouldDisableServiceWorker } from './utils/miniBrowserDetection';

// Check if we need mini browser mode
const browserInfo = detectMiniBrowser();
const needsMiniBrowserMode = browserInfo.isMiniBrowser || needsReact17Mode();

console.log('🔍 Browser Detection:', {
  isMiniBrowser: browserInfo.isMiniBrowser,
  isInstagram: browserInfo.isInstagram,
  isFacebook: browserInfo.isFacebook,
  needsLegacyMode: browserInfo.needsLegacyMode,
  userAgent: browserInfo.userAgent
});

if (needsMiniBrowserMode) {
  console.log('📱 Redirecting to mini browser mode...');
  // Redirect to mini browser entry point
  // This will be handled by the build system
  import('./index-mini');
} else {
  console.log('🌐 Using standard browser mode...');
  // Use the standard React 18 entry point
  loadStandardApp();
}

/**
 * Standard app loading for modern browsers
 */
async function loadStandardApp(): Promise<void> {
  try {
    // Apply polyfills for modern browsers
    await import('core-js/stable');
    await import('regenerator-runtime/runtime');
    await import('whatwg-fetch');
    
    // Import React and other dependencies
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    const App = (await import('./App')).default;
    
    // CSS will be loaded by webpack
    
    // Ensure DOM is ready
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      });
    }

    // Handle service worker
    if (!shouldDisableServiceWorker() && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered');
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    }

    // Get root element
    let rootEl = document.getElementById('root');
    if (!rootEl) {
      rootEl = document.createElement('div');
      rootEl.id = 'root';
      document.body.appendChild(rootEl);
    }

    // Check for SSR content
    const hasSSR = !!rootEl.firstChild;
    
    if (hasSSR && ReactDOM.hydrateRoot) {
      // Hydrate existing content
      console.log('🔄 Hydrating existing content...');
      ReactDOM.hydrateRoot(rootEl, React.createElement(App));
      (window as any).__KEA_HYDRATION_STATUS__ = 'ok';
      (window as any).__KEA_BOOT_MODE__ = 'modern-hydrate';
    } else {
      // Create new root
      console.log('🆕 Creating new root...');
      const root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(React.StrictMode, null, React.createElement(App)));
      (window as any).__KEA_HYDRATION_STATUS__ = 'ok';
      (window as any).__KEA_BOOT_MODE__ = 'modern-render';
    }

    // Set global flags
    (window as any).__KEA_POLYFILLS_LOADED__ = true;
    
    console.log('✅ Standard app loaded successfully');

  } catch (error) {
    console.error('❌ Failed to load standard app:', error);
    
    // Fallback to mini browser mode
    console.log('🔄 Falling back to mini browser mode...');
    try {
      const { default: MiniApp } = await import('./components/MiniBrowserApp');
      const React = await import('react');
      const ReactDOM = await import('react-dom');
      
      const rootEl = document.getElementById('root') || document.body;
      rootEl.innerHTML = '';
      ReactDOM.render(React.createElement(MiniApp), rootEl);
      
      (window as any).__KEA_HYDRATION_STATUS__ = 'fallback';
      (window as any).__KEA_BOOT_MODE__ = 'fallback-mini';
      
      console.log('✅ Fallback to mini browser mode successful');
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      
      // Show error page
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
            🚫 App Loading Failed
          </h1>
          <p style="color: #6c757d; margin-bottom: 20px;">
            Unable to load the app. Please try refreshing the page or using a different browser.
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
            Refresh Page
          </button>
        </div>
      `;
    }
  }
}

// Global error handlers
window.onerror = function(message, source, lineno, colno, error) {
  console.error(`Global Error: ${message} at ${source}:${lineno}:${colno}`, error);
  return false;
};

window.onunhandledrejection = function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
  event.preventDefault();
};