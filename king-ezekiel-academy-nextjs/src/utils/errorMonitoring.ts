'use client';

import React from 'react';

interface ErrorInfo {
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  timestamp: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  componentStack?: string;
  errorBoundary?: string;
}

interface PerformanceInfo {
  url: string;
  loadTime: number;
  timestamp: string;
  userAgent?: string;
  userId?: string;
}

class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private errors: ErrorInfo[] = [];
  private performanceData: PerformanceInfo[] = [];
  private maxErrors = 100;
  private maxPerformanceEntries = 50;

  static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  private setupGlobalErrorHandlers(): void {
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    });

    // Console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.captureError({
        message: args.join(' '),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      originalConsoleError.apply(console, args);
    };
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.capturePerformance({
            url: window.location.href,
            loadTime: navigation.loadEventEnd - navigation.fetchStart,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          });
        }
      }, 0);
    });

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
  }

  private monitorCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.capturePerformance({
        url: window.location.href,
        loadTime: lastEntry.startTime,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }, 'LCP');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.capturePerformance({
          url: window.location.href,
          loadTime: entry.processingStart - entry.startTime,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }, 'FID');
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.capturePerformance({
        url: window.location.href,
        loadTime: clsValue,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }, 'CLS');
    }).observe({ entryTypes: ['layout-shift'] });
  }

  captureError(errorInfo: Partial<ErrorInfo>): void {
    const error: ErrorInfo = {
      message: errorInfo.message || 'Unknown error',
      stack: errorInfo.stack,
      url: errorInfo.url || window.location.href,
      line: errorInfo.line,
      column: errorInfo.column,
      timestamp: errorInfo.timestamp || new Date().toISOString(),
      userAgent: errorInfo.userAgent || navigator.userAgent,
      userId: errorInfo.userId,
      sessionId: errorInfo.sessionId || this.getSessionId(),
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary
    };

    this.errors.unshift(error);
    
    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Captured');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('URL:', error.url);
      console.error('Timestamp:', error.timestamp);
      console.groupEnd();
    }

    // Send to external service in production
    this.sendToExternalService('error', error);
  }

  capturePerformance(perfInfo: PerformanceInfo, metric?: string): void {
    const performance: PerformanceInfo = {
      url: perfInfo.url,
      loadTime: perfInfo.loadTime,
      timestamp: perfInfo.timestamp || new Date().toISOString(),
      userAgent: perfInfo.userAgent || navigator.userAgent,
      userId: perfInfo.userId
    };

    this.performanceData.unshift(performance);
    
    // Keep only the latest performance entries
    if (this.performanceData.length > this.maxPerformanceEntries) {
      this.performanceData = this.performanceData.slice(0, this.maxPerformanceEntries);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric ${metric || 'Load Time'}:`, performance.loadTime + 'ms');
    }

    // Send to external service in production
    this.sendToExternalService('performance', { ...performance, metric });
  }

  private async sendToExternalService(type: 'error' | 'performance', data: any): Promise<void> {
    // In production, send to your preferred error monitoring service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to custom API endpoint
        await fetch('/api/monitoring/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to send monitoring data:', error);
      }
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  // Public methods
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  getPerformanceData(): PerformanceInfo[] {
    return [...this.performanceData];
  }

  clearErrors(): void {
    this.errors = [];
  }

  clearPerformanceData(): void {
    this.performanceData = [];
  }

  // React Error Boundary integration
  captureReactError(error: Error, errorInfo: any): void {
    this.captureError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  }

  // Custom error logging
  logError(message: string, error?: Error, context?: any): void {
    this.captureError({
      message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...context
    });
  }

  // Performance monitoring
  measurePerformance(name: string, fn: () => void): void {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    this.capturePerformance({
      url: window.location.href,
      loadTime: end - start,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }, name);
  }

  // Get monitoring summary
  getMonitoringSummary(): {
    totalErrors: number;
    totalPerformanceEntries: number;
    recentErrors: ErrorInfo[];
    averageLoadTime: number;
  } {
    const recentErrors = this.errors.slice(0, 10);
    const averageLoadTime = this.performanceData.length > 0
      ? this.performanceData.reduce((sum, entry) => sum + entry.loadTime, 0) / this.performanceData.length
      : 0;

    return {
      totalErrors: this.errors.length,
      totalPerformanceEntries: this.performanceData.length,
      recentErrors,
      averageLoadTime
    };
  }
}

// Export singleton instance
export const errorMonitoring = ErrorMonitoringService.getInstance();

// React Error Boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    errorMonitoring.captureReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                <p className="text-sm text-gray-500">We've been notified about this error and are working to fix it.</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Reload Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default errorMonitoring;
