import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// CRITICAL: Fix hash for mini browsers and iOS Safari BEFORE React loads
(function() {
  var ua = navigator.userAgent || '';
  var isMiniBrowser = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(ua);
  var isIOSSafari = /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
  var isIOSChrome = /CriOS/.test(ua);
  
  // Fix hash for mini browsers and iOS browsers
  if ((isMiniBrowser || isIOSSafari || isIOSChrome) && (!window.location.hash || window.location.hash === '#')) {
    window.location.hash = '#/';
    console.log('🔧 Fixed hash for iOS/mini browser:', window.location.hash);
  }
  
  // Additional iOS Safari fixes
  if (isIOSSafari || isIOSChrome) {
    // Prevent iOS Safari from hiding the address bar
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.scrollTo(0, 1);
      }, 0);
    });
    
    // Fix iOS Safari viewport issues
    var viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');
    }
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