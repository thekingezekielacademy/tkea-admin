'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaClock, FaBook, FaGraduationCap, FaArrowRight } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  cover_photo_url?: string;
  created_at: string;
  category: string;
  duration: string;
  lessons: number;
  // Scheduling fields
  status?: string;
  is_scheduled?: boolean;
  scheduled_for?: string;
  // Access control
  access_type?: 'free' | 'membership';
}

const LatestCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Handle window resize for responsive carousel
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch latest 10 courses
  useEffect(() => {
    const fetchLatestCourses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
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
          .in('status', ['published', 'scheduled'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching latest courses:', error);
          setError('Failed to load courses');
          return;
        }

        if (data) {
          // Transform data to match our interface
          const transformedCourses = data.map(course => ({
            ...course,
            category: course.category || 'general',
            duration: calculateTotalDuration(course.course_videos || []),
            lessons: course.course_videos?.length || 0
          }));
          
          setCourses(transformedCourses);
        }
      } catch (err) {
        console.error('Error fetching latest courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestCourses();
  }, []);

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

  // Get number of slides per view based on screen size
  const getSlidesPerView = () => {
    if (windowWidth < 640) return 1; // Mobile: 1 slide
    if (windowWidth < 1024) return 2; // Tablet: 2 slides
    return 3; // Desktop: 3 slides
  };

  const nextSlide = () => {
    const slidesPerView = getSlidesPerView();
    const maxIndex = Math.max(0, courses.length - slidesPerView);
    setCurrentIndex((prevIndex) => 
      prevIndex >= maxIndex ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    const slidesPerView = getSlidesPerView();
    const maxIndex = Math.max(0, courses.length - slidesPerView);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? maxIndex : prevIndex - 1
    );
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading latest courses...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || courses.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">No courses available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-50 to-secondary-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-48 h-48 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-secondary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <FaGraduationCap className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Latest Courses
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-900 mb-4 sm:mb-6">
            Discover Our Newest Courses
          </h2>
          <p className="text-base sm:text-lg text-primary-600 max-w-3xl mx-auto leading-relaxed">
            Stay ahead with our latest course additions, designed to keep you at the forefront of digital innovation.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          {courses.length > getSlidesPerView() && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200"
                aria-label="Previous courses"
              >
                <FaChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200"
                aria-label="Next courses"
              >
                <FaChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Courses Grid - Mobile Optimized */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / getSlidesPerView())}%)` 
              }}
            >
              {courses.map((course) => {
                const isScheduled = course.status === 'scheduled';
                const scheduledDate = course.scheduled_for ? new Date(course.scheduled_for).toLocaleDateString() : '';
                
                return (
                  <div key={course.id} className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2 sm:px-3">
                    <div 
                      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 h-full ${
                        isScheduled ? 'cursor-default opacity-75' : 'hover:shadow-xl cursor-pointer'
                      }`}
                      onClick={() => {
                        if (isScheduled) {
                          // Show "Coming Soon" message for scheduled courses
                          alert(`This course is coming soon! Scheduled for ${scheduledDate}`);
                        } else {
                          // Navigate to course for published courses
                          window.location.href = `/course/${course.id}`;
                        }
                      }}
                    >
                      <div className="relative">
                        <img 
                          src={course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop'} 
                          alt={course.title}
                          className="w-full h-40 sm:h-36 lg:h-40 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          {getLevelBadge(course.level)}
                        </div>
                        <div className="absolute top-2 left-2 bg-primary-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                          <FaGraduationCap className="h-3 w-3" />
                          <span>{isScheduled ? 'Coming Soon' : 'New'}</span>
                        </div>
                        {isScheduled && (
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                            <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                              Coming Soon
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 sm:p-4">
                        <h3 className="text-base sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                          {course.title}
                        </h3>
                        <p className="text-sm sm:text-xs lg:text-sm text-gray-600 mb-3 line-clamp-2">
                          {isScheduled ? `Available on ${scheduledDate}` : (course.description || 'No description available')}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm sm:text-xs lg:text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <FaClock className="h-3 w-3 sm:h-3 sm:w-3" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FaBook className="h-3 w-3 sm:h-3 sm:w-3" />
                            <span>{course.lessons} lessons</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots Indicator */}
          {courses.length > getSlidesPerView() && (
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: Math.ceil(courses.length / getSlidesPerView()) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === Math.floor(currentIndex / getSlidesPerView()) ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Browse All Courses Button */}
        <div className="text-center mt-8 sm:mt-12">
          <Link 
            href="/courses" 
            onClick={() => window.scrollTo(0, 0)}
            className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base font-semibold"
          >
            <span>Browse All Courses</span>
            <FaArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestCourses;