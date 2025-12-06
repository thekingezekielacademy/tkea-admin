import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LearningPath {
  id: string;
  title: string;
  description?: string;
  cover_photo_url?: string;
  gradient?: string;
  category: string;
  level: string;
  instructor?: string;
  duration?: string;
  estimated_course_count: number;
  purchase_price: number;
  access_type: 'free' | 'purchase';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

interface PathCourse {
  id: string;
  course_id: string;
  order_index: number;
  is_required: boolean;
  courses: {
    id: string;
    title: string;
    description?: string;
    cover_photo_url?: string;
    level?: string;
    category?: string;
    purchase_price?: number;
    access_type?: string;
  } | null;
}

const LearningPathView: React.FC = () => {
  const navigate = useNavigate();
  const { id: pathId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [pathCourses, setPathCourses] = useState<PathCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Normalize amount (handle both kobo and naira formats)
  const normalizeAmount = (raw: number) => {
    if (typeof raw !== 'number' || isNaN(raw)) return 0;
    if (raw >= 100000 && raw % 100 === 0) return Math.round(raw / 100); // Kobo to naira
    if (raw >= 100 && raw < 10000) return raw; // Already in naira
    if (raw > 0 && raw < 100) return raw * 100; // Legacy fix
    return raw;
  };

  useEffect(() => {
    if (pathId) {
      fetchLearningPath();
    }
  }, [pathId]);

  const fetchLearningPath = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch learning path details
      const { data: pathData, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', pathId)
        .single();

      if (pathError) throw pathError;
      setLearningPath(pathData);

      // Fetch courses in this learning path
      // Type the Supabase response to handle nested relations
      type SupabaseResponse = Array<{
        id: string;
        course_id: string;
        order_index: number;
        is_required: boolean;
        courses: Array<{
          id: string;
          title: string;
          description?: string;
          cover_photo_url?: string;
          level?: string;
          category?: string;
          purchase_price?: number;
          access_type?: string;
        }> | null;
      }>;
      
      const { data: coursesData, error: coursesError } = await supabase
        .from('learning_path_courses')
        .select(`
          id,
          course_id,
          order_index,
          is_required,
          courses (
            id,
            title,
            description,
            cover_photo_url,
            level,
            category,
            purchase_price,
            access_type
          )
        `)
        .eq('learning_path_id', pathId)
        .order('order_index', { ascending: true });

      if (coursesError) throw coursesError;
      
      // Transform the data - Supabase returns nested relations as arrays
      // We need to extract the course data properly
      const transformedCourses: PathCourse[] = ((coursesData || []) as unknown as SupabaseResponse).map((item) => {
        let courseData: PathCourse['courses'] = null;
        
        if (item.courses) {
          // Supabase nested relations come as arrays - take the first element
          if (Array.isArray(item.courses) && item.courses.length > 0) {
            courseData = item.courses[0];
          } else if (!Array.isArray(item.courses)) {
            // Fallback: if it's already an object, use it directly
            courseData = item.courses as PathCourse['courses'];
          }
        }
        
        return {
          id: item.id,
          course_id: item.course_id,
          order_index: item.order_index,
          is_required: item.is_required,
          courses: courseData
        };
      }).filter((item) => item.courses !== null);
      
      setPathCourses(transformedCourses);
    } catch (err: any) {
      console.error('Error fetching learning path:', err);
      setError('Failed to load learning path');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const normalized = normalizeAmount(amount);
    return `₦${normalized.toLocaleString('en-NG')}`;
  };

  const getLevelBadge = (level: string) => {
    const levelConfig: Record<string, { color: string; text: string }> = {
      beginner: { color: 'bg-green-100 text-green-800', text: 'Beginner' },
      intermediate: { color: 'bg-yellow-100 text-yellow-800', text: 'Intermediate' },
      advanced: { color: 'bg-red-100 text-red-800', text: 'Advanced' },
      expert: { color: 'bg-purple-100 text-purple-800', text: 'Expert' },
      mastery: { color: 'bg-indigo-100 text-indigo-800', text: 'Mastery' }
    };
    
    const config = levelConfig[level] || levelConfig.beginner;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading learning path...</p>
        </div>
      </div>
    );
  }

  if (error || !learningPath) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Learning path not found'}</p>
          <button
            onClick={() => navigate('/admin/learning-paths')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Learning Paths
          </button>
        </div>
      </div>
    );
  }

  const normalizedPrice = normalizeAmount(learningPath.purchase_price || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/learning-paths')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Learning Paths
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{learningPath.title}</h1>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate(`/admin/learning-paths/edit/${learningPath.id}`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Photo */}
            {learningPath.cover_photo_url ? (
              <img
                src={learningPath.cover_photo_url}
                alt={learningPath.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div
                className={`w-full h-64 rounded-lg bg-gradient-to-br ${
                  learningPath.gradient || 'from-indigo-600 to-purple-600'
                }`}
              />
            )}

            {/* Description */}
            {learningPath.description && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{learningPath.description}</p>
              </div>
            )}

            {/* Courses */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Courses ({pathCourses.length})
              </h2>
              
              {pathCourses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No courses in this learning path</p>
              ) : (
                <div className="space-y-4">
                  {pathCourses.map((pathCourse, index) => (
                    <div
                      key={pathCourse.id}
                      className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      
                      {pathCourse.courses?.cover_photo_url ? (
                        <img
                          src={pathCourse.courses.cover_photo_url}
                          alt={pathCourse.courses.title}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {pathCourse.courses?.title || 'Course not found'}
                        </h3>
                        {pathCourse.courses?.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {pathCourse.courses.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          {pathCourse.is_required ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              Required
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                              Optional
                            </span>
                          )}
                          {pathCourse.courses?.purchase_price && pathCourse.courses.purchase_price > 0 && (
                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                              {formatCurrency(pathCourse.courses.purchase_price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Details Card */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      learningPath.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : learningPath.status === 'archived'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {learningPath.status.charAt(0).toUpperCase() + learningPath.status.slice(1)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  {getLevelBadge(learningPath.level)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{learningPath.category || 'Not set'}</p>
                </div>

                {learningPath.instructor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                    <p className="text-gray-900">{learningPath.instructor}</p>
                  </div>
                )}

                {learningPath.duration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <p className="text-gray-900">{learningPath.duration}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Courses</label>
                  <p className="text-gray-900">{pathCourses.length} course{pathCourses.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      learningPath.access_type === 'free'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {learningPath.access_type === 'free' ? 'Free Access' : 'Purchase Required'}
                  </span>
                </div>

                {learningPath.access_type === 'purchase' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <p className="text-2xl font-bold text-gray-900">
                      {normalizedPrice === 0 ? 'Free' : formatCurrency(learningPath.purchase_price)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathView;

