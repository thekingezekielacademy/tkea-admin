/**
 * Simplified App Component for Mini Browsers
 * Uses HashRouter and simplified routing for Instagram/Facebook compatibility
 */

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getBrowserInfo } from '../utils/simpleBrowserDetection';

// Import only essential components
import Dashboard from '../pages/Dashboard';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import CourseOverview from '../pages/course/CourseOverview';
import Profile from '../pages/Profile';
import Home from '../pages/Home';
import PWAInstall from '../pages/PWAInstall';

// Simplified loading component
const LoadingSpinner: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#1e3a8a'
  }}>
    <div>Loading...</div>
  </div>
);

// Error boundary for mini browsers
class MiniBrowserErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Mini Browser Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const info = getBrowserInfo();
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#f8f9fa',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
            {info.isInApp ? '📱' : '🌐'} App Error
          </h1>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            Something went wrong. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#1e3a8a',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error Details</summary>
              <pre style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '10px', 
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Main App component optimized for mini browsers
 * Uses HashRouter and simplified routing
 */
const MiniBrowserApp: React.FC = () => {
  const info = getBrowserInfo();
  
  // Log browser info for debugging
  console.log(`${info.isInApp ? '📱' : '🌐'} Mini Browser App starting...`);
  console.log('User Agent:', info.userAgent);
  console.log('Is In-App Browser:', info.isInApp);

  return (
    <MiniBrowserErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/install" element={<PWAInstall />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/course/:id" element={<CourseOverview />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </Router>
    </MiniBrowserErrorBoundary>
  );
};

export default MiniBrowserApp;
