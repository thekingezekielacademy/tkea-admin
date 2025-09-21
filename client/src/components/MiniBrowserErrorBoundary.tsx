import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * MiniBrowserErrorBoundary - Simple error boundary for mini browsers
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
class MiniBrowserErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    console.error('❌ MiniBrowserErrorBoundary caught an error:', error, errorInfo);
    
    // Check if this is a mini browser
    const isMiniBrowser = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(navigator.userAgent);
    
    if (isMiniBrowser) {
      console.log('📱 Error occurred in mini browser - showing fallback UI');
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI for errors
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ color: '#333', marginBottom: '20px' }}>
              King Ezekiel Academy
            </h1>
            <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
              We're experiencing some technical difficulties. Please try refreshing the page or opening this link in your regular browser.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Refresh Page
              </button>
              
              <a 
                href="https://app.thekingezekielacademy.com" 
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  display: 'inline-block'
                }}
              >
                Open in Browser
              </a>
            </div>
            
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>
                Technical Details
              </summary>
              <pre style={{ 
                fontSize: '12px', 
                color: '#999', 
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '3px',
                overflow: 'auto'
              }}>
                {this.state.error?.message || 'Unknown error occurred'}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MiniBrowserErrorBoundary;
