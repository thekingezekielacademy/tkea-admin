/**
 * App Bootstrap Component
 * 
 * Handles different rendering strategies based on browser capabilities:
 * - Client-only render for mini browsers
 * - SSR hydration for regular browsers with SSR markup
 * - Modern hydration for regular browsers without SSR markup
 */

import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from '../App';
import UnsupportedBrowserBanner from './UnsupportedBrowserBanner';
import { 
  isMiniBrowser, 
  shouldUseClientOnlyRender, 
  getRenderingStrategy,
  getBrowserInfo,
  logBrowserInfo 
} from '../utils/miniBrowserDetection';
import { initializeServiceWorkerManagement } from '../utils/miniBrowserServiceWorker';

type BootstrapStatus = 'loading' | 'success' | 'error' | 'fallback';

interface AppBootstrapProps {
  onBootstrapComplete?: (strategy: string, status: BootstrapStatus) => void;
}

const AppBootstrap: React.FC<AppBootstrapProps> = ({ onBootstrapComplete }) => {
  const [status, setStatus] = useState<BootstrapStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string>('unknown');
  const [retryCount, setRetryCount] = useState(0);

  const bootstrapApp = useCallback(async () => {
    try {
      setStatus('loading');
      setError(null);
      
      // Set initial global status
      (window as any).__KEA_HYDRATION_STATUS__ = 'initializing';
      (window as any).__KEA_BOOT_PROGRESS__ = 'bootstrap-start';
      
      // Log browser information for debugging
      logBrowserInfo();
      const browserInfo = getBrowserInfo();
      
      // Initialize service worker management
      await initializeServiceWorkerManagement();
      
      // Get rendering strategy
      const renderingStrategy = getRenderingStrategy();
      setStrategy(renderingStrategy);
      
      console.log(`🚀 Starting app bootstrap with strategy: ${renderingStrategy}`);
      
      // Get root element
      let rootElement = document.getElementById('root');
      if (!rootElement) {
        rootElement = document.createElement('div');
        rootElement.id = 'root';
        document.body.appendChild(rootElement);
      }
      
      // Clear any existing content
      rootElement.innerHTML = '';
      
      // Apply rendering strategy
      switch (renderingStrategy) {
        case 'client-only':
          await renderClientOnly(rootElement, browserInfo);
          break;
          
        case 'ssr-hydration':
          await renderSSRHydration(rootElement, browserInfo);
          break;
          
        case 'modern-hydration':
          await renderModernHydration(rootElement, browserInfo);
          break;
          
        default:
          throw new Error(`Unknown rendering strategy: ${renderingStrategy}`);
      }
      
      setStatus('success');
      onBootstrapComplete?.(renderingStrategy, 'success');
      
    } catch (error) {
      console.error('❌ App bootstrap failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setStatus('error');
      (window as any).__KEA_HYDRATION_STATUS__ = 'bootstrap-error';
      onBootstrapComplete?.(strategy, 'error');
    }
  }, [onBootstrapComplete, strategy]);

  // Client-only rendering for mini browsers
  const renderClientOnly = async (rootElement: HTMLElement, browserInfo: any) => {
    console.log('📱 Using client-only rendering for mini browser');
    
    // Force location.hash for HashRouter in mini browsers
    if (isMiniBrowser() && (!location.hash || location.hash === '#')) {
      location.hash = '/';
    }
    
    // Set global status for monitoring
    (window as any).__KEA_HYDRATION_STATUS__ = 'loading';
    (window as any).__KEA_BOOT_MODE__ = 'client-only';
    
    // Use ReactDOM.render for maximum compatibility
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      rootElement
    );
    
    // Set success status
    (window as any).__KEA_HYDRATION_STATUS__ = 'ok';
  };

  // SSR hydration for browsers with existing markup
  const renderSSRHydration = async (rootElement: HTMLElement, browserInfo: any) => {
    console.log('🔄 Using SSR hydration');
    
    // Set global status for monitoring
    (window as any).__KEA_HYDRATION_STATUS__ = 'loading';
    (window as any).__KEA_BOOT_MODE__ = 'ssr-hydration';
    
    // Check if we have SSR markup
    const hasSSRMarkup = rootElement.children.length > 0;
    
    if (hasSSRMarkup && hydrateRoot) {
      try {
        hydrateRoot(rootElement, <App />);
        (window as any).__KEA_HYDRATION_STATUS__ = 'ok';
        return;
      } catch (hydrationError) {
        console.warn('⚠️ SSR hydration failed, falling back to client-only:', hydrationError);
        (window as any).__KEA_HYDRATION_STATUS__ = 'hydration-error';
        // Fall through to client-only fallback
      }
    }
    
    // Fallback to client-only if no SSR markup or hydration failed
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      rootElement
    );
    (window as any).__KEA_HYDRATION_STATUS__ = 'ok';
  };

  // Modern hydration for regular browsers
  const renderModernHydration = async (rootElement: HTMLElement, browserInfo: any) => {
    console.log('⚡ Using modern hydration');
    
    // Set global status for monitoring
    (window as any).__KEA_HYDRATION_STATUS__ = 'loading';
    (window as any).__KEA_BOOT_MODE__ = 'modern-hydration';
    
    try {
      // Try createRoot first
      if (createRoot) {
        const root = createRoot(rootElement);
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
        (window as any).__KEA_HYDRATION_STATUS__ = 'ok';
        return;
      }
      
      throw new Error('createRoot not available');
      
    } catch (modernError) {
      console.warn('⚠️ Modern rendering failed, falling back to client-only:', modernError);
      (window as any).__KEA_HYDRATION_STATUS__ = 'modern-error';
      
      // Fallback to ReactDOM.render
      ReactDOM.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
        rootElement
      );
      (window as any).__KEA_HYDRATION_STATUS__ = 'ok';
    }
  };

  // Handle retry
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    bootstrapApp();
  }, [bootstrapApp]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setStatus('fallback');
    
    // Try to render a minimal version of the app
    try {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        ReactDOM.render(
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                King Ezekiel Academy
              </h1>
              <p className="text-gray-600 mb-4">
                Browser compatibility issue detected. Please try a different browser.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </div>
          </div>,
          rootElement
        );
      }
    } catch (error) {
      console.error('❌ Even fallback rendering failed:', error);
    }
  }, []);

  // Bootstrap on mount
  useEffect(() => {
    bootstrapApp();
  }, [bootstrapApp]);

  // Show error banner if bootstrap failed
  if (status === 'error') {
    return (
      <UnsupportedBrowserBanner
        browserType={getBrowserInfo().miniBrowserType || 'current'}
        errorMessage={error || undefined}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
    );
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading King Ezekiel Academy
          </h2>
          <p className="text-gray-600">
            Initializing for {getBrowserInfo().miniBrowserType || 'your browser'}...
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-blue-600 mt-2">
              Retry attempt {retryCount}
            </p>
          )}
        </div>
      </div>
    );
  }

  // App successfully bootstrapped
  return null;
};

export default AppBootstrap;
