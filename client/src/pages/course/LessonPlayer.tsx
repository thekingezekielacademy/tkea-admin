import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProgressRing from '../../components/ProgressRing';
import SimpleVideoPlayer from '../../components/SimpleVideoPlayer';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { TrialStatus } from '../../utils/trialManager';
import secureStorage from '../../utils/secureStorage';
import { notificationService } from '../../utils/notificationService';

const LessonPlayer: React.FC = () => {
  const navigate = useNavigate();
  const { id, lessonId } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
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
  const [userStreak, setUserStreak] = useState<number>(0);
  const [relatedCourses, setRelatedCourses] = useState<any[]>([]);
  const [loadingRelatedCourses, setLoadingRelatedCourses] = useState<boolean>(false);

  // Fetch course and lesson data function
  const fetchCourseAndLesson = async () => {
    if (!id || !lessonId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // First, refresh the session to ensure we have a valid token
      const { error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError) {
        console.log('⚠️ Session refresh failed, trying to get current session:', sessionError);
        const { data: currentSession } = await supabase.auth.getSession();
        if (!currentSession.session) {
          setError('Authentication required. Please sign in again.');
          setLoading(false);
          return;
        }
      }

      // Try database operations first, then fall back to localStorage
      if (user?.id) {
        try {
          // Try to auto-enroll user in course
          const { error: enrollError } = await supabase
            .from('user_courses')
            .upsert({
              user_id: user.id,
              course_id: id,
              progress: 0,
              completed_lessons: '[]',
              last_accessed: new Date().toISOString(),
              is_active: true
            }, {
              onConflict: 'user_id,course_id'
            });

          if (!enrollError) {
            console.log('✅ User auto-enrolled in course via database');
          } else {
            console.log('Database enrollment failed, using localStorage fallback');
          }
        } catch (error) {
          console.log('Database operation failed, using localStorage fallback');
        }
      }

      // Always store in localStorage as backup
      try {
        localStorage.setItem('recent_course_id', id);
        localStorage.setItem('recent_course_progress', '0'); // Start at 0%
        localStorage.setItem('recent_course_timestamp', new Date().toISOString());
        console.log('✅ Course activity stored in localStorage');
      } catch (localStorageError) {
        console.log('Could not store course activity in localStorage');
      }
      
      // Fetch course with all videos
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          course_videos (
            id,
            name,
            duration,
            link,
            order_index
          )
        `)
        .eq('id', id)
        .single();
      
      if (courseError) {
        console.error('❌ Error fetching course:', courseError);
        throw courseError;
      }
      
      if (courseData) {
        console.log('✅ Course data received:', courseData);
          setCourse(courseData);
          
          // Find the current lesson by lessonId
          const videos = courseData.course_videos || [];
          const sortedVideos = videos.sort((a: any, b: any) => a.order_index - b.order_index);
          
          // Try to find lesson by ID first, then by order index
          let foundVideo = videos.find((v: any) => v.id === lessonId);
          if (!foundVideo) {
            // If lessonId is a number, treat it as order index
            const lessonIndex = parseInt(lessonId) - 1;
            foundVideo = sortedVideos[lessonIndex];
          }
          
          if (foundVideo) {
            console.log('🎥 Found video:', foundVideo);
            console.log('🔗 Video link from database:', foundVideo.link);
            setCurrentVideo(foundVideo);
            setCurrentLessonIndex(sortedVideos.findIndex((v: any) => v.id === foundVideo.id));
          } else {
            // Default to first video if lesson not found
            if (sortedVideos.length > 0) {
              setCurrentVideo(sortedVideos[0]);
              setCurrentLessonIndex(0);
            }
          }
        } else {
          setError('Course not found');
        }
      } catch (err) {
        console.error('❌ Error fetching course:', err);
        setError(`Failed to load course: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

  // Check database subscription status
  const checkDatabaseSubscription = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        console.log('✅ Found active subscription in database:', data);
        setDatabaseSubscriptionStatus(true);
        return true;
      } else {
        console.log('❌ No active subscription found in database');
        setDatabaseSubscriptionStatus(false);
        return false;
      }
    } catch (error) {
      console.log('⚠️ Database subscription check failed (table may not exist yet):', error);
      setDatabaseSubscriptionStatus(false);
      return false;
    }
  };

  // Fetch user streak data
  const fetchUserStreak = async () => {
    if (!user?.id) return;
    
    try {
      // Try to get streak from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('id', user.id)
        .single();
      
      if (!profileError && profileData) {
        setUserStreak(profileData.current_streak || 0);
        console.log('✅ User streak fetched:', profileData.current_streak);
      } else {
        // Fallback: calculate streak from lesson completion data
        const { data: lessonData, error: lessonError } = await supabase
          .from('user_lesson_progress')
          .select('completed_at')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .order('completed_at', { ascending: false });
        
        if (!lessonError && lessonData) {
          // Calculate streak based on consecutive days with completed lessons
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          let streak = 0;
          let currentDate = new Date(today);
          
          for (let i = 0; i < 30; i++) { // Check last 30 days
            const dateStr = currentDate.toISOString().split('T')[0];
            const hasLessonOnDate = lessonData.some(lesson => 
              lesson.completed_at?.startsWith(dateStr)
            );
            
            if (hasLessonOnDate) {
              streak++;
              currentDate.setDate(currentDate.getDate() - 1);
            } else {
              break;
            }
          }
          
          setUserStreak(streak);
          console.log('✅ Calculated streak from lesson data:', streak);
        } else {
          setUserStreak(0);
          console.log('❌ Could not fetch streak data');
        }
      }
    } catch (error) {
      console.log('⚠️ Error fetching user streak:', error);
      setUserStreak(0);
    }
  };

  // Fetch related courses
  const fetchRelatedCourses = async () => {
    if (!course) {
      console.log('❌ No course data available for related courses');
      return;
    }
    
    setLoadingRelatedCourses(true);
    console.log('🔍 Fetching related courses for course:', course.id);
    console.log('📋 Full course object:', course);
    console.log('🏷️ Course category:', course.category);
    
    try {
      // First, let's check what courses exist in the database
      const { data: allCourses, error: allCoursesError } = await supabase
        .from('courses')
        .select('id, title, category')
        .limit(10);
      
      console.log('📊 All courses in database:', allCourses);
      console.log('📊 All courses error:', allCoursesError);
      
      // First try to get courses from the same category
      let relatedData = null;
      let relatedError = null;
      
      if (course.category) {
        console.log('🔍 Searching for courses with category:', course.category);
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, cover_photo_url, category, level, description')
          .eq('category', course.category)
          .neq('id', course.id)
          .limit(3);
        
        relatedData = data;
        relatedError = error;
        console.log('📊 Category-based query result:', { data: data?.length, error, results: data });
      } else {
        console.log('⚠️ Course has no category field');
      }
      
      if (!relatedError && relatedData && relatedData.length > 0) {
        setRelatedCourses(relatedData);
        console.log('✅ Related courses fetched by category:', relatedData.length);
        setLoadingRelatedCourses(false);
        return;
      }
      
      // Fallback: get random courses
      console.log('🔄 Trying fallback: random courses');
      const { data: randomData, error: randomError } = await supabase
        .from('courses')
        .select('id, title, cover_photo_url, category, level, description')
        .neq('id', course.id)
        .limit(3);
      
      console.log('📊 Random courses query result:', { data: randomData?.length, error: randomError, results: randomData });
      
      if (!randomError && randomData) {
        setRelatedCourses(randomData);
        console.log('✅ Random courses fetched as fallback:', randomData.length);
      } else {
        console.log('❌ Could not fetch any courses:', randomError);
        setRelatedCourses([]);
      }
    } catch (error) {
      console.log('⚠️ Error fetching related courses:', error);
      setRelatedCourses([]);
    } finally {
      setLoadingRelatedCourses(false);
    }
  };

  // Check trial and subscription status
  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id) return;
      
      try {
        console.log('🔍 Checking access for user:', user.id);
        
        // Check database subscription status first and get the result
        const hasDatabaseSubscription = await checkDatabaseSubscription();
        
        // Check subscription status from secure storage
        const isSubActive = secureStorage.isSubscriptionActive();
        setSubActive(isSubActive);
        console.log('📊 Subscription status:', isSubActive);
        console.log('📊 Database subscription status:', hasDatabaseSubscription);
        
        // Check trial status from localStorage
        const localTrial = localStorage.getItem('user_trial_status');
        console.log('📅 Local trial data:', localTrial);
        
        if (localTrial) {
          try {
            const parsedTrial = JSON.parse(localTrial);
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
            console.log('📊 Trial status:', updatedTrialStatus);
            
            // Check if access should be granted (prioritize database subscription)
            const hasAccess = updatedTrialStatus.isActive || hasDatabaseSubscription || isSubActive;
            console.log('🔐 Has access:', hasAccess, '(Trial active:', updatedTrialStatus.isActive, '| DB Sub:', hasDatabaseSubscription, '| Secure Sub:', isSubActive, ')');
            
            // Redirect if NO access (trial expired AND no subscription)
            if (!hasAccess) {
              console.log('🚫 ACCESS DENIED - Trial expired and no subscription - redirecting to profile');
              navigate('/profile', { replace: true });
              return;
            } else {
              console.log('✅ ACCESS GRANTED - Trial active or subscription active');
            }
          } catch (parseError) {
            console.error('❌ Failed to parse localStorage trial data:', parseError);
          }
        } else {
          console.log('⚠️ No trial data found in localStorage');
          // If no trial data, check if user has subscription (prioritize database)
          if (!hasDatabaseSubscription && !isSubActive) {
            console.log('🚫 No trial data and no subscription - redirecting to profile');
            navigate('/profile', { replace: true });
            return;
          } else {
            console.log('✅ ACCESS GRANTED - Database subscription or secure storage subscription active');
          }
        }
      } catch (error) {
        console.error('❌ Error checking access:', error);
      }
    };
    
    checkAccess();
  }, [user?.id, navigate]);

  // Fetch course and lesson data on mount
  useEffect(() => {
    fetchCourseAndLesson();
  }, [id, lessonId, user?.id]);

  // Fetch user streak when user changes
  useEffect(() => {
    if (user?.id) {
      fetchUserStreak();
    }
  }, [user?.id]);

  // Fetch related courses when course changes
  useEffect(() => {
    if (course) {
      fetchRelatedCourses();
    }
  }, [course]);

  // Handle video player events
  const handleVideoPlay = () => {
    console.log(`Lesson ${lessonId} video started playing`);
    // Track video start for analytics
  };

  const handleVideoPause = () => {
    console.log(`Lesson ${lessonId} video paused`);
    // Track video pause for progress
  };

  const handleVideoEnded = async () => {
    console.log(`Lesson ${lessonId} video completed`);
    
    if (!user?.id || !id || !lessonId) return;
    
    try {
      // Try database operations first, then fall back to localStorage
      if (user?.id) {
        try {
          // Mark lesson as completed in user_lesson_progress
          console.log('📊 Tracking lesson completion:', {
            user_id: user.id,
            course_id: id,
            lesson_id: lessonId
          });

          const { error: progressError } = await supabase
            .from('user_lesson_progress')
            .upsert({
              user_id: user.id,
              course_id: id,
              lesson_id: lessonId,
              is_completed: true,
              completed_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,lesson_id'
            });

          if (!progressError) {
            console.log('✅ Lesson completion tracked in database');
            
            // Update user_courses table with new completed lessons count
            console.log('🔄 SYNC: Starting user_courses update for course:', id);
            try {
              // Get current completed lessons count for this course
              const { data: currentProgress, error: progressQueryError } = await supabase
                .from('user_lesson_progress')
                .select('lesson_id')
                .eq('user_id', user.id)
                .eq('course_id', id)
                .eq('is_completed', true);

              console.log('🔄 SYNC: Query result:', { currentProgress, progressQueryError });

              if (!progressQueryError && currentProgress) {
                const completedCount = currentProgress.length;
                console.log('🔄 SYNC: Found completed lessons:', completedCount);
                
                // Update user_courses table
                const { error: userCoursesError } = await supabase
                  .from('user_courses')
                  .update({
                    completed_lessons: completedCount,
                    progress: completedCount > 0 ? Math.round((completedCount / (course?.videos?.length || 1)) * 100) : 0,
                    last_accessed: new Date().toISOString()
                  })
                  .eq('user_id', user.id)
                  .eq('course_id', id);

                console.log('🔄 SYNC: Update result:', { userCoursesError });

                if (!userCoursesError) {
                  console.log('✅ User courses table updated with progress:', {
                    courseId: id,
                    completedCount,
                    totalVideos: course?.videos?.length || 0,
                    progressPercentage: Math.round((completedCount / (course?.videos?.length || 1)) * 100)
                  });
                } else {
                  console.log('❌ Failed to update user_courses:', userCoursesError);
                }
              } else {
                console.log('❌ SYNC: Failed to query user_lesson_progress:', progressQueryError);
              }
            } catch (updateError) {
              console.log('❌ Error updating user_courses:', updateError);
            }
            
            // Send notification for lesson completion
            if (notificationService.isNotificationEnabled()) {
              try {
                await notificationService.sendNotification({
                  title: '🎉 Lesson Completed!',
                  body: `Great job! You've completed "${currentVideo.name}". Keep up the momentum!`,
                  tag: 'lesson-completed',
                  requireInteraction: false,
                  actions: [
                    { action: 'continue', title: 'Next Lesson' },
                    { action: 'view', title: 'View Progress' }
                  ]
                });
              } catch (notificationError) {
                console.log('Notification send failed:', notificationError);
              }
            }
          } else {
            console.log('❌ Database tracking failed:', progressError);
            console.log('Using localStorage fallback');
          }

          // Try to update XP and streak
          try {
            const { error: xpError } = await supabase.rpc('update_user_xp_and_streak', {
              user_id: user.id,
              xp_to_add: 50, // +50 XP for completing a lesson
              activity_type: 'lesson_completion'
            });

            if (!xpError) {
              console.log('✅ XP and streak updated in database');
            } else {
              console.log('XP update failed (function might not exist yet)');
            }
          } catch (xpError) {
            console.log('XP update function not available yet');
          }
        } catch (error) {
          console.log('Database operations failed, using localStorage fallback');
        }
      }
      
      // Update local state to show lesson as completed
      setCompletedLessons(prev => {
        const newSet = new Set(prev);
        newSet.add(lessonId);
        return newSet;
      });

      // Always update localStorage as backup
      try {
        const currentProgress = completedLessons.size + 1; // +1 for this lesson
        const totalLessons = course?.course_videos?.length || 1;
        const progressPercentage = Math.round((currentProgress / totalLessons) * 100);
        
        localStorage.setItem('recent_course_id', id); // Add course ID
        localStorage.setItem('recent_course_progress', progressPercentage.toString());
        localStorage.setItem('recent_course_timestamp', new Date().toISOString());
        console.log('✅ Progress updated in localStorage:', progressPercentage + '%');
      } catch (localStorageError) {
        console.log('Could not update localStorage progress');
      }

    } catch (error) {
      console.error('Error in lesson completion tracking:', error);
    }
  };

  const nextLesson = () => {
    if (course?.course_videos && currentLessonIndex < course.course_videos.length - 1) {
      const nextVideo = course.course_videos[currentLessonIndex + 1];
      navigate(`/course/${id}/lesson/${nextVideo.id}`);
    }
  };

  const handleCourseCompletion = async () => {
    try {
      // Mark course as completed in database
      const { error: completionError } = await supabase
        .from('user_courses')
        .upsert({
          user_id: user.id,
          course_id: id,
          progress: 100,
          completed_lessons: course?.course_videos?.length || 0,
          last_accessed: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          is_completed: true
        });

      if (completionError) {
        console.log('Could not save course completion to database, using localStorage fallback');
      }

      // Award bonus XP for completing entire course (200 XP bonus)
      try {
        const { error: xpError } = await supabase.rpc('update_user_xp_and_streak', {
          user_id: user.id,
          xp_gain: 200,
          activity_type: 'course_completed'
        });

        if (!xpError) {
          console.log('✅ Awarded 200 XP bonus for completing course');
        } else {
          console.log('Could not award course completion XP:', xpError);
        }
        
        // Send course completion notification
        if (notificationService.isNotificationEnabled()) {
          try {
            await notificationService.sendCourseCompletionNotification(course?.title || 'Course');
          } catch (notificationError) {
            console.log('Course completion notification failed:', notificationError);
          }
        }
      } catch (xpError) {
        console.log('XP system not available yet');
      }

      // Update localStorage
      localStorage.setItem('recent_course_id', id);
      localStorage.setItem('recent_course_progress', '100');
      localStorage.setItem('recent_course_timestamp', new Date().toISOString());
      localStorage.setItem('recent_course_completed', 'true');

      // Show completion message and redirect to courses page
      alert('🎉 Congratulations! You have completed this course!');
      navigate('/courses');
    } catch (error) {
      console.error('Error completing course:', error);
      // Still redirect even if saving fails
      navigate('/courses');
    }
  };

  const prevLesson = () => {
    if (course?.course_videos && currentLessonIndex > 0) {
      const prevVideo = course.course_videos[currentLessonIndex - 1];
      navigate(`/course/${id}/lesson/${prevVideo.id}`);
    }
  };

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  };

  const formatDuration = (duration: string) => {
    if (duration.includes(':')) {
      return duration;
    } else if (duration.includes('m') && duration.includes('s')) {
      return duration;
    } else if (duration.startsWith('PT')) {
      const minutes = duration.match(/(\d+)M/)?.[1] || '0';
      const seconds = duration.match(/(\d+)S/)?.[1] || '0';
      return `${minutes}:${seconds.padStart(2, '0')}`;
    }
    return duration;
  };

  // Check if video is YouTube
  const isYouTubeVideo = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchCourseAndLesson();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate('/courses')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No course or video data
  if (!course || !currentVideo) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-700 font-medium mb-3">Lesson not found</p>
            <button 
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Back to Courses Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold">Want to explore more courses? 🚀</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block md:col-span-3 bg-white border rounded-xl h-fit p-4">
          <div className="font-bold mb-3">Lessons</div>
          <div className="space-y-2">
            {course.course_videos?.sort((a: any, b: any) => a.order_index - b.order_index).map((video: any, index: number) => {
              const isCompleted = completedLessons.has(video.id);
              
              return (
                <div 
                  key={video.id} 
                  className={`px-3 py-2 rounded border cursor-pointer flex items-center justify-between ${
                    currentVideo.id === video.id 
                      ? 'bg-primary-50 border-primary-200 text-primary-700' 
                      : isCompleted 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'hover:bg-gray-50'
                  }`}
                  onClick={() => navigate(`/course/${id}/lesson/${video.id}`)}
                >
                  <span>{video.name || `Lesson ${index + 1}`}</span>
                  {isCompleted && (
                    <span className="text-green-600">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Player */}
        <main className="col-span-12 md:col-span-6">
          <div className="bg-white rounded-xl border overflow-hidden mb-4">
            <div className="p-4 border-b flex items-center justify-between gap-4">
              <div>
                <div className="font-bold">{currentVideo.name}</div>
                <div className="h-1.5 bg-gray-100 rounded mt-2">
                  <div 
                    className="h-1.5 bg-primary-500 rounded transition-all" 
                    style={{ width: `${((currentLessonIndex + 1) / (course.course_videos?.length || 1)) * 100}%` }}
                  />
                </div>
                              <div className="text-xs text-gray-500 mt-1">
                {currentLessonIndex + 1} of {course.course_videos?.length || 0} lessons
                {completedLessons.size > 0 && (
                  <span className="ml-2 text-green-600">
                    • {completedLessons.size} completed
                  </span>
                )}
                </div>
              </div>
              <div className="hidden sm:block">
                <ProgressRing 
                  size={52} 
                  strokeWidth={6} 
                  progress={Math.round(((currentLessonIndex + 1) / (course.course_videos?.length || 1)) * 100)} 
                />
              </div>
            </div>
            <div className="w-full overflow-hidden" style={{ minHeight: '280px', height: '55vh', maxHeight: '580px', margin: 0, padding: 0, marginBottom: 0 }}>
              {isYouTubeVideo(currentVideo.link) ? (
                <SimpleVideoPlayer
                  src={getYouTubeVideoId(currentVideo.link)}
                  type="youtube"
                  title={currentVideo.name}
                  autoplay={false}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
                  <div className="text-center">
                    <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">Video Player</p>
                    <p className="text-sm text-gray-300">
                      {currentVideo.link.includes('http') ? 'Direct video link detected' : 'Video source not supported'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Currently supporting YouTube videos only
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 px-4 -mt-2">
              <span>Duration: {formatDuration(currentVideo.duration)}</span>
              <span>Lesson {currentLessonIndex + 1} of {course.course_videos?.length || 0}</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-700">Downloadable resources • Transcript • Notes</div>
              <div className="bg-primary-50 border border-primary-100 p-3 rounded text-sm text-primary-800">🔥 Great job! You’re on track — keep going.</div>
              <div className="flex items-center justify-between">
                <button
                  onClick={prevLesson}
                  disabled={!course?.course_videos || currentLessonIndex <= 0}
                  className={`px-4 py-2 rounded-lg border ${!course?.course_videos || currentLessonIndex <= 0 ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  Previous Lesson
                </button>
                {currentLessonIndex >= (course.course_videos?.length || 0) - 1 ? (
                  // Last lesson - show Complete Course button
                  <button 
                    onClick={handleCourseCompletion}
                    className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                  >
                    🎉 Complete Course
                  </button>
                ) : (
                  // Not last lesson - show Next Lesson button
                  <button 
                    onClick={nextLesson} 
                    className="px-4 py-2 rounded-lg border bg-primary-600 text-white hover:bg-primary-700"
                  >
                  Next Lesson
                </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile lessons list under video */}
          <div className="block md:hidden">
            <div className="bg-white border rounded-xl p-4">
              <div className="font-bold mb-3">Lessons</div>
              <div className="space-y-2">
                {course.course_videos?.sort((a: any, b: any) => a.order_index - b.order_index).map((video: any, index: number) => {
                  const isCompleted = completedLessons.has(video.id);
                  
                  return (
                    <div
                      key={video.id}
                      className={`px-3 py-2 rounded border cursor-pointer flex items-center justify-between ${
                        currentVideo.id === video.id 
                          ? 'bg-primary-50 border-primary-200 text-primary-700' 
                          : isCompleted 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'hover:bg-gray-50'
                      }`}
                      onClick={() => navigate(`/course/${id}/lesson/${video.id}`)}
                    >
                      <span>{video.name || `Lesson ${index + 1}`}</span>
                      {isCompleted && (
                        <span className="text-green-600">✓</span>
                      )}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* Right rail */}
        <aside className="col-span-12 md:col-span-3 space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold mb-1">Up Next</div>
            <div className="text-sm text-gray-600">
              {course.course_videos && currentLessonIndex < course.course_videos.length - 1 
                ? course.course_videos[currentLessonIndex + 1]?.name || `Lesson ${currentLessonIndex + 2}`
                : 'This is the last lesson'
              }
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold mb-1">Daily Streak</div>
            <div className="text-sm text-gray-600">
              {userStreak > 0 
                ? `You've learned ${userStreak} day${userStreak === 1 ? '' : 's'} in a row` 
                : 'Start your learning streak today!'
              }
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold mb-1">Related Courses</div>
            <div className="space-y-2">
              {loadingRelatedCourses ? (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Loading suggestions...
                </div>
              ) : relatedCourses.length > 0 ? (
                relatedCourses.map((course) => (
                  <div 
                    key={course.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    <img 
                      src={course.cover_photo_url || '/default-course-image.jpg'} 
                      alt={course.title}
                      className="w-8 h-8 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {course.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {course.level} • {course.category}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">No related courses found</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LessonPlayer;


