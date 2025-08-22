import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import secureStorage from '../utils/secureStorage';
import TrialBanner from '../components/TrialBanner';
import { TrialStatus } from '../utils/trialManager';
import { 
  FaTrophy, 
  FaFire, 
  FaPlay, 
  FaStar, 
  FaUsers, 
  FaCrown,
  FaChartLine,
  FaCheckCircle,
  FaArrowRight,
  FaUser
} from 'react-icons/fa';
import { secureLog, secureError, criticalLog } from '../utils/secureLogger';

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  
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
      
      // Try to fetch from database first
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (subError) {
        secureLog('❌ Database subscription query error:', subError);
      }
      
      if (!subError && subData) {
        setSubActive(true);
        secureStorage.setSubscriptionActive(true); // Update secure storage
        secureLog('✅ Found active subscription in database, setting subActive = true');
        secureLog('📊 Subscription data:', subData);
      } else {
        // Fallback to secure storage
        const secureSubActive = secureStorage.isSubscriptionActive();
        setSubActive(secureSubActive);
        secureLog('No active subscription in database, using secure storage status:', secureSubActive);
        
        // Also check if there are any subscriptions at all for this user
        const { data: allSubs, error: allSubsError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id);
        
        if (allSubsError) {
          secureLog('❌ Error fetching all subscriptions:', allSubsError);
        } else {
          secureLog('📊 All subscriptions for user:', allSubs);
        }
      }
    } catch (error) {
      secureLog('Database not available, using secure storage fallback');
      const secureSubActive = secureStorage.isSubscriptionActive();
      setSubActive(secureSubActive);
    }
  }, [user?.id]);

  // Fetch trial status
  const fetchTrialStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // First check localStorage for trial status
      const localTrial = localStorage.getItem('user_trial_status');
      
      if (localTrial) {
        try {
          const parsedTrial = JSON.parse(localTrial);
                  // Recalculate days remaining - use floor to get exact days, not rounded up
        const now = new Date();
        const endDate = new Date(parsedTrial.endDate);
        const timeDiff = endDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
          
          const updatedTrialStatus = {
            ...parsedTrial,
            daysRemaining,
            isExpired: daysRemaining <= 0
          };
          
          setTrialStatus(updatedTrialStatus);
          secureLog('✅ Found trial status in localStorage:', updatedTrialStatus);
          return;
        } catch (parseError) {
          secureLog('Failed to parse localStorage trial data');
        }
      }
      
      // If no localStorage trial, check if this is a new user and initialize trial
      // For new users, assume they're within 7 days if no created_at or if created_at is recent
      const userCreatedAt = user.created_at ? new Date(user.created_at) : new Date();
      const daysSinceCreation = Math.ceil((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // If user is new (no created_at) or within 7 days, give them trial
      if (!user.created_at || daysSinceCreation <= 7) {
        // This is a new user within 7 days, initialize trial
        const startDate = userCreatedAt;
        // Set end date to exactly 7 days from start (midnight to midnight)
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        // Calculate exact days remaining
        const now = new Date();
        const timeDiff = endDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
        
        const newTrialStatus = {
          isActive: true,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          daysRemaining,
          totalDays: 7,
          isExpired: daysRemaining <= 0
        };
        
        // Save to localStorage
        localStorage.setItem('user_trial_status', JSON.stringify(newTrialStatus));
        setTrialStatus(newTrialStatus);
        secureLog('✅ Initialized trial for new user:', newTrialStatus);
      } else {
        // User is older than 7 days, no trial
        setTrialStatus({
          isActive: false,
          startDate: '',
          endDate: '',
          daysRemaining: 0,
          totalDays: 0,
          isExpired: true
        });
        secureLog('User is older than 7 days, no trial available');
      }
      
      // Try database query as well (for when table exists)
      try {
        const { data: trialData, error } = await supabase
          .from('user_trials')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (!error && trialData) {
          const now = new Date();
          const endDate = new Date(trialData.end_date);
          const timeDiff = endDate.getTime() - now.getTime();
          const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
          
          const dbTrialStatus = {
            isActive: true,
            startDate: trialData.start_date,
            endDate: trialData.end_date,
            daysRemaining,
            totalDays: 7,
            isExpired: daysRemaining <= 0
          };
          
          setTrialStatus(dbTrialStatus);
          secureLog('✅ Found trial status in database:', dbTrialStatus);
        }
      } catch (dbError) {
        secureLog('Database table user_trials not available yet');
      }
    } catch (error) {
      secureError('Error in fetchTrialStatus:', error);
      // Set default no trial status
      setTrialStatus({
        isActive: false,
        startDate: '',
        endDate: '',
        daysRemaining: 0,
        totalDays: 0,
        isExpired: true
      });
    }
  }, [user?.id]);

  // Fetch user stats from database
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Refresh session to handle JWT expiration
      const { error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError) {
        secureError('Session refresh error:', sessionError);
        return;
      }

      // Fetch user profile with XP and streak data - Skip if columns don't exist
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('xp, streak_count, last_activity_date')
          .eq('id', user.id)
          .single();

        if (error) {
          secureLog('XP/streak columns not available yet, using default values');
          // Use default values when XP system isn't set up yet
          setUserStats({
            xp: 0,
            streak_count: 0,
            last_activity_date: new Date().toISOString().split('T')[0],
            level: 1,
            total_users: 100, // Default community size
            class_ranking: 'Top 90%' // Default ranking
          });
          return;
        }

        // Fetch total users count for community stats
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Calculate level and ranking
        const level = calculateLevel(profile.xp || 0);
        const totalUsersCount = totalUsers || 1247;
        
        // Simple ranking calculation (mock for now)
        const ranking = profile.xp > 2000 ? 'Top 25%' : 
                       profile.xp > 1000 ? 'Top 50%' : 
                       profile.xp > 500 ? 'Top 75%' : 'Top 90%';

        setUserStats({
          xp: profile.xp || 0,
          streak_count: profile.streak_count || 0,
          last_activity_date: profile.last_activity_date || new Date().toISOString().split('T')[0],
          level,
          total_users: totalUsersCount,
          class_ranking: ranking
        });
      } catch (error) {
        secureLog('XP system not available yet, using default values');
        // Use default values when XP system isn't set up yet
        setUserStats({
          xp: 0,
          streak_count: 0,
          last_activity_date: new Date().toISOString().split('T')[0],
          level: 1,
          total_users: 100, // Default community size
          class_ranking: 'Top 90%' // Default ranking
        });
      }

    } catch (error) {
      secureError('Error in fetchUserStats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);



  // Fetch real course data
  const fetchCourseData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingCourses(true);
      
      // Refresh session to handle JWT expiration
      const { error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError) {
        secureError('Session refresh error:', sessionError);
        return;
      }

      // Try database queries first, then fall back to localStorage
      let enrolledCourses = [];
      
      try {
        // First, try to get courses from user_courses table
        const { data: enrolledData, error: enrolledError } = await supabase
          .from('user_courses')
          .select('course_id, progress, completed_lessons, last_accessed')
          .eq('user_id', user.id)
          .order('last_accessed', { ascending: false });

        if (!enrolledError && enrolledData) {
          enrolledCourses = enrolledData;
          secureLog('✅ Found enrolled courses in database:', enrolledCourses);
        } else {
          secureLog('Database query failed, trying localStorage fallback...');
          
          // Fallback to localStorage
          try {
            const recentCourseId = localStorage.getItem('recent_course_id');
            const recentCourseProgress = localStorage.getItem('recent_course_progress');
            const recentTimestamp = localStorage.getItem('recent_course_timestamp');
            
            if (recentCourseId && recentCourseProgress && recentTimestamp) {
              const timeDiff = Date.now() - new Date(recentTimestamp).getTime();
              const hoursAgo = timeDiff / (1000 * 60 * 60);
              
                          if (hoursAgo < 24) { // Within last 24 hours
              const isCompleted = localStorage.getItem('recent_course_completed') === 'true';
              enrolledCourses = [{
                course_id: recentCourseId,
                progress: parseInt(recentCourseProgress) || 0,
                completed_lessons: isCompleted ? 2 : Math.floor((parseInt(recentCourseProgress) || 0) / 100 * 2),
                last_accessed: recentTimestamp,
                is_completed: isCompleted
              }];
              secureLog('✅ Found recent course activity in localStorage:', enrolledCourses);
            }
            }
          } catch (localStorageError) {
            secureLog('Could not check localStorage for recent courses');
          }
        }
      } catch (error) {
        secureLog('Database query error, using localStorage fallback');
        // Use localStorage fallback
        try {
          const recentCourseId = localStorage.getItem('recent_course_id');
          const recentCourseProgress = localStorage.getItem('recent_course_progress');
          const recentTimestamp = localStorage.getItem('recent_course_timestamp');
          
          if (recentCourseId && recentCourseProgress && recentTimestamp) {
            const timeDiff = Date.now() - new Date(recentTimestamp).getTime();
            const hoursAgo = timeDiff / (1000 * 60 * 60);
            
                      if (hoursAgo < 24) {
            const isCompleted = localStorage.getItem('recent_course_completed') === 'true';
            enrolledCourses = [{
              course_id: recentCourseId,
              progress: parseInt(recentCourseProgress) || 0,
              completed_lessons: isCompleted ? 2 : Math.floor((parseInt(recentCourseProgress) || 0) / 100 * 2),
              last_accessed: recentTimestamp,
              is_completed: isCompleted
            }];
            secureLog('✅ Using localStorage fallback for course data');
          }
          }
        } catch (localStorageError) {
          secureLog('Could not use localStorage fallback');
        }
      }

      // Set current course (most recently accessed)
      if (enrolledCourses && enrolledCourses.length > 0) {
        const mostRecent = enrolledCourses[0];
        
        // Update last_accessed timestamp for this course
        try {
          await supabase
            .from('user_courses')
            .update({ last_accessed: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('course_id', mostRecent.course_id);
        } catch (updateError) {
          secureLog('Could not update last_accessed timestamp');
        }
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title, description, level, cover_photo_url, created_by')
          .eq('id', mostRecent.course_id)
          .single();

        if (courseError) {
          secureError('Error fetching course data:', courseError);
          return;
        }
        
        // Fetch course videos count
        const { count: totalLessons } = await supabase
          .from('course_videos')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', courseData.id);

        // Calculate actual progress based on completed lessons
        const actualProgress = totalLessons > 0 ? Math.round((mostRecent.completed_lessons / totalLessons) * 100) : 0;
        
        setCurrentCourse({
          id: courseData.id,
          title: courseData.title,
          progress: actualProgress,
          totalLessons: totalLessons || 0,
          completedLessons: mostRecent.completed_lessons || 0,
          category: courseData.level || 'General',
          instructor: 'Admin', // We can add instructor field later
          rating: 4.8, // We can add rating system later
          enrolledStudents: 1247, // We can add enrollment count later
          image: courseData.cover_photo_url || '/api/placeholder/300/200'
        });
      } else {
        // Check localStorage for recent activity if no database records
        try {
          const recentCourseId = localStorage.getItem('recent_course_id');
          const recentCourseProgress = localStorage.getItem('recent_course_progress');
          const recentTimestamp = localStorage.getItem('recent_course_timestamp');
          
          if (recentCourseId && recentCourseProgress && recentTimestamp) {
            const timeDiff = Date.now() - new Date(recentTimestamp).getTime();
            const hoursAgo = timeDiff / (1000 * 60 * 60);
            
            if (hoursAgo < 24) { // Within last 24 hours
              // Create a temporary current course from localStorage data
              setCurrentCourse({
                id: recentCourseId,
                title: 'Recent Course', // We'll update this when we fetch course details
                progress: parseInt(recentCourseProgress) || 0,
                totalLessons: 0, // Will be updated with real data
                completedLessons: 0, // Will be updated with real data
                category: 'General',
                instructor: 'Admin',
                rating: 4.8,
                enrolledStudents: 1247,
                image: '/api/placeholder/300/200'
              });
              
              // Try to fetch actual course details and video count
              try {
                const { data: courseData } = await supabase
                  .from('courses')
                  .select('title, level, cover_photo_url')
                  .eq('id', recentCourseId)
                  .single();
                
                if (courseData) {
                  // Fetch actual video count for this course
                  const { count: actualTotalLessons } = await supabase
                    .from('course_videos')
                    .select('*', { count: 'exact', head: true })
                    .eq('course_id', recentCourseId);
                  
                  const actualTotalLessonsCount = actualTotalLessons || 0;
                  const actualProgress = actualTotalLessonsCount > 0 ? Math.round((parseInt(recentCourseProgress) || 0)) : 0;
                  const actualCompletedLessons = actualTotalLessonsCount > 0 ? Math.floor((parseInt(recentCourseProgress) || 0) / 100 * actualTotalLessonsCount) : 0;
                  
                  setCurrentCourse(prev => prev ? {
                    ...prev,
                    title: courseData.title,
                    category: courseData.level || 'General',
                    image: courseData.cover_photo_url || '/api/placeholder/300/200',
                    totalLessons: actualTotalLessonsCount,
                    completedLessons: actualCompletedLessons,
                    progress: actualProgress
                  } : null);
                }
              } catch (fetchError) {
                secureLog('Could not fetch course details for localStorage course');
              }
            }
          }
        } catch (localStorageError) {
          secureLog('Could not check localStorage for recent courses');
        }
      }

      // Fetch recommended courses (not enrolled)
      const { data: allCourses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          level,
          cover_photo_url,
          created_by
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (coursesError) {
        secureError('Error fetching courses:', coursesError);
        return;
      }

      // Filter out courses user is already enrolled in
      const enrolledCourseIds = enrolledCourses?.map(ec => ec.course_id) || [];
      const availableCourses = allCourses?.filter(course => !enrolledCourseIds.includes(course.id)) || [];

      // Transform to Course interface
      const recommended = availableCourses.slice(0, 2).map(course => ({
        id: course.id,
        title: course.title,
        progress: 0,
        totalLessons: 0, // We'll fetch this if needed
        completedLessons: 0,
        category: course.level || 'General',
        instructor: 'Admin',
        rating: 4.7,
        enrolledStudents: 1000,
        image: course.cover_photo_url || '/api/placeholder/300/200'
      }));

      setRecommendedCourses(recommended);

    } catch (error) {
      secureError('Error in fetchCourseData:', error);
    } finally {
      setIsLoadingCourses(false);
    }
  }, [user?.id]);

  // Fetch stats on component mount
  useEffect(() => {
    fetchSubscriptionStatus();
    fetchUserStats();
    fetchCourseData();
    fetchTrialStatus();
  }, [user?.id, fetchSubscriptionStatus, fetchUserStats, fetchCourseData, fetchTrialStatus]);

  // Real data state
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Calculate badges and achievements based on real user data
  const calculateBadgesAndAchievements = useCallback(() => {
    if (!userStats || !currentCourse) return;

    const newBadges: Badge[] = [];
    const newAchievements: Achievement[] = [];

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
        progress: Math.min((userStats.streak_count / 7) * 100, 100)
      });
    }

    // Badge: Course Master (complete a course)
    if (currentCourse.progress >= 100) {
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
        progress: currentCourse.progress
      });
    }

    // Achievement: Early Bird (earn XP before 9 AM - simplified for now)
    newAchievements.push({
      id: '1',
      title: 'Early Bird',
      description: 'Complete a lesson before 9 AM',
      xp: 50,
      earned: userStats.xp > 100,
      earnedDate: userStats.xp > 100 ? 'Today' : undefined
    });

    // Achievement: Speed Learner (complete 5+ lessons in one day - simplified)
    newAchievements.push({
      id: '2',
      title: 'Speed Learner',
      description: 'Complete 5 lessons in one day',
      xp: 100,
      earned: userStats.xp > 200
    });

    // Achievement: Social Butterfly (earn XP from multiple activities)
    newAchievements.push({
      id: '3',
      title: 'Social Butterfly',
      description: 'Earn XP from multiple learning activities',
      xp: 75,
      earned: userStats.xp > 150,
      earnedDate: userStats.xp > 150 ? 'Today' : undefined
    });

    setBadges(newBadges);
    setAchievements(newAchievements);
  }, [userStats, currentCourse]);

  // Update badges and achievements when user stats or current course changes
  useEffect(() => {
    calculateBadgesAndAchievements();
  }, [calculateBadgesAndAchievements]);

  const [motivationalQuotes] = useState([
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
  ]);

  const [currentQuote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

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



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name || user?.email?.split('@')[0] || 'Student'}! 👋
              </h1>
              <p className="text-gray-600">Continue your learning journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <FaFire className="text-orange-500" />
                <span className="text-sm font-medium text-blue-900">
                  {userStats.streak_count} day streak
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Status Banner */}
        {isAdmin && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaCrown className="text-purple-600 text-xl" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">🎉 Admin Access Granted!</h3>
                  <p className="text-sm text-gray-700">
                    You are signed in as an administrator. You can now access admin features and manage courses.
                  </p>
                  {/* Debug info for admins - shows if someone was redirected */}
                  {location.state?.redirectedFrom && (
                    <p className="text-xs text-purple-600 mt-1 italic">
                      🔍 Debug: User was redirected from {location.state.redirectedFrom}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin')}
                className="bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
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
            onSubscribe={() => navigate('/profile')}
          />
        )}

        {/* XP System Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-4">
          <div className="flex items-center space-x-3">
            <FaStar className="text-blue-500 text-lg" />
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">🎯 XP System Active</h3>
              <p className="text-xs text-gray-700">
                Your learning activities automatically earn XP and maintain your streak. Watch lessons, complete courses, and stay consistent!
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info Banner - Remove in production */}
        <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="text-yellow-600 text-lg">🔍</div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Debug Info (Remove in Production)</h3>
              <div className="text-xs text-gray-700 space-y-1">
                <p><strong>Trial Status:</strong> {trialStatus.isActive ? 'Active' : 'Inactive'} | Expired: {trialStatus.isExpired ? 'Yes' : 'No'} | Days Left: {trialStatus.daysRemaining}</p>
                <p><strong>Subscription Status:</strong> {subActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Access Granted:</strong> {trialStatus.isActive || subActive ? 'Yes' : 'No'}</p>
                <p><strong>Secure Storage:</strong> {secureStorage.isSubscriptionActive() ? 'Active' : 'Inactive'}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
              </div>
              <div className="mt-3 flex space-x-2">
                <button 
                  onClick={() => {
                    secureStorage.setSubscriptionActive(true);
                    setSubActive(true);
                    console.log('✅ Manually set subscription to active');
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                >
                  Set Sub Active
                </button>
                <button 
                  onClick={() => {
                    secureStorage.setSubscriptionActive(false);
                    setSubActive(false);
                    console.log('❌ Manually set subscription to inactive');
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                >
                  Set Sub Inactive
                </button>
                <button 
                  onClick={() => fetchSubscriptionStatus()}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Refresh Sub Status
                </button>
              </div>
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
                        <span className="text-sm text-gray-600">
                          <strong>{currentCourse.progress}%</strong> complete
                        </span>
                        <span className="text-sm text-gray-500">
                          {currentCourse.totalLessons - currentCourse.completedLessons} videos remaining
                        </span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">
                        {currentCourse.progress > 0 ? 'Keep going! 🚀' : 'Start watching! 🎬'}
                      </span>
                    </div>
                    
                    {/* Course Stats */}
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{currentCourse.completedLessons}</div>
                        <div className="text-xs text-gray-600">Videos Watched</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{currentCourse.totalLessons}</div>
                        <div className="text-xs text-gray-600">Total Videos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{currentCourse.progress}%</div>
                        <div className="text-xs text-gray-600">Progress</div>
                      </div>
                    </div>
                    
                    {/* Continue Learning Button */}
                    <div className="mt-4">
                      <button 
                        onClick={() => {
                          if (trialStatus.isExpired && !subActive) {
                            navigate('/profile');
                          } else {
                            navigate(`/course/${currentCourse.id}`);
                          }
                        }}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                          trialStatus.isExpired && !subActive
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                        }`}
                      >
                        <span>
                          {trialStatus.isExpired && !subActive ? '🔒 Upgrade to Access' : '🎬 Continue Learning'}
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
                            "Good start! Watch a few more videos to reach the 50% milestone!"
                          ) : (
                            "Watch your first video to earn the 'First Steps' badge!"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 19 16.5 19c-1.746 0-3.332-.523-4.5-1.253" />
                    </svg>
                  </div>
                  
                  {/* Check if user has been viewing courses recently */}
                  {(() => {
                    try {
                      const recentCourseId = localStorage.getItem('recent_course_id');
                      const recentCourseProgress = localStorage.getItem('recent_course_progress');
                      const recentTimestamp = localStorage.getItem('recent_course_timestamp');
                      
                      if (recentCourseId && recentCourseProgress && recentTimestamp) {
                        const timeDiff = Date.now() - new Date(recentTimestamp).getTime();
                        const hoursAgo = timeDiff / (1000 * 60 * 60);
                        
                        if (hoursAgo < 24) { // Within last 24 hours
                          return (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">Continue Your Learning Journey</h3>
                              <p className="text-gray-600 mb-4">
                                You were recently learning! Pick up where you left off or explore new courses.
                              </p>
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-blue-200">
                                <div className="flex items-center space-x-3">
                                  <div className="text-2xl">🎬</div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">Recent Activity</h4>
                                    <p className="text-xs text-gray-700">
                                      You were working on a course recently. Your progress is being tracked!
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button 
                                  onClick={() => {
                                    if (trialStatus.isExpired && !subActive) {
                                      navigate('/profile');
                                    } else {
                                      navigate(`/course/${recentCourseId}`);
                                    }
                                  }}
                                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    trialStatus.isExpired && !subActive
                                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                                  }`}
                                >
                                  {trialStatus.isExpired && !subActive ? 'Upgrade to Access' : 'Continue Learning'}
                                </button>
                                <button 
                                  onClick={() => navigate('/courses')}
                                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                                >
                                  Browse All Courses
                                </button>
                              </div>
                            </div>
                          );
                        }
                      }
                      
                      // Default message for new users
                      return (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Start Learning?</h3>
                          <p className="text-gray-600 mb-4">
                            Choose your first course and begin your learning journey today!
                          </p>
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4 border border-green-200">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">🎯</div>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm">Quick Start Guide</h4>
                                <p className="text-xs text-gray-700">
                                  Browse our course catalog, pick a topic that interests you, and click "Start Learning" to begin!
                                </p>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => navigate('/courses')}
                            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                          >
                            Browse All Courses
                          </button>
                        </div>
                      );
                    } catch (error) {
                      // Fallback to default message
                      return (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Start Learning?</h3>
                          <p className="text-gray-600 mb-4">
                            Choose your first course and begin your learning journey today!
                          </p>
                          <button 
                            onClick={() => {
                              if (trialStatus.isExpired && !subActive) {
                                navigate('/profile');
                              } else {
                                navigate('/courses');
                              }
                            }}
                            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                              trialStatus.isExpired && !subActive
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                                : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
                            }`}
                          >
                            {trialStatus.isExpired && !subActive ? 'Upgrade to Access' : 'Browse All Courses'}
                          </button>
                        </div>
                      );
                    }
                  })()}
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
              ) : recommendedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendedCourses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {course.title.split(' ').map(word => word[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{course.instructor}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center space-x-1">
                              <FaStar className="text-yellow-400" />
                              <span>{course.rating}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FaUsers className="text-gray-400" />
                              <span>{course.enrolledStudents}</span>
                            </span>
                          </div>
                          <div className="mt-3">
                            <button 
                              onClick={() => {
                                if (trialStatus.isExpired && !subActive) {
                                  navigate('/profile');
                                } else {
                                  navigate(`/course/${course.id}`);
                                }
                              }} 
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                trialStatus.isExpired && !subActive
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-primary-600 text-white hover:bg-primary-700'
                              }`}
                            >
                              {trialStatus.isExpired && !subActive ? 'Upgrade to Access' : 'Start Learning'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Yet</h3>
                  <p className="text-gray-600 mb-4">Explore our course catalog to find your next learning adventure</p>
                  <button 
                    onClick={() => {
                      if (trialStatus.isExpired && !subActive) {
                        navigate('/profile');
                      } else {
                        navigate('/courses');
                      }
                    }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      trialStatus.isExpired && !subActive
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {trialStatus.isExpired && !subActive ? 'Upgrade to Access' : 'Explore Courses'}
                  </button>
                </div>
              )}
            </div>

            {/* Social Proof */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Standing</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <FaCrown className="text-yellow-500 text-xl" />
                    <h4 className="font-semibold text-gray-900">Class Ranking</h4>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{userStats.class_ranking}</p>
                  <p className="text-sm text-gray-600">You're ahead of most learners in your batch!</p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
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
                        if (trialStatus.isExpired && !subActive) {
                          navigate('/profile');
                        } else {
                          navigate('/courses');
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        trialStatus.isExpired && !subActive
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      }`}
                    >
                      {trialStatus.isExpired && !subActive ? 'Upgrade to Access' : 'Explore Courses'}
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

            {/* Badges */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Badges Earned</h3>
              <div className="space-y-3">
                {badges.map((badge) => (
                  <div key={badge.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                    badge.earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="text-2xl">{badge.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{badge.name}</h4>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                      {badge.earned && badge.earnedDate && (
                        <p className="text-xs text-green-600">Earned {badge.earnedDate}</p>
                      )}
                      {!badge.earned && badge.progress && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${badge.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{badge.progress}% complete</p>
                        </div>
                      )}
                    </div>
                    {badge.earned && <FaCheckCircle className="text-green-500" />}
                  </div>
                ))}
              </div>
            </div>

            {/* XP & Level */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Experience Points</h3>
              
              {userStats.xp === 0 ? (
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-400 mb-2">
                    Level 1
                  </div>
                  <p className="text-sm text-gray-600 mb-2">0 total XP</p>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-green-800 font-medium">
                      🎯 Complete your first lesson to earn 50 XP and unlock your potential!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <div className={`text-3xl font-bold ${getLevelColor(userStats.level)}`}>
                    Level {userStats.level}
                  </div>
                  <p className="text-sm text-gray-600">{userStats.xp.toLocaleString()} total XP</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Next level: {((userStats.level * 1000) - userStats.xp).toLocaleString()} XP needed
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    achievement.earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div>
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">+{achievement.xp} XP</div>
                      {achievement.earned && (
                        <FaCheckCircle className="text-green-500 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FaCrown className="text-yellow-500 text-xl" />
                <h3 className="font-semibold text-gray-900">Subscription</h3>
              </div>
              
              {trialStatus.isActive && !subActive ? (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-red-600 mb-2">{trialStatus.daysRemaining}</div>
                  <p className="text-sm text-gray-600">trial days left</p>
                  <div className="bg-red-50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-red-800 font-medium">
                      {trialStatus.daysRemaining <= 3 ? 'Upgrade now to keep learning!' : 'Upgrade to keep learning!'}
                    </p>
                  </div>
                </div>
              ) : subActive ? (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-600 mb-2">Active</div>
                  <p className="text-sm text-gray-600">subscription</p>
                  <div className="bg-green-50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-green-800 font-medium">
                      You have full access! 🎉
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-600 mb-2">No Access</div>
                  <p className="text-sm text-gray-600">subscription required</p>
                  <div className="bg-gray-50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-gray-800 font-medium">
                      Subscribe to start learning!
                    </p>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => navigate('/profile')}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>
                  {trialStatus.isActive && !subActive ? 'Upgrade Now' : 
                   subActive ? 'Manage Subscription' : 'Subscribe Here'}
                </span>
                <FaArrowRight className="text-sm" />
              </button>
            </div>

            {/* Continue Learning CTA */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl shadow-sm border border-primary-200 p-6">
              <div className="text-center">
                <FaPlay className="text-primary-600 text-2xl mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Continue Learning</h3>
                {currentCourse ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Pick up where you left off in {currentCourse.title}
                    </p>
                    <button 
                      onClick={() => {
                        if (trialStatus.isExpired && !subActive) {
                          navigate('/profile');
                        } else {
                          navigate(`/course/${currentCourse.id}/overview`);
                        }
                      }}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        trialStatus.isExpired && !subActive
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {trialStatus.isExpired && !subActive ? 'Upgrade to Access' : 'Resume Course'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Start your learning journey today
                    </p>
                    <button 
                      onClick={() => {
                        if (trialStatus.isExpired && !subActive) {
                          navigate('/profile');
                        } else {
                          navigate('/courses');
                        }
                      }}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        trialStatus.isExpired && !subActive
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {trialStatus.isExpired && !subActive ? 'Upgrade to Access' : 'Browse Courses'}
                    </button>
                  </>
                )}
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
                    onClick={() => navigate('/profile')}
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
  );
};

export default Dashboard;
