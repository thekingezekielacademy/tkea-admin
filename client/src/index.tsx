import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
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
      <App />
    </React.StrictMode>
  );
  console.log('✅ React app mounted successfully');
} else {
  console.error('❌ Root element not found');
}