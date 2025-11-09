'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FaClock, FaBook, FaUser } from 'react-icons/fa';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  cover_photo_url?: string;
  instructor?: string;
  created_at: string;
  category: string;
  duration: string;
  lessons: number;
  access_type?: 'free' | 'membership';
  price?: number;
}

const AccessCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('courses')
          .select(`
            *,
            course_videos (
              id,
              duration,
              order_index
            )
          `)
          .in('status', ['published', 'scheduled'])
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          const transformedCourses: Course[] = data.map((course: any) => ({
            ...course,
            category: course.category || 'general',
            duration: calculateTotalDuration(course.course_videos || []),
            instructor: course.instructor || 'King Ezekiel Academy',
            cover_photo_url: course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
            lessons: course.course_videos?.length || 0,
            price: course.price || (course.access_type === 'free' ? 0 : 2500),
          }));

          setCourses(transformedCourses);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-secondary-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            All Courses
          </h1>
          <p className="text-secondary-400 text-sm">
            Explore our comprehensive course collection
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/access/${course.id}`}
              className="group"
            >
              <div className="bg-secondary-800 rounded-lg p-4 hover:bg-secondary-700 transition-colors duration-200 h-full flex flex-col">
                {/* Course Image */}
                <div className="relative mb-4">
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-gradient-to-br from-primary-900 to-accent-600">
                    {course.cover_photo_url ? (
                      <img
                        src={course.cover_photo_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                        {course.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Info */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-semibold text-white text-base line-clamp-2 group-hover:text-accent-400 transition-colors mb-2">
                    {course.title}
                  </h3>
                  
                  {course.instructor && (
                    <p className="text-secondary-400 text-xs mb-3 line-clamp-1">
                      {course.instructor}
                    </p>
                  )}

                  {/* Course Meta */}
                  <div className="flex items-center justify-between text-xs text-secondary-400 mt-auto">
                    <div className="flex items-center gap-3">
                      {course.duration && (
                        <div className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                      {course.lessons && (
                        <div className="flex items-center gap-1">
                          <FaBook className="w-3 h-3" />
                          <span>{course.lessons}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="pt-3 mt-3 border-t border-secondary-700">
                    <span className="text-white font-bold text-sm">
                      {course.access_type === 'free' ? 'Free' : `₦${course.price?.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-secondary-400">No courses available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessCourses;

