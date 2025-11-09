'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FaClock, FaBook, FaUser, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import FixedFlutterwavePayment from '@/components/FixedFlutterwavePayment';

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
  course_videos?: Lesson[];
}

interface Lesson {
  id: string;
  name: string;
  duration: string;
  order_index: number;
}

const AccessCoursePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
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
              name,
              duration,
              order_index
            )
          `)
          .eq('id', params.courseId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          // Sort videos by order_index
          const sortedVideos = (data.course_videos || []).sort((a: Lesson, b: Lesson) => 
            a.order_index - b.order_index
          );

          const transformedCourse: Course = {
            ...data,
            category: data.category || 'general',
            duration: calculateTotalDuration(data.course_videos || []),
            instructor: data.instructor || 'King Ezekiel Academy',
            cover_photo_url: data.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
            lessons: data.course_videos?.length || 0,
            price: data.price || (data.access_type === 'free' ? 0 : 2500),
            course_videos: sortedVideos,
          };

          setCourse(transformedCourse);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (params.courseId) {
      fetchCourse();
    }
  }, [params.courseId]);

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

  const handlePayNow = () => {
    if (course?.access_type === 'free') {
      // For free courses, redirect to course overview or lesson
      router.push(`/course/${course.id}/overview`);
    } else {
      // For paid courses, show payment modal
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    // Redirect to course overview after successful payment
    if (course) {
      router.push(`/course/${course.id}/overview`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-secondary-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-secondary-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Course Not Found</h1>
          <p className="text-secondary-400 mb-6">{error || 'The course you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/access/courses')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse All Courses
          </button>
        </div>
      </div>
    );
  }

  // Get instructor info
  const instructorName = course.instructor || 'King Ezekiel Academy';
  // Use a placeholder avatar service as fallback
  const instructorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=3b82f6&color=fff&size=128`;

  return (
    <div className="min-h-screen bg-secondary-950">
      {/* [1] Course Cover (Hero) */}
      <div className="relative w-full h-[60vh] min-h-[500px] overflow-hidden">
        {/* Background Image/Graphic */}
        <div className="absolute inset-0">
          {course.cover_photo_url ? (
            <img
              src={course.cover_photo_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-900 via-primary-800 to-accent-600"></div>
          )}
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-secondary-950 via-secondary-950/80 to-transparent"></div>
          <div className="absolute inset-0 bg-secondary-950/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col justify-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
            <div className="flex flex-col md:flex-row items-end gap-6">
              {/* Instructor Photo & Name */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-white/20 overflow-hidden bg-secondary-800">
                  <img
                    src={instructorAvatar}
                    alt={instructorName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-secondary-300 text-sm mb-1">Instructor</p>
                  <p className="text-white font-semibold text-lg">{instructorName}</p>
                </div>
              </div>

              {/* Title / Banner text */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {course.title}
                </h1>
                <p className="text-secondary-300 text-lg max-w-3xl">
                  {course.description || 'Master this comprehensive course and take your skills to the next level.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push('/access/courses')}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>

        {/* Optional Slider Indicator */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          <div className="px-3 py-1 bg-white/10 backdrop-blur-md text-white rounded-full text-sm">
            {course.lessons} Lessons
          </div>
          <div className="px-3 py-1 bg-white/10 backdrop-blur-md text-white rounded-full text-sm">
            {course.duration}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* [2] Course Title & Instructor Info */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {course.title}
              </h2>
              <div className="flex items-center gap-4 text-secondary-400">
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4" />
                  <span>{instructorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaBook className="w-4 h-4" />
                  <span>{course.lessons} Lessons</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* [3] Course Outline / Description */}
          <div className="lg:col-span-2">
            {/* Section Heading */}
            <div className="bg-secondary-800 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-white mb-4">Course Description</h3>
              <p className="text-secondary-300 leading-relaxed mb-4">
                {course.description || 'This comprehensive course will take you from beginner to advanced level. Learn the fundamentals and master advanced techniques with hands-on projects and real-world examples.'}
              </p>
            </div>

            {/* Course Outline */}
            <div className="bg-secondary-800 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-6">Course Outline</h3>
              
              {course.course_videos && course.course_videos.length > 0 ? (
                <div className="space-y-3">
                  {course.course_videos.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-start gap-4 p-4 bg-secondary-700 rounded-lg hover:bg-secondary-600 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{lesson.name}</h4>
                        <div className="flex items-center gap-4 text-secondary-400 text-sm">
                          <span className="flex items-center gap-1">
                            <FaClock className="w-3 h-3" />
                            {lesson.duration}
                          </span>
                        </div>
                      </div>
                      <FaCheckCircle className="w-5 h-5 text-secondary-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-secondary-400">No lessons available yet.</p>
                </div>
              )}

              {/* Bullet Points */}
              <div className="mt-6 pt-6 border-t border-secondary-700">
                <h4 className="text-white font-semibold mb-3">What You'll Learn:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-secondary-300">
                    <FaCheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Master the fundamentals and advanced concepts</span>
                  </li>
                  <li className="flex items-start gap-3 text-secondary-300">
                    <FaCheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Build real-world projects and applications</span>
                  </li>
                  <li className="flex items-start gap-3 text-secondary-300">
                    <FaCheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Get hands-on experience with practical exercises</span>
                  </li>
                  <li className="flex items-start gap-3 text-secondary-300">
                    <FaCheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Receive expert guidance and support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* [4] Price & Call To Action */}
          <div className="lg:col-span-1">
            <div className="bg-secondary-800 rounded-lg p-6 sticky top-24">
              {/* Price Tag */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  {course.access_type === 'free' ? (
                    <span>Free</span>
                  ) : (
                    <span>₦{course.price?.toLocaleString()}</span>
                  )}
                </div>
                <p className="text-secondary-400 text-sm">
                  {course.access_type === 'free' ? 'Lifetime access' : 'One-time payment'}
                </p>
              </div>

              {/* Pay Now Button */}
              <button
                onClick={handlePayNow}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-4"
              >
                {course.access_type === 'free' ? 'Start Learning Free' : 'Pay Now'}
              </button>

              {/* Course Details */}
              <div className="space-y-4 pt-6 border-t border-secondary-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-400">Duration</span>
                  <span className="text-white font-medium">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-400">Lessons</span>
                  <span className="text-white font-medium">{course.lessons}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-400">Level</span>
                  <span className="text-white font-medium capitalize">{course.level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-400">Instructor</span>
                  <span className="text-white font-medium">{instructorName}</span>
                </div>
              </div>

              {/* Course Includes */}
              <div className="mt-6 pt-6 border-t border-secondary-700">
                <h4 className="text-white font-semibold mb-3 text-sm">This course includes:</h4>
                <ul className="space-y-2 text-sm text-secondary-300">
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="w-4 h-4 text-primary-500" />
                    <span>{course.lessons} video lessons</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="w-4 h-4 text-primary-500" />
                    <span>Certificate of completion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="w-4 h-4 text-primary-500" />
                    <span>Lifetime access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="w-4 h-4 text-primary-500" />
                    <span>Mobile and desktop access</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <FixedFlutterwavePayment
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        planName={`Course: ${course.title}`}
        amount={course.price || 2500}
      />
    </div>
  );
};

export default AccessCoursePage;

