'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { FaPlay, FaClock, FaUsers, FaStar, FaBook, FaCheckCircle, FaLock, FaArrowLeft, FaShare, FaHeart } from 'react-icons/fa';
import ProtectedRoute from '@/components/ProtectedRoute';
import AccessControl from '@/components/AccessControl';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  rating: number;
  students: number;
  price: number;
  image: string;
  lessons: Lesson[];
  category: string;
  language: string;
  lastUpdated: string;
  requirements: string[];
  whatYouWillLearn: string[];
  // Access control
  access_type?: 'free' | 'membership';
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  description: string;
}

const CourseOverview: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<number>(0);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock course data - replace with actual API call
        const mockCourse: Course = {
          id: params.courseId as string,
          title: 'Digital Marketing Fundamentals',
          description: 'Learn the essential concepts and strategies of digital marketing in this comprehensive course. Master SEO, social media marketing, content creation, and analytics to boost your business growth.',
          instructor: 'John Smith',
          duration: '8 hours',
          level: 'Beginner',
          rating: 4.8,
          students: 1250,
          price: 99.99,
          image: '/img/course-1.jpg',
          category: 'Digital Marketing',
          language: 'English',
          lastUpdated: '2024-01-15',
          requirements: [
            'Basic computer skills',
            'Internet connection',
            'No prior marketing experience required'
          ],
          whatYouWillLearn: [
            'Master digital marketing fundamentals',
            'Create effective social media strategies',
            'Understand SEO and content marketing',
            'Analyze marketing performance with analytics',
            'Build and execute marketing campaigns'
          ],
          lessons: [
            {
              id: '1',
              title: 'Introduction to Digital Marketing',
              duration: '15 min',
              description: 'Get started with the basics of digital marketing and understand the digital landscape.',
              isCompleted: true,
              isLocked: false
            },
            {
              id: '2',
              title: 'Understanding Your Audience',
              duration: '20 min',
              description: 'Learn how to identify and understand your target audience for better marketing results.',
              isCompleted: false,
              isLocked: false
            },
            {
              id: '3',
              title: 'Content Marketing Strategy',
              duration: '25 min',
              description: 'Develop a comprehensive content marketing strategy that drives engagement and conversions.',
              isCompleted: false,
              isLocked: true
            },
            {
              id: '4',
              title: 'Social Media Marketing',
              duration: '30 min',
              description: 'Master social media platforms and create engaging content that builds your brand.',
              isCompleted: false,
              isLocked: true
            },
            {
              id: '5',
              title: 'SEO Fundamentals',
              duration: '35 min',
              description: 'Learn search engine optimization techniques to improve your website visibility.',
              isCompleted: false,
              isLocked: true
            }
          ]
        };

        setCourse(mockCourse);
        
        // Mock user progress
        setUserProgress(20); // 20% completed
        setIsEnrolled(true); // User is enrolled
        
      } catch (err) {
        setError('Failed to load course data');
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.courseId) {
      fetchCourse();
    }
  }, [params.courseId]);

  const handleStartLearning = () => {
    if (course && course.lessons.length > 0) {
      const firstLesson = course.lessons[0];
      router.push(`/course/${course.id}/lesson/${firstLesson.id}`);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.isLocked) {
      router.push(`/course/${course?.id}/lesson/${lesson.id}`);
    }
  };

  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: course?.title,
        text: course?.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-900 mb-4">Course Not Found</h1>
            <p className="text-primary-600 mb-6">{error || 'The course you\'re looking for doesn\'t exist.'}</p>
            <button
              onClick={() => router.push('/courses')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse All Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <AccessControl>
        <div className="min-h-screen bg-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => router.push('/courses')}
            className="hover:text-primary-600 transition-colors"
          >
            Courses
          </button>
          <span>/</span>
          <span className="text-gray-900">{course.category}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-4">
                    {course.title}
                  </h1>
                  <p className="text-lg text-primary-600 mb-6">
                    {course.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={handleFavoriteToggle}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorited ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaHeart className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FaShare className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center text-primary-600">
                  <FaUsers className="h-5 w-5 mr-2" />
                  {course.students.toLocaleString()} students
                </div>
                <div className="flex items-center text-primary-600">
                  <FaClock className="h-5 w-5 mr-2" />
                  {course.duration}
                </div>
                <div className="flex items-center text-primary-600">
                  <FaStar className="h-5 w-5 mr-2" />
                  {course.rating} (125 reviews)
                </div>
                <div className="flex items-center text-primary-600">
                  <FaBook className="h-5 w-5 mr-2" />
                  {course.level}
                </div>
                <div className="text-primary-600">
                  Updated {course.lastUpdated}
                </div>
              </div>

              {/* Progress Bar */}
              {isEnrolled && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Your Progress</span>
                    <span className="text-sm text-gray-500">{userProgress}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${userProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Course Image */}
            <div className="mb-8">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-64 object-cover rounded-2xl shadow-lg"
              />
            </div>

            {/* What You'll Learn */}
            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-6 mb-8">
              <h2 className="text-xl font-semibold text-primary-900 mb-4">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.whatYouWillLearn.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <FaCheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Content */}
            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-6 mb-8">
              <h2 className="text-xl font-semibold text-primary-900 mb-6">Course Content</h2>
              
              <div className="space-y-4">
                {course.lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id} 
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      lesson.isLocked ? 'bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div 
                      className="flex items-center space-x-4 flex-1 cursor-pointer"
                      onClick={() => handleLessonClick(lesson)}
                    >
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        {lesson.isCompleted ? (
                          <FaCheckCircle className="h-4 w-4 text-green-600" />
                        ) : lesson.isLocked ? (
                          <FaLock className="h-4 w-4 text-gray-400" />
                        ) : (
                          <span className="text-sm font-semibold text-primary-600">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-primary-900">{lesson.title}</h3>
                        <p className="text-sm text-gray-600">{lesson.description}</p>
                        <p className="text-sm text-primary-600">{lesson.duration}</p>
                      </div>
                    </div>
                    <button
                      disabled={lesson.isLocked}
                      onClick={() => handleLessonClick(lesson)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        lesson.isLocked
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : lesson.isCompleted
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {lesson.isCompleted ? 'Completed' : lesson.isLocked ? 'Locked' : 'Start'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-6">
              <h2 className="text-xl font-semibold text-primary-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {course.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-primary-600 mt-1">•</span>
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary-900 mb-2">
                  ${course.price}
                </div>
                <p className="text-primary-600">One-time payment</p>
              </div>

              <button 
                onClick={handleStartLearning}
                className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mb-4"
              >
                <FaPlay className="h-5 w-5 mr-2" />
                {isEnrolled ? 'Continue Learning' : 'Start Learning'}
              </button>

              <div className="space-y-4 text-sm mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">Instructor</span>
                  <span className="text-primary-900 font-medium">{course.instructor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">Duration</span>
                  <span className="text-primary-900 font-medium">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">Level</span>
                  <span className="text-primary-900 font-medium">{course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">Language</span>
                  <span className="text-primary-900 font-medium">{course.language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">Students</span>
                  <span className="text-primary-900 font-medium">{course.students.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">This course includes:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• {course.lessons.length} video lessons</li>
                  <li>• Certificate of completion</li>
                  <li>• Lifetime access</li>
                  <li>• Mobile and desktop access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AccessControl>
    </ProtectedRoute>
  );
};

export default CourseOverview;
