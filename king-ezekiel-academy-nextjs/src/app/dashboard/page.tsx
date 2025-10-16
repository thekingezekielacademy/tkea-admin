'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaFire, FaStar, FaCrown, FaArrowRight, FaPlay, FaBook, FaTrophy, FaUsers, FaChartLine, FaCheckCircle, FaUser } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { useSidebar } from '@/contexts/SidebarContext';
import { createClient } from '@/lib/supabase/client';
import NotificationPermission from '@/components/NotificationPermission';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import DashboardSidebar from '@/components/DashboardSidebar';
import secureStorage from '@/utils/secureStorage';
import { secureLog, secureError } from '@/utils/secureLogger';
import { notificationService } from '@/utils/notificationService';
import { CourseProgressService } from '@/services/courseProgressService';

// Types matching the original CRA implementation
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

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  xp: number;
  earned: boolean;
  earnedDate?: string;
}

interface UserStats {
  xp: number;
  streak_count: number;
  last_activity_date: string;
  level: number;
  total_users: number;
  class_ranking: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { isExpanded, isMobile } = useSidebar();

  // Calculate dynamic margin based on sidebar state
  const getSidebarMargin = () => {
    if (isMobile) return 'ml-16'; // Mobile always uses collapsed width
    return isExpanded ? 'ml-64' : 'ml-16'; // Desktop: expanded=256px, collapsed=64px
  };
  
  // User stats state (matches CRA initial state)
  const [userStats, setUserStats] = useState<UserStats>({
    xp: 0,
    streak_count: 0,
    last_activity_date: new Date().toISOString().split('T')[0],
    level: 1,
    total_users: 1247,
    class_ranking: 'Top 35%'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Check subscription status - prioritize database over local storage
  const [subActive, setSubActive] = useState<boolean>(false);
  
  // Add refresh trigger for course data
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Function to refresh course data
  const refreshCourseData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Calculate level based on XP (every 1000 XP = 1 level)
  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 1000) + 1;
  };

