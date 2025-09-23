import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// LASER FIX: Proper DOM ready check with hash handling
function initializeApp() {
  // Ensure hash is set for HashRouter
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '#/';
  }
  
  // Get root element
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }
  
  // Render React app
  try {
    ReactDOM.render(React.createElement(App), rootElement);
    console.log('✅ React app mounted successfully');
  } catch (error) {
    console.error('React render error:', error);
    // Fallback: Show simple error message
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;"><h2>King Ezekiel Academy</h2><p>Loading error. Please refresh the page.</p><button onclick="window.location.reload()" style="padding: 10px 20px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">Refresh</button></div>';
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}