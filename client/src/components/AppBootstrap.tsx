import React from 'react';
import ReactDOM from 'react-dom/client';
import { render } from 'react-dom';
import App from '../App';

/**
 * AppBootstrap - Simple conditional rendering for mini browsers
 * 
 * This component handles the critical difference between:
 * - Mini browsers (Instagram, Facebook, etc.) - Use React 17 render method
 * - Modern browsers - Use React 18 createRoot method
 */

const AppBootstrap: React.FC = () => {
  // Simple mini browser detection
  const isMiniBrowser = (): boolean => {
    const ua = navigator.userAgent || '';
    return /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(ua);
  };

  // Mount the app based on browser type
  React.useEffect(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('❌ Root element not found');
      return;
    }

    try {
      if (isMiniBrowser()) {
        console.log('📱 Mini browser detected - using React 17 render method');
        // Use React 17 render method for mini browsers
        render(<App />, rootElement);
      } else {
        console.log('🖥️ Modern browser detected - using React 18 createRoot');
        // Use React 18 createRoot for modern browsers
        const root = ReactDOM.createRoot(rootElement);
        root.render(<React.StrictMode><App /></React.StrictMode>);
      }
      console.log('✅ App mounted successfully');
    } catch (error) {
      console.error('❌ App mounting failed:', error);
        // Fallback: try React 17 render method
        try {
          render(<App />, rootElement);
          console.log('✅ App mounted with fallback method');
        } catch (fallbackError) {
        console.error('❌ Fallback mounting also failed:', fallbackError);
        // Show error message
        rootElement.innerHTML = `
          <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
            <h1>King Ezekiel Academy</h1>
            <p>Unable to load the application. Please try refreshing the page.</p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; margin: 10px;">
              Refresh Page
            </button>
            <a href="https://app.thekingezekielacademy.com" target="_blank" style="display: block; margin-top: 20px;">
              Open in Browser
            </a>
          </div>
        `;
      }
    }
  }, []);

  // This component doesn't render anything - it just handles mounting
  return null;
};

export default AppBootstrap;