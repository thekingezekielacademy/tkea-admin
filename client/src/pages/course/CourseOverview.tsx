import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProgressRing from '../../components/ProgressRing';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const CourseOverview: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<number>(0);

  // Fetch course data function
  const fetchCourse = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // For non-authenticated users, we can still fetch course data for viewing
      // Only require authentication for actual course access
      if (!user) {
        console.log('👤 Guest user viewing course - allowing read-only access');
      } else {
        // First, refresh the session to ensure we have a valid token
        const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
        
        if (sessionError) {
          console.log('⚠️ Session refresh failed, trying to get current session:', sessionError);
          const { data: currentSession } = await supabase.auth.getSession();
          if (!currentSession.session) {
            console.log('⚠️ No valid session for authenticated user');
          }
        }
      }
      
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
        .eq('id', id)
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
  };

  // Fetch course data on mount
  useEffect(() => {
    fetchCourse();
  }, [id]);

  // Fetch user progress for this course
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!id || !user?.id) return;
      
      try {
        // First check localStorage for recent progress
        const recentCourseId = localStorage.getItem('recent_course_id');
        const recentCourseProgress = localStorage.getItem('recent_course_progress');
        const isCompleted = localStorage.getItem('recent_course_completed') === 'true';
        
        if (recentCourseId === id) {
          if (isCompleted) {
            setUserProgress(100);
          } else {
            setUserProgress(parseInt(recentCourseProgress || '0'));
          }
          return;
        }
        
        // Try to fetch from database
        try {
          const { data: progressData, error: progressError } = await supabase
            .from('user_courses')
            .select('progress, completed_lessons, is_completed')
            .eq('user_id', user.id)
            .eq('course_id', id)
            .single();
          
          if (!progressError && progressData) {
            if (progressData.is_completed) {
              setUserProgress(100);
            } else {
              setUserProgress(progressData.progress || 0);
            }
          }
        } catch (dbError) {
          console.log('Could not fetch progress from database, using localStorage fallback');
          // Use localStorage fallback
          if (recentCourseId === id) {
            setUserProgress(parseInt(recentCourseProgress || '0'));
          }
        }
      } catch (error) {
        console.error('Error fetching user progress:', error);
      }
    };

    fetchUserProgress();
  }, [id, user?.id]);

  // Helper function to calculate total duration from videos
  const calculateTotalDuration = (videos: any[]): string => {
    if (!videos || videos.length === 0) return '0 min';
    
    let totalSeconds = 0;
    
    videos.forEach(video => {
      const duration = video.duration;
      if (duration) {
        // Handle different duration formats: "1:30:25", "5:30", "5 min", "5m 30s", etc.
        if (duration.includes(':')) {
          const parts = duration.split(':');
          if (parts.length === 2) {
            // Format: "5:30" (minutes:seconds)
            totalSeconds += (parseInt(parts[0]) || 0) * 60;
            totalSeconds += parseInt(parts[1]) || 0;
          } else if (parts.length === 3) {
            // Format: "1:30:25" (hours:minutes:seconds)
            totalSeconds += (parseInt(parts[0]) || 0) * 3600; // hours to seconds
            totalSeconds += (parseInt(parts[1]) || 0) * 60;   // minutes to seconds
            totalSeconds += parseInt(parts[2]) || 0;           // seconds
          }
        } else if (duration.includes('min') || duration.includes('m')) {
          const match = duration.match(/(\d+)/);
          if (match) totalSeconds += (parseInt(match[1]) || 0) * 60;
        } else if (duration.includes('h') || duration.includes('hour')) {
          const match = duration.match(/(\d+)/);
          if (match) totalSeconds += (parseInt(match[1]) || 0) * 3600;
        } else {
          // Try to parse as just a number (assume minutes)
          const num = parseInt(duration);
          if (!isNaN(num)) totalSeconds += num * 60;
        }
      }
    });
    
    // Convert total seconds to hours, minutes, seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Format the result
    if (hours > 0) {
      if (minutes === 0 && seconds === 0) {
        return `${hours}h`;
      } else if (seconds === 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${hours}h ${minutes}m ${seconds}s`;
      }
    } else if (minutes > 0) {
      if (seconds === 0) {
        return `${minutes}m`;
      } else {
        return `${minutes}m ${seconds}s`;
      }
    } else {
      return `${seconds}s`;
    }
  };

  const startCourse = () => {
    if (!user) {
      // Redirect non-authenticated users to sign in
      navigate('/signin', { 
        state: { 
          redirectTo: `/course/${id}/lesson/${course?.course_videos?.[0]?.id || '1'}`,
          message: 'Please sign in to access this course'
        }
      });
      return;
    }
    
    if (course?.course_videos && course.course_videos.length > 0) {
      navigate(`/course/${id}/lesson/${course.course_videos[0].id}`);
    } else {
      navigate(`/course/${id}/lesson/1`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchCourse();
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

  // No course data
  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-700 font-medium mb-3">Course not found</p>
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold">Browse all courses 📚</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guest User Banner */}
        {!user && (
          <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl border border-purple-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">👋 Preview Mode</h3>
                  <p className="text-purple-100">You're viewing this course as a guest. Sign in to start learning and track your progress!</p>
                </div>
              </div>
              <div className="text-right">
                <button 
                  onClick={() => navigate('/signin')}
                  className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Sign In to Start
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary-700 to-primary-500 text-white p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 sm:mb-3 leading-tight">{course.title || 'Course Title'}</h1>
            <p className="text-primary-100 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">{course.description || 'A clean, cinematic overview that invites you to begin immediately.'}</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <button onClick={startCourse} className="w-full sm:w-auto bg-white text-primary-700 font-semibold px-4 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-primary-50 transition text-sm sm:text-base">
                {user ? 'Start Course' : 'Sign In to Start'}
              </button>
              {user && (
                <div className="bg-white/10 rounded-full p-1 self-center sm:self-auto">
                  <ProgressRing size={48} strokeWidth={5} progress={userProgress} className="sm:hidden" />
                  <ProgressRing size={64} strokeWidth={6} progress={userProgress} className="hidden sm:block" />
                </div>
              )}
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white border rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500">Lessons</div>
            <div className="text-lg sm:text-xl font-bold">{course.course_videos?.length || 0}</div>
          </div>
          <div className="bg-white border rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500">Duration</div>
            <div className="text-lg sm:text-xl font-bold">{calculateTotalDuration(course.course_videos || [])}</div>
          </div>
          <div className="bg-white border rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500">Level</div>
            <div className="text-lg sm:text-xl font-bold capitalize">{course.level || 'Beginner'}</div>
          </div>
        </div>

        {/* Rewards & Motivation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white border rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold mb-2">Course Rewards</h2>
            <ul className="text-gray-700 list-disc list-inside space-y-1 text-sm sm:text-base">
              <li>🏅 Badge unlocked at 100%</li>
              <li>🎓 Certificate available on completion</li>
            </ul>
          </div>
          <div className="bg-white border rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold mb-2">Motivation</h2>
            <p className="text-gray-700 text-sm sm:text-base">“In 7 days, you could master this skill — let’s start today.”</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseOverview;


