import { useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '../utils/performance';

/**
 * Custom hook for performance monitoring
 * 
 * Features:
 * - Automatic page load timing
 * - Component render timing
 * - User interaction timing
 * - Performance metrics collection
 * - Integration with PerformanceMonitor utility
 */
export const usePerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const interactionStartTime = useRef<number>(0);

  // Start measuring component render time
  useEffect(() => {
    renderStartTime.current = performance.now();
    performanceMonitor.startMeasure(`${componentName}-render`);

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitor.endMeasure(`${componentName}-render`);
      
      // Log render time in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time:`, renderTime.toFixed(2), 'ms');
      }
    };
  }, [componentName]);

  // Measure user interaction time
  const measureInteraction = useCallback((interactionName: string) => {
    interactionStartTime.current = performance.now();
    performanceMonitor.startMeasure(`${componentName}-${interactionName}`);
  }, [componentName]);

  // End interaction measurement
  const endInteraction = useCallback((interactionName: string) => {
    const interactionTime = performance.now() - interactionStartTime.current;
    const duration = performanceMonitor.endMeasure(`${componentName}-${interactionName}`);
    
    // Log interaction time in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} ${interactionName} time:`, interactionTime.toFixed(2), 'ms');
    }
    
    return duration;
  }, [componentName]);

  // Measure async operation
  const measureAsync = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    performanceMonitor.startMeasure(`${componentName}-${operationName}`);
    
    try {
      const result = await operation();
      performanceMonitor.endMeasure(`${componentName}-${operationName}`);
      return result;
    } catch (error) {
      performanceMonitor.endMeasure(`${componentName}-${operationName}`);
      throw error;
    }
  }, [componentName]);

  // Get performance metrics
  const getMetrics = useCallback(() => {
    return performanceMonitor.getAllMetrics();
  }, []);

  // Clear performance metrics
  const clearMetrics = useCallback(() => {
    performanceMonitor.clearMetrics();
  }, []);

  return {
    measureInteraction,
    endInteraction,
    measureAsync,
    getMetrics,
    clearMetrics
  };
};

/**
 * Hook for measuring page load performance
 */
export const usePagePerformance = (pageName: string) => {
  useEffect(() => {
    // Measure page load time
    performanceMonitor.startMeasure(`${pageName}-page-load`);
    
    // Measure First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            performanceMonitor.endMeasure(`${pageName}-fcp`);
            break;
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
      
      return () => observer.disconnect();
    }
    
    return () => {
      performanceMonitor.endMeasure(`${pageName}-page-load`);
    };
  }, [pageName]);

  // Measure user interactions
  const measureClick = useCallback((elementName: string) => {
    performanceMonitor.startMeasure(`${pageName}-click-${elementName}`);
  }, [pageName]);

  const endClick = useCallback((elementName: string) => {
    performanceMonitor.endMeasure(`${pageName}-click-${elementName}`);
  }, [pageName]);

  return {
    measureClick,
    endClick
  };
};

/**
 * Hook for measuring form performance
 */
export const useFormPerformance = (formName: string) => {
  const { measureAsync } = usePerformance(formName);

  const measureFormSubmission = useCallback(async <T>(
    submission: () => Promise<T>
  ): Promise<T> => {
    return measureAsync('form-submission', submission);
  }, [measureAsync]);

  const measureFormValidation = useCallback(async <T>(
    validation: () => Promise<T>
  ): Promise<T> => {
    return measureAsync('form-validation', validation);
  }, [measureAsync]);

  return {
    measureFormSubmission,
    measureFormValidation
  };
};

/**
 * Hook for measuring API calls
 */
export const useAPIPerformance = (apiName: string) => {
  const { measureAsync } = usePerformance(apiName);

  const measureAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    return measureAsync('api-call', apiCall);
  }, [measureAsync]);

  return {
    measureAPICall
  };
};

export default usePerformance;
