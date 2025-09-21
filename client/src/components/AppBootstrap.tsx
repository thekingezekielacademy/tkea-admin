import React from 'react';
import { render } from 'react-dom';
import App from '../App';

/**
 * AppBootstrap - Always use React 17 render for maximum compatibility
 * 
 * This ensures compatibility with all browsers including mini browsers
 */

const AppBootstrap: React.FC = () => {
  // Always use React 17 render method for maximum compatibility
  React.useEffect(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('❌ Root element not found');
      return;
    }

    try {
      console.log('🔧 Using React 17 render for maximum compatibility');
      render(<App />, rootElement);
      console.log('✅ App mounted successfully');
    } catch (error) {
      console.error('❌ App mounting failed:', error);
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
  }, []);

  // This component doesn't render anything - it just handles mounting
  return null;
};

export default AppBootstrap;