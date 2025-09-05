import * as Sentry from '@sentry/react';

// Initialize Sentry with safe defaults
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      // Don't send console errors or network errors
      if (event.exception) {
        const error = event.exception.values[0];
        if (error.type === 'Error' && 
            (error.value?.includes('console') || 
             error.value?.includes('network') ||
             error.value?.includes('404'))) {
          return null;
        }
      }
    }
    return event;
  },
});

export default Sentry;
