// Instagram Mini Browser Minimal Mode
// Instagram's in-app browser has extremely limited JavaScript support
import React from 'react';

export const isInstagramBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('instagram') || 
         userAgent.includes('fbav') || 
         userAgent.includes('fban') ||
         userAgent.includes('fbsv');
};

export const isMiniBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('instagram') || 
         userAgent.includes('fbav') || 
         userAgent.includes('fban') ||
         userAgent.includes('fbsv') ||
         userAgent.includes('line') ||
         userAgent.includes('whatsapp') ||
         userAgent.includes('telegram');
};

// Ultra-safe feature detection for Instagram browser
export const safeFeatureCheck = {
  // Check if basic DOM is available
  hasDOM: (): boolean => {
    try {
      return typeof document !== 'undefined' && typeof window !== 'undefined';
    } catch {
      return false;
    }
  },

  // Check if React can render
  canRender: (): boolean => {
    try {
      return typeof window !== 'undefined' && 
             typeof document !== 'undefined' && 
             document.getElementById('root') !== null;
    } catch {
      return false;
    }
  },

  // Check if fetch is available (Instagram might not have it)
  hasFetch: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      return 'fetch' in window;
    } catch {
      return false;
    }
  },

  // Check if Promise is available
  hasPromise: (): boolean => {
    try {
      return typeof Promise !== 'undefined';
    } catch {
      return false;
    }
  },

  // Check if async/await is available
  hasAsync: (): boolean => {
    try {
      // Test if we can create an async function
      const testAsync = async () => {};
      return typeof testAsync === 'function';
    } catch {
      return false;
    }
  }
};

// Minimal error boundary for Instagram browser
export const createMinimalErrorBoundary = () => {
  return class MinimalErrorBoundary extends React.Component<{children: React.ReactNode}> {
    constructor(props: {children: React.ReactNode}) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
      return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
      console.error('Minimal Error Boundary caught an error:', error, errorInfo);
    }

    render() {
      if ((this.state as any).hasError) {
        return React.createElement('div', {
          style: { 
            padding: '20px', 
            textAlign: 'center', 
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f0f0f0',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }
        }, [
          React.createElement('h1', { 
            key: 'title',
            style: { color: '#333', marginBottom: '20px' } 
          }, 'King Ezekiel Academy'),
          React.createElement('p', { 
            key: 'message',
            style: { color: '#666', marginBottom: '20px' } 
          }, 'For the best experience, please open this link in your browser:'),
          React.createElement('a', { 
            key: 'link',
            href: 'https://thekingezekielacademy.com',
            style: { 
              color: '#007bff', 
              textDecoration: 'underline',
              fontSize: '18px',
              fontWeight: 'bold'
            }
          }, 'Open in Browser'),
          React.createElement('p', { 
            key: 'instruction',
            style: { color: '#999', marginTop: '20px', fontSize: '14px' } 
          }, 'Tap the link above to open in Chrome, Safari, or your preferred browser')
        ]);
      }

      return this.props.children;
    }
  };
};

// Safe console logging for Instagram browser
export const safeLog = (message: string, ...args: any[]) => {
  try {
    if (typeof console !== 'undefined' && console.log) {
      console.log(message, ...args);
    }
  } catch {
    // Silent fail
  }
};

// Safe error logging
export const safeError = (message: string, error?: any) => {
  try {
    if (typeof console !== 'undefined' && console.error) {
      console.error(message, error);
    }
  } catch {
    // Silent fail
  }
};
