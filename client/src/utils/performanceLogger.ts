// =====================================================
// PERFORMANCE LOGGER
// Provides controlled logging for development and production
// =====================================================

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  component?: string;
  action?: string;
}

class PerformanceLogger {
  private static instance: PerformanceLogger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG;
  }

  static getInstance(): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger();
    }
    return PerformanceLogger.instance;
  }

  /**
   * Log error messages (always shown)
   */
  error(message: string, data?: any, component?: string, action?: string): void {
    this.log(LogLevel.ERROR, message, data, component, action);
  }

  /**
   * Log warning messages (shown in development and production)
   */
  warn(message: string, data?: any, component?: string, action?: string): void {
    this.log(LogLevel.WARN, message, data, component, action);
  }

  /**
   * Log info messages (shown in development only)
   */
  info(message: string, data?: any, component?: string, action?: string): void {
    this.log(LogLevel.INFO, message, data, component, action);
  }

  /**
   * Log debug messages (shown in development only)
   */
  debug(message: string, data?: any, component?: string, action?: string): void {
    this.log(LogLevel.DEBUG, message, data, component, action);
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, data?: any): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    this.log(LogLevel.INFO, message, { ...data, duration }, 'Performance');
  }

  /**
   * Log API calls
   */
  apiCall(method: string, url: string, status: number, duration?: number): void {
    const message = `API ${method} ${url} - ${status}`;
    const data = { method, url, status, duration };
    this.log(LogLevel.INFO, message, data, 'API');
  }

  /**
   * Log user actions
   */
  userAction(action: string, data?: any): void {
    const message = `User action: ${action}`;
    this.log(LogLevel.INFO, message, data, 'UserAction');
  }

  /**
   * Log database operations
   */
  database(operation: string, table: string, duration?: number, data?: any): void {
    const message = `DB ${operation} on ${table}`;
    const logData = { operation, table, duration, ...data };
    this.log(LogLevel.DEBUG, message, logData, 'Database');
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, component?: string, action?: string): void {
    // Only log if level is appropriate for current environment
    if (level > this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      component,
      action
    };

    // Add to logs array
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Output to console based on level
    this.outputToConsole(entry);
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const { level, message, data, component, action } = entry;
    const prefix = `[${component || 'App'}]${action ? `[${action}]` : ''}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(`🚨 ${prefix} ${message}`, data);
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ ${prefix} ${message}`, data);
        break;
      case LogLevel.INFO:
        console.log(`ℹ️ ${prefix} ${message}`, data);
        break;
      case LogLevel.DEBUG:
        console.log(`🐛 ${prefix} ${message}`, data);
        break;
    }
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, component?: string, limit: number = 50): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component);
    }

    return filteredLogs.slice(0, limit);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get log statistics
   */
  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    byComponent: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byComponent: {} as Record<string, number>
    };

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
      
      if (log.component) {
        stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = PerformanceLogger.getInstance();

// Export convenience functions
export const logError = (message: string, data?: any, component?: string, action?: string) => 
  logger.error(message, data, component, action);

export const logWarn = (message: string, data?: any, component?: string, action?: string) => 
  logger.warn(message, data, component, action);

export const logInfo = (message: string, data?: any, component?: string, action?: string) => 
  logger.info(message, data, component, action);

export const logDebug = (message: string, data?: any, component?: string, action?: string) => 
  logger.debug(message, data, component, action);

export const logPerformance = (operation: string, duration: number, data?: any) => 
  logger.performance(operation, duration, data);

export const logApiCall = (method: string, url: string, status: number, duration?: number) => 
  logger.apiCall(method, url, status, duration);

export const logUserAction = (action: string, data?: any) => 
  logger.userAction(action, data);

export const logDatabase = (operation: string, table: string, duration?: number, data?: any) => 
  logger.database(operation, table, duration, data);

export default logger;
