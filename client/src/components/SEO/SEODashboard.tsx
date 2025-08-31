import React, { useState, useEffect } from 'react';
import { FaChartLine, FaSearch, FaMobile, FaDesktop, FaGlobe, FaRocket, FaEye, FaMousePointer, FaClock, FaExclamationTriangle, FaCheckCircle, FaTachometerAlt } from 'react-icons/fa';
import { FaUsers } from 'react-icons/fa'; // Added missing import
import { performanceMonitor } from '../../utils/performance';
import { getCacheInfo, isServiceWorkerActive } from '../../utils/serviceWorker';

interface SEOMetrics {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topKeywords: Array<{ keyword: string; impressions: number; clicks: number; ctr: number }>;
  deviceBreakdown: Array<{ device: string; percentage: number }>;
  trafficSources: Array<{ source: string; percentage: number }>;
  indexedPages: number;
  crawlErrors: number;
  mobileUsability: number;
  pageSpeed: {
    desktop: number;
    mobile: number;
  };
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
}

interface PagePerformance {
  url: string;
  title: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  lastAudit: string;
}

const SEODashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null);
  const [pagePerformance, setPagePerformance] = useState<PagePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadSEOMetrics();
    loadPagePerformance();
    loadSystemInfo();
  }, [selectedTimeframe]);

  const loadSEOMetrics = async () => {
    try {
      // Simulate API call - replace with actual GA4 API integration
      const mockMetrics: SEOMetrics = {
        pageViews: 15420,
        uniqueVisitors: 8920,
        bounceRate: 32.5,
        avgSessionDuration: 245,
        topKeywords: [
          { keyword: 'digital marketing courses', impressions: 1250, clicks: 89, ctr: 7.1 },
          { keyword: 'online business training', impressions: 890, clicks: 67, ctr: 7.5 },
          { keyword: 'king ezekiel academy', impressions: 2340, clicks: 156, ctr: 6.7 },
          { keyword: 'social media marketing', impressions: 567, clicks: 34, ctr: 6.0 },
          { keyword: 'ecommerce training', impressions: 445, clicks: 28, ctr: 6.3 }
        ],
        deviceBreakdown: [
          { device: 'Desktop', percentage: 45 },
          { device: 'Mobile', percentage: 48 },
          { device: 'Tablet', percentage: 7 }
        ],
        trafficSources: [
          { source: 'Organic Search', percentage: 65 },
          { source: 'Direct', percentage: 20 },
          { source: 'Social Media', percentage: 10 },
          { source: 'Referral', percentage: 5 }
        ],
        indexedPages: 47,
        crawlErrors: 2,
        mobileUsability: 98,
        pageSpeed: {
          desktop: 92,
          mobile: 87
        },
        coreWebVitals: {
          lcp: 1.8,
          fid: 45,
          cls: 0.08
        }
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading SEO metrics:', error);
    }
  };

  const loadPagePerformance = async () => {
    try {
      const mockPagePerformance: PagePerformance[] = [
        {
          url: '/',
          title: 'Homepage',
          performance: 95,
          accessibility: 98,
          bestPractices: 92,
          seo: 96,
          lastAudit: '2025-01-31'
        },
        {
          url: '/courses',
          title: 'Courses',
          performance: 89,
          accessibility: 95,
          bestPractices: 88,
          seo: 94,
          lastAudit: '2025-01-31'
        },
        {
          url: '/blog',
          title: 'Blog',
          performance: 91,
          accessibility: 96,
          bestPractices: 90,
          seo: 97,
          lastAudit: '2025-01-31'
        },
        {
          url: '/about',
          title: 'About',
          performance: 93,
          accessibility: 97,
          bestPractices: 91,
          seo: 95,
          lastAudit: '2025-01-31'
        }
      ];

      setPagePerformance(mockPagePerformance);
    } catch (error) {
      console.error('Error loading page performance:', error);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const [cacheData, swStatus] = await Promise.all([
        getCacheInfo(),
        isServiceWorkerActive()
      ]);
      
      setCacheInfo(cacheData);
      setServiceWorkerStatus(swStatus);
      setLoading(false);
    } catch (error) {
      console.error('Error loading system info:', error);
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <FaCheckCircle className="text-green-600" />;
    if (score >= 70) return <FaExclamationTriangle className="text-yellow-600" />;
    return <FaExclamationTriangle className="text-red-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaChartLine className="mr-2 text-primary-600" />
            SEO Performance Dashboard
          </h2>
          <p className="text-gray-600">Real-time SEO metrics and performance insights</p>
        </div>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe as any)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                selectedTimeframe === timeframe
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Page Views</p>
              <p className="text-2xl font-bold">{metrics?.pageViews.toLocaleString()}</p>
            </div>
            <FaEye className="text-3xl opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Unique Visitors</p>
              <p className="text-2xl font-bold">{metrics?.uniqueVisitors.toLocaleString()}</p>
            </div>
            <FaUsers className="text-3xl opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Bounce Rate</p>
              <p className="text-2xl font-bold">{metrics?.bounceRate}%</p>
            </div>
            <FaMousePointer className="text-3xl opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Session</p>
              <p className="text-2xl font-bold">{Math.floor((metrics?.avgSessionDuration || 0) / 60)}m</p>
            </div>
            <FaClock className="text-3xl opacity-80" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Core Web Vitals */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaRocket className="mr-2 text-primary-600" />
            Core Web Vitals
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Largest Contentful Paint</span>
              <span className={`font-semibold ${metrics?.coreWebVitals.lcp && metrics.coreWebVitals.lcp <= 2.5 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics?.coreWebVitals.lcp}s
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">First Input Delay</span>
              <span className={`font-semibold ${metrics?.coreWebVitals.fid && metrics.coreWebVitals.fid <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics?.coreWebVitals.fid}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cumulative Layout Shift</span>
              <span className={`font-semibold ${metrics?.coreWebVitals.cls && metrics.coreWebVitals.cls <= 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics?.coreWebVitals.cls}
              </span>
            </div>
          </div>
        </div>

        {/* Page Speed */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaTachometerAlt className="mr-2 text-primary-600" />
            Page Speed
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center">
                <FaDesktop className="mr-2" />
                Desktop
              </span>
              <span className={`font-semibold ${getPerformanceColor(metrics?.pageSpeed.desktop || 0)}`}>
                {metrics?.pageSpeed.desktop}/100
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center">
                <FaMobile className="mr-2" />
                Mobile
              </span>
              <span className={`font-semibold ${getPerformanceColor(metrics?.pageSpeed.mobile || 0)}`}>
                {metrics?.pageSpeed.mobile}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Performance Table */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accessibility</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best Practices</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SEO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagePerformance.map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{page.title}</div>
                      <div className="text-sm text-gray-500">{page.url}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getPerformanceIcon(page.performance)}
                      <span className={`ml-2 font-semibold ${getPerformanceColor(page.performance)}`}>
                        {page.performance}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getPerformanceIcon(page.accessibility)}
                      <span className={`ml-2 font-semibold ${getPerformanceColor(page.accessibility)}`}>
                        {page.accessibility}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getPerformanceIcon(page.bestPractices)}
                      <span className={`ml-2 font-semibold ${getPerformanceColor(page.bestPractices)}`}>
                        {page.bestPractices}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getPerformanceIcon(page.seo)}
                      <span className={`ml-2 font-semibold ${getPerformanceColor(page.seo)}`}>
                        {page.seo}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{page.lastAudit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Service Worker</h4>
          <div className="flex items-center">
            {serviceWorkerStatus ? (
              <FaCheckCircle className="text-green-600 mr-2" />
            ) : (
              <FaExclamationTriangle className="text-red-600 mr-2" />
            )}
            <span className={serviceWorkerStatus ? 'text-green-600' : 'text-red-600'}>
              {serviceWorkerStatus ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Cache Status</h4>
          <div className="text-sm text-gray-600">
            {cacheInfo ? (
              <div>
                <div>Total Caches: {cacheInfo.cacheNames.length}</div>
                <div>Total Items: {cacheInfo.totalSize}</div>
              </div>
            ) : (
              <span>Loading...</span>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Indexed Pages</h4>
          <div className="text-2xl font-bold text-primary-600">{metrics?.indexedPages}</div>
          <div className="text-sm text-gray-500">Google Search Console</div>
        </div>
      </div>
    </div>
  );
};

export default SEODashboard;
