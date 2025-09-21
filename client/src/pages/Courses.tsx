import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaClock, FaUser, FaBook, FaTag, FaLock, FaUnlock, FaGraduationCap } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { supabase } from '../lib/supabase';
import secureStorage from '../utils/secureStorage';
import TrialManager from '../utils/trialManager';
import DashboardSidebar from '../components/DashboardSidebar';
import SEOHead from '../components/SEO/SEOHead';
import { generateCourseStructuredData } from '../components/SEO/StructuredData';
import { useFacebookPixel } from '../hooks/useFacebookPixel';

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
  const [hasTrialAccess, setHasTrialAccess] = useState(false);
  const [databaseSubscriptionStatus, setDatabaseSubscriptionStatus] = useState<boolean>(false);
  const COURSES_PER_PAGE = 10;
  const history = useHistory();
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

  // Debug sidebar state
  useEffect(() => {
    // console.log('Sidebar Debug:', {
    //   user: !!user,
    //   isMobile,
    //   isExpanded,
    //   margin: getSidebarMargin(),
    // });
  }, [user, isMobile, isExpanded]);

  // Check database subscription status
  const checkDatabaseSubscription = async () => {
    if (!user?.id) return;
    
    // Wait for auth to be fully loaded
    if (!supabase.auth.getUser()) {
      console.log('Auth not ready, skipping subscription check');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!error && data && data.length > 0) {
        // console.log('✅ Found active subscription in database:', data[0]);
        setDatabaseSubscriptionStatus(true);
        return true;
      } else {
        // console.log('❌ No active subscription found in database');
        setDatabaseSubscriptionStatus(false);
        return false;
      }
    } catch (error) {
      // console.log('⚠️ Database subscription check failed (table may not exist yet):', error);
      setDatabaseSubscriptionStatus(false);
      return false;
    }
  };

  // Check if user has trial access with explicit subscription status
  const checkTrialAccessWithStatus = async (isSubscribed: boolean) => {
    if (!user?.id) return;
    
    // CRITICAL: Database subscription status takes priority over local storage
    // If database shows active subscription, user should NOT have trial access
    if (isSubscribed) {
      console.log('✅ User has ACTIVE subscription from database, no trial access needed');
      setHasTrialAccess(false);
      
      // Update local storage to match database status
      secureStorage.setSubscriptionActive(true);
      
      // Clear any existing trial data from localStorage since user is subscribed
      const existingTrial = localStorage.getItem('user_trial_status');
      if (existingTrial) {
        console.log('🗑️ Clearing localStorage trial data for subscribed user');
        localStorage.removeItem('user_trial_status');
      }
      return;
    }
    
    // Only check local storage if database doesn't show active subscription
    const hasLocalSubscription = secureStorage.isSubscriptionActive();
    if (hasLocalSubscription) {
      console.log('✅ User has active subscription from local storage, no trial access needed');
      setHasTrialAccess(false);
      return;
    }
    
    try {
      // First check localStorage for trial status
      const localTrial = localStorage.getItem('user_trial_status');
      
      if (localTrial) {
        try {
          const parsedTrial = JSON.parse(localTrial);
          // Use centralized calculation for consistency across devices
          const daysRemaining = TrialManager.calculateDaysRemaining(parsedTrial.endDate);
          
          const hasAccess = parsedTrial.isActive && daysRemaining > 0;
          setHasTrialAccess(hasAccess);
          // console.log('🔍 Trial access check from localStorage:', { hasAccess, daysRemaining, parsedTrial });
          return;
        } catch (parseError) {
          // console.log('Failed to parse localStorage trial data');
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
        endDate.setDate(startDate.getDate() + 6); // 6 days from start = 7 days total
        endDate.setHours(23, 59, 59, 999); // End of day
        
        // Use centralized calculation for consistency across devices
        const daysRemaining = TrialManager.calculateDaysRemaining(endDate.toISOString());
        
        const newTrialStatus = {
          isActive: daysRemaining > 0, // Only active if days remaining > 0
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          daysRemaining,
          isExpired: daysRemaining <= 0
        };
        
        // Save to localStorage
        localStorage.setItem('user_trial_status', JSON.stringify(newTrialStatus));
        setHasTrialAccess(newTrialStatus.isActive && daysRemaining > 0);
        // console.log('✅ Initialized trial for new user in Courses:', { newTrialStatus, daysRemaining, hasAccess: newTrialStatus.isActive && daysRemaining > 0 });
      } else {
        // User is older than 7 days, no trial
        setHasTrialAccess(false);
        // console.log('User is older than 7 days, no trial available');
      }
      
      // Try database query as well (for when table exists)
      try {
        const trialAccess = await TrialManager.hasTrialAccess(user.id);
        // Only set trial access if user is NOT subscribed
        if (!isSubscribed) {
          setHasTrialAccess(trialAccess);
          // console.log('Trial access check from database:', trialAccess);
        }
      } catch (dbError) {
        // console.log('Database table user_trials not available yet');
      }
    } catch (error) {
      console.error('Error in checkTrialAccess:', error);
      setHasTrialAccess(false);
    }
  };

  // Check subscription status and trial access when user changes
  useEffect(() => {
    if (user) {
      // console.log('🔍 User changed, checking subscription and trial access:', { userId: user.id, email: user.email });
      // Check database subscription status first, then trial access
      const checkSubscriptionAndTrial = async () => {
        const isSubscribed = await checkDatabaseSubscription();
        // Pass the subscription status directly to avoid race conditions
        await checkTrialAccessWithStatus(isSubscribed);
      };
      
      checkSubscriptionAndTrial();
    } else {
      // console.log('🔍 No user, resetting trial access');
      setHasTrialAccess(false);
    }
  }, [user]);

  // Debug state changes (commented out for production)
  // useEffect(() => {
  //   console.log('🔍 Trial access state changed:', { hasTrialAccess, databaseSubscriptionStatus, user: user?.id });
  // }, [hasTrialAccess, databaseSubscriptionStatus, user]);

  // Fetch courses from database with pagination
  const fetchCourses = async (page = 0, append = false) => {
    try {
      if (page === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      // console.log(`🔍 Fetching courses page ${page}...`);
      
      // For non-authenticated users, we can still fetch courses for viewing
      // Only require authentication for actual course access
      if (!user) {
        // console.log('👤 Guest user fetching courses - allowing read-only access');
      } else {
        // First, refresh the session to ensure we have a valid token
        const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
        
        if (sessionError) {
          // console.log('⚠️ Session refresh failed, trying to get current session:', sessionError);
          // If refresh fails, try to get current session
          const { data: currentSession } = await supabase.auth.getSession();
          if (!currentSession.session) {
            // console.log('⚠️ No valid session found for authenticated user');
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

      // Apply sorting based on selected option
      if (selectedSort === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (selectedSort === 'most-enrolled') {
        query = query.order('students', { ascending: false });
      } else {
        // Default: all courses, newest first
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (selectedSort === 'latest' || selectedSort === 'most-enrolled') {
        // For latest and most-enrolled, limit to 10 courses total
        query = query.limit(10);
      } else if (selectedCategory !== 'all' || selectedLevel !== 'all') {
        // For filtered results (category or level), show all courses in that filter
        // No pagination limit - show all matching courses
      } else {
        // For all courses (no filters), use pagination
        query = query.range(page * COURSES_PER_PAGE, (page + 1) * COURSES_PER_PAGE - 1);
      }

      const { data, error: fetchError } = await query;
      
      //  data, error: fetchError });
      
      if (fetchError) {
        console.error('❌ Supabase error:', fetchError);
        
        // Handle specific authentication errors
        if (fetchError.code === 'PGRST303' || fetchError.message?.includes('JWT expired')) {
          // console.log('🔄 JWT expired, attempting to refresh session...');
          
          // Try to refresh the session and retry
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('❌ Failed to refresh session:', refreshError);
            // For non-authenticated users, this is not an error
            if (user) {
              setError('Authentication expired. Please sign in again.');
            }
            if (page === 0) setLoading(false);
            else setLoadingMore(false);
            return;
          }
          
          // Retry the courses fetch after refresh
          let retryQuery = supabase
            .from('courses')
            .select(`
              *,
              course_videos (
                id,
                name,
                duration,
                order_index
              )
            `);

          // Apply category filtering
          if (selectedCategory !== 'all') {
            retryQuery = retryQuery.eq('category', selectedCategory);
          }

          // Apply level filtering
          if (selectedLevel !== 'all') {
            retryQuery = retryQuery.eq('level', selectedLevel);
          }

          // Apply search filtering
          if (debouncedSearchTerm) {
            retryQuery = retryQuery.or(`title.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`);
          }

          // Apply sorting based on selected option
          if (selectedSort === 'latest') {
            retryQuery = retryQuery.order('created_at', { ascending: false });
          } else if (selectedSort === 'most-enrolled') {
            retryQuery = retryQuery.order('students', { ascending: false });
          } else {
            // Default: all courses, newest first
            retryQuery = retryQuery.order('created_at', { ascending: false });
          }

          // Apply pagination
          if (selectedSort === 'latest' || selectedSort === 'most-enrolled') {
            // For latest and most-enrolled, limit to 10 courses total
            retryQuery = retryQuery.limit(10);
          } else if (selectedCategory !== 'all' || selectedLevel !== 'all') {
            // For filtered results (category or level), show all courses in that filter
            // No pagination limit - show all matching courses
          } else {
            // For all courses (no filters), use pagination
            retryQuery = retryQuery.range(page * COURSES_PER_PAGE, (page + 1) * COURSES_PER_PAGE - 1);
          }

          const { data: retryData, error: retryError } = await retryQuery;
          
          if (retryError) {
            throw retryError;
          }
          
          if (retryData) {
            console.log('🔍 Raw course data from database:', retryData);
            console.log(' First course cover_photo_url:', retryData[0]?.cover_photo_url);
            console.log(' First course cover_url:', retryData[0]?.cover_url);
            
            const transformedCourses = retryData.map(course => ({
              ...course,
              category: course.category || 'general',
              duration: calculateTotalDuration(course.course_videos || []),
              instructor: 'King Ezekiel Academy',
              rating: 4.5,
              students: 0,
              cover_photo: course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
              lessons: course.course_videos?.length || 0
            }));
            
            console.log(' Transformed course data:', transformedCourses[0]);
            // Apply shuffling only for the first page (not when appending for pagination)
            // This ensures fresh random order every time users visit the page
            const finalCourses = append ? transformedCourses : shuffleArray(transformedCourses);
            
            if (!append) {
              // console.log('🎲 Courses shuffled for fresh random order!');
            }
            
            if (append) {
              setCourses(prev => [...prev, ...finalCourses]);
            } else {
              setCourses(finalCourses);
            }
            
                    // Check if there are more courses
        if (selectedSort === 'latest' || selectedSort === 'most-enrolled') {
          setHasMore(false); // No pagination for latest/most-enrolled
        } else if (selectedCategory !== 'all' || selectedLevel !== 'all') {
          setHasMore(false); // No pagination for filtered results - show all courses
        } else {
          setHasMore(retryData.length === COURSES_PER_PAGE);
        }
        setCurrentPage(page);
            
            if (page === 0) setLoading(false);
            else setLoadingMore(false);
            return;
          }
        }
        
        throw fetchError;
      }
      
      if (data) {
        // console.log(`✅ Courses data received for page ${page}:`, data);
        // console.log(`🔍 Sample course data:`, data[0]);
        // console.log(`🔍 Sample course_videos:`, data[0]?.course_videos);
        // console.log(`🔍 Sample category:`, data[0]?.category);
                          // Transform data to match our interface
                  const transformedCourses = data.map(course => ({
                    ...course,
                    // Add real data from videos
                    category: course.category || 'general', // Use actual category from DB
                    duration: calculateTotalDuration(course.course_videos || []),
                    instructor: 'King Ezekiel Academy', // Default instructor since it doesn't exist in DB
                    rating: 4.5, // Default rating since it doesn't exist in DB
                    students: 0, // Default students since it doesn't exist in DB
                    cover_photo: course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
                    lessons: course.course_videos?.length || 0
                  }));
        
        // Apply shuffling only for the first page (not when appending for pagination)
        // This ensures fresh random order every time users visit the page
        const finalCourses = append ? transformedCourses : shuffleArray(transformedCourses);
        
        if (!append) {
          // console.log('🎲 Courses shuffled for fresh random order!');
        }
        
        if (append) {
          setCourses(prev => [...prev, ...finalCourses]);
        } else {
          setCourses(finalCourses);
        }
        
        // Check if there are more courses
        if (selectedSort === 'latest' || selectedSort === 'most-enrolled') {
          setHasMore(false); // No pagination for latest/most-enrolled
        } else if (selectedCategory !== 'all' || selectedLevel !== 'all') {
          setHasMore(false); // No pagination for filtered results - show all courses
        } else {
          setHasMore(data.length === COURSES_PER_PAGE);
        }
        setCurrentPage(page);
        
        // console.log(`🔄 Transformed courses for page ${page}:`, transformedCourses);
        // console.log(`📊 Has more courses: ${data.length === COURSES_PER_PAGE}`);
      } else {
        // console.log(`⚠️ No data received from Supabase for page ${page}`);
        if (!append) setCourses([]);
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

  // Load more courses function
  const loadMoreCourses = () => {
    if (hasMore && !loadingMore) {
      fetchCourses(currentPage + 1, true);
    }
  };

  // Helper function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = (array: any[]): any[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

  // Fetch courses on component mount only
  useEffect(() => {
    fetchCourses(0, false);
    if (user?.id) {
      checkTrialAccessWithStatus(databaseSubscriptionStatus);
    }
  }, [user?.id]); // Run when user changes

  // Debug logging for trial access
  useEffect(() => {
    // console.log('🔍 Trial access debug:', {
    //   user: user?.id,
    //   hasTrialAccess,
    //   subActive: databaseSubscriptionStatus || secureStorage.isSubscriptionActive(),
    //   trialStatus: localStorage.getItem('user_trial_status')
    // });
  }, [user?.id, hasTrialAccess, databaseSubscriptionStatus]);

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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const goToAccess = () => {
    if (user && (databaseSubscriptionStatus || hasTrialAccess)) {
      // User has active subscription or trial access - go to dashboard
      history.push('/dashboard');
    } else if (user) {
      // User is signed in but no active subscription or trial - go to subscription page to upgrade
      history.push('/subscription');
    } else {
      // User is not signed in - go to sign in page
      history.push('/signin');
    }
  };

  const handleEnroll = (courseId: string) => {
    if (user && (databaseSubscriptionStatus || hasTrialAccess)) {
      // User is signed in and has active subscription OR trial access - go to course overview
      history.push(`/course/${courseId}/overview`);
    } else if (user) {
      // User is signed in but no active subscription or trial - go to subscription page to upgrade
      history.push('/subscription');
    } else {
      // User is not signed in - go to signup page to start free
      history.push('/signup');
    }
  };

  const handleNotifyMe = async (courseId: string) => {
    if (!user) {
      // User is not signed in - go to signup page
      history.push('/signup');
      return;
    }

    try {
      // Request notification permission
      const notificationService = (await import('../utils/notificationService')).NotificationService.getInstance();
      const hasPermission = await notificationService.requestPermission();
      
      if (hasPermission) {
        // Store course notification preference
        const courseNotifications = JSON.parse(localStorage.getItem('course_notifications') || '[]');
        if (!courseNotifications.includes(courseId)) {
          courseNotifications.push(courseId);
          localStorage.setItem('course_notifications', JSON.stringify(courseNotifications));
        }
        
        // Show success message
        alert('You will be notified when this course becomes available!');
      } else {
        alert('Please enable notifications to get updates about this course.');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      alert('There was an error setting up notifications. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Digital Marketing Courses - King Ezekiel Academy"
        description="Master digital marketing with our comprehensive courses designed for beginners and professionals. Learn SEO, social media, e-commerce, and more from industry experts."
      />
      {/* Only show sidebar for authenticated users */}
      {user && <DashboardSidebar />}
      
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

            {/* Free Trial Active - Blue */}
            {(() => {
              const showTrialBanner = !databaseSubscriptionStatus && hasTrialAccess;
              
              return showTrialBanner;
            })() && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-blue-400">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg md:text-2xl font-bold mb-1">⏰ Free Trial Active</h3>
                      <p className="text-blue-100 text-xs sm:text-sm md:text-lg leading-relaxed">Enjoy full access for a limited time - upgrade to continue learning</p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <button 
                      onClick={() => history.push('/subscription')}
                      className="bg-white text-blue-600 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-sm md:text-base"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Trial Expired - Orange */}
            {!databaseSubscriptionStatus && !hasTrialAccess && user && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-orange-400">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg md:text-2xl font-bold mb-1">⚠️ Trial Expired</h3>
                      <p className="text-orange-100 text-xs sm:text-sm md:text-lg leading-relaxed">Your free trial has ended - subscribe to continue learning</p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <button 
                      onClick={() => history.push('/subscription')}
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
                    onClick={() => history.push('/signup')}
                    className="bg-white text-purple-600 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-sm md:text-base"
                  >
                    Start Free!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className={`mb-6 sm:mb-8 ${isExpanded ? 'max-w-7xl mx-auto px-2 sm:px-6 lg:px-8' : 'max-w-full mx-auto px-2 sm:px-8 lg:px-12'}`}>
          {/* Search Bar - Full Width on Mobile */}
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
          <div className="text-center py-8 sm:py-12">
            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading courses...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-red-700 font-medium mb-3 text-sm sm:text-base">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <button 
                onClick={() => {
                  setCurrentPage(0);
                  setHasMore(true);
                  fetchCourses(0, false);
                }}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Try Again
              </button>
              {error.includes('Authentication') && (
                <button 
                  onClick={() => history.push('/signin')}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Sign In
                </button>
              )}
            </div>
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
            
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
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
                  <span className="text-xs sm:text-sm text-gray-500 capitalize">{course.category?.replace('-', ' ') || 'General'}</span>
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
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm sm:text-lg font-semibold text-primary-600">
                      {user && (databaseSubscriptionStatus || hasTrialAccess) ? 'Full Access' : 'Membership Access'}
                    </span>
                  </div>
                  <button 
                    onClick={() => course.is_scheduled ? handleNotifyMe(course.id) : handleEnroll(course.id)} 
                    className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base ${
                      course.is_scheduled 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {course.is_scheduled ? (
                      <>
                        <span>🔔</span>
                        <span>Notify Me</span>
                      </>
                    ) : user && (databaseSubscriptionStatus || hasTrialAccess) ? (
                      <>
                        <FaUnlock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Start Learning</span>
                      </>
                    ) : user ? (
                      <>
                        <FaLock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Upgrade to Access</span>
                      </>
                    ) : (
                      <>
                        <FaLock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Start Free!</span>
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

        {filteredCourses.length === 0 && !loading && !error && (
          <div className={`text-center py-8 sm:py-12 ${isExpanded ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'max-w-full mx-auto px-6 sm:px-8 lg:px-12'}`}>
            <p className="text-gray-500 text-base sm:text-lg">No courses found matching your criteria.</p>
          </div>
        )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
