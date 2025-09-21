import React from 'react';
import { render } from 'react-dom';
import App from '../App';

/**
 * AppBootstrap - Ultra-simple React 17 render for mini browser compatibility
 * 
 * This ensures maximum compatibility with all browsers including mini browsers
 * Uses only the most basic React features
 */

function AppBootstrap() {
  // Ultra-simple mounting - no hooks, no complex features
  var rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Root element not found');
    return null;
  }

  try {
    console.log('🔧 Using ultra-simple React 17 render for mini browser compatibility');
    render(React.createElement(App), rootElement);
    console.log('✅ App mounted successfully');
  } catch (error) {
    console.error('❌ App mounting failed:', error);
    // Show error message
    rootElement.innerHTML = 
      '<div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">' +
        '<h1>King Ezekiel Academy</h1>' +
        '<p>Unable to load the application. Please try refreshing the page.</p>' +
        '<button onclick="window.location.reload()" style="padding: 10px 20px; margin: 10px;">' +
          'Refresh Page' +
        '</button>' +
        '<a href="https://app.thekingezekielacademy.com" target="_blank" style="display: block; margin-top: 20px;">' +
          'Open in Browser' +
        '</a>' +
      '</div>';
  }

  // This component doesn't render anything - it just handles mounting
  return null;
}

export default AppBootstrap;