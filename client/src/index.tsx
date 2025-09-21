import React from 'react';
import { render } from 'react-dom';
import AppBootstrap from './components/AppBootstrap';
import './index.css';

// CRITICAL: Fix hash for mini browsers BEFORE React loads
(function() {
  const ua = navigator.userAgent || '';
  const isMiniBrowser = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(ua);
  
  if (isMiniBrowser && (!location.hash || location.hash === '#')) {
    location.hash = '#/';
    console.log('🔧 Fixed hash for mini browser:', location.hash);
  }
})();

// SIMPLE: Always use React 17 render for maximum compatibility
const rootElement = document.getElementById('root');
if (rootElement) {
  render(<AppBootstrap />, rootElement);
  console.log('✅ AppBootstrap mounted successfully');
} else {
  console.error('❌ Root element not found');
}