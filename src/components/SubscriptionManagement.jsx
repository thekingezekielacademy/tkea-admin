import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('12'); // months
  const [subscriptionData, setSubscriptionData] = useState({
    overview: {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      cancelledSubscriptions: 0,
      trialSubscriptions: 0,
      totalRevenue: 0,
      monthlyRecurringRevenue: 0
    },
    trends: {
      monthlyGrowth: 0,
      revenueGrowth: 0,
      churnRate: 0,
      conversionRate: 0
    },
    monthlyData: [],
    subscriptionBreakdown: {}
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSubscriptionData();
    }
  }, [user, timeRange]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError('');

      const months = parseInt(timeRange);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      const startDateISO = startDate.toISOString();

      // Fetch ALL subscriptions (for overview stats) and filtered by date (for trends)
      const [allSubscriptionsResult, filteredSubscriptionsResult, allPaymentsResult] = await Promise.all([
        supabase.from('user_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('user_subscriptions').select('*').gte('created_at', startDateISO).order('created_at', { ascending: false }),
        supabase.from('subscription_payments').select('*').eq('status', 'success').gte('created_at', startDateISO).order('created_at', { ascending: false })
      ]);

      // Use ALL subscriptions for overview stats
      const allSubscriptions = allSubscriptionsResult.data || [];
      // Use filtered subscriptions for monthly trends
      const filteredSubscriptions = filteredSubscriptionsResult.data || [];
      const allPayments = allPaymentsResult.data || [];
      
      console.log('📊 Subscription Data:', {
        totalSubscriptions: allSubscriptions.length,
        filteredSubscriptions: filteredSubscriptions.length,
        allPayments: allPayments.length,
        subscriptions: allSubscriptions.map(s => ({ id: s.id, status: s.status, created_at: s.created_at })),
        payments: allPayments.map(p => ({ id: p.id, amount: p.amount, created_at: p.created_at }))
      });

      // Calculate overview stats (using ALL subscriptions, not filtered)
      const totalSubscriptions = allSubscriptions.length;
      const activeSubscriptions = allSubscriptions.filter(sub => 
        sub.status === 'active' || sub.status === 'Active'
      ).length;
      const cancelledSubscriptions = allSubscriptions.filter(sub => 
        sub.status === 'cancelled' || sub.status === 'canceled' || sub.status === 'Cancelled'
      ).length;
      const trialSubscriptions = allSubscriptions.filter(sub => 
        sub.status === 'trial' || sub.status === 'trialing' || sub.status === 'Trialing'
      ).length;
      const expiredSubscriptions = allSubscriptions.filter(sub => 
        sub.status === 'expired' || sub.status === 'Expired'
      ).length;

      // Calculate revenue
      const totalRevenue = allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / 100;
      const currentMonth = new Date();
      const monthlyPayments = allPayments.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate.getMonth() === currentMonth.getMonth() && 
               paymentDate.getFullYear() === currentMonth.getFullYear();
      });
      const monthlyRecurringRevenue = monthlyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / 100;

      // Calculate trends (use filtered subscriptions for monthly comparison)
      const currentMonthSubs = filteredSubscriptions.filter(sub => {
        const subDate = new Date(sub.created_at);
        return subDate.getMonth() === currentMonth.getMonth() && 
               subDate.getFullYear() === currentMonth.getFullYear();
      }).length;

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthSubs = filteredSubscriptions.filter(sub => {
        const subDate = new Date(sub.created_at);
        return subDate.getMonth() === lastMonth.getMonth() && 
               subDate.getFullYear() === lastMonth.getFullYear();
      }).length;

      const monthlyGrowth = lastMonthSubs > 0 ? ((currentMonthSubs - lastMonthSubs) / lastMonthSubs) * 100 : 0;
      const churnRate = totalSubscriptions > 0 ? (cancelledSubscriptions / totalSubscriptions) * 100 : 0;
      const conversionRate = trialSubscriptions > 0 ? (activeSubscriptions / trialSubscriptions) * 100 : 0;

      // Generate monthly data for trends (use filtered subscriptions)
      const monthlyData = [];
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthSubs = filteredSubscriptions.filter(sub => {
          if (!sub.created_at) return false;
          const subDate = new Date(sub.created_at);
          return subDate >= monthStart && subDate <= monthEnd;
        });

        const monthPayments = allPayments.filter(payment => {
          if (!payment.created_at) return false;
          const paymentDate = new Date(payment.created_at);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        });

        const monthRevenue = monthPayments.reduce((sum, payment) => {
          const amount = payment.amount || 0;
          return sum + (amount > 1000 ? amount : amount / 100);
        }, 0);

        monthlyData.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          subscriptions: monthSubs.length,
          revenue: Math.round(monthRevenue * 100) / 100, // Round to 2 decimal places
          activeSubs: monthSubs.filter(sub => 
            sub.status === 'active' || sub.status === 'Active'
          ).length
        });
      }

      // Subscription breakdown by status (normalize status values)
      const subscriptionBreakdown = allSubscriptions.reduce((acc, sub) => {
        let status = (sub.status || 'unknown').toLowerCase();
        // Normalize status values
        if (status === 'canceled') status = 'cancelled';
        if (status === 'trialing') status = 'trial';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Calculate revenue growth properly (compare current month MRR to previous month MRR)
      const previousMonthPayments = allPayments.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate.getMonth() === lastMonth.getMonth() && 
               paymentDate.getFullYear() === lastMonth.getFullYear();
      });
      const previousMonthMRR = previousMonthPayments.reduce((sum, payment) => {
        const amount = payment.amount || 0;
        return sum + (amount > 1000 ? amount : amount / 100);
      }, 0);
      const revenueGrowth = previousMonthMRR > 0 
        ? ((monthlyRecurringRevenue - previousMonthMRR) / previousMonthMRR) * 100 
        : 0;

      setSubscriptionData({
        overview: {
          totalSubscriptions,
          activeSubscriptions,
          cancelledSubscriptions,
          trialSubscriptions,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100
        },
        trends: {
          monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          churnRate: Math.round(churnRate * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10
        },
        monthlyData,
        subscriptionBreakdown
      });

    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Failed to load subscription data. Some metrics may not be available.');
    } finally {
      setLoading(false);
    }
  };

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
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="3">Last 3 months</option>
                <option value="6">Last 6 months</option>
                <option value="12">Last 12 months</option>
                <option value="24">Last 24 months</option>
              </select>
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {/* Total Subscriptions */}
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
                    <dd className="text-lg font-medium text-gray-900">{subscriptionData.overview.totalSubscriptions.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Subscriptions */}
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
                    <dd className="text-lg font-medium text-gray-900">{subscriptionData.overview.activeSubscriptions.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Trial Subscriptions */}
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
                    <dd className="text-lg font-medium text-gray-900">{subscriptionData.overview.trialSubscriptions.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Cancelled Subscriptions */}
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
                    <dd className="text-lg font-medium text-gray-900">{subscriptionData.overview.cancelledSubscriptions.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
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
                    <dd className="text-lg font-medium text-gray-900">₦{subscriptionData.overview.totalRevenue.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Recurring Revenue */}
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
                    <dd className="text-lg font-medium text-gray-900">₦{subscriptionData.overview.monthlyRecurringRevenue.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trends and Growth Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Trends */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Growth Trends
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Growth Rate</span>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${subscriptionData.trends.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {subscriptionData.trends.monthlyGrowth >= 0 ? '+' : ''}{subscriptionData.trends.monthlyGrowth}%
                    </span>
                    <svg className={`w-4 h-4 ml-1 ${subscriptionData.trends.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={subscriptionData.trends.monthlyGrowth >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue Growth</span>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${subscriptionData.trends.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {subscriptionData.trends.revenueGrowth >= 0 ? '+' : ''}{subscriptionData.trends.revenueGrowth}%
                    </span>
                    <svg className={`w-4 h-4 ml-1 ${subscriptionData.trends.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={subscriptionData.trends.revenueGrowth >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Churn Rate</span>
                  <span className={`text-sm font-medium ${subscriptionData.trends.churnRate < 5 ? 'text-green-600' : subscriptionData.trends.churnRate < 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {subscriptionData.trends.churnRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className={`text-sm font-medium ${subscriptionData.trends.conversionRate > 20 ? 'text-green-600' : subscriptionData.trends.conversionRate > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {subscriptionData.trends.conversionRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Breakdown */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Subscription Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(subscriptionData.subscriptionBreakdown).map(([status, count]) => {
                  const percentage = subscriptionData.overview.totalSubscriptions > 0 
                    ? (count / subscriptionData.overview.totalSubscriptions) * 100 
                    : 0;
                  
                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'active': return 'bg-green-500';
                      case 'trial': return 'bg-blue-500';
                      case 'cancelled': return 'bg-red-500';
                      case 'expired': return 'bg-gray-500';
                      default: return 'bg-gray-400';
                    }
                  };

                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{status}</span>
                        <span className="font-medium text-gray-900">{count} ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(status)}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Monthly Trends ({timeRange} months)
            </h3>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.subscriptions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.activeSubs}</td>
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







