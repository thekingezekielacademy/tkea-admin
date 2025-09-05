// =====================================================
// GLOBAL ERROR HANDLER
// Provides consistent error handling across the application
// =====================================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
  component?: string;
}

export interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 100;

  /**
   * Handle application errors with consistent formatting
   */
  static handleError(
    error: Error | string,
    context: ErrorContext = {},
    options: {
      showToast?: boolean;
      logToConsole?: boolean;
      reportToService?: boolean;
    } = {}
  ): AppError {
    const {
      showToast = true,
      logToConsole = true,
      reportToService = true
    } = options;

    // Create standardized error object
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: this.getErrorDetails(error),
      timestamp: new Date().toISOString(),
      userId: context.userId,
      component: context.component
    };

    // Log to console if enabled
    if (logToConsole) {
      this.logToConsole(appError, context);
    }

    // Add to error log
    this.addToLog(appError);

    // Show user-friendly message if enabled
    if (showToast) {
      this.showUserMessage(appError);
    }

    // Report to external service if enabled
    if (reportToService) {
      this.reportToService(appError, context);
    }

    return appError;
  }

  /**
   * Handle async errors with proper error boundaries
   */
  static async handleAsyncError<T>(
    asyncFn: () => Promise<T>,
    context: ErrorContext = {},
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await asyncFn();
    } catch (error) {
      this.handleError(error, context);
      return fallback;
    }
  }

  /**
   * Handle API errors with specific error codes
   */
  static handleApiError(
    error: any,
    context: ErrorContext = {}
  ): AppError {
    const apiError = this.createApiError(error);
    return this.handleError(apiError, context, {
      showToast: true,
      logToConsole: true,
      reportToService: true
    });
  }

  /**
   * Handle database errors with specific handling
   */
  static handleDatabaseError(
    error: any,
    context: ErrorContext = {}
  ): AppError {
    const dbError = this.createDatabaseError(error);
    return this.handleError(dbError, context, {
      showToast: true,
      logToConsole: true,
      reportToService: true
    });
  }

  /**
   * Get error code based on error type
   */
  private static getErrorCode(error: Error | string): string {
    if (typeof error === 'string') {
      return 'UNKNOWN_ERROR';
    }

    // Supabase errors
    if (error.message?.includes('PGRST')) {
      return 'DATABASE_ERROR';
    }

    // Network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return 'NETWORK_ERROR';
    }

    // Authentication errors
    if (error.message?.includes('JWT') || error.message?.includes('auth')) {
      return 'AUTH_ERROR';
    }

    // Paystack errors
    if (error.message?.includes('Paystack') || error.message?.includes('payment')) {
      return 'PAYMENT_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: Error | string): string {
    if (typeof error === 'string') {
      return error;
    }

    // Database errors
    if (error.message?.includes('PGRST116')) {
      return 'The requested data was not found';
    }

    if (error.message?.includes('PGRST301')) {
      return 'You do not have permission to perform this action';
    }

    // Network errors
    if (error.message?.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    // Authentication errors
    if (error.message?.includes('JWT expired')) {
      return 'Your session has expired. Please sign in again.';
    }

    // Paystack errors
    if (error.message?.includes('Paystack')) {
      return 'Payment processing failed. Please try again.';
    }

    // Default message
    return error.message || 'An unexpected error occurred';
  }

  /**
   * Get error details for debugging
   */
  private static getErrorDetails(error: Error | string): any {
    if (typeof error === 'string') {
      return { originalMessage: error };
    }

    return {
      name: error.name,
      stack: error.stack,
      originalMessage: error.message
    };
  }

  /**
   * Create API-specific error
   */
  private static createApiError(error: any): Error {
    const message = error.response?.data?.message || error.message || 'API request failed';
    const apiError = new Error(message);
    (apiError as any).status = error.response?.status;
    (apiError as any).data = error.response?.data;
    return apiError;
  }

  /**
   * Create database-specific error
   */
  private static createDatabaseError(error: any): Error {
    let message = 'Database operation failed';
    
    if (error.code === 'PGRST116') {
      message = 'Data not found';
    } else if (error.code === 'PGRST301') {
      message = 'Permission denied';
    } else if (error.code === 'PGRST303') {
      message = 'Session expired';
    } else if (error.message) {
      message = error.message;
    }

    const dbError = new Error(message);
    (dbError as any).code = error.code;
    (dbError as any).details = error.details;
    return dbError;
  }

  /**
   * Log error to console with proper formatting
   */
  private static logToConsole(error: AppError, context: ErrorContext): void {
    const logMessage = `🚨 Error in ${context.component || 'Unknown Component'}`;
    const logData = {
      error: error.message,
      code: error.code,
      context,
      timestamp: error.timestamp
    };

    if (error.code === 'NETWORK_ERROR') {
      console.warn(logMessage, logData);
    } else if (error.code === 'AUTH_ERROR') {
      console.warn(logMessage, logData);
    } else {
      console.error(logMessage, logData);
    }
  }

  /**
   * Show user-friendly message
   */
  private static showUserMessage(error: AppError): void {
    // This would integrate with your toast notification system
    // For now, we'll use a simple alert in development
    if (process.env.NODE_ENV === 'development') {
      console.log('User message:', error.message);
    }
  }

  /**
   * Report error to external service
   */
  private static reportToService(error: AppError, context: ErrorContext): void {
    // This would integrate with your error reporting service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
      console.log('Reporting error to service:', error);
    }
  }

  /**
   * Add error to internal log
   */
  private static addToLog(error: AppError): void {
    this.errorLog.unshift(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  /**
   * Get recent errors for debugging
   */
  static getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    total: number;
    byCode: Record<string, number>;
    byComponent: Record<string, number>;
  } {
    const stats = {
      total: this.errorLog.length,
      byCode: {} as Record<string, number>,
      byComponent: {} as Record<string, number>
    };

    this.errorLog.forEach(error => {
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
      if (error.component) {
        stats.byComponent[error.component] = (stats.byComponent[error.component] || 0) + 1;
      }
    });

    return stats;
  }
}

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  ErrorHandler.handleError(event.error, {
    component: 'Global',
    action: 'Unhandled Error'
  });
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handleError(event.reason, {
    component: 'Global',
    action: 'Unhandled Promise Rejection'
  });
});

export default ErrorHandler;
