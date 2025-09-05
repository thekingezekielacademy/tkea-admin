const fs = require('fs');

// Read the SafeErrorBoundary file
let content = fs.readFileSync('src/components/SafeErrorBoundary.tsx', 'utf8');

// Fix the Sentry ErrorBoundary usage
const oldErrorBoundary = `const SafeErrorBoundary: React.FC<SafeErrorBoundaryProps> = ({ 
  children, 
  fallback: Fallback = DefaultFallback 
}) => {
  return (
    <Sentry.ErrorBoundary fallback={Fallback}>
      {children}
    </Sentry.ErrorBoundary>
  );
};`;

const newErrorBoundary = `const SafeErrorBoundary: React.FC<SafeErrorBoundaryProps> = ({ 
  children, 
  fallback: Fallback = DefaultFallback 
}) => {
  return (
    <Sentry.ErrorBoundary fallback={({ error }) => <Fallback error={error} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
};`;

// Replace the error boundary
content = content.replace(oldErrorBoundary, newErrorBoundary);

// Write the fixed content
fs.writeFileSync('src/components/SafeErrorBoundary.tsx', content);

console.log('✅ Fixed Sentry ErrorBoundary TypeScript error');
