const fs = require('fs');

// Create a simpler ErrorBoundary that works with Sentry
const simpleErrorBoundary = `import React from 'react';
import * as Sentry from '@sentry/react';

interface SafeErrorBoundaryProps {
  children: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
          <p className="text-sm text-gray-500">We're sorry, but something unexpected happened.</p>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

const SafeErrorBoundary: React.FC<SafeErrorBoundaryProps> = ({ children }) => {
  return (
    <Sentry.ErrorBoundary fallback={DefaultFallback}>
      {children}
    </Sentry.ErrorBoundary>
  );
};

export default SafeErrorBoundary;
`;

// Write the simplified error boundary
fs.writeFileSync('src/components/SafeErrorBoundary.tsx', simpleErrorBoundary);

console.log('✅ Created simplified SafeErrorBoundary');
