import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionData, setSubscriptionData] = useState({
      totalSubscriptions: 0,
      activeSubscriptions: 0,
    trialCount: 0,
    cancelledCount: 0,
    expiredCount: 0,
    mrr: 0,
      totalRevenue: 0,
      monthlyGrowth: 0,
      revenueGrowth: 0,
      churnRate: 0,
    conversionRate: 0,
    monthlyData: [],
    breakdown: []
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSubscriptionData();
    }
  }, [user]);

  /**
   * Helper: Normalize amount (handle both kobo and naira formats)
   */
  const normalizeAmount = (raw) => {
    if (typeof raw !== 'number' || isNaN(raw)) return 0;
    if (raw >= 100000 && raw % 100 === 0) return Math.round(raw / 100); // Kobo to naira
    if (raw >= 100 && raw < 10000) return raw; // Already in naira
    if (raw > 0 && raw < 100) return raw * 100; // Legacy fix
    return raw;
  };

  /**
   * Helper: Check if subscription is ACTIVE
   * Active ONLY if: status = "active" AND is_active = true AND start_date <= now AND end_date >= now
   * If is_active field doesn't exist, assume true if status is active and dates are valid
   */
  const isActiveSubscription = (sub, now) => {
    const statusOk = sub.status === 'active';
    // Handle missing is_active field - if it doesn't exist, assume true for active status
    const isActiveOk = sub.is_active === undefined ? true : sub.is_active === true;
    const startDate = sub.start_date ? new Date(sub.start_date) : new Date(sub.created_at);
    const endDate = sub.end_date ? new Date(sub.end_date) : null;
    const startOk = startDate <= now;
    const endOk = !endDate || endDate >= now;
    
    return statusOk && isActiveOk && startOk && endOk;
  };

  /**
   * Helper: Get active subscriptions
   */
  const getActiveSubscriptions = (subscriptions, now) => {
    return subscriptions.filter(sub => isActiveSubscription(sub, now));
  };

  /**
   * Helper: Calculate revenue from subscriptions
   */
  const calculateRevenue = (subscriptions) => {
    return subscriptions.reduce((sum, sub) => {
      const amount = sub.amount || sub.monthly_price || 0; // Use amount or monthly_price
      return sum + normalizeAmount(amount);
      }, 0);
  };

  /**
   * Helper: Calculate growth rates
   */
  const calculateGrowthRates = (currentMonthData, previousMonthData) => {
    const monthlyGrowth = previousMonthData.newSubscriptions > 0
      ? ((currentMonthData.newSubscriptions - previousMonthData.newSubscriptions) / previousMonthData.newSubscriptions) * 100
      : currentMonthData.newSubscriptions > 0 ? 100 : 0;

    const revenueGrowth = previousMonthData.revenue > 0
      ? ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100
      : currentMonthData.revenue > 0 ? 100 : 0;

    return { monthlyGrowth, revenueGrowth };
  };

  /**
   * Helper: Generate 12-month report
   */
  const generateMonthlyReport = (subscriptions, now) => {
      const monthlyData = [];
    
    for (let i = 11; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

      // Count new subscriptions created in this month
      const newSubscriptions = subscriptions.filter(sub => {
        const createdDate = new Date(sub.created_at);
        return createdDate >= monthStart && createdDate <= monthEnd;
        });

      // Count active subscriptions during this month
      const activeSubscriptions = subscriptions.filter(sub => {
        if (!isActiveSubscription(sub, now)) return false;
        const startDate = sub.start_date ? new Date(sub.start_date) : new Date(sub.created_at);
        const endDate = sub.end_date ? new Date(sub.end_date) : null;
        return startDate <= monthEnd && (!endDate || endDate >= monthStart);
        });

      // Calculate revenue for subscriptions active during this month
      const monthRevenue = calculateRevenue(activeSubscriptions);

        monthlyData.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthDate: new Date(monthDate),
        newSubscriptions: newSubscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        revenue: Math.round(monthRevenue * 100) / 100
      });
    }

    return monthlyData.reverse(); // Newest first
  };

  /**
   * Fetch subscription data from Supabase
   */
  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError('');

      // Calculate date 12 months ago
      const now = new Date();
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const startDateISO = twelveMonthsAgo.toISOString();

      // Fetch subscriptions from last 12 months only
      // Fetch fields: user_id, status, is_active, start_date, end_date, amount (as monthly_price), created_at
      const { data: subscriptions, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('user_id, status, is_active, start_date, end_date, amount, created_at')
        .gte('created_at', startDateISO)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const allSubscriptions = subscriptions || [];
      const activeSubs = getActiveSubscriptions(allSubscriptions, now);

      // Categorize subscriptions
      const expiredSubs = allSubscriptions.filter(sub => {
        if (sub.status === 'cancelled' || sub.status === 'cancelled') return false;
        const endDate = sub.end_date ? new Date(sub.end_date) : null;
        return endDate && endDate < now;
      });

      const cancelledSubs = allSubscriptions.filter(sub => 
        sub.status === 'cancelled' || sub.status === 'canceled'
      );

      const trialSubs = allSubscriptions.filter(sub => 
        sub.status === 'trial' || sub.status === 'trialing'
      );

      // Calculate metrics
      const totalSubscriptions = allSubscriptions.length;
      const activeSubscriptions = activeSubs.length;
      const trialCount = trialSubs.length;
      const cancelledCount = cancelledSubs.length;
      const expiredCount = expiredSubs.length;

      // Calculate MRR (sum of all active subscription monthly fees)
      const mrr = calculateRevenue(activeSubs);

      // Calculate Total Revenue (sum of all subscription revenue in last 12 months)
      const totalRevenue = calculateRevenue(allSubscriptions);

      // Generate monthly report
      const monthlyData = generateMonthlyReport(allSubscriptions, now);

      // Calculate growth rates (current month vs previous month)
      const currentMonth = monthlyData[0] || { newSubscriptions: 0, revenue: 0 };
      const previousMonth = monthlyData[1] || { newSubscriptions: 0, revenue: 0 };
      const { monthlyGrowth, revenueGrowth } = calculateGrowthRates(currentMonth, previousMonth);

      // Calculate churn rate (cancelled + expired / total)
      const churnRate = totalSubscriptions > 0
        ? ((cancelledCount + expiredCount) / totalSubscriptions) * 100
        : 0;

      // Calculate conversion rate (active / trial)
      const conversionRate = trialCount > 0
        ? (activeSubscriptions / trialCount) * 100
        : 0;

      // Prepare breakdown for chart
      const breakdown = [
        { name: 'active', value: activeSubscriptions, color: '#10b981' },
        { name: 'expired', value: expiredCount, color: '#6b7280' },
        { name: 'cancelled', value: cancelledCount, color: '#ef4444' },
        { name: 'trial', value: trialCount, color: '#3b82f6' }
      ].filter(item => item.value > 0);

      setSubscriptionData({
          totalSubscriptions,
          activeSubscriptions,
        trialCount,
        cancelledCount,
        expiredCount,
        mrr,
        totalRevenue,
        monthlyGrowth,
        revenueGrowth,
        churnRate,
        conversionRate,
        monthlyData,
        breakdown
      });

    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Failed to load subscription data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
    <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
              <p className="mt-2 text-gray-600">Track subscriptions, revenue, and growth trends</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-md">Last 12 months</span>
              <button
                onClick={fetchSubscriptionData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* KPI Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Subscriptions</dt>
                    <dd className="text-lg font-medium text-gray-900">{subscriptionData.totalSubscriptions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">{subscriptionData.activeSubscriptions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Trial</dt>
                    <dd className="text-lg font-medium text-gray-900">{subscriptionData.trialCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Cancelled</dt>
                    <dd className="text-lg font-medium text-gray-900">{subscriptionData.cancelledCount}</dd>
                  </dl>
                </div>
                </div>
              </div>
            </div>
          </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">₦{subscriptionData.totalRevenue.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-pink-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">MRR</dt>
                    <dd className="text-lg font-medium text-gray-900">₦{subscriptionData.mrr.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Trend Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Growth Rate</h3>
            <p className={`text-2xl font-semibold ${subscriptionData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {subscriptionData.monthlyGrowth >= 0 ? '+' : ''}{subscriptionData.monthlyGrowth.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Revenue Growth</h3>
            <p className={`text-2xl font-semibold ${subscriptionData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {subscriptionData.revenueGrowth >= 0 ? '+' : ''}{subscriptionData.revenueGrowth.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Churn Rate</h3>
            <p className={`text-2xl font-semibold ${subscriptionData.churnRate < 5 ? 'text-green-600' : subscriptionData.churnRate < 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {subscriptionData.churnRate.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</h3>
            <p className={`text-2xl font-semibold ${subscriptionData.conversionRate > 20 ? 'text-green-600' : subscriptionData.conversionRate > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {subscriptionData.conversionRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subscription Breakdown (Doughnut Chart) */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Breakdown</h3>
            {subscriptionData.breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionData.breakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subscriptionData.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Revenue over last 12 months (Line Chart) */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue (Last 12 Months)</h3>
            {subscriptionData.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={subscriptionData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trends Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Monthly Trends</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Subscriptions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Subscriptions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptionData.monthlyData.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.newSubscriptions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.activeSubscriptions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₦{month.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;