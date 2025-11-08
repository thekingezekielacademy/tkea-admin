'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaClock, FaUser, FaBook, FaTag, FaLock, FaUnlock, FaGraduationCap } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { useSidebar } from '@/contexts/SidebarContext';
import { createClient } from '@/lib/supabase/client';
import secureStorage from '@/utils/secureStorage';
import { shuffleCoursesDefault } from '@/utils/courseShuffle';
import SEOHead from '@/components/SEO/SEOHead';
import { generateCourseStructuredData } from '@/components/SEO/StructuredData';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import FixedFlutterwavePayment from '@/components/FixedFlutterwavePayment';
// Sidebar is now managed globally by Providers.tsx - no need to import here

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  cover_photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Scheduling fields
  scheduled_for?: string;
  is_scheduled?: boolean;
  status?: string;
  // Access control
  access_type?: 'free' | 'membership';
  // Transformed fields for display
  category: string;
  duration: string;
  instructor: string;
  rating: number;
  students: number;
  cover_photo: string;
  lessons: number;
}

const Courses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSort, setSelectedSort] = useState('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [databaseSubscriptionStatus, setDatabaseSubscriptionStatus] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const COURSES_PER_PAGE = 10;
  const router = useRouter();
  const { user } = useAuth();
  const { isExpanded, isMobile } = useSidebar();
  const { trackCourseView, trackSearch, trackLead } = useFacebookPixel();

  // Calculate dynamic margin based on sidebar state
  const getSidebarMargin = () => {
    if (!user) return ''; // No sidebar when not signed in
    if (isMobile) return 'ml-16'; // Mobile always uses collapsed width
    return isExpanded ? 'ml-64' : 'ml-16'; // Desktop: expanded=256px, collapsed=64px
  };

  // Ensure sidebar margin is always applied when user is logged in
  const getMainContentClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    const marginClass = getSidebarMargin();
    return `${baseClasses} ${marginClass}`.trim();
  };

  const isSubExpired = (sub: any) => {
    if (!sub) return true;
    const now = new Date();
    const end = sub.end_date ? new Date(sub.end_date) : null;
    const nextBilling = sub.next_billing_date ? new Date(sub.next_billing_date) : null;
    if (end && now > end) return true;
    if (nextBilling && now > nextBilling) return true;
    return false;
  };

  const checkDatabaseSubscription = async () => {
    if (!user?.id) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        const sub = data[0];
        if (isSubExpired(sub)) {
          setDatabaseSubscriptionStatus(false);
          return false;
        }
        setDatabaseSubscriptionStatus(true);
        return true;
      } else {
        setDatabaseSubscriptionStatus(false);
        return false;
      }
    } catch (error) {
      setDatabaseSubscriptionStatus(false);
      return false;
    }
  };

  // Check subscription status when user changes
  useEffect(() => {
    if (user) {
      checkDatabaseSubscription();
    }
  }, [user]);

  // Fetch courses from database with pagination
  const fetchCourses = async (page = 0, append = false) => {
    try {
      if (page === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      console.log(`🔍 Fetching courses page ${page}...`);
      
      // For non-authenticated users, we can still fetch courses for viewing
      // Only require authentication for actual course access
      const supabase = createClient();
      if (!user) {
        console.log('👤 Guest user fetching courses - allowing read-only access');
      } else {
        // First, refresh the session to ensure we have a valid token
        const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
        
        if (sessionError) {
          console.log('⚠️ Session refresh failed, trying to get current session:', sessionError);
          // If refresh fails, try to get current session
          const { data: currentSession } = await supabase.auth.getSession();
          if (!currentSession.session) {
            console.log('⚠️ No valid session found for authenticated user');
          }
        }
      }
      
      let query = supabase
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
        .in('status', ['published', 'scheduled']);

      // Apply category filtering
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      // Apply level filtering
      if (selectedLevel !== 'all') {
        query = query.eq('level', selectedLevel);
      }

      // Apply search filtering
      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`);
      }

      // Apply sorting
      if (selectedSort === 'latest' || selectedSort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (selectedSort === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (selectedSort === 'most-enrolled') {
        query = query.order('enrolled_students', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const from = page * COURSES_PER_PAGE;
      const to = from + COURSES_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        const transformedCourses = data.map((course: any) => ({
          ...course,
          category: course.category || 'general',
          duration: calculateTotalDuration(course.course_videos || []),
          instructor: course.instructor || 'King Ezekiel Academy',
          rating: course.rating || 4.8,
          students: course.students || course.enrolled_students || 0,
          cover_photo: course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
          lessons: course.course_videos?.length || 0
        }));

        // Shuffle courses to randomize display order (only for first page)
        const coursesToSet = page === 0 ? shuffleCoursesDefault(transformedCourses) : transformedCourses;

        if (append) {
          setCourses(prev => [...prev, ...coursesToSet]);
        } else {
          setCourses(coursesToSet);
        }

        if (data.length < COURSES_PER_PAGE) {
          setHasMore(false);
        }
      } else {
        setCourses([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
      // For non-authenticated users, show a more friendly error message
      if (!user) {
        setError('Unable to load courses at the moment. Please try again later.');
      } else {
        setError(`Failed to load courses from database: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      if (page === 0) setLoading(false);
      else setLoadingMore(false);
    }
  };

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

  // Fetch courses on component mount only
  useEffect(() => {
    fetchCourses(0, false);
  }, [user?.id]); // Run when user changes

  // Debug logging for subscription access
  useEffect(() => {
    // console.log('🔍 Subscription access debug:', {
    //   user: user?.id,
    //   subActive: databaseSubscriptionStatus || secureStorage.isSubscriptionActive()
    // });
  }, [user?.id, databaseSubscriptionStatus]);

  // Watch for filter changes and refetch courses
  useEffect(() => {
    fetchCourses(0, false);
  }, [selectedCategory, selectedLevel, selectedSort, debouncedSearchTerm]);

  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // All filtering is now done at the database level
  const filteredCourses = courses;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'web-development': return <FaBook />;
      case 'digital-marketing': return <FaTag />;
      case 'ui-ux-design': return <FaUser />;
      case 'data-analytics': return <FaTag />;
      case 'branding': return <FaTag />;
      case 'content-creation': return <FaTag />;
      default: return <FaBook />;
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'business-entrepreneurship': 'Business & Entrepreneurship',
      'branding-public-relations': 'Branding & Public Relations',
      'content-communication': 'Content & Communication',
      'digital-advertising': 'Digital Advertising',
      'email-seo-strategies': 'Email & SEO Strategies',
      'ui-ux-design': 'UI/UX Design',
      'visual-communication': 'Visual Communication',
      'video-editing-creation': 'Video Editing & Creation',
      'data-science-analytics': 'Data Science & Analytics',
      'digital-marketing': 'Digital Marketing',
      'social-media': 'Social Media',
      'seo': 'SEO',
      'ecommerce': 'E-commerce',
      'content-creation': 'Content Creation'
    };
    
    return categoryMap[category] || category?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General';
  };

  const getLevelBadge = (level: string) => {
    const levelConfig = {
      beginner: { label: 'Lv 1 – Beginner', color: 'bg-green-100 text-green-800' },
      intermediate: { label: 'Lv 2 – Intermediate', color: 'bg-yellow-100 text-yellow-800' },
      advanced: { label: 'Lv 3 – Advanced', color: 'bg-red-100 text-red-800' },
      expert: { label: 'Lv 4 – Expert', color: 'bg-purple-100 text-purple-800' },
      mastery: { label: 'Lv 5 – Mastery', color: 'bg-indigo-100 text-indigo-800' }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.beginner;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Load more courses
  const loadMoreCourses = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchCourses(nextPage, true);
    }
  };

  // Handle course click
  const handleCourseClick = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };

  // Handle course enrollment
  const handleEnroll = (courseId: string, isFree?: boolean) => {
    // Check if this is a free course - accessible to ALL users (signed-in or not)
    if (isFree === true) {
      if (user) {
        // User is signed in - go directly to course overview
        router.push(`/course/${courseId}/overview`);
      } else {
        // User is not signed in - go to signup page first, then to course
        router.push(`/signup?redirect=/course/${courseId}/overview`);
      }
      return;
    }
    
    // For paid courses, check subscription status
    if (user && databaseSubscriptionStatus) {
      // User is signed in and has active subscription - go to course overview
      router.push(`/course/${courseId}/overview`);
    } else if (user) {
      // User is signed in but no active subscription - show payment modal
      setShowPaymentModal(true);
    } else {
      // User is not signed in - go to signup page to start free
      router.push('/signup');
    }
  };

  // Helper function to get access status text
  const getAccessStatusText = (course: Course) => {
    if (course.access_type === 'free') {
      return 'Free Access';
    }
    if (user && databaseSubscriptionStatus) {
      return 'Full Access';
    }
    return 'Membership Access';
  };

  const handleNotifyMe = async (courseId: string) => {
    if (!user) {
      // User is not signed in - go to signup page
      router.push('/signup');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/courses/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success message
        alert(data.message || 'You will be notified when this course becomes available!');
      } else {
        // Show error message
        alert(data.error || 'Failed to set up notification. Please try again.');
      }
    } catch (error) {
      console.error('Error setting up notification:', error);
      alert('Failed to set up notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle button click based on user status
  const handleButtonClick = (course: Course) => {
    if (course.status === 'scheduled') {
      // Show notification for scheduled courses
      alert(`This course is coming soon! Scheduled for ${course.scheduled_for ? new Date(course.scheduled_for).toLocaleDateString() : 'TBD'}`);
      return;
    }

    if (user && databaseSubscriptionStatus) {
      // User has access - go to course
      handleCourseClick(course.id);
    } else if (user) {
      // User needs to upgrade - show payment modal
      setShowPaymentModal(true);
    } else {
      // Guest user - go to signup
      router.push('/signup');
    }
  };

  // Handle successful subscription payment
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    // Refresh subscription status
    await checkDatabaseSubscription();
    // Show success message
    alert('Subscription successful! You now have access to all premium courses.');
  };

  // Define all available categories with proper labels
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'business-entrepreneurship', label: 'Business & Entrepreneurship' },
    { value: 'branding-public-relations', label: 'Branding & Public Relations' },
    { value: 'content-communication', label: 'Content & Communication' },
    { value: 'digital-advertising', label: 'Digital Advertising' },
    { value: 'email-seo-strategies', label: 'Email & SEO Strategies' },
    { value: 'ui-ux-design', label: 'UI/UX Design' },
    { value: 'visual-communication', label: 'Visual Communication' },
    { value: 'video-editing-creation', label: 'Video Editing & Creation' },
    { value: 'data-science-analytics', label: 'Data Science & Analytics' },
    { value: 'artificial-intelligence-cloud', label: 'AI & Cloud Computing' },
    { value: 'project-workflow-management', label: 'Project & Workflow Management' },
    { value: 'information-security', label: 'Information Security' }
  ];

  // Sorting options
  const sortOptions = [
    { value: 'all', label: 'All Courses' },
    { value: 'latest', label: 'Latest (Last 10)' },
    { value: 'most-enrolled', label: 'Most Enrolled (Top 10)' }
  ];

  const levels = [
    { value: 'all', label: 'All Levels' },
    ...Array.from(new Set(courses.map(course => course.level)))
      .filter(level => level)
      .map(level => {
        const levelConfig = {
          beginner: 'Lv 1 – Beginner',
          intermediate: 'Lv 2 – Intermediate',
          advanced: 'Lv 3 – Advanced',
          expert: 'Lv 4 – Expert',
          mastery: 'Lv 5 – Mastery'
        };
        return {
          value: level,
          label: levelConfig[level as keyof typeof levelConfig] || level
        };
      })
  ];

  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setCurrentPage(0);
    setHasMore(true);
    fetchCourses(0, false);
  };

  // Handle level change
  const handleLevelChange = (newLevel: string) => {
    setSelectedLevel(newLevel);
    setCurrentPage(0);
    setHasMore(true);
    fetchCourses(0, false);
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    setSelectedSort(newSort);
    setCurrentPage(0);
    setHasMore(true);
    fetchCourses(0, false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Digital Marketing Courses - King Ezekiel Academy"
        description="Master digital marketing with our comprehensive courses designed for beginners and professionals. Learn SEO, social media, e-commerce, and more from industry experts."
      />
      
      {/* Main Content */}
      <div className={getMainContentClasses()} style={{ minHeight: '100vh' }}>
        <div className="pt-16">
          <div className={`mx-auto py-8 sm:py-12 ${isExpanded ? 'max-w-7xl px-2 sm:px-6 lg:px-8' : 'max-w-full px-2 sm:px-8 lg:px-12'}`}>
          {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  Explore Our Courses
            </h1>
                {user && (
                  <button
                    onClick={() => {
                      if (!loading) {
                        setCurrentPage(0);
                        setHasMore(true);
                        setError(null);
                        fetchCourses(0, false);
                      }
                    }}
                    disabled={loading}
                    className="p-1.5 sm:p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    title="Refresh courses"
                  >
                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed">
                Master the most in-demand digital skills with our comprehensive courses. Start free and upgrade to access all courses.
            </p>
          </div>

            {/* Beautiful Subscription Status Banner */}
            {user && (
              <div className="mb-6 sm:mb-8">
                {/* Active Subscription - Green */}
                {databaseSubscriptionStatus && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-green-400">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg md:text-2xl font-bold mb-1">🎉 Full Access Active!</h3>
                          <p className="text-green-100 text-xs sm:text-sm md:text-lg leading-relaxed">Your subscription gives you unlimited access to all courses</p>
                        </div>
                      </div>
                      <div className="text-center sm:text-right">
                        <div className="bg-white/20 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold inline-block">
                          Premium Member
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Subscription - Upgrade Banner */}
                {!databaseSubscriptionStatus && (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-orange-400">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg md:text-2xl font-bold mb-1">🔐 Unlock Premium Courses</h3>
                          <p className="text-orange-100 text-xs sm:text-sm md:text-lg leading-relaxed">Subscribe now to access all membership courses</p>
                        </div>
                      </div>
                      <div className="text-center sm:text-right">
                        <button 
                          onClick={() => setShowPaymentModal(true)}
                          className="bg-white text-orange-600 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-sm md:text-base"
                        >
                          Subscribe Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Guest User Banner - Purple */}
            {!user && (
              <div className="mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-purple-400">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg md:text-2xl font-bold mb-1">👋 Welcome Guest!</h3>
                        <p className="text-purple-100 text-xs sm:text-sm md:text-lg leading-relaxed">Browse our courses and start learning for free</p>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <button 
                        onClick={() => router.push('/signup')}
                        className="bg-white text-purple-600 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-sm md:text-base"
                      >
                        Start Learning!
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className={`mb-6 sm:mb-8 ${isExpanded ? 'max-w-7xl mx-auto px-2 sm:px-6 lg:px-8' : 'max-w-full mx-auto px-2 sm:px-8 lg:px-12'}`}>
              {/* Search Bar */}
              <div className="mb-4 sm:mb-6">
              <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                />
                </div>
            </div>

              {/* Filters - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>

                {/* Level Filter */}
                <select
                  value={selectedLevel}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm"
                >
                  {levels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>

                {/* Sort Filter */}
                <select
                  value={selectedSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm"
                >
                  {sortOptions.map(sort => (
                    <option key={sort.value} value={sort.value}>{sort.label}</option>
                  ))}
                </select>
              </div>

              {/* Active Filters Display */}
              {(selectedCategory !== 'all' || selectedLevel !== 'all' || selectedSort !== 'all') && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {categories.find(c => c.value === selectedCategory)?.label}
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className="ml-1.5 sm:ml-2 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedLevel !== 'all' && (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {levels.find(l => l.value === selectedLevel)?.label}
                      <button
                        onClick={() => handleLevelChange('all')}
                        className="ml-1.5 sm:ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedSort !== 'all' && (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {sortOptions.find(s => s.value === selectedSort)?.label}
                      <button
                        onClick={() => handleSortChange('all')}
                        className="ml-1.5 sm:ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedLevel('all');
                      setSelectedSort('all');
                      setCurrentPage(0);
                      setHasMore(true);
                      fetchCourses(0, false);
                    }}
                    className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

          {/* Loading State */}
          {loading && (
              <div className={`text-center py-8 sm:py-12 ${isExpanded ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'max-w-full mx-auto px-6 sm:px-8 lg:px-12'}`}>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading courses...</p>
                    </div>
          )}

          {/* Error State */}
          {error && (
              <div className={`text-center py-8 sm:py-12 ${isExpanded ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'max-w-full mx-auto px-6 sm:px-8 lg:px-12'}`}>
                <p className="text-red-600 text-base sm:text-lg">{error}</p>
                <button
                  onClick={() => fetchCourses(0, false)}
                  className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </button>
                    </div>
          )}

          {/* Courses Grid */}
          {!loading && !error && (
              <div className={`${isExpanded ? 'max-w-7xl mx-auto px-2 sm:px-6 lg:px-8' : 'max-w-full mx-auto px-2 sm:px-8 lg:px-12'}`}>
                {/* Shuffle Indicator */}
                <div className="col-span-full mb-4 text-center">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-full px-4 py-2">
                    <span className="text-purple-600 text-sm font-medium">🎲</span>
                    <span className="text-purple-700 text-sm">Courses are shuffled for fresh discovery every time!</span>
                  </div>
                </div>
                
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {filteredCourses.map(course => (
                    <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full">
                    <div className="relative">
                      <img
                          src={course.cover_photo || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop'} 
                        alt={course.title}
                          className="w-full h-40 sm:h-48 object-cover"
                      />
                        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                        {getLevelBadge(course.level)}
                    </div>
                        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-primary-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium flex items-center space-x-1">
                        <FaGraduationCap className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            {course.is_scheduled ? 'Coming Soon' : (user && databaseSubscriptionStatus ? 'Full Access' : 'Membership')}
                          </span>
                          <span className="sm:hidden">
                            {course.is_scheduled ? 'Soon' : (user && databaseSubscriptionStatus ? 'Access' : 'Member')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 sm:p-6">
                        <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                          {getCategoryIcon(course.category)}
                          <span className="text-xs sm:text-sm text-gray-500">{getCategoryDisplayName(course.category)}</span>
                    </div>

                        <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2 leading-tight">{course.title}</h3>
                        {course.is_scheduled && course.scheduled_for ? (
                          <div className="mb-3 sm:mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-blue-700 text-sm sm:text-base font-medium flex items-center space-x-2">
                              <span>📅</span>
                              <span>Coming Soon: {new Date(course.scheduled_for).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-600 mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">{course.description || 'No description available'}</p>
                        )}
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                            <FaClock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <FaBook className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{course.lessons} {course.lessons === 1 ? 'lesson' : 'lessons'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FaUser className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">{course.instructor}</span>
                            <span className="sm:hidden">King Ezekiel Academy</span>
                          </div>
                    </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-semibold text-primary-600 text-center px-2 py-1 bg-primary-50 rounded-full">
                              {getAccessStatusText(course)}
                            </span>
                        </div>
                          <button 
                            onClick={() => course.is_scheduled ? handleNotifyMe(course.id) : handleEnroll(course.id, course.access_type === 'free')} 
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-xs sm:text-sm font-medium ${
                              course.is_scheduled 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : course.access_type === 'free'
                                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                                  : user && databaseSubscriptionStatus
                                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                                    : user 
                                      ? 'bg-red-600 text-white hover:bg-red-700'
                                      : 'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                          >
                            {course.is_scheduled ? (
                              <>
                                <span>🔔</span>
                                <span className="truncate">Notify Me</span>
                              </>
                            ) : course.access_type === 'free' ? (
                              <>
                                <FaUnlock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">Start Learning</span>
                              </>
                            ) : user && databaseSubscriptionStatus ? (
                              <>
                                <FaUnlock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">Start Learning</span>
                              </>
                            ) : user ? (
                              <>
                                <FaLock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">Upgrade to Access</span>
                              </>
                            ) : (
                              <>
                                <FaLock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">Start Learning!</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
            </div>
          )}

          {/* Load More Button */}
            {hasMore && !loading && !error && (
              <div className={`text-center mt-6 sm:mt-8 ${isExpanded ? 'max-w-7xl mx-auto px-2 sm:px-6 lg:px-8' : 'max-w-full mx-auto px-2 sm:px-8 lg:px-12'}`}>
              <button
                  onClick={loadMoreCourses}
                disabled={loadingMore}
                  className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg text-sm sm:text-base"
                >
                  {loadingMore ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      <span className="font-semibold">Loading More...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="font-semibold">Load More Courses</span>
                    </>
                  )}
              </button>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                  Showing {courses.length} courses • Click to load {COURSES_PER_PAGE} more
                </p>
            </div>
          )}

            {/* Empty State */}
            {filteredCourses.length === 0 && !loading && !error && (
              <div className={`text-center py-8 sm:py-12 ${isExpanded ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'max-w-full mx-auto px-6 sm:px-8 lg:px-12'}`}>
                <p className="text-gray-500 text-base sm:text-lg">No courses found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Subscription Payment Modal */}
        <FixedFlutterwavePayment
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          planName="Monthly Membership"
          amount={2500}
        />
    </div>
  );
};

export default Courses;