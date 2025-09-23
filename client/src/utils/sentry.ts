// ULTRA-SIMPLE: Disable Sentry for mini browser compatibility
// Sentry can cause issues in mini browsers and iOS Safari

const SimpleSentry = {
  init: () => {
    // No-op for mini browsers
    const needsSimpleMode = (window as any).__KEA_SIMPLE_BROWSER__?.needsSimpleMode || false;
    if (needsSimpleMode) {
      console.log('Sentry disabled for mini browser compatibility');
      return;
    }
    
    // Only initialize for desktop browsers
    const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
    if (sentryDsn && sentryDsn !== 'your_sentry_dsn_here' && sentryDsn.length > 10) {
      try {
        // Dynamic import to avoid loading Sentry in mini browsers
        import('@sentry/react').then((Sentry) => {
          Sentry.init({
            dsn: sentryDsn,
            environment: process.env.NODE_ENV,
            tracesSampleRate: 0.1,
          });
        });
      } catch (error) {
        console.log('Sentry initialization failed:', error);
      }
    }
  },
  
  captureException: (error: any) => {
    // No-op for mini browsers
    const needsSimpleMode = (window as any).__KEA_SIMPLE_BROWSER__?.needsSimpleMode || false;
    if (needsSimpleMode) {
      console.error('Error (Sentry disabled):', error);
      return;
    }
    
    // Only capture for desktop browsers
    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(error);
      });
    } catch (e) {
      console.error('Sentry capture failed:', e);
    }
  }
};

export default SimpleSentry;
