import React, { useState, useEffect } from 'react';
import { FaChartLine, FaSearch, FaMobile, FaDesktop, FaGlobe, FaRocket } from 'react-icons/fa';

interface SEOMetrics {
  pageSpeed: number;
  mobileScore: number;
  desktopScore: number;
  seoScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
}

interface PagePerformance {
  url: string;
  title: string;
  loadTime: number;
  score: number;
  lastChecked: string;
}

/**
 * SEODashboard Component - Real-time SEO Performance Monitoring
 * 
 * Features:
 * - Page speed metrics
 * - Core Web Vitals
 * - SEO scores
 * - Performance trends
 * - Page-specific analytics
 * - Mobile vs Desktop comparison
 */
const SEODashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SEOMetrics>({
    pageSpeed: 85,
    mobileScore: 82,
    desktopScore: 88,
    seoScore: 95,
    accessibilityScore: 90,
    bestPracticesScore: 87,
    firstContentfulPaint: 1.2,
    largestContentfulPaint: 2.8,
    cumulativeLayoutShift: 0.05,
    totalBlockingTime: 150
  });

  const [pagePerformance, setPagePerformance] = useState<PagePerformance[]>([
    {
      url: '/',
      title: 'Homepage',
      loadTime: 1.8,
      score: 88,
      lastChecked: '2025-01-31T10:00:00Z'
    },
    {
      url: '/courses',
      title: 'Courses',
      loadTime: 2.1,
      score: 85,
      lastChecked: '2025-01-31T10:00:00Z'
    },
    {
      url: '/blog',
      title: 'Blog',
      loadTime: 1.9,
      score: 87,
      lastChecked: '2025-01-31T10:00:00Z'
    },
    {
      url: '/about',
      title: 'About',
      loadTime: 1.7,
      score: 90,
      lastChecked: '2025-01-31T10:00:00Z'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Simulate fetching real-time metrics
  const refreshMetrics = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update with simulated new data
    setMetrics(prev => ({
      ...prev,
      pageSpeed: Math.max(70, Math.min(100, prev.pageSpeed + (Math.random() - 0.5) * 10)),
      mobileScore: Math.max(70, Math.min(100, prev.mobileScore + (Math.random() - 0.5) * 8)),
      desktopScore: Math.max(70, Math.min(100, prev.desktopScore + (Math.random() - 0.5) * 8))
    }));
    
    setIsLoading(false);
  };

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get score background color
  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Format time in seconds
  const formatTime = (time: number) => `${time.toFixed(1)}s`;

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaChartLine className="mr-3 text-primary-600" />
          SEO Performance Dashboard
        </h2>
        <button
          onClick={refreshMetrics}
          disabled={isLoading}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
        >
          <FaRocket className="mr-2" />
          {isLoading ? 'Refreshing...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* Overall Performance Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Overall Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(metrics.pageSpeed)}`}>
                {metrics.pageSpeed}
              </p>
            </div>
            <FaGlobe className="text-4xl text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Mobile Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(metrics.mobileScore)}`}>
                {metrics.mobileScore}
              </p>
            </div>
            <FaMobile className="text-4xl text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Desktop Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(metrics.desktopScore)}`}>
                {metrics.desktopScore}
              </p>
            </div>
            <FaDesktop className="text-4xl text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">SEO Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(metrics.seoScore)}`}>
                {metrics.seoScore}
              </p>
            </div>
            <FaSearch className="text-4xl text-orange-400" />
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">First Contentful Paint</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatTime(metrics.firstContentfulPaint)}
            </p>
            <p className="text-xs text-gray-500">
              {metrics.firstContentfulPaint <= 1.8 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Largest Contentful Paint</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatTime(metrics.largestContentfulPaint)}
            </p>
            <p className="text-xs text-gray-500">
              {metrics.largestContentfulPaint <= 2.5 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Cumulative Layout Shift</p>
            <p className="text-xl font-semibold text-gray-900">
              {metrics.cumulativeLayoutShift.toFixed(3)}
            </p>
            <p className="text-xs text-gray-500">
              {metrics.cumulativeLayoutShift <= 0.1 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Blocking Time</p>
            <p className="text-xl font-semibold text-gray-900">
              {metrics.totalBlockingTime}ms
            </p>
            <p className="text-xs text-gray-500">
              {metrics.totalBlockingTime <= 200 ? 'Good' : 'Needs Improvement'}
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
                    <div>
                      <div className="text-sm font-medium text-gray-900">{page.title}</div>
                      <div className="text-sm text-gray-500">{page.url}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{formatTime(page.loadTime)}</span>
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

      {/* Recommendations */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">SEO Recommendations</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Optimize images with WebP format and proper sizing</li>
          <li>• Implement lazy loading for below-the-fold content</li>
          <li>• Add structured data markup for courses and blog posts</li>
          <li>• Optimize CSS delivery and remove unused styles</li>
          <li>• Enable compression and caching for static assets</li>
        </ul>
      </div>
    </div>
  );
};

export default SEODashboard;
