import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// CRITICAL: Expose React globally for mini browser compatibility
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;
console.log('🔧 React exposed globally for mini browser compatibility');

// Delayed initialization for mini browser compatibility
const initializeApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('❌ Root element not found');
      return;
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ React app mounted successfully');
  } catch (error) {
    console.error('❌ React app mount failed:', error);
    
    // Fallback: Show error message
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h2>App Loading Error</h2>
          <p>Please refresh the page to try again.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
};

// Wait for DOM to be ready and React to be available
const waitForReact = () => {
  let attempts = 0;
  const maxAttempts = 20; // 10 seconds total
  
  const checkReact = () => {
    attempts++;
    
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
      console.log('✅ React and ReactDOM available, initializing app...');
      initializeApp();
    } else if (attempts < maxAttempts) {
      console.log(`⏳ Waiting for React... (${attempts}/${maxAttempts})`);
      setTimeout(checkReact, 500);
    } else {
      console.error('❌ React not available after maximum attempts');
      // Show fallback message
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.innerHTML = `
          <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
            <h2>Loading Timeout</h2>
            <p>The app is taking longer than expected to load. Please refresh the page.</p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Refresh Page
            </button>
          </div>
        `;
      }
    }
  };
  
  checkReact();
};

// Start the initialization process
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForReact);
} else {
  waitForReact();
}