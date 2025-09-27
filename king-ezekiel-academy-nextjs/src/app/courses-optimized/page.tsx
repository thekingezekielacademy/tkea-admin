'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaSearch, FaClock, FaUser, FaBook, FaTag, FaLock, FaUnlock, FaGraduationCap } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { useSidebar } from '@/contexts/SidebarContext';
// import { optimizedQueries, cacheUtils, performanceMonitor } from '@/lib/supabase-optimized';
import SEOHead from '@/components/SEO/SEOHead';
import { generateOrganizationStructuredData } from '@/components/SEO/StructuredData';
import SidebarLayout from '@/components/SidebarLayout';
import { shuffleCoursesDefault } from '@/utils/courseShuffle';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  cover_photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  scheduled_for?: string;
  is_scheduled?: boolean;
  status?: string;
  access_type?: 'free' | 'membership';
  category: string;
  duration: string;
  instructor: string;
  rating: number;
  students: number;
  cover_photo: string;
  lessons: number;
}

const CoursesOptimized: React.FC = () => {
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
  const router = useRouter();
  const { user } = useAuth();

  // Memoized filters to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    category: selectedCategory,
    level: selectedLevel,
    search: debouncedSearchTerm,
    sort: selectedSort
  }), [selectedCategory, selectedLevel, debouncedSearchTerm, selectedSort]);

  // Optimized subscription check with caching
  const checkDatabaseSubscription = useCallback(async () => {
    if (!user?.id) return false;
    
    const startTime = performanceMonitor.startTiming('checkSubscription');
    
    try {
      const { data, error } = await optimizedQueries.getUserSubscriptions(user.id);
      
      performanceMonitor.endTiming('checkSubscription', startTime);
      
      if (!error && data && data.length > 0) {
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
  }, [user?.id]);

  // Optimized trial access check
  const checkTrialAccess = useCallback(async () => {
    if (!user?.id) return false;
    
    try {
      const userCreatedAt = user.created_at ? new Date(user.created_at) : new Date();
      const daysSinceCreation = Math.ceil((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreation <= 7) {
        setHasTrialAccess(true);
        return true;
      } else {
        setHasTrialAccess(false);
        return false;
      }
    } catch (error) {
      setHasTrialAccess(false);
      return false;
    }
  }, [user?.id, user?.created_at]);

  // Check subscription status and trial access when user changes
  useEffect(() => {
    if (user) {
      const checkSubscriptionAndTrial = async () => {
        const isSubscribed = await checkDatabaseSubscription();
        if (!isSubscribed) {
          await checkTrialAccess();
        }
      };
      
      checkSubscriptionAndTrial();
    } else {
      setHasTrialAccess(false);
    }
  }, [user, checkDatabaseSubscription, checkTrialAccess]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Optimized course fetching with caching
  const fetchCourses = useCallback(async (page = 0, append = false) => {
    const startTime = performanceMonitor.startTiming('fetchCourses');
    
    try {
      if (page === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      const { data, error: fetchError } = await optimizedQueries.getCourses(filters, page, COURSES_PER_PAGE);
      
      performanceMonitor.endTiming('fetchCourses', startTime);
      
      if (fetchError) {
        console.error('Supabase error:', fetchError);
        setError('Failed to load courses');
        if (page === 0) setLoading(false);
        else setLoadingMore(false);
        return;
      }

      if (data) {
        // Transform data to match our interface
        const transformedCourses = data.map(course => ({
          ...course,
          category: course.category || 'general',
          duration: calculateTotalDuration(course.course_videos || []),
          instructor: course.created_by || 'King Ezekiel Academy',
          rating: 4.8,
          students: course.students || 0,
          cover_photo: course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
          lessons: course.course_videos?.length || 0
        }));

        if (append) {
          setCourses(prev => [...prev, ...transformedCourses]);
        } else {
          setCourses(transformedCourses);
        }

        // Check if there are more courses
        setHasMore(transformedCourses.length === COURSES_PER_PAGE);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      if (page === 0) setLoading(false);
      else setLoadingMore(false);
    }
  }, [filters, COURSES_PER_PAGE]);

  // Helper function to calculate total duration from videos
  const calculateTotalDuration = useCallback((videos: any[]): string => {
    if (!videos || videos.length === 0) return '0 min';
    
    let totalSeconds = 0;
    
    videos.forEach(video => {
      const duration = video.duration;
      if (duration) {
        if (duration.includes(':')) {
          const parts = duration.split(':');
          if (parts.length === 2) {
            totalSeconds += (parseInt(parts[0]) || 0) * 60;
            totalSeconds += parseInt(parts[1]) || 0;
          } else if (parts.length === 3) {
            totalSeconds += (parseInt(parts[0]) || 0) * 3600;
            totalSeconds += (parseInt(parts[1]) || 0) * 60;
            totalSeconds += parseInt(parts[2]) || 0;
          }
        } else if (duration.includes('min') || duration.includes('m')) {
          const match = duration.match(/(\d+)/);
          if (match) totalSeconds += (parseInt(match[1]) || 0) * 60;
        } else if (duration.includes('h') || duration.includes('hour')) {
          const match = duration.match(/(\d+)/);
          if (match) totalSeconds += (parseInt(match[1]) || 0) * 3600;
        } else {
          const num = parseInt(duration);
          if (!isNaN(num)) totalSeconds += num * 60;
        }
      }
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }, []);

  // Fetch courses when filters change
  useEffect(() => {
    setCurrentPage(0);
    fetchCourses(0);
  }, [fetchCourses]);

  // Load more courses
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchCourses(nextPage, true);
    }
  }, [loadingMore, hasMore, currentPage, fetchCourses]);

  // Handle course click
  const handleCourseClick = useCallback((course: Course) => {
    const isScheduled = course.status === 'scheduled';
    
    if (isScheduled) {
      const scheduledDate = course.scheduled_for ? new Date(course.scheduled_for).toLocaleDateString() : '';
      alert(`This course is coming soon! Scheduled for ${scheduledDate}`);
      return;
    }

    // Check access
    const hasAccess = user && (databaseSubscriptionStatus || hasTrialAccess);
    
    if (!hasAccess) {
      router.push('/subscription');
      return;
    }

    // Navigate to course
    router.push(`/course/${course.id}`);
  }, [user, databaseSubscriptionStatus, hasTrialAccess, router]);

  // Memoized level badge component
  const getLevelBadge = useCallback((level: string) => {
    const levelConfig = {
      beginner: { label: 'Beginner', color: 'bg-green-100 text-green-800' },
      intermediate: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
      advanced: { label: 'Advanced', color: 'bg-red-100 text-red-800' },
      expert: { label: 'Expert', color: 'bg-purple-100 text-purple-800' }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.beginner;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  }, []);

  // Memoized filter options
  const categories = useMemo(() => [
    { value: 'all', label: 'All Categories' },
    { value: 'digital-marketing', label: 'Digital Marketing' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' }
  ], []);

  const levels = useMemo(() => [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ], []);

  const sortOptions = useMemo(() => [
    { value: 'all', label: 'All Courses' },
    { value: 'latest', label: 'Latest' },
    { value: 'most-enrolled', label: 'Most Enrolled' }
  ], []);

  return (
    <>
      <SEOHead
        title="All Courses - King Ezekiel Academy"
        description="Browse our comprehensive library of digital marketing courses. Learn from industry experts and transform your career with our world-class education platform."
        keywords="digital marketing courses, online learning, career development, professional skills"
        canonical="/courses"
        structuredData={generateOrganizationStructuredData()}
      />
      
      <SidebarLayout>
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-4">
                All Courses (Optimized)
              </h1>
              <p className="text-lg text-primary-600 max-w-2xl mx-auto">
                Discover our comprehensive library of digital marketing courses designed to transform your career.
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-soft p-6 mb-8 border border-primary-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>

                {/* Level Filter */}
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {levels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>

                {/* Sort Filter */}
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">Loading courses...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Courses Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const isScheduled = course.status === 'scheduled';
                  const hasAccess = user && (databaseSubscriptionStatus || hasTrialAccess);
                  
                  return (
                    <div
                      key={course.id}
                      className={`bg-white rounded-xl shadow-soft overflow-hidden transition-all duration-300 hover:shadow-glow border border-primary-100 ${
                        isScheduled ? 'opacity-75' : 'cursor-pointer'
                      }`}
                      onClick={() => handleCourseClick(course)}
                    >
                      <div className="relative">
                        <img
                          src={course.cover_photo}
                          alt={course.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          {getLevelBadge(course.level)}
                        </div>
                        <div className="absolute top-2 left-2 bg-primary-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                          <FaGraduationCap className="h-3 w-3" />
                          <span>{isScheduled ? 'Coming Soon' : 'Available'}</span>
                        </div>
                        {isScheduled && (
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                            <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                              Coming Soon
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-1">
                            <FaClock className="h-3 w-3" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FaBook className="h-3 w-3" />
                            <span>{course.lessons} lessons</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FaUser className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{course.instructor}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FaUser className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{course.students} students</span>
                          </div>
                        </div>

                        {!hasAccess && user && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              {hasTrialAccess ? 'Trial Access' : 'Subscription Required'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {!loading && !error && hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Courses'}
                </button>
              </div>
            )}

            {/* No Courses Message */}
            {!loading && !error && courses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No courses found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    </>
  );
};

export default CoursesOptimized;