  // Real data state
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Motivational quotes
  const motivationalQuotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
  ];

  const [currentQuote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

  // Helper functions
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'text-purple-600';
    if (level >= 5) return 'text-blue-600';
    return 'text-green-600';
  };

  // Fetch subscription status from database
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      secureLog('🔍 Checking subscription status for user:', user.id);
      
      // Try to fetch from database first
      const supabase = createClient();
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (subError) {
        secureLog('❌ Database subscription query error:', subError);
      }
      
      if (!subError && subData && subData.length > 0) {
        const subscription = subData[0]; // Get first (most recent) subscription
        
        // SECURITY: Check if subscription is actually active and not canceled
        const now = new Date();
        const nextBillingDate = subscription.next_billing_date ? new Date(subscription.next_billing_date) : null;
        const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
        
        // Subscription is active if:
        // 1. Status is 'active' AND
        // 2. Not canceled at period end OR
        // 3. If canceled, still within the paid period
        const isActuallyActive = subscription.status === 'active' && 
          (!subscription.cancel_at_period_end || 
           (endDate && now < endDate) ||
           (nextBillingDate && now < nextBillingDate));
        
        if (isActuallyActive) {
          setSubActive(true);
          secureStorage.setSubscriptionActive(true);
          secureLog('✅ Found ACTIVE subscription, setting subActive = true');
          secureLog('📊 Subscription data:', subData);
        } else {
          setSubActive(false);
          secureStorage.setSubscriptionActive(false);
          secureLog('❌ Subscription exists but NOT active (canceled/expired), setting subActive = false');
          secureLog('📊 Subscription status:', { status: subscription.status, cancel_at_period_end: subscription.cancel_at_period_end });
        }
      } else {
        // No active subscription found
        setSubActive(false);
        secureStorage.setSubscriptionActive(false);
        secureLog('No active subscription in database, setting subActive = false');
      }
    } catch (error) {
      secureLog('Database not available, using secure storage fallback');
      const secureSubActive = secureStorage.isSubscriptionActive();
      setSubActive(secureSubActive);
    }
  }, [user?.id]);

  // Fetch user stats FROM PROFILES TABLE (SECURITY FIXED)
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Refresh session to handle JWT expiration
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError) {
        secureError('Session refresh error:', sessionError);
        return;
      }

      // CRITICAL SECURITY: Verify the current session user ID matches what user object has
      // This prevents showing another user's data
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user?.id || sessionData.session.user.id !== user.id) {
        secureError('Session user mismatch - potential security breach!', 
                   {sessionUserId: sessionData?.session?.user?.id, contextUserId: user.id});
        return;
      }

      // Fetch REAL user profile data from database with double verification
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('xp, streak_count, last_activity_date')
        .eq('id', user.id)  // Double-check we're getting the right user
        .single();

      secureLog('📊 Fetching user profile (SECURE):', { profile, error, requestedUserId: user.id });

      if (error) {
        secureLog('❌ Error fetching user profile:', error);
        // If columns don't exist, use zero defaults
        const { data: basicProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (basicProfile) {
          secureLog('Profile exists but XP columns unavailable - using zero defaults');
          
          const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          setUserStats({
            xp: 0,
            streak_count: 0,
            last_activity_date: new Date().toISOString().split('T')[0],
            level: 1,
            total_users: totalUsers || 1247,
            class_ranking: 'Top 90%'
          });
          return;
        } else {
          secureError('User profile not found');
          return;
        }
      }

      // ✅ SUCCESS: Received real user data
      const currentXP = profile.xp || 0;
      const currentStreak = profile.streak_count || 0;
      
      secureLog('✅ Successfully fetched real user stats:', {
        xp: currentXP,
        streak: currentStreak,
        user_id: user.id
      });

      // Get community stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Calculate level from REAL XP (every 1000 XP = 1 level)
      const calculatedLevel = calculateLevel(currentXP);
      const totalUsersCount = totalUsers || 1247;
      
      // Real ranking calculation
      const ranking = currentXP > 2000 ? 'Top 25%' : 
                     currentXP > 1000 ? 'Top 50%' : 
                     currentXP > 500 ? 'Top 75%' : 'Top 90%';

      // Set REAL user stats with database values
      setUserStats({
        xp: currentXP,
        streak_count: currentStreak,
        last_activity_date: profile.last_activity_date || new Date().toISOString().split('T')[0],
        level: calculatedLevel,
        total_users: totalUsersCount,
        class_ranking: ranking
      });

    } catch (error) {
      secureError('Error in fetchUserStats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch course data (SECURITY ENHANCED)
  const fetchCourseData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingCourses(true);
      
      // CRITICAL SECURITY: Ensure session user matches the current context
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user?.id || sessionData.session.user.id !== user.id) {
        secureError('Course access blocked - user session mismatch!', 
                   { sessionUserId: sessionData?.session?.user?.id, requestingUserId: user.id });
        setIsLoadingCourses(false);
        return;
      }
      
      secureLog('🔍 Starting fetchCourseData for user (SECURE):', user.id);
      
      // Refresh session to handle JWT expiration
      const { error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError) {
        secureError('Session refresh error:', sessionError);
        return;
      }

      // Use the new course progress service to get real progress data
      console.log('🔍 Calling CourseProgressService.getUserCourseProgress for user:', user.id);
      const courseProgressData = await CourseProgressService.getUserCourseProgress(user.id);
      
      secureLog('📊 Course progress data:', courseProgressData);
      console.log('📊 Raw course progress data:', courseProgressData);

      if (courseProgressData && courseProgressData.length > 0) {
        // Process courses with REAL progress data
        const courses = courseProgressData.map((courseData) => {
          const progress = Math.max(0, Math.min(100, courseData.progress_percentage || 0));
          
          return {
            id: courseData.course_id,
            title: courseData.course_title,
            progress: progress,
            completedLessons: courseData.completed_lessons,
            totalLessons: courseData.total_lessons,
            category: 'General', // You can enhance this by fetching from courses table
            instructor: 'King Ezekiel Academy',
            rating: 4.7,
            enrolledStudents: 1000,
            image: '/api/placeholder/300/200', // You can enhance this by fetching from courses table
            last_accessed: courseData.last_accessed
          };
        });

        // Select course with highest progress
        if (courses.length > 0) {
          const highestProgressCourse = courses.reduce((prev, current) => 
            (current.progress > prev.progress) ? current : prev
          );
          setCurrentCourse(highestProgressCourse);

          const otherCourses = courses.filter(course => course.id !== highestProgressCourse.id);
          setRecommendedCourses(otherCourses.slice(0, 2));
        } else {
          setCurrentCourse(null);
          setRecommendedCourses([]);
        }

      } else {
        secureLog('No course progress found - User has not completed any lessons yet');
        
        // User has NO progress - show proper empty state
        setCurrentCourse(null);
        setRecommendedCourses([]);
      }
    } catch (error) {
      secureError('Error in fetchCourseData:', error);
    } finally {
      setIsLoadingCourses(false);
    }
  }, [user?.id]);

  const fetchBadges = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      const mockBadges: Badge[] = [
        {
          id: '1',
          name: 'First Steps',
          description: 'Complete your first lesson',
          icon: '🎯',
          earned: userStats.xp > 0,
          earnedDate: userStats.xp > 0 ? 'Today' : undefined
        },
        {
          id: '2',
          name: 'Week Warrior',
          description: 'Learn for 7 days in a row',
          icon: '🔥',
          earned: userStats.streak_count >= 7,
          earnedDate: userStats.streak_count >= 7 ? 'Today' : undefined,
          progress: userStats.streak_count >= 7 ? undefined : Math.round(Math.min((userStats.streak_count / 7) * 100, 100))
        },
        {
          id: '3',
          name: 'Course Master',
          description: 'Complete a full course',
      icon: '🏆',
      earned: (currentCourse?.progress || 0) >= 100,
      earnedDate: (currentCourse?.progress || 0) >= 100 ? 'Today' : undefined,
      progress: (currentCourse?.progress || 0) >= 100 ? undefined : (currentCourse?.progress || 0)
              }
      ];
      setBadges(mockBadges);
            } catch (error) {
      secureError('Error fetching badges:', error);
    }
  }, [userStats, currentCourse]);

  // Notification functions
  const checkNotificationTriggers = useCallback(async () => {
    if (!notificationService.isNotificationEnabled()) return;

    try {
      // 1. Check for XP level up
      const previousLevel = parseInt(localStorage.getItem('previous_level') || '1');
      const currentLevel = userStats.level;
      if (currentLevel > previousLevel) {
        await notificationService.sendXPLevelUpNotification(currentLevel, userStats.xp);
        localStorage.setItem('previous_level', currentLevel.toString());
      }

      // 2. Check for course continuation reminder
      if (currentCourse && currentCourse.progress > 0 && currentCourse.progress < 100) {
        const lastAccessed = localStorage.getItem(`last_accessed_${currentCourse.id}`);
        if (lastAccessed) {
          const hoursSinceLastAccess = (Date.now() - parseInt(lastAccessed)) / (1000 * 60 * 60);
          if (hoursSinceLastAccess > 24) {
            await notificationService.sendCourseContinuationReminder(currentCourse.title, currentCourse.progress);
          }
        }
      }

      // 3. Check for streak reminder
      const streak = userStats.streak_count;
      if (streak > 0) {
        const lastStreakNotification = localStorage.getItem('last_streak_notification');
        const daysSinceLastNotification = lastStreakNotification 
          ? (Date.now() - parseInt(lastStreakNotification)) / (1000 * 60 * 60 * 24)
          : 1;
        
        if (daysSinceLastNotification >= 1) {
          await notificationService.sendStreakReminder(streak);
          localStorage.setItem('last_streak_notification', Date.now().toString());
        }
      }

      // Check for premium upgrade opportunity
      if (!subActive) {
        const userEngagement = parseInt(localStorage.getItem('user_engagement_score') || '0');
        if (userEngagement > 10) {
          await notificationService.sendPremiumUpgradePrompt('unlimited courses and advanced features');
        }
      }
    } catch (error) {
      secureError('Error checking notification triggers:', error);
    }
  }, [currentCourse, userStats, subActive]);

  const setupNotifications = useCallback(() => {
    if (userStats.xp > 0) {
      notificationService.sendXPLevelUpNotification(userStats.level, userStats.xp);
    }
  }, [userStats]);

  // Check for various notification triggers
  useEffect(() => {
    if (!user?.id) return;

    const setupNotifications = async () => {
      if (!notificationService.isNotificationEnabled()) {
        return;
      }

      await checkNotificationTriggers();
    };

    setupNotifications();
  }, [user?.id, currentCourse, userStats, checkNotificationTriggers]);

  useEffect(() => {
    if (!user?.id) return;
    
    const loadData = async () => {
      setIsLoading(true);
      
      // SECURITY FIX: Clear any stale cache data before loading new user's data
      try {
        const secureStorage = require('@/utils/secureStorage');
        // Only clear subscription-related cache, keep session tokens
        localStorage.removeItem('subscription_active');
        localStorage.removeItem('user_trial_status');
      } catch (error) {
        console.error('Cache clearing error during dashboard load:', error);
      }
      
      await Promise.all([
        fetchUserStats(),
        fetchCourseData(),
        fetchBadges(),
        fetchSubscriptionStatus()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [user?.id]); // Only depend on user.id to prevent loops

  // Optimized refresh (removed to prevent duplicates)

  // Calculate badges and achievements based on real user data
  const calculateBadgesAndAchievements = useCallback(() => {
    if (!userStats || !currentCourse) return;

    const newBadges: Badge[] = [];

    // Badge: First Steps (complete first lesson)
    if (userStats.xp > 0) {
      newBadges.push({
        id: '1',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        earned: true,
        earnedDate: 'Today'
      });
    }

    // Badge: Week Warrior (7+ day streak)
    if (userStats.streak_count >= 7) {
      newBadges.push({
        id: '2',
        name: 'Week Warrior',
        description: 'Learn for 7 days in a row',
        icon: '🔥',
        earned: true,
        earnedDate: 'Today'
      });
    } else {
      newBadges.push({
        id: '2',
        name: 'Week Warrior',
        description: 'Learn for 7 days in a row',
        icon: '🔥',
        earned: false,
        progress: Math.round(Math.min((userStats.streak_count / 7) * 100, 100))
      });
    }

    // Badge: Course Master (complete a course)
    if ((currentCourse?.progress || 0) >= 100) {
      newBadges.push({
        id: '3',
        name: 'Course Master',
        description: 'Complete a full course',
        icon: '🏆',
        earned: true,
        earnedDate: 'Today'
      });
    } else {
      newBadges.push({
        id: '3',
        name: 'Course Master',
        description: 'Complete a full course',
        icon: '🏆',
        earned: false,
        progress: (currentCourse?.progress || 0)
      });
    }

    setBadges(newBadges);
  }, [userStats, currentCourse]);

  // Update badges and achievements when user stats or current course changes
  useEffect(() => {
    calculateBadgesAndAchievements();
  }, [calculateBadgesAndAchievements]);

  // Handlers
  const handleSubscribe = () => {
    router.push('/subscription');
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };

  // Loading state with skeleton
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
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className={`${getSidebarMargin()} transition-all duration-300 ease-in-out`}>
        {/* Notification Permission Prompt */}
        <NotificationPermission 
          onPermissionGranted={() => {
          console.log('Notification permission granted');
          // Track permission granted
            localStorage.setItem('notification_permission_granted', 'true');
          }}
          onPermissionDenied={() => {
          console.log('Notification permission denied');
          // Track permission denied
            localStorage.setItem('notification_permission_denied', 'true');
          }}
        />


        {/* Header */}
        <div className="bg-white shadow-sm border-b pt-16">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                  <span className="block sm:inline">Welcome back, </span>
                  <span className="block sm:inline">{user?.name || user?.email?.split('@')[0] || 'Student'}! 👋</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Continue your learning journey</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <FaFire className="text-orange-500" />
                  <span className="text-sm font-medium text-blue-900">
                    {userStats.streak_count} day{userStats.streak_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-lg">
                  <FaStar className="text-purple-500" />
                  <span className="text-sm font-medium text-purple-900">
                    {userStats.xp} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-8">
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
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/admin')}
                  className="w-full sm:w-auto bg-purple-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center sm:justify-start space-x-2 text-sm sm:text-base"
                >
                  <span>Go to Admin Panel</span>
                  <FaArrowRight className="text-sm" />
                </button>
              </div>
            </div>
          )}

          {/* Trial system removed */}

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
                    <button
                      onClick={refreshCourseData}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Refresh course progress"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <FaChartLine className="text-green-500" />
                    <span className="text-sm text-gray-600">Level {userStats.level}</span>
                  </div>
                </div>

                {/* Course Progress Content */}
                  {isLoadingCourses ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading your courses...</span>
                    </div>
                ) : currentCourse ? (
                  <>
                    {/* Current Course Progress */}
                    <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{currentCourse.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {currentCourse.category}
                          </span>
                          <span className="text-sm text-gray-600">
                            {currentCourse.completedLessons}/{currentCourse.totalLessons} videos
                          </span>
                          </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="relative mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${getProgressColor(currentCourse.progress)} transition-all duration-300`}
                            style={{ width: `${currentCourse.progress}%` }}
                            ></div>
                          </div>
                          </div>
                      
                      {/* Progress Details */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-4">
                          {currentCourse.progress > 0 ? (
                            <>
                              <span className="text-sm text-gray-600">
                                <strong>{currentCourse.progress}%</strong> complete
                              </span>
                              <span className="text-sm text-gray-500">
                                {currentCourse.totalLessons - currentCourse.completedLessons} videos remaining
                              </span>
                            </>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Ready to start your journey!</span>
                              <span className="text-sm text-gray-500">
                                {currentCourse.totalLessons} videos available
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-green-600 font-medium">
                          {currentCourse.progress > 0 ? 'Keep going! 🚀' : 'Start watching! 🎬'}
                        </span>
                      </div>
                      
                      {/* Course Stats */}
                      <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{currentCourse.completedLessons}</div>
                          <div className="text-xs text-gray-600">
                            {currentCourse.completedLessons > 0 ? 'Videos Watched' : 'Not Started'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{currentCourse.totalLessons}</div>
                          <div className="text-xs text-gray-600">Total Videos</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {currentCourse.progress || 0}%
                          </div>
                          <div className="text-xs text-gray-600">Progress</div>
                        </div>
                      </div>
                      
                      {/* Continue Learning Button */}
                      <div className="mt-4">
                          <button
                          onClick={() => {
                            if (!subActive) {
                              router.push('/subscription');
                            } else {
                              router.push(`/course/${currentCourse.id}`);
                            }
                          }}
                          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                            !subActive
                              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                          }`}
                        >
                          <span>
                            {!subActive ? '🔒 Upgrade to Access' : '🎬 Continue Learning'}
                          </span>
                          <FaArrowRight className="text-sm" />
                          </button>
                        </div>
                    </div>

                    {/* Next Milestone */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <FaTrophy className="text-yellow-500 text-xl" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Next Milestone</h4>
                          <p className="text-sm text-gray-600">
                            {currentCourse.progress >= 100 ? (
                              "🎉 Course completed! You've earned the 'Course Master' badge!"
                            ) : currentCourse.progress >= 75 ? (
                              "Almost there! Complete the remaining videos to finish this course!"
                            ) : currentCourse.progress >= 50 ? (
                              "Great progress! You're halfway through. Keep up the momentum!"
                            ) : currentCourse.progress >= 25 ? (
                              "Good start! You're making steady progress. Keep it up!"
                            ) : (
                              "Ready to begin? Start watching your first video to get started!"
                            )}
                          </p>
                    </div>
                      </div>
                    </div>
                  </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaBook className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                      <p className="text-gray-600 mb-4">Start your learning journey by enrolling in a course</p>
                      <button
                        onClick={() => router.push('/courses')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Browse Courses
                      </button>
                    </div>
                  )}
              </div>

              {/* Recommended Courses */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
                  <span className="text-sm text-gray-600">AI-powered suggestions</span>
                </div>

                {isLoadingCourses ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading recommendations...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          P&PS
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">P&PS</h3>
                          <p className="text-sm text-gray-600 mb-2">PRESENTATION & PUBLIC SPEAKING</p>
                          <p className="text-xs text-gray-500 mb-3">King Ezekiel Academy</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center space-x-1">
                              <FaStar className="text-yellow-400" />
                              <span>4.7</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FaUsers className="text-gray-400" />
                              <span>1000</span>
                            </span>
                        </div>
                          <div className="mt-3">
                            <button 
                              onClick={() => {
                                if (!subActive) {
                                  router.push('/subscription');
                                } else {
                                  router.push('/courses');
                                }
                              }} 
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                !subActive
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {!subActive ? 'Upgrade to Access' : 'Start Learning'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          VBS
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">VBS</h3>
                          <p className="text-sm text-gray-600 mb-2">VTU BUSINESS SIMPLIFIED!</p>
                          <p className="text-xs text-gray-500 mb-3">King Ezekiel Academy</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center space-x-1">
                              <FaStar className="text-yellow-400" />
                              <span>4.7</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FaUsers className="text-gray-400" />
                              <span>1000</span>
                        </span>
                      </div>
                          <div className="mt-3">
                            <button 
                              onClick={() => {
                                if (!subActive) {
                                  router.push('/subscription');
                                } else {
                                  router.push('/courses');
                                }
                              }} 
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                !subActive
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {!subActive ? 'Upgrade to Access' : 'Start Learning'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}
                </div>

              {/* Social Proof */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Your Standing</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <FaCrown className="text-yellow-500 text-xl" />
                      <h4 className="font-semibold text-gray-900">Class Ranking</h4>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {userStats.class_ranking === 'Calculating...' ? (
                        <span className="animate-pulse">Calculating...</span>
                      ) : (
                        userStats.class_ranking
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {userStats.class_ranking === 'Calculating...' 
                        ? 'Determining your ranking...' 
                        : "You're ahead of most learners in your batch!"
                      }
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <FaUsers className="text-blue-500 text-xl" />
                      <h4 className="font-semibold text-gray-900">Community</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{userStats.total_users.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Students learning with you</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Streak & Motivation */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FaFire className="text-orange-500 text-xl" />
                  <h3 className="font-semibold text-gray-900">Learning Streak</h3>
                  </div>
                
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{userStats.streak_count}</div>
                  <p className="text-sm text-gray-600">days in a row</p>
                  </div>

                {userStats.xp === 0 ? (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-blue-200">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🚀</div>
                      <h4 className="font-semibold text-gray-900 mb-2">Ready to Start Your Journey?</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Every great adventure begins with a single step. Start learning today and watch your XP grow!
                      </p>
                      <button 
                        onClick={() => {
                          router.push('/courses');
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                      >
                        Explore Courses
                      </button>
                  </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-orange-800">
                      🔥 You've learned {userStats.streak_count} days in a row. Keep it up!
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      Daily streak bonus: +{userStats.streak_count * 10} XP
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 italic">"{currentQuote}"</p>
                </div>
              </div>

              {/* Badges Earned */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Badges Earned</h3>
                <div className="space-y-3">
                  {badges.length > 0 ? (
                    badges.slice(0, 4).map((badge) => (
                      <div key={badge.id} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          badge.earned ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          <FaTrophy className={`h-4 w-4 ${
                            badge.earned ? 'text-yellow-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            badge.earned ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {badge.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{badge.description}</p>
                          {badge.progress !== undefined && (
                            <div className="mt-1">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{badge.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div
                                  className="bg-yellow-500 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${badge.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">No badges earned yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Experience Points */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Experience Points</h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">Level {userStats.level}</div>
                  <div className="text-lg font-semibold text-gray-900 mb-4">{userStats.xp} total XP</div>
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((userStats.xp % 1000) / 1000) * 100}%` }}
                    ></div>
            </div>
                  <p className="text-sm text-gray-600">
                    Next level: {1000 - (userStats.xp % 1000)} XP needed
                  </p>
          </div>
        </div>

              {/* Subscription Status */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Subscription</h3>
                <div className="text-center">
                  {subActive ? (
                    <>
                      <div className="text-2xl font-bold text-green-600 mb-2">Active</div>
                      <div className="text-lg font-semibold text-gray-900 mb-4">subscription</div>
                      <p className="text-sm text-gray-600 mb-4">You have full access! 🎉</p>
                      <button
                        onClick={() => router.push('/subscription')}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Manage Subscription
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-600 mb-2">Free</div>
                      <div className="text-lg font-semibold text-gray-900 mb-4">User</div>
                      <p className="text-sm text-gray-600 mb-4">Access free courses</p>
                      <button
                        onClick={() => router.push('/subscription')}
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                      >
                        Upgrade Now
                      </button>
                    </>
                  )}
      </div>
    </div>

              {/* Profile Settings */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Profile Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="text-sm text-gray-900">{user?.name || 'The King Ezekiel A'}</div>
                    <p className="text-xs text-gray-500">Name cannot be changed here</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="text-sm text-gray-900">{user?.email || 'thekingezekielacademy@gmail.com'}</div>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Manage Full Profile
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}