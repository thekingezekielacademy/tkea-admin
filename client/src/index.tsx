import React from 'react';
import { render } from 'react-dom';
import AppBootstrap from './components/AppBootstrap';
import './index.css';

// CRITICAL: Fix hash for mini browsers BEFORE React loads
(function() {
  var ua = navigator.userAgent || '';
  var isMiniBrowser = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(ua);
  
  if (isMiniBrowser && (!location.hash || location.hash === '#')) {
    location.hash = '#/';
    console.log('🔧 Fixed hash for mini browser:', location.hash);
  }
})();

// ULTRA-SIMPLE: Use React 17 render with createElement for maximum compatibility
var rootElement = document.getElementById('root');
if (rootElement) {
  render(React.createElement(AppBootstrap), rootElement);
  console.log('✅ AppBootstrap mounted successfully');
} else {
  console.error('❌ Root element not found');
}