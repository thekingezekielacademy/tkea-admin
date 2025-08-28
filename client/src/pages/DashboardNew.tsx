import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { supabase } from '../lib/supabase';
import secureStorage from '../utils/secureStorage';
import TrialBanner from '../components/TrialBanner';
import { TrialStatus } from '../utils/trialManager';
import DashboardSidebar from '../components/DashboardSidebar';
import { 
  FaTrophy, 
  FaFire, 
  FaPlay, 
  FaStar, 
  FaCrown,
  FaChartLine,
  FaArrowRight,
  FaUser
} from 'react-icons/fa';
import { secureLog, secureError } from '../utils/secureLogger';

interface Course {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  category: string;
  instructor: string;
  rating: number;
  enrolledStudents: number;
  image: string;
}



interface UserStats {
  xp: number;
  streak_count: number;
  last_activity_date: string;
  level: number;
  total_users: number;
  class_ranking: string;
}

const DashboardNew: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { isExpanded, isMobile } = useSidebar();

  // Calculate dynamic margin based on sidebar state
  const getSidebarMargin = () => {
    if (isMobile) return 'ml-16'; // Mobile always uses collapsed width
    return isExpanded ? 'ml-64' : 'ml-16'; // Desktop: expanded=256px, collapsed=64px
  };
  
  // User stats state
  const [userStats, setUserStats] = useState<UserStats>({
    xp: 0,
    streak_count: 0,
    last_activity_date: new Date().toISOString().split('T')[0],
    level: 1,
    total_users: 1247,
    class_ranking: 'Top 35%'
  });
  
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isActive: false,
    startDate: '',
    endDate: '',
    daysRemaining: 0,
    totalDays: 0,
    isExpired: true
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Check subscription status
  const [subActive, setSubActive] = useState<boolean>(() => {
    try { return secureStorage.isSubscriptionActive(); } catch { return false; }
  });

  // Calculate level based on XP (every 1000 XP = 1 level)
  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 1000) + 1;
  };

  // Fetch subscription status from database
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      secureLog('🔍 Checking subscription status for user:', user.id);
      
      // Check if user has an active subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        secureError('Error fetching subscription:', subscriptionError);
      }

      if (subscriptionData) {
        // SECURITY: Check if subscription is actually active and not canceled
        const now = new Date();
        const nextBillingDate = subscriptionData.next_billing_date ? new Date(subscriptionData.next_billing_date) : null;
        const endDate = subscriptionData.end_date ? new Date(subscriptionData.end_date) : null;
        
        // Subscription is active if:
        // 1. Status is 'active' AND
        // 2. Not canceled at period end OR
        // 3. If canceled, still within the paid period
        const isActuallyActive = subscriptionData.status === 'active' && 
          (!subscriptionData.cancel_at_period_end || 
           (endDate && now < endDate) ||
           (nextBillingDate && now < nextBillingDate));
        
        if (isActuallyActive) {
          setSubActive(true);
          secureStorage.setSubscriptionActive(true);
          secureLog('✅ Found ACTIVE subscription, setting subActive = true');
          secureLog('📊 Subscription data:', subscriptionData);
        } else {
          setSubActive(false);
          secureStorage.setSubscriptionActive(false);
          secureLog('❌ Subscription exists but NOT active (canceled/expired), setting subActive = false');
          secureLog('📊 Subscription status:', { status: subscriptionData.status, cancel_at_period_end: subscriptionData.cancel_at_period_end });
        }
      } else {
        secureLog('❌ No active subscription found in database');
        setSubActive(false);
        secureStorage.setSubscriptionActive(false);
      }
    } catch (error) {
      secureError('Error in fetchSubscriptionStatus:', error);
    }
  }, [user?.id]);

  // Fetch user stats from database
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('xp, streak_count, last_activity_date')
        .eq('id', user.id)
        .single();

      if (error) {
        secureError('Error fetching user stats:', error);
        return;
      }

      if (data) {
        const level = calculateLevel(data.xp || 0);
        setUserStats(prev => ({
          ...prev,
          xp: data.xp || 0,
          streak_count: data.streak_count || 0,
          last_activity_date: data.last_activity_date || new Date().toISOString().split('T')[0],
          level
        }));
      }
    } catch (error) {
      secureError('Error in fetchUserStats:', error);
    }
  }, [user?.id]);

  // Check trial status
  const checkTrialStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      secureLog('🔍 Checking subscription status for user:', user.id);
      
      // Check if user has an active subscription first
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscriptionData) {
        // SECURITY: Check if subscription is actually active and not canceled
        const now = new Date();
        const nextBillingDate = subscriptionData.next_billing_date ? new Date(subscriptionData.next_billing_date) : null;
        const endDate = subscriptionData.end_date ? new Date(subscriptionData.end_date) : null;
        
        // Subscription is active if:
        // 1. Status is 'active' AND
        // 2. Not canceled at period end OR
        // 3. If canceled, still within the paid period
        const isActuallyActive = subscriptionData.status === 'active' && 
          (!subscriptionData.cancel_at_period_end || 
           (endDate && now < endDate) ||
           (nextBillingDate && now < nextBillingDate));
        
        if (isActuallyActive) {
          secureLog('✅ User has ACTIVE subscription, no trial needed');
          setTrialStatus(prev => ({ ...prev, isActive: false, isExpired: true }));
          return;
        } else {
          secureLog('❌ User has subscription but NOT active (canceled/expired), checking trial');
          // Continue to check trial status
        }
      }

      // Check trial status
      const { data: trialData, error: trialError } = await supabase
        .from('user_trials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (trialError && trialError.code !== 'PGRST116') {
        secureError('Error fetching trial data:', trialError);
      }

      if (trialData) {
        const startDate = new Date(trialData.created_at);
        const endDate = new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
        const isExpired = now > endDate;

        setTrialStatus({
          isActive: !isExpired,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          daysRemaining,
          totalDays: 7,
          isExpired
        });

        secureLog('Trial status updated:', { isActive: !isExpired, daysRemaining, isExpired });
      } else {
        // Check if user is eligible for trial (less than 7 days old)
        const userCreatedAt = new Date(user.created_at);
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - userCreatedAt.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysSinceCreation <= 7) {
          secureLog('User is eligible for trial, days since creation:', daysSinceCreation);
          setTrialStatus(prev => ({ ...prev, isActive: false, isExpired: false }));
        } else {
          secureLog('User is older than 7 days, no trial available');
          setTrialStatus(prev => ({ ...prev, isActive: false, isExpired: true }));
        }
      }
    } catch (error) {
      secureError('Error in checkTrialStatus:', error);
    }
  }, [user?.id, user?.created_at]);

  // Fetch enrolled courses
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

  const fetchEnrolledCourses = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          course_id,
          courses (
            id,
            title,
            description,
            cover_url,
            playlist_url,
            category,
            instructor,
            rating,
            enrolled_students
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        secureError('Error fetching enrolled courses:', error);
        return;
      }

      if (data && data.length > 0) {
        const transformedCourses: Course[] = data.map((item: any) => ({
          id: item.courses?.id || '',
          title: item.courses?.title || '',
          progress: 0, // You can calculate this from lesson progress
          totalLessons: 0, // You can get this from course_videos count
          completedLessons: 0, // You can calculate this from lesson progress
          category: item.courses?.category || 'general',
          instructor: item.courses?.instructor || 'Instructor',
          rating: item.courses?.rating || 0,
          enrolledStudents: item.courses?.enrolled_students || 0,
          image: item.courses?.cover_url || '/default-course-image.jpg'
        }));

        setEnrolledCourses(transformedCourses);
        
        // Set current course as the first enrolled course
        if (transformedCourses.length > 0) {
          setCurrentCourse(transformedCourses[0]);
        }
      } else {
        secureLog('✅ Found enrolled courses in database:', []);
        setEnrolledCourses([]);
        setCurrentCourse(null);
      }
    } catch (error) {
      secureError('Error in fetchEnrolledCourses:', error);
    }
  }, [user?.id]);

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchSubscriptionStatus(),
          fetchUserStats(),
          checkTrialStatus(),
          fetchEnrolledCourses()
        ]);
      } catch (error) {
        secureError('Error initializing dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      initializeDashboard();
    }
  }, [user?.id, fetchSubscriptionStatus, fetchUserStats, checkTrialStatus, fetchEnrolledCourses]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
                     <div className={`${getSidebarMargin()} transition-all duration-300 ease-in-out flex items-center justify-center min-h-screen pt-16`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
                 <div className={`${getSidebarMargin()} transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b pt-16">
          <div className="px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 leading-tight">
                  <span className="block sm:inline">Welcome back, </span>
                  <span className="block sm:inline">{user?.name || user?.email?.split('@')[0] || 'Student'}! 👋</span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2">Continue your learning journey</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 bg-blue-50 px-2 sm:px-3 py-2 rounded-lg">
                  <FaFire className="text-orange-500 text-xs sm:text-sm" />
                  <span className="text-xs font-medium text-blue-900">
                    {userStats.streak_count} day{userStats.streak_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-purple-50 px-2 sm:px-4 py-2 rounded-lg">
                  <FaStar className="text-purple-500 text-xs sm:text-sm" />
                  <span className="text-xs sm:text-sm font-medium text-purple-900">
                    {userStats.xp} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
          {/* Admin Status Banner */}
          {isAdmin && (
            <div className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-start sm:items-center space-x-3">
                  <FaCrown className="text-purple-600 text-lg sm:text-xl flex-shrink-0 mt-1 sm:mt-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">🎉 Admin Access Granted!</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mt-1">
                      You are signed in as an administrator. You can now access admin features and manage courses.
                    </p>
                    {/* Debug info for admins - shows if someone was redirected */}
                    {location.state?.redirectedFrom && (
                      <p className="text-xs text-purple-600 mt-2 italic">
                        🔍 Debug: User was redirected from {location.state.redirectedFrom}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/admin')}
                  className="w-full sm:w-auto bg-purple-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center sm:justify-start space-x-2 text-sm sm:text-base"
                >
                  <span>Go to Admin Panel</span>
                  <FaArrowRight className="text-sm" />
                </button>
              </div>
            </div>
          )}

          {/* Trial Banner - Only show when subscription is not active */}
          {trialStatus.isActive && !subActive && (
            <TrialBanner
              trialStatus={trialStatus}
              onSubscribe={() => navigate('/subscription')}
            />
          )}

          {/* XP System Info Banner */}
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-3 sm:p-4">
            <div className="flex items-start sm:items-center space-x-3">
              <FaStar className="text-blue-500 text-base sm:text-lg flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">🎯 XP System Active</h3>
                <p className="text-xs text-gray-700 mt-1">
                  Your learning activities automatically earn XP and maintain your streak. Watch lessons, complete courses, and stay consistent!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - 2/3 width */}
            <div className="lg:col-span-2 space-y-8">
              {/* Progress & Achievement Section */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
                  <div className="flex items-center space-x-2">
                    <FaChartLine className="text-green-500" />
                    <span className="text-sm text-gray-600">Level {userStats.level}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* XP Progress */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <FaStar className="text-white text-xl" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{userStats.xp}</h3>
                    <p className="text-sm text-gray-600">Total XP</p>
                  </div>

                  {/* Streak */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <FaFire className="text-white text-xl" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{userStats.streak_count}</h3>
                    <p className="text-sm text-gray-600">Day Streak</p>
                  </div>

                  {/* Ranking */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                      <FaTrophy className="text-white text-xl" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{userStats.class_ranking}</h3>
                    <p className="text-sm text-gray-600">Class Ranking</p>
                  </div>
                </div>
              </div>

              {/* Current Course Section */}
              {currentCourse ? (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Continue Learning</h2>
                    <span className="text-sm text-gray-600">Your current course</span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaPlay className="text-white text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{currentCourse.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{currentCourse.category}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Progress: {currentCourse.progress}%</span>
                        <span>•</span>
                        <span>{currentCourse.completedLessons}/{currentCourse.totalLessons} lessons</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (trialStatus.isExpired && !subActive) {
                          navigate('/subscription');
                        } else {
                          navigate(`/course/${currentCourse.id}/overview`);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        trialStatus.isExpired && !subActive
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {trialStatus.isExpired && !subActive ? 'Upgrade to Access' : 'Resume Course'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaPlay className="text-gray-400 text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Course</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Start your learning journey today
                    </p>
                    <button 
                      onClick={() => {
                        if (trialStatus.isExpired && !subActive) {
                          navigate('/subscription');
                        } else {
                          navigate('/courses');
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        trialStatus.isExpired && !subActive
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {trialStatus.isExpired && !subActive ? 'Upgrade to Access' : 'Browse Courses'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="font-semibold text-gray-900">{userStats.total_users.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Your Level</span>
                    <span className="font-semibold text-gray-900">{userStats.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Next Level</span>
                    <span className="font-semibold text-gray-900">{userStats.level + 1}</span>
                  </div>
                </div>
              </div>

              {/* Profile Update Section */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
                  <span className="text-sm text-gray-600">Update your information</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Name cannot be changed here</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  
                  {/* Manage Profile Button */}
                  <div className="pt-4">
                    <button 
                      onClick={() => navigate('/subscription')}
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                    >
                      <FaUser className="text-sm" />
                      <span>Manage Full Profile</span>
                      <FaArrowRight className="text-sm" />
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Access complete profile settings, bio, and subscription management
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNew;
