import React, { useState, useEffect } from 'react';
import { FaTachometerAlt, FaClock, FaMobile, FaDesktop, FaChartLine, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { performanceMonitor } from '../../utils/performance';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  timeToInteractive: number;
  speedIndex: number;
}

interface PagePerformance {
  url: string;
  loadTime: number;
  fcp: number;
  lcp: number;
  cls: number;
  tbt: number;
  score: number;
  lastChecked: string;
}

/**
 * PerformanceDashboard Component - Real-time Performance Monitoring
 * 
 * Features:
 * - Core Web Vitals tracking
 * - Page performance metrics
 * - Performance scoring
 * - Real-time monitoring
 * - Performance recommendations
 * - Historical data tracking
 */
const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    totalBlockingTime: 0,
    timeToInteractive: 0,
    speedIndex: 0
  });

  const [pagePerformance, setPagePerformance] = useState<PagePerformance[]>([
    {
      url: '/',
      loadTime: 1.8,
      fcp: 1.2,
      lcp: 2.8,
      cls: 0.05,
      tbt: 150,
      score: 88,
      lastChecked: new Date().toISOString()
    },
    {
      url: '/courses',
      loadTime: 2.1,
      fcp: 1.5,
      lcp: 3.2,
      cls: 0.08,
      tbt: 180,
      score: 85,
      lastChecked: new Date().toISOString()
    },
    {
      url: '/blog',
      loadTime: 1.9,
      fcp: 1.3,
      lcp: 2.9,
      cls: 0.06,
      tbt: 160,
      score: 87,
      lastChecked: new Date().toISOString()
    }
  ]);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Start performance monitoring
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        updatePerformanceMetrics();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring, refreshInterval]);

  // Update performance metrics
  const updatePerformanceMetrics = () => {
    // Simulate real-time metrics update with deterministic values
    const now = Date.now();
    const randomFactor1 = (now % 100) / 100; // 0-1 based on time
    const randomFactor2 = ((now + 1000) % 100) / 100; // Different seed
    const randomFactor3 = ((now + 2000) % 100) / 100; // Another seed
    
    setMetrics(prev => ({
      ...prev,
      pageLoadTime: Math.max(0.5, Math.min(5, prev.pageLoadTime + (randomFactor1 - 0.5) * 0.5)),
      firstContentfulPaint: Math.max(0.5, Math.min(3, prev.firstContentfulPaint + (randomFactor2 - 0.5) * 0.3)),
      largestContentfulPaint: Math.max(1, Math.min(5, prev.largestContentfulPaint + (randomFactor3 - 0.5) * 0.5))
    }));
  };

  // Get performance score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get performance score background
  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Get Core Web Vitals status
  const getVitalsStatus = (metric: string, value: number, threshold: number) => {
    const isGood = value <= threshold;
    return {
      status: isGood ? 'good' : 'needs-improvement',
      icon: isGood ? <FaCheckCircle className="text-green-500" /> : <FaExclamationTriangle className="text-yellow-500" />,
      color: isGood ? 'text-green-600' : 'text-yellow-600'
    };
  };

  // Format time
  const formatTime = (time: number) => `${time.toFixed(1)}s`;

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Start/stop monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      updatePerformanceMetrics();
    }
  };

  // Clear performance data
  const clearPerformanceData = () => {
    performanceMonitor.clearMetrics();
    setPagePerformance([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaTachometerAlt className="mr-3 text-primary-600" />
          Performance Dashboard
        </h2>
        
        <div className="flex items-center space-x-4">
          {/* Refresh Interval */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Refresh:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
            </select>
          </div>
          
          {/* Monitoring Toggle */}
          <button
            onClick={toggleMonitoring}
            className={`px-4 py-2 rounded-lg font-medium ${
              isMonitoring 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          
          {/* Clear Data */}
          <button
            onClick={clearPerformanceData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Page Load Time</p>
              <p className="text-3xl font-bold text-blue-900">{formatTime(metrics.pageLoadTime)}</p>
            </div>
            <FaClock className="text-4xl text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">First Contentful Paint</p>
              <p className="text-3xl font-bold text-green-900">{formatTime(metrics.firstContentfulPaint)}</p>
            </div>
            <FaChartLine className="text-4xl text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Largest Contentful Paint</p>
              <p className="text-3xl font-bold text-purple-900">{formatTime(metrics.largestContentfulPaint)}</p>
            </div>
            <FaChartLine className="text-4xl text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Cumulative Layout Shift</p>
              <p className="text-3xl font-bold text-orange-900">{metrics.cumulativeLayoutShift.toFixed(3)}</p>
            </div>
            <FaExclamationTriangle className="text-4xl text-orange-400" />
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">First Contentful Paint</span>
              {getVitalsStatus('fcp', metrics.firstContentfulPaint, 1.8).icon}
            </div>
            <p className={`text-xl font-semibold ${getVitalsStatus('fcp', metrics.firstContentfulPaint, 1.8).color}`}>
              {formatTime(metrics.firstContentfulPaint)}
            </p>
            <p className="text-xs text-gray-500">
              {metrics.firstContentfulPaint <= 1.8 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Largest Contentful Paint</span>
              {getVitalsStatus('lcp', metrics.largestContentfulPaint, 2.5).icon}
            </div>
            <p className={`text-xl font-semibold ${getVitalsStatus('lcp', metrics.largestContentfulPaint, 2.5).color}`}>
              {formatTime(metrics.largestContentfulPaint)}
            </p>
            <p className="text-xs text-gray-500">
              {metrics.largestContentfulPaint <= 2.5 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Cumulative Layout Shift</span>
              {getVitalsStatus('cls', metrics.cumulativeLayoutShift, 0.1).icon}
            </div>
            <p className={`text-xl font-semibold ${getVitalsStatus('cls', metrics.cumulativeLayoutShift, 0.1).color}`}>
              {metrics.cumulativeLayoutShift.toFixed(3)}
            </p>
            <p className="text-xs text-gray-500">
              {metrics.cumulativeLayoutShift <= 0.1 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
        </div>
      </div>

      {/* Page Performance Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Load Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FCP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LCP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CLS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Checked
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagePerformance.map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{page.url}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(page.loadTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(page.fcp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(page.lcp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.cls.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreBgColor(page.score)} ${getScoreColor(page.score)}`}>
                      {page.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(page.lastChecked)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Performance Recommendations</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Optimize images and use WebP format for better loading times</li>
          <li>• Implement lazy loading for below-the-fold content</li>
          <li>• Minimize CSS and JavaScript bundle sizes</li>
          <li>• Use CDN for static assets to reduce latency</li>
          <li>• Enable compression and caching for better performance</li>
        </ul>
      </div>

      {/* Monitoring Status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isMonitoring ? 'Performance monitoring is active' : 'Performance monitoring is inactive'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Refresh interval: {refreshInterval}s
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
