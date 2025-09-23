import React, { useState, useEffect } from 'react';
import { FaChartLine, FaSearch, FaEye, FaMousePointer, FaClock, FaMobile, FaDesktop } from 'react-icons/fa';

interface SEOAnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topKeywords: Array<{ keyword: string; impressions: number; clicks: number; ctr: number }>;
  topPages: Array<{ page: string; views: number; avgTime: number }>;
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  trafficSources: { organic: number; direct: number; social: number; referral: number };
}

/**
 * SEOAnalytics Component - Real-time SEO and Analytics Dashboard
 * 
 * Features:
 * - Google Analytics integration
 * - Search Console data
 * - Page performance metrics
 * - Keyword performance
 * - Traffic source analysis
 * - Device breakdown
 * - Real-time updates
 */
const SEOAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<SEOAnalyticsData>({
    pageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    topKeywords: [],
    topPages: [],
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    trafficSources: { organic: 0, direct: 0, social: 0, referral: 0 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  // Simulate fetching analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API calls
      setAnalyticsData({
        pageViews: 15420,
        uniqueVisitors: 8920,
        bounceRate: 32.5,
        avgSessionDuration: 245,
        topKeywords: [
          { keyword: 'digital marketing courses', impressions: 1250, clicks: 89, ctr: 7.1 },
          { keyword: 'online education Nigeria', impressions: 890, clicks: 67, ctr: 7.5 },
          { keyword: 'social media marketing', impressions: 756, clicks: 54, ctr: 7.1 },
          { keyword: 'business growth strategies', impressions: 634, clicks: 43, ctr: 6.8 },
          { keyword: 'e-commerce training', impressions: 567, clicks: 38, ctr: 6.7 }
        ],
        topPages: [
          { page: '/', views: 3420, avgTime: 180 },
          { page: '/courses', views: 2890, avgTime: 210 },
          { page: '/blog', views: 2150, avgTime: 165 },
          { page: '/about', views: 1890, avgTime: 120 },
          { page: '/contact', views: 1560, avgTime: 90 }
        ],
        deviceBreakdown: { mobile: 65, desktop: 30, tablet: 5 },
        trafficSources: { organic: 45, direct: 25, social: 20, referral: 10 }
      });
      
      setIsLoading(false);
    };

    fetchAnalyticsData();
  }, [timeRange]);

  // Format time in minutes and seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Format percentage
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // Format number with commas
  const formatNumber = (num: number) => num.toLocaleString();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaChartLine className="mr-3 text-primary-600" />
          SEO Analytics Dashboard
        </h2>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Time Range:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Page Views</p>
              <p className="text-3xl font-bold text-blue-900">{formatNumber(analyticsData.pageViews)}</p>
            </div>
            <FaEye className="text-4xl text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Unique Visitors</p>
              <p className="text-3xl font-bold text-green-900">{formatNumber(analyticsData.uniqueVisitors)}</p>
            </div>
            <FaSearch className="text-4xl text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Bounce Rate</p>
              <p className="text-3xl font-bold text-purple-900">{formatPercentage(analyticsData.bounceRate)}</p>
            </div>
            <FaMousePointer className="text-4xl text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Avg. Session</p>
              <p className="text-3xl font-bold text-orange-900">{formatTime(analyticsData.avgSessionDuration)}</p>
            </div>
            <FaClock className="text-4xl text-orange-400" />
          </div>
        </div>
      </div>

      {/* Traffic Sources & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Traffic Sources */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Organic Search</span>
              <span className="font-semibold text-green-600">{formatPercentage(analyticsData.trafficSources.organic)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Direct Traffic</span>
              <span className="font-semibold text-blue-600">{formatPercentage(analyticsData.trafficSources.direct)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Social Media</span>
              <span className="font-semibold text-purple-600">{formatPercentage(analyticsData.trafficSources.social)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Referral</span>
              <span className="font-semibold text-orange-600">{formatPercentage(analyticsData.trafficSources.referral)}</span>
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaMobile className="text-gray-400 mr-2" />
                <span className="text-gray-600">Mobile</span>
              </div>
              <span className="font-semibold text-gray-900">{formatPercentage(analyticsData.deviceBreakdown.mobile)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaDesktop className="text-gray-400 mr-2" />
                <span className="text-gray-600">Desktop</span>
              </div>
              <span className="font-semibold text-gray-900">{formatPercentage(analyticsData.deviceBreakdown.desktop)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaMobile className="text-gray-400 mr-2" />
                <span className="text-gray-600">Tablet</span>
              </div>
              <span className="font-semibold text-gray-900">{formatPercentage(analyticsData.deviceBreakdown.tablet)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Keywords */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Keywords</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keyword
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analyticsData.topKeywords.map((keyword, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{keyword.keyword}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(keyword.impressions)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(keyword.clicks)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPercentage(keyword.ctr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Pages */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Pages</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analyticsData.topPages.map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{page.page}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(page.views)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(page.avgTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEO Recommendations */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">SEO Recommendations</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Optimize bounce rate by improving page content and user experience</li>
          <li>• Increase mobile optimization to improve mobile traffic performance</li>
          <li>• Focus on long-tail keywords with higher conversion potential</li>
          <li>• Improve page load speed to reduce bounce rate</li>
          <li>• Create more engaging content for longer session duration</li>
        </ul>
      </div>
    </div>
  );
};

export default SEOAnalytics;
