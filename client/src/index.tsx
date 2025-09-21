import React from 'react';
import ReactDOM from 'react-dom';
import App from './App-minimal';
import './index.css';

// CRITICAL: Fix hash for mini browsers BEFORE React loads
(function() {
  var ua = navigator.userAgent || '';
  var isMiniBrowser = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(ua);
  
  if (isMiniBrowser && (!window.location.hash || window.location.hash === '#')) {
    window.location.hash = '#/';
    console.log('🔧 Fixed hash for mini browser:', window.location.hash);
  }
})();

// ULTRA-SIMPLE: Use React 16 render for maximum compatibility
var rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.render(React.createElement(App), rootElement);
  console.log('✅ App mounted successfully with React 16');
} else {
  console.error('❌ Root element not found');
}