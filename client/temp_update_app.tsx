const fs = require('fs');

// Read the current App.tsx
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add monitoring imports at the top
const newImports = `import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { initializeServiceWorker } from './utils/serviceWorker';
import { EnvironmentValidator } from './utils/envValidator';
import FacebookPixelProvider from './components/FacebookPixelProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
// import NetworkStatus from './components/NetworkStatus';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import SafeErrorBoundary from './components/SafeErrorBoundary';
import webVitals from './utils/webVitals';
import analytics from './utils/analytics';
import './utils/sentry'; // Initialize Sentry first`;

// Replace the imports
content = content.replace(/import React, { useEffect } from 'react';\nimport { BrowserRouter as Router, Routes, Route } from 'react-router-dom';\nimport { AuthProvider } from '\.\/contexts\/AuthContext';\nimport { SidebarProvider } from '\.\/contexts\/SidebarContext';\nimport { initializeServiceWorker } from '\.\/utils\/serviceWorker';\nimport { EnvironmentValidator } from '\.\/utils\/envValidator';\nimport FacebookPixelProvider from '\.\/components\/FacebookPixelProvider';\nimport Navbar from '\.\/components\/Navbar';\nimport Footer from '\.\/components\/Footer';\n\/\/ import NetworkStatus from '\.\/components\/NetworkStatus';\nimport ProtectedRoute from '\.\/components\/ProtectedRoute';\nimport AdminRoute from '\.\/components\/AdminRoute';\nimport ScrollToTop from '\.\/components\/ScrollToTop';/, newImports);

// Add monitoring initialization to the App function
const oldAppFunction = `function App() {
  useEffect(() => {
    // Validate environment variables
    EnvironmentValidator.logValidation();
    
    // Initialize service worker for caching and performance
    initializeServiceWorker();
  }, []);`;

const newAppFunction = `function App() {
  useEffect(() => {
    // Initialize monitoring first
    webVitals.startMonitoring();
    analytics.initialize();
    
    // Validate environment variables
    EnvironmentValidator.logValidation();
    
    // Initialize service worker for caching and performance
    initializeServiceWorker();
  }, []);`;

// Replace the App function
content = content.replace(oldAppFunction, newAppFunction);

// Wrap the entire app with SafeErrorBoundary
const oldReturn = `  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <FacebookPixelProvider />
          <ScrollToTop />
          <div className="App">
            <Navbar />
            {/* <NetworkStatus /> */}
            <main>`;

const newReturn = `  return (
    <SafeErrorBoundary>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <FacebookPixelProvider />
            <ScrollToTop />
            <div className="App">
              <Navbar />
              {/* <NetworkStatus /> */}
              <main>`;

// Replace the return statement
content = content.replace(oldReturn, newReturn);

// Close the SafeErrorBoundary
const oldClosing = `          </main>
          <Footer />
        </div>
      </Router>
    </SidebarProvider>
  </AuthProvider>
);`;

const newClosing = `          </main>
          <Footer />
        </div>
      </Router>
    </SidebarProvider>
  </AuthProvider>
    </SafeErrorBoundary>
);`;

// Replace the closing
content = content.replace(oldClosing, newClosing);

// Write the updated content
fs.writeFileSync('src/App.tsx', content);

console.log('✅ Updated App.tsx with monitoring integration');
