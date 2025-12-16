import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ResellerStats {
  reseller_id: string;
  reseller_name: string;
  reseller_email: string;
  affiliate_code: string;
  total_referrals: number;
  total_earned: number; // in kobo
  pending_balance: number; // in kobo
  available_balance: number; // in kobo
  total_withdrawn: number; // in kobo
  successful_conversions: number;
  conversion_rate: number;
  first_referral_date: string | null;
  last_referral_date: string | null;
  created_at: string | null;
}

interface DashboardStats {
  totalActiveResellers: number;
  totalReferrals: number;
  totalCommissionsPaid: number; // in kobo
  totalPendingCommissions: number; // in kobo
  totalAvailableBalance: number; // in kobo
  totalWithdrawn: number; // in kobo
  activeResellers: number;
  topResellers: ResellerStats[];
  loading: boolean;
  debugInfo?: {
    totalAffiliateCodes: number;
    totalReferralRecords: number;
    totalWallets: number;
  };
}

const ResellerAnalysisDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalActiveResellers: 0,
    totalReferrals: 0,
    totalCommissionsPaid: 0,
    totalPendingCommissions: 0,
    totalAvailableBalance: 0,
    totalWithdrawn: 0,
    activeResellers: 0,
    topResellers: [],
    loading: true,
    debugInfo: undefined,
  });

  // Convert kobo to NGN for display
  const koboToNaira = (kobo: number): number => {
    if (typeof kobo !== 'number' || isNaN(kobo) || kobo === 0) return 0;
    return kobo / 100;
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchResellerStats();
    }
  }, [user]);

  const fetchResellerStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      console.log('=== RESELLER ANALYTICS - FETCHING DATA ===');

      // Step 1: Get all active resellers (users with active affiliate codes)
      const { data: affiliateCodes, error: codesError } = await supabase
        .from('affiliate_codes')
        .select('user_id, code, is_active, created_at')
        .eq('is_active', true);

      if (codesError) {
        console.error('Error fetching affiliate codes:', codesError);
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log(`Found ${affiliateCodes?.length || 0} active affiliate codes`);

      if (!affiliateCodes || affiliateCodes.length === 0) {
        setStats({
          totalActiveResellers: 0,
          totalReferrals: 0,
          totalCommissionsPaid: 0,
          totalPendingCommissions: 0,
          totalAvailableBalance: 0,
          totalWithdrawn: 0,
          activeResellers: 0,
          topResellers: [],
          loading: false,
          debugInfo: {
            totalAffiliateCodes: 0,
            totalReferralRecords: 0,
            totalWallets: 0,
          },
        });
        return;
      }

      const resellerIds = affiliateCodes.map(ac => ac.user_id);

      // Step 2: Get reseller profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, affiliate_code')
        .in('id', resellerIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Step 3: Get all referral records for these resellers
      const { data: referrals, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .in('affiliate_id', resellerIds);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      }

      console.log(`Found ${referrals?.length || 0} referral records`);

      // Step 4: Get wallet balances for resellers
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .in('user_id', resellerIds);

      if (walletsError) {
        console.error('Error fetching wallets:', walletsError);
      }

      console.log(`Found ${wallets?.length || 0} wallet records`);

      // Step 5: Calculate per-reseller stats
      const resellerStats: ResellerStats[] = [];
      let totalCommissionsPaid = 0;
      let totalPendingCommissions = 0;
      let totalAvailableBalance = 0;
      let totalWithdrawn = 0;

      for (const affiliateCode of affiliateCodes) {
        const resellerId = affiliateCode.user_id;
        const profile = profiles?.find(p => p.id === resellerId);
        const wallet = wallets?.find(w => w.user_id === resellerId);

        // Get all referrals for this reseller
        const resellerReferrals = (referrals || []).filter(r => r.affiliate_id === resellerId);
        
        // Calculate stats
        const totalReferrals = resellerReferrals.length;
        const successfulConversions = resellerReferrals.filter(r => r.purchase_id !== null).length;
        const conversionRate = totalReferrals > 0 ? (successfulConversions / totalReferrals) * 100 : 0;
        
        // Calculate earnings (all amounts in kobo)
        const totalEarned = resellerReferrals.reduce((sum, r) => sum + (r.commission_amount || 0), 0);
        const pendingEarned = resellerReferrals
          .filter(r => r.commission_status === 'pending')
          .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

        // Get wallet balances (default to 0 if no wallet)
        const pendingBalance = wallet?.pending_balance || 0;
        const availableBalance = wallet?.available_balance || 0;
        const totalWithdrawnAmount = wallet?.total_withdrawn || 0;
        const walletTotalEarned = wallet?.total_earned || 0;

        // Use wallet total_earned if available, otherwise calculate from referrals
        const finalTotalEarned = walletTotalEarned > 0 ? walletTotalEarned : totalEarned;

        // Get referral dates
        const referralDates = resellerReferrals
          .map(r => r.converted_at)
          .filter(d => d)
          .sort();

        resellerStats.push({
          reseller_id: resellerId,
          reseller_name: profile?.name || 'Unknown Reseller',
          reseller_email: profile?.email || 'No Email',
          affiliate_code: affiliateCode.code || profile?.affiliate_code || 'N/A',
          total_referrals: totalReferrals,
          total_earned: finalTotalEarned,
          pending_balance: pendingBalance,
          available_balance: availableBalance,
          total_withdrawn: totalWithdrawnAmount,
          successful_conversions: successfulConversions,
          conversion_rate: conversionRate,
          first_referral_date: referralDates.length > 0 ? referralDates[0] : null,
          last_referral_date: referralDates.length > 0 ? referralDates[referralDates.length - 1] : null,
          created_at: affiliateCode.created_at,
        });

        // Aggregate totals
        totalCommissionsPaid += finalTotalEarned;
        totalPendingCommissions += pendingBalance;
        totalAvailableBalance += availableBalance;
        totalWithdrawn += totalWithdrawnAmount;
      }

      // Sort by total earned (descending)
      resellerStats.sort((a, b) => b.total_earned - a.total_earned);
      const topResellers = resellerStats.slice(0, 10);
      const activeResellers = resellerStats.filter(r => r.total_referrals > 0).length;

      console.log(`=== ANALYTICS SUMMARY ===`);
      console.log(`Active Resellers: ${affiliateCodes.length}`);
      console.log(`Total Referrals: ${referrals?.length || 0}`);
      console.log(`Total Commissions: ₦${koboToNaira(totalCommissionsPaid).toLocaleString()}`);
      console.log(`Active Resellers with Sales: ${activeResellers}`);

      setStats({
        totalActiveResellers: affiliateCodes.length,
        totalReferrals: referrals?.length || 0,
        totalCommissionsPaid: totalCommissionsPaid,
        totalPendingCommissions: totalPendingCommissions,
        totalAvailableBalance: totalAvailableBalance,
        totalWithdrawn: totalWithdrawn,
        activeResellers: activeResellers,
        topResellers: topResellers,
        loading: false,
        debugInfo: {
          totalAffiliateCodes: affiliateCodes.length,
          totalReferralRecords: referrals?.length || 0,
          totalWallets: wallets?.length || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching reseller stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading reseller analytics...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reseller Analysis Dashboard</h1>
              <p className="text-gray-600">Comprehensive analytics for reseller performance</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchResellerStats}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info Panel */}
        {stats.debugInfo && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">Database Diagnostic Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-blue-700">Active Affiliate Codes:</span>
                    <span className="ml-2 text-blue-900">{stats.debugInfo.totalAffiliateCodes}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-700">Total Referral Records:</span>
                    <span className="ml-2 text-blue-900">{stats.debugInfo.totalReferralRecords}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-700">Wallet Records:</span>
                    <span className="ml-2 text-blue-900">{stats.debugInfo.totalWallets}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Active Resellers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalActiveResellers}</p>
                <p className="text-xs text-gray-500 mt-1">With active affiliate codes</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalReferrals}</p>
                <p className="text-xs text-gray-500 mt-1">All referral records</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commissions Paid</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">₦{koboToNaira(stats.totalCommissionsPaid).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Commissions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">₦{koboToNaira(stats.totalPendingCommissions).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting 72h release</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available for Withdrawal</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">₦{koboToNaira(stats.totalAvailableBalance).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Withdrawn</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">₦{koboToNaira(stats.totalWithdrawn).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Lifetime withdrawals</p>
              </div>
              <div className="bg-gray-100 rounded-full p-3">
                <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Top 10 Resellers Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top 10 Resellers by Earnings</h2>
          
          {stats.topResellers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-500">
                No resellers found. Check if affiliate_codes table has active codes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reseller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Referrals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Withdrawn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topResellers.map((reseller, index) => (
                    <tr key={reseller.reseller_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <span className="text-yellow-500 mr-2">🥇</span>}
                          {index === 1 && <span className="text-gray-400 mr-2">🥈</span>}
                          {index === 2 && <span className="text-orange-600 mr-2">🥉</span>}
                          <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{reseller.reseller_name}</div>
                        <div className="text-sm text-gray-500">{reseller.reseller_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{reseller.affiliate_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reseller.total_referrals}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reseller.successful_conversions}</div>
                        <div className="text-xs text-gray-500">{reseller.conversion_rate.toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">₦{koboToNaira(reseller.total_earned).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-yellow-600">₦{koboToNaira(reseller.pending_balance).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-purple-600">₦{koboToNaira(reseller.available_balance).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">₦{koboToNaira(reseller.total_withdrawn).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {reseller.last_referral_date 
                            ? new Date(reseller.last_referral_date).toLocaleDateString()
                            : 'No activity'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Performance Insights */}
        {stats.topResellers.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-indigo-500 pl-4">
                <p className="text-sm font-medium text-gray-600">Top Performer</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {stats.topResellers[0]?.reseller_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ₦{koboToNaira(stats.topResellers[0]?.total_earned || 0).toLocaleString()} earned
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm font-medium text-gray-600">Most Referrals</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {stats.topResellers.reduce((max, r) => r.total_referrals > max.total_referrals ? r : max, stats.topResellers[0])?.reseller_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.topResellers.reduce((max, r) => r.total_referrals > max.total_referrals ? r : max, stats.topResellers[0])?.total_referrals || 0} referrals
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm font-medium text-gray-600">Active Rate</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {stats.totalActiveResellers > 0 
                    ? Math.round((stats.activeResellers / stats.totalActiveResellers) * 100) 
                    : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.activeResellers} of {stats.totalActiveResellers} resellers active
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResellerAnalysisDashboard;
