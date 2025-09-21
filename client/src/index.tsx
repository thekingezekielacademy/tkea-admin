import React from 'react';
import ReactDOM from 'react-dom/client';
import AppBootstrap from './components/AppBootstrap';
import './index.css';

// CRITICAL: Expose React globally for mini browser compatibility
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;

// CRITICAL: Fix hash for mini browsers BEFORE React loads
(function() {
  const ua = navigator.userAgent || '';
  const isMiniBrowser = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(ua);
  
  if (isMiniBrowser && (!location.hash || location.hash === '#')) {
    location.hash = '#/';
    console.log('🔧 Fixed hash for mini browser:', location.hash);
  }
})();

// SIMPLE: Use AppBootstrap for conditional rendering
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<AppBootstrap />);
  console.log('✅ AppBootstrap mounted successfully');
} else {
  console.error('❌ Root element not found');
}