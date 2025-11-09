'use client';
import React, { useState, useEffect, useMemo } from 'react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateOrganizationStructuredData } from '@/components/SEO/StructuredData';
import HorizontalScrollSection from '@/components/spotify/HorizontalScrollSection';
import CourseCard from '@/components/spotify/CourseCard';
import CategoryCard from '@/components/spotify/CategoryCard';
import LearningPathCard from '@/components/spotify/LearningPathCard';
import { createClient } from '@/lib/supabase/client';
import { 
  FaLaptopCode, 
  FaChartBar, 
  FaPalette, 
  FaBullhorn,
  FaDatabase,
  FaMobileAlt,
  FaNetworkWired,
  FaShieldAlt
} from 'react-icons/fa';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor?: string;
  cover_photo_url?: string;
  duration?: string;
  lessons?: number;
  rating?: number;
  price?: string;
  level?: string;
  category?: string;
  status?: string;
  is_scheduled?: boolean;
  access_type?: 'free' | 'membership';
  created_at: string;
}

// Shuffle function for arrays
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Home: React.FC = () => {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffleKey, setShuffleKey] = useState(0);

  // Force reshuffle on mount and when courses load
  useEffect(() => {
    if (allCourses.length > 0) {
      setShuffleKey(prev => prev + 1);
    }
  }, [allCourses.length]);

  // Memoized computed values that shuffle based on shuffleKey
  const trendingCourses = useMemo(() => {
    if (allCourses.length === 0) return [];
    return shuffleArray(allCourses).slice(0, 10);
  }, [allCourses, shuffleKey]);

  const newReleases = useMemo(() => {
    if (allCourses.length === 0) return [];
    // Sort by created_at and take latest, then shuffle
    const sorted = [...allCourses].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return shuffleArray(sorted.slice(0, 10));
  }, [allCourses, shuffleKey]);

  const topRated = useMemo(() => {
    if (allCourses.length === 0) return [];
    return shuffleArray(allCourses).slice(0, 10);
  }, [allCourses, shuffleKey]);

  // Fetch courses from database
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch all published courses
        const { data: allCourses, error } = await supabase
          .from('courses')
          .select(`
            *,
            course_videos (
              id,
              duration,
              order_index
            )
          `)
          .in('status', ['published'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching courses:', error);
          return;
        }

        if (allCourses) {
          // Transform courses
          const transformedCourses: Course[] = allCourses.map((course: any) => {
            const duration = calculateTotalDuration(course.course_videos || []);
            return {
              id: course.id,
              title: course.title,
              description: course.description || '',
              instructor: course.created_by || 'King Ezekiel Academy',
              cover_photo_url: course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
              duration: duration,
              lessons: course.course_videos?.length || 0,
              rating: 4.8,
              price: course.access_type === 'free' ? '0' : '2500',
              level: course.level || 'beginner',
              category: course.category || 'general',
              status: course.status,
              is_scheduled: course.is_scheduled,
              access_type: course.access_type || 'membership',
              created_at: course.created_at,
            };
          });

          // Store all courses - sorting/shuffling happens in useMemo
          setAllCourses(transformedCourses);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Helper function to calculate total duration
  const calculateTotalDuration = (videos: any[]): string => {
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
        }
      }
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '0 min';
    }
  };

  // Categories
  const categories = [
    {
      id: 'web-development',
      name: 'Web Development',
      description: 'Build modern web applications',
      icon: <FaLaptopCode />,
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      id: 'digital-marketing',
      name: 'Digital Marketing',
      description: 'Master online marketing strategies',
      icon: <FaBullhorn />,
      gradient: 'from-purple-600 to-pink-600',
    },
    {
      id: 'ui-ux-design',
      name: 'UI/UX Design',
      description: 'Create beautiful user experiences',
      icon: <FaPalette />,
      gradient: 'from-pink-600 to-rose-600',
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis',
      description: 'Analyze and visualize data',
      icon: <FaChartBar />,
      gradient: 'from-green-600 to-emerald-600',
    },
    {
      id: 'mobile-development',
      name: 'Mobile Development',
      description: 'Build mobile apps',
      icon: <FaMobileAlt />,
      gradient: 'from-orange-600 to-red-600',
    },
    {
      id: 'cybersecurity',
      name: 'Cybersecurity',
      description: 'Protect digital assets',
      icon: <FaShieldAlt />,
      gradient: 'from-indigo-600 to-purple-600',
    },
    {
      id: 'cloud-computing',
      name: 'Cloud Computing',
      description: 'Master cloud platforms',
      icon: <FaNetworkWired />,
      gradient: 'from-teal-600 to-cyan-600',
    },
    {
      id: 'database',
      name: 'Database Management',
      description: 'Manage data effectively',
      icon: <FaDatabase />,
      gradient: 'from-yellow-600 to-orange-600',
    },
  ];

  // Learning Paths - connected to actual courses with shuffling
  const learningPaths = useMemo(() => {
    if (allCourses.length === 0) return [];

    const paths = [
      {
        id: 'digital-marketer-30-days',
        title: 'Become a Digital Marketer in 30 Days',
        description: 'A comprehensive path to master digital marketing from scratch',
        category: 'digital-marketing',
        courseCount: 8,
        duration: '30 days',
        gradient: 'from-purple-700 to-pink-700',
      },
      {
        id: 'web-developer-4-weeks',
        title: 'Master Web Development in 4 Weeks',
        description: 'Learn frontend and backend development from the ground up',
        category: 'web-development',
        courseCount: 12,
        duration: '4 weeks',
        gradient: 'from-blue-700 to-cyan-700',
      },
      {
        id: 'data-analyst-path',
        title: 'Data Analyst Career Path',
        description: 'Start your career in data analysis with these essential courses',
        category: 'data-analysis',
        courseCount: 10,
        duration: '6 weeks',
        gradient: 'from-green-700 to-emerald-700',
      },
      {
        id: 'ui-designer-path',
        title: 'UI/UX Designer in 5 Weeks',
        description: 'Design beautiful and intuitive user interfaces',
        category: 'ui-ux-design',
        courseCount: 7,
        duration: '5 weeks',
        gradient: 'from-pink-700 to-rose-700',
      },
    ];

    // Map categories to course categories
    const categoryMap: Record<string, string> = {
      'digital-marketing': 'marketing',
      'web-development': 'development',
      'data-analysis': 'data',
      'ui-ux-design': 'design',
    };

    // For each path, get courses matching the category and shuffle
    return paths.map(path => {
      const mappedCategory = categoryMap[path.category] || path.category;
      let matchingCourses = allCourses.filter(course => 
        course.category?.toLowerCase().includes(mappedCategory) ||
        course.title?.toLowerCase().includes(mappedCategory.replace('-', ' '))
      );

      // If no exact matches, use all courses shuffled
      if (matchingCourses.length === 0) {
        matchingCourses = shuffleArray(allCourses);
      } else {
        matchingCourses = shuffleArray(matchingCourses);
      }

      // Get the first course ID for the link
      const firstCourseId = matchingCourses.length > 0 ? matchingCourses[0].id : null;

      return {
        ...path,
        courseIds: matchingCourses.slice(0, path.courseCount).map(c => c.id),
        firstCourseId,
        courseCount: Math.min(path.courseCount, matchingCourses.length),
      };
    });
  }, [allCourses, shuffleKey]);

  if (loading) {
    return (
      <>
        <SEOHead
          title="Digital Marketing Education Platform"
          description="Transform your career with comprehensive digital marketing courses. Learn from industry experts and join 10,000+ successful students."
          keywords="digital marketing courses, online education, business growth, entrepreneurship, Nigeria, Africa"
          canonical="/"
        />
        <div className="min-h-screen bg-secondary-950 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-secondary-400">Loading courses...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Digital Marketing Education Platform"
        description="Transform your career with comprehensive digital marketing courses. Learn from industry experts and join 10,000+ successful students."
        keywords="digital marketing courses, online education, business growth, entrepreneurship, Nigeria, Africa"
        canonical="/"
        ogImage="/img/link-previewer-optimized.jpg"
        ogType="website"
        structuredData={generateOrganizationStructuredData()}
      />
      {/* Content wrapper */}
      <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Section 1: Trending Courses */}
            {trendingCourses.length > 0 && (
              <HorizontalScrollSection
                title="Trending Courses"
                subtitle="Popular courses students are learning right now"
              >
                {trendingCourses.map((course) => (
                  <div key={course.id} className="flex-shrink-0 w-[200px]">
                    <CourseCard course={course} />
                  </div>
                ))}
              </HorizontalScrollSection>
            )}

          {/* Section 2: New Releases */}
          {newReleases.length > 0 && (
            <HorizontalScrollSection
              title="New Releases"
              subtitle="Fresh courses added this week"
            >
              {newReleases.map((course) => (
                <div key={course.id} className="flex-shrink-0 w-[200px]">
                  <CourseCard course={course} showBadge badgeText="New" />
            </div>
              ))}
            </HorizontalScrollSection>
          )}

          {/* Section 3: Skill Categories */}
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Browse by Category
            </h2>
              <p className="text-secondary-400 text-sm">
                Explore courses by skill area
              </p>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {categories.map((category) => (
                <div key={category.id} className="flex-shrink-0">
                  <CategoryCard category={category} />
          </div>
              ))}
        </div>
      </section>

          {/* Section 4: Top Learning Paths */}
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Top Learning Paths
              </h2>
              <p className="text-secondary-400 text-sm">
                Curated courses to achieve your goals
              </p>
                    </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {learningPaths.map((path) => (
                <div key={path.id} className="flex-shrink-0">
                  <LearningPathCard path={path} />
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Featured Charts */}
          {topRated.length > 0 && (
            <>
              <HorizontalScrollSection
                title="Top 10 Courses in Nigeria"
                subtitle="Most popular courses among Nigerian students"
              >
                {topRated.slice(0, 10).map((course) => (
                  <div key={course.id} className="flex-shrink-0 w-[200px]">
                    <CourseCard course={course} />
                  </div>
                ))}
              </HorizontalScrollSection>

              <HorizontalScrollSection
                title="Top Rated by Students"
                subtitle="Highest rated courses based on student reviews"
              >
                {topRated.map((course) => (
                  <div key={course.id} className="flex-shrink-0 w-[200px]">
                    <CourseCard course={course} />
                  </div>
                ))}
              </HorizontalScrollSection>
            </>
          )}
          </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Home;
