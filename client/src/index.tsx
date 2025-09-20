import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// SIMPLE: Just mount the app directly - no complex waiting
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