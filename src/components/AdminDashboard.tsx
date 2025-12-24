import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalLearningPaths: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalUsers: 0,
    skillPathCompletions: 0,
    skillPathCompletionRate: 0,
    loading: true,
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  // Normalize amount (handles both kobo and naira formats)
  const normalizeAmount = (raw: number): number => {
    if (typeof raw !== 'number' || isNaN(raw) || raw === 0) return 0;
    
    // If amount is >= 100000, it's likely in kobo (250000 kobo = 2500 naira)
    if (raw >= 100000 && raw % 100 === 0) {
      return Math.round(raw / 100);
    }
    
    // If amount is between 100 and 10000, it's likely already in naira (keep as-is)
    // Common course price: 2500 naira
    if (raw >= 100 && raw < 10000) {
      return raw;
    }
    
    // If amount is very small (< 100), might be legacy divide (e.g., 25 → 2500)
    if (raw > 0 && raw < 100) {
      return raw * 100; // fix legacy 25 → 2500
    }
    
    // For amounts between 10000 and 100000, check if divisible by 100
    // If divisible by 100, likely kobo (e.g., 25000 = 250 naira)
    if (raw >= 10000 && raw < 100000 && raw % 100 === 0) {
      return raw / 100;
    }
    
    // Default: assume it's already in naira if it's a reasonable amount
    // or convert from kobo if it's very large
    if (raw >= 100000) {
      return Math.round(raw / 100); // Convert kobo to naira
    }
    
    return raw;
  };

  const fetchStats = async () => {
    try {
      // Fetch courses count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // Fetch learning paths count
      const { count: learningPathsCount } = await supabase
        .from('learning_paths')
        .select('*', { count: 'exact', head: true });

      // Fetch total purchases (successful purchases only)
      const { count: purchasesCount } = await supabase
        .from('product_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'success');

      // Fetch total revenue (sum of all successful purchases)
      // Normalize amounts to naira (some may be in kobo, some in naira)
      const { data: purchasesData } = await supabase
        .from('product_purchases')
        .select('amount_paid')
        .eq('payment_status', 'success');

      const totalRevenue = purchasesData?.reduce((sum, purchase) => {
        const normalizedAmount = normalizeAmount(purchase.amount_paid || 0);
        return sum + normalizedAmount;
      }, 0) || 0;

      // Fetch active users (users with at least one successful purchase)
      const { data: activeUsersData } = await supabase
        .from('product_purchases')
        .select('buyer_id')
        .eq('payment_status', 'success')
        .eq('access_granted', true);

      const uniqueActiveUsers = new Set(activeUsersData?.map(p => p.buyer_id) || []);

      // Fetch total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch Skill Path Discovery completions
      // Count unique users who completed Skill Path (by email or user_id)
      // Note: Using skill_path_results table (actual table name in database)
      let skillPathCompletions = 0;
      let skillPathCompletionRate = 0;
      
      try {
        // Try skill_path_results first (actual table name)
        // Try different possible column name combinations
        let skillPathData: any[] | null = null;
        let skillPathError: any = null;

        // First, try a simple count to see if table exists and is accessible
        const { count: totalCount, error: countError } = await supabase
          .from('skill_path_results')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.warn('Cannot access skill_path_results table:', countError);
          skillPathError = countError;
        } else {
          console.log('skill_path_results table accessible, total records:', totalCount);
          
          // Now try to get the actual data
          const { data: data1, error: error1 } = await supabase
            .from('skill_path_results')
            .select('email, user_id, completed_at, created_at');

          if (error1) {
            console.warn('Error with specific columns, trying all columns:', error1);
            // Try selecting all columns
            const { data: data2, error: error2 } = await supabase
              .from('skill_path_results')
              .select('*')
              .limit(1000);
            
            if (error2) {
              console.warn('Error fetching all columns from skill_path_results:', error2);
              skillPathError = error2;
            } else {
              skillPathData = data2;
              console.log('Fetched Skill Path data (all columns):', data2?.length, 'records');
            }
          } else {
            skillPathData = data1;
            console.log('Fetched Skill Path data:', data1?.length, 'records');
          }
        }

        // If skill_path_results failed, try fallback table
        if (skillPathError || (!skillPathData && skillPathError)) {
          console.warn('Trying fallback table skill_path_responses...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('skill_path_responses')
            .select('email, user_id, completed_at');
          
          if (fallbackError) {
            console.warn('Both tables failed:', fallbackError);
          } else if (fallbackData) {
            skillPathData = fallbackData;
            console.log('Using fallback table, found:', fallbackData.length, 'records');
          }
        }

        // Count unique completions
        if (skillPathData && skillPathData.length > 0) {
          const uniqueSkillPathCompletions = new Set<string>();
          skillPathData.forEach((response: any) => {
            // Handle different possible column name formats
            const userId = response.user_id || response.userId || response.userId || null;
            const email = response.email || response.user_email || response.userEmail || null;
            
            if (userId) {
              uniqueSkillPathCompletions.add(String(userId));
            } else if (email) {
              uniqueSkillPathCompletions.add(String(email).toLowerCase().trim());
            }
          });

          skillPathCompletions = uniqueSkillPathCompletions.size;
          skillPathCompletionRate = usersCount && usersCount > 0 
            ? Math.round((skillPathCompletions / usersCount) * 100) 
            : 0;
          
          console.log('Skill Path completions calculated:', {
            totalRecords: skillPathData.length,
            uniqueCompletions: skillPathCompletions,
            completionRate: skillPathCompletionRate
          });
        } else {
          console.log('No Skill Path data found');
        }
      } catch (error) {
        console.error('Error fetching Skill Path completions:', error);
        // Continue with 0 values if table doesn't exist yet
      }

      setStats({
        totalCourses: coursesCount || 0,
        totalLearningPaths: learningPathsCount || 0,
        totalPurchases: purchasesCount || 0,
        totalRevenue: totalRevenue,
        activeUsers: uniqueActiveUsers.size,
        totalUsers: usersCount || 0,
        skillPathCompletions: skillPathCompletions,
        skillPathCompletionRate: skillPathCompletionRate,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
            Loading...
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || user?.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCourses}</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Learning Paths</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLearningPaths}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPurchases}</p>
                <p className="text-xs text-gray-500 mt-1">Successful payments</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">₦{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">From all purchases</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeUsers}</p>
                <p className="text-xs text-gray-500 mt-1">Users with purchases</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">All registered users</p>
              </div>
              <div className="bg-gray-100 rounded-full p-3">
                <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Skill Path Discovery</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.skillPathCompletions}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.skillPathCompletionRate > 0 
                    ? `${stats.skillPathCompletionRate}% of users completed` 
                    : 'Users completed diagnostic'}
                </p>
              </div>
              <div className="bg-teal-100 rounded-full p-3">
                <svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/courses')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left"
            >
              <div className="bg-indigo-100 rounded-lg p-2">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Courses</p>
                <p className="text-sm text-gray-600">View and edit courses</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/courses/add')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
            >
              <div className="bg-green-100 rounded-lg p-2">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Add New Course</p>
                <p className="text-sm text-gray-600">Create a new course</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/purchases')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Purchases</p>
                <p className="text-sm text-gray-600">View all purchases</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/manual-add-to-library')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
            >
              <div className="bg-green-100 rounded-lg p-2">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manual Add to Library</p>
                <p className="text-sm text-gray-600">Grant access by email</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/learning-paths')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-left"
            >
              <div className="bg-purple-100 rounded-lg p-2">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Learning Paths</p>
                <p className="text-sm text-gray-600">Manage learning paths</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/subscriptions')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left"
            >
              <div className="bg-indigo-100 rounded-lg p-2">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Subscriptions</p>
                <p className="text-sm text-gray-600">Track subscriptions, revenue, and growth trends</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/resellers')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
            >
              <div className="bg-green-100 rounded-lg p-2">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Reseller Analysis</p>
                <p className="text-sm text-gray-600">View reseller performance and analytics</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/blog')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Blog Management</p>
                <p className="text-sm text-gray-600">Add, edit, and delete blog posts</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

