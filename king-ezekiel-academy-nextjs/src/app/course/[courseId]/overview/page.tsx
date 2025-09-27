'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProgressRing from '@/components/ProgressRing';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { TrialStatus } from '@/utils/trialManager';
import TrialManager from '@/utils/trialManager';
import secureStorage from '@/utils/secureStorage';

const CourseOverview: React.FC = () => {
  const router = useRouter();
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading: authLoading } = useAuth();
  
  // Prevent refresh loop with ref tracking
  const hasHydratedRef = useRef(false);
  const fetchedDataRef = useRef(false);
  
  // Debug logging for refresh issues - only once
  useEffect(() => {
    console.log('🔄 CourseOverview component mounted');
    console.log('📋 Course ID:', courseId);
    console.log('👤 User state:', user);
  }, []); // Only once
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<number>(0);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isActive: false,
    startDate: '',
    endDate: '',
    daysRemaining: 0,
    totalDays: 0,
    isExpired: true
  });
  const [subActive, setSubActive] = useState<boolean>(false);
  const [databaseSubscriptionStatus, setDatabaseSubscriptionStatus] = useState<boolean>(false);


  // Check database subscription status - FIXED to match CRA behavior EXACTLY
  const checkSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return false;
    
    try {
      const supabase = createClient();
      const { data: subscriptionData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (subError || !subscriptionData || subscriptionData.length === 0) {
        console.log('No active subscription found:', subError);
        setDatabaseSubscriptionStatus(false);
        return false;
      } else {
        // Check if subscription is actually active (not cancelled) - exact CRA logic  
        const subscription = subscriptionData[0];
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
        
        setDatabaseSubscriptionStatus(isActuallyActive ? true : false);
        console.log('Active subscription found and validated:', subscription, 'isActuallyActive:', isActuallyActive);
        return isActuallyActive;
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setDatabaseSubscriptionStatus(false);
      return false;
    }
  }, [user?.id]);

  // Check trial status
  const checkTrialStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const trialManager = new TrialManager();
      const status = await trialManager.getTrialStatus();
      setTrialStatus(status);
      console.log('Trial status:', status);
    } catch (err) {
      console.error('Error checking trial status:', err);
    }
  }, [user?.id]);

  // Check local subscription status - FIXED to match CRA app logic
  const checkLocalSubscriptionStatus = useCallback(() => {
    try {
      const isActive = secureStorage.isSubscriptionActive();
      setSubActive(isActive);
      console.log('Local subscription status:', isActive);
    } catch (err) {
      console.error('Error checking local subscription:', err);
      setSubActive(false);
    }
  }, []);

  // Fetch user progress
  const fetchUserProgress = useCallback(async () => {
    if (!user?.id || !courseId) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_progress')
        .select('progress_percentage')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();
      
      if (error) {
        console.log('No progress found for this course');
        setUserProgress(0);
      } else {
        setUserProgress(data.progress_percentage || 0);
      }
    } catch (err) {
      console.error('Error fetching user progress:', err);
      setUserProgress(0);
    }
  }, [user?.id, courseId]);

  // Cache fetchCourse with proper dependencies
  const fetchCourseCallback = useCallback(async () => {
    if (!courseId || fetchedDataRef.current) return;
    
    console.log('🔍 Starting to fetch course data for ID:', courseId);
    fetchedDataRef.current = true; // Prevent double calls
    
    try {
      setLoading(true);
      setError(null);
      
      // For non-authenticated users, we can still fetch course data for viewing
      if (!user) {
        console.log('👤 Guest user viewing course - allowing read-only access');
      } else {
        // First, refresh the session to ensure we have a valid token
        const supabase = createClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
        
        if (sessionError) {
          console.log('⚠️ Session refresh failed, trying to get current session:', sessionError);
          const { data: currentSession } = await supabase.auth.getSession();
          if (!currentSession.session) {
            console.log('⚠️ No valid session for authenticated user');
          }
        }
      }
      
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('courses')
        .select(`
          *,
          course_videos (
            id,
            name,
            duration,
            order_index
          )
        `)
        .eq('id', courseId)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching course:', fetchError);
        throw fetchError;
      }
      
      if (data) {
        console.log('✅ Course data received:', data);
        setCourse(data);
      } else {
        setError('Course not found');
      }
    } catch (err) {
      console.error('❌ Error fetching course:', err);
      setError(`Failed to load course: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.id]);

  // Combined access checking logic matching CRA app - EXACT 3-test implementation  
  const checkAccess = useCallback(async () => {
    if (!user?.id) {
      console.log('⏳ No user ID available for subscription check');
      return;
    }
    
    try {
      console.log('🔍 Checking access for user:', user.id);
      
      // STEP 0: First, check if this is a free course - if so, grant access immediately
      if (course && course.access_type === 'free') {
        console.log('✅ FREE COURSE ACCESS GRANTED - Course is marked as free');
        return;
      }
      
      // STEP 1: Check database subscription status first
      const hasDatabaseSubscription = await checkSubscriptionStatus();
      console.log('📊 Database subscription status:', hasDatabaseSubscription);
      
      // STEP 2: Check secure storage subscription status
      const isSubActive = secureStorage.isSubscriptionActive();
      setSubActive(isSubActive);
      console.log('📊 Secure storage subscription:', isSubActive);
      
      // STEP 3: Check trial status 
      const trialManager = new TrialManager();
      const updatedTrialStatus = await trialManager.getTrialStatus();
      console.log('📅 Trial status check result:', updatedTrialStatus);
      
      if (updatedTrialStatus) {
        setTrialStatus(updatedTrialStatus);
        
        // EXACT 3-STATE LOGIC from CRA app
        const hasAccess = updatedTrialStatus.isActive || hasDatabaseSubscription || isSubActive;
        console.log('🔐 Has access:', hasAccess, '(Trial active:', updatedTrialStatus.isActive, '| DB Sub:', hasDatabaseSubscription, '| Secure Sub:', isSubActive, ')');
        console.log('📊 State Updates - Updated trialStatus:', updatedTrialStatus, 'Updated subActive:', isSubActive, 'Updated databaseSubscriptionStatus:', hasDatabaseSubscription);
        
        if (!hasAccess) {
          console.log('🚫 ACCESS DENIED - Trial expired and no subscription');
        } else {
          console.log('✅ ACCESS GRANTED - Trial active or subscription active');
        }
      } else {
        // If no trial data, check subscription status
        const hasAccess = hasDatabaseSubscription || isSubActive;
        console.log('🔐 Access (no trial):', hasAccess, '(DB Sub:', hasDatabaseSubscription, '| Secure Sub:', isSubActive, ')');
        console.log('📊 State Updates - No trial data found - Updated subActive:', isSubActive, 'Updated databaseSubscriptionStatus:', hasDatabaseSubscription);
      }
    } catch (error) {
      console.error('❌ Error checking access:', error);
    }
  }, [user?.id, checkSubscriptionStatus, course]);

  // Hydration prevention effect with unified access checking
  useEffect(() => {
    if (hasHydratedRef.current) return;
    
    // Set hydration flag immediately  
    hasHydratedRef.current = true;
    
    // Small delay to ensure DOM is stable
    const timeoutId = setTimeout(() => {
      fetchCourseCallback();
      if (user?.id) {
        checkAccess();
        fetchUserProgress();
      }
    }, 50); // Brief delay to let hydration complete
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchCourseCallback, checkAccess, fetchUserProgress, user?.id]);

  // Simplified: Single trigger when user becomes available AND auth loading stops
  useEffect(() => {
    if (user?.id && !authLoading && hasHydratedRef.current) {
      console.log('🔄 User fully loaded and available, triggering subscription checks');
      setTimeout(() => {
        checkAccess();
        fetchUserProgress();
      }, 150); // Give auth state time to settle
    }
  }, [user?.id, authLoading, checkAccess, fetchUserProgress]);

  // Handle course access
  const handleCourseAccess = () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    // Check if this is a free course first - grant access immediately
    if (course && course.access_type === 'free') {
      // Navigate to first lesson for free course
      if (course?.course_videos && course.course_videos.length > 0) {
        const firstVideo = course.course_videos[0];
        router.push(`/course/${courseId}/lesson/${firstVideo.id}`);
      }
      return;
    }

    // Check if user has access for non-free courses
    const hasAccess = subActive || databaseSubscriptionStatus || trialStatus.isActive;
    
    if (!hasAccess) {
      router.push('/subscription');
      return;
    }

    // Navigate to first lesson
    if (course?.course_videos && course.course_videos.length > 0) {
      const firstVideo = course.course_videos[0];
      router.push(`/course/${courseId}/lesson/${firstVideo.id}`);
    } else {
      // If no videos, redirect to course page
      router.push(`/course/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Course not found</div>
          <button
            onClick={() => router.push('/courses')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const hasAccess = user && (course?.access_type === 'free' || subActive || databaseSubscriptionStatus || trialStatus.isActive);
  const totalDuration = course.course_videos?.reduce((total: number, video: any) => {
    const duration = video.duration;
    if (duration && duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length === 2) {
        return total + (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      }
    }
    return total;
  }, 0) || 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8" suppressHydrationWarning>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Course Image */}
            <div className="lg:w-1/3">
              <img
                src={course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop'}
                alt={course.title}
                className="w-full h-48 lg:h-64 object-cover rounded-lg"
              />
            </div>
            
            {/* Course Info */}
            <div className="lg:w-2/3">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-gray-600 text-lg mb-6">{course.description}</p>
              
              {/* Course Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{course.course_videos?.length || 0}</div>
                  <div className="text-sm text-gray-600">Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{formatDuration(totalDuration)}</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{course.level}</div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{userProgress}%</div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>
              
              {/* Progress Ring */}
              {user && (
                <div className="flex items-center gap-4 mb-6">
                  <ProgressRing progress={userProgress} size={80} />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Your Progress</div>
                    <div className="text-sm text-gray-600">
                      {userProgress}% complete
                    </div>
                  </div>
                </div>
              )}
              
              {/* Access Button */}
              <div className="flex gap-4">
                {!user ? (
                  <button
                    onClick={() => router.push('/signin')}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                  >
                    Sign In to Access
                  </button>
                ) : !hasAccess ? (
                  <button
                    onClick={() => router.push('/subscription')}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                  >
                    Subscribe to Access
                  </button>
                ) : (
                  <button
                    onClick={handleCourseAccess}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                  >
                    {userProgress > 0 ? 'Continue Learning' : 'Start Course'}
                  </button>
                )}
                
                <button
                  onClick={() => router.push('/courses')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Back to Courses
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lessons List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Course Lessons</h2>
              <div className="space-y-3">
                {course.course_videos?.map((video: any, index: number) => (
                  <div key={video.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{video.name}</div>
                        <div className="text-sm text-gray-600">{video.duration}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Lesson {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Course Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Course Information</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="font-medium text-gray-900">{course.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Level</div>
                  <div className="font-medium text-gray-900 capitalize">{course.level}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Created</div>
                  <div className="font-medium text-gray-900">
                    {new Date(course.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Access Status */}
            {user && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Access Status</h3>
                <div className="space-y-3">
                  {subActive && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Active Subscription</span>
                    </div>
                  )}
                  {databaseSubscriptionStatus && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Active Subscription</span>
                    </div>
                  )}
                  {trialStatus.isActive && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        Free Trial ({trialStatus.daysRemaining} days left)
                      </span>
                    </div>
                  )}
                  {!hasAccess && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">No Access</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseOverview;
