// Bundle analyzer utility to identify performance bottlenecks
export const bundleAnalyzer = {
  // Track component render times
  componentRenderTimes: new Map<string, number[]>(),
  
  // Track bundle sizes
  bundleSizes: new Map<string, number>(),
  
  // Track network requests
  networkRequests: new Map<string, { start: number; end: number; size: number }[]>(),
  
  startComponentRender(componentName: string): number {
    return Date.now();
  },
  
  endComponentRender(componentName: string, startTime: number): number {
    const duration = Date.now() - startTime;
    const times = this.componentRenderTimes.get(componentName) || [];
    times.push(duration);
    
    // Keep only last 20 measurements
    if (times.length > 20) {
      times.shift();
    }
    
    this.componentRenderTimes.set(componentName, times);
    
    // Log slow renders
    if (duration > 100) {
      console.warn(`Slow component render: ${componentName} took ${duration}ms`);
    }
    
    return duration;
  },
  
  getComponentStats(componentName: string) {
    const times = this.componentRenderTimes.get(componentName) || [];
    if (times.length === 0) return null;
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    return { avg, max, min, count: times.length };
  },
  
  getAllComponentStats() {
    const stats: Record<string, any> = {};
    
    this.componentRenderTimes.forEach((times, componentName) => {
      stats[componentName] = this.getComponentStats(componentName);
    });
    
    return stats;
  },
  
  // Track network request performance
  startNetworkRequest(url: string): number {
    const startTime = Date.now();
    const requests = this.networkRequests.get(url) || [];
    requests.push({ start: startTime, end: 0, size: 0 });
    this.networkRequests.set(url, requests);
    return startTime;
  },
  
  endNetworkRequest(url: string, startTime: number, size: number = 0) {
    const endTime = Date.now();
    const requests = this.networkRequests.get(url) || [];
    const lastRequest = requests[requests.length - 1];
    
    if (lastRequest && lastRequest.start === startTime) {
      lastRequest.end = endTime;
      lastRequest.size = size;
    }
    
    // Log slow requests
    const duration = endTime - startTime;
    if (duration > 2000) {
      console.warn(`Slow network request: ${url} took ${duration}ms`);
    }
  },
  
  getNetworkStats() {
    const stats: Record<string, any> = {};
    
    this.networkRequests.forEach((requests, url) => {
      const durations = requests
        .filter(r => r.end > 0)
        .map(r => r.end - r.start);
      
      if (durations.length > 0) {
        stats[url] = {
          avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          maxDuration: Math.max(...durations),
          minDuration: Math.min(...durations),
          totalRequests: durations.length,
          totalSize: requests.reduce((sum, r) => sum + r.size, 0)
        };
      }
    });
    
    return stats;
  },
  
  // Identify performance bottlenecks
  identifyBottlenecks() {
    const componentStats = this.getAllComponentStats();
    const networkStats = this.getNetworkStats();
    
    const bottlenecks = {
      slowComponents: [] as string[],
      slowRequests: [] as string[],
      recommendations: [] as string[]
    };
    
    // Find slow components
    Object.entries(componentStats).forEach(([component, stats]) => {
      if (stats && stats.avg > 50) {
        bottlenecks.slowComponents.push(`${component}: ${stats.avg.toFixed(0)}ms avg`);
      }
    });
    
    // Find slow requests
    Object.entries(networkStats).forEach(([url, stats]) => {
      if (stats.avgDuration > 1000) {
        bottlenecks.slowRequests.push(`${url}: ${stats.avgDuration.toFixed(0)}ms avg`);
      }
    });
    
    // Generate recommendations
    if (bottlenecks.slowComponents.length > 0) {
      bottlenecks.recommendations.push('Consider memoizing slow components with React.memo()');
      bottlenecks.recommendations.push('Use useMemo() and useCallback() for expensive calculations');
    }
    
    if (bottlenecks.slowRequests.length > 0) {
      bottlenecks.recommendations.push('Implement request caching to reduce API calls');
      bottlenecks.recommendations.push('Consider using React Query or SWR for data fetching');
    }
    
    return bottlenecks;
  },
  
  // Generate performance report
  generateReport() {
    const bottlenecks = this.identifyBottlenecks();
    const componentStats = this.getAllComponentStats();
    const networkStats = this.getNetworkStats();
    
    console.group('🚀 Performance Report');
    console.log('Component Performance:', componentStats);
    console.log('Network Performance:', networkStats);
    console.log('Bottlenecks:', bottlenecks);
    console.groupEnd();
    
    return {
      componentStats,
      networkStats,
      bottlenecks
    };
  },
  
  // Clear all data
  clear() {
    this.componentRenderTimes.clear();
    this.bundleSizes.clear();
    this.networkRequests.clear();
  }
};

// React component wrapper for automatic performance tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const startTime = bundleAnalyzer.startComponentRender(componentName);
    
    React.useEffect(() => {
      bundleAnalyzer.endComponentRender(componentName, startTime);
    });
    
    return React.createElement(Component, props);
  });
};

// Hook for manual performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const startTime = React.useRef<number>(0);
  
  React.useEffect(() => {
    startTime.current = bundleAnalyzer.startComponentRender(componentName);
    
    return () => {
      bundleAnalyzer.endComponentRender(componentName, startTime.current);
    };
  }, [componentName]);
};

// Import React for the wrapper
import React from 'react';
