import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleApp from './SimpleApp';
import './index.css';

// CRITICAL: Expose React globally for mini browser compatibility
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;
console.log('🔧 React exposed globally for mini browser compatibility');

// SIMPLE: Just mount the app directly
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <SimpleApp />
    </React.StrictMode>
  );
  console.log('✅ React app mounted successfully');
} else {
  console.error('❌ Root element not found');
}