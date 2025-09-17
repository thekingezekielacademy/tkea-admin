import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'plyr/dist/plyr.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Safari polyfills for older versions
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Instagram/Facebook browser debugging
if (typeof window !== 'undefined') {
  const userAgent = navigator.userAgent;
  const isInstagram = /Instagram/i.test(userAgent);
  const isFacebook = /FBAN|FBAV|FBIOS/i.test(userAgent);
  
  if (isInstagram || isFacebook) {
    console.log('📱 Instagram/Facebook browser detected - enabling FULL APP mode');
    console.log('User Agent:', userAgent);
    console.log('Browser Type:', isInstagram ? 'Instagram' : 'Facebook');
    console.log('React will load normally - no restrictions applied');
    
    // Add visual indicator for debugging
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:green;color:white;padding:5px;z-index:9999;font-family:monospace;font-size:12px;text-align:center;';
    debugDiv.textContent = `✅ ${isInstagram ? 'Instagram' : 'Facebook'} Browser - Full App Loading...`;
    document.body.appendChild(debugDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (debugDiv.parentNode) {
        debugDiv.parentNode.removeChild(debugDiv);
      }
    }, 5000);
  }
}

// Global error logging for Safari and in-app browser debugging
window.onerror = function (message, source, lineno, colno, error) {
  const userAgent = navigator.userAgent;
  const isInstagram = /Instagram/i.test(userAgent);
  const isFacebook = /FBAN|FBAV|FBIOS/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  console.error("❌ Global Error:", {
    message,
    source,
    lineno,
    colno,
    error: error?.stack || error,
    userAgent,
    isInstagram,
    isFacebook,
    isSafari,
    timestamp: new Date().toISOString()
  });
  
  // Also log to a more visible location for debugging
  if (typeof document !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
    
    let browserType = 'Safari';
    if (isInstagram) browserType = 'Instagram Browser';
    else if (isFacebook) browserType = 'Facebook Browser';
    else if (isSafari) browserType = 'Safari';
    
    errorDiv.textContent = `${browserType} Error: ${message} at ${source}:${lineno}:${colno}`;
    document.body.appendChild(errorDiv);
    
    // Remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }
};

window.onunhandledrejection = function (event) {
  const userAgent = navigator.userAgent;
  const isInstagram = /Instagram/i.test(userAgent);
  const isFacebook = /FBAN|FBAV|FBIOS/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  console.error("❌ Unhandled Promise Rejection:", {
    reason: event.reason,
    promise: event.promise,
    userAgent,
    isInstagram,
    isFacebook,
    isSafari,
    timestamp: new Date().toISOString()
  });
  
  // Also log to a more visible location for debugging
  if (typeof document !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:50px;left:0;right:0;background:orange;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
    
    let browserType = 'Safari';
    if (isInstagram) browserType = 'Instagram Browser';
    else if (isFacebook) browserType = 'Facebook Browser';
    else if (isSafari) browserType = 'Safari';
    
    errorDiv.textContent = `${browserType} Promise Rejection: ${event.reason}`;
    document.body.appendChild(errorDiv);
    
    // Remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
