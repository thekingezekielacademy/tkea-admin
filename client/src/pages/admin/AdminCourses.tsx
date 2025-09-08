import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  cover_photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  totalDuration?: string;
}

const AdminCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch courses with their videos to calculate total duration
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          level,
          cover_photo_url,
          created_by,
          created_at,
          updated_at,
          course_videos!inner(
            duration
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data and calculate total duration
      const transformedCourses: Course[] = (coursesData || []).map(course => {
        // Calculate total duration from videos
        let totalDuration = '0:00';
        if (course.course_videos && course.course_videos.length > 0) {
          const totalSeconds = course.course_videos.reduce((total, video) => {
            const duration = video.duration;
            // Parse duration in various formats (e.g., "1:30:25", "15:30", "15m 30s", "PT5M30S")
            if (duration.includes(':')) {
              const parts = duration.split(':');
              if (parts.length === 2) {
                // Format: "15:30" (minutes:seconds)
                const [minutes, seconds] = parts.map(Number);
                return total + (minutes * 60) + (seconds || 0);
              } else if (parts.length === 3) {
                // Format: "1:30:25" (hours:minutes:seconds)
                const [hours, minutes, seconds] = parts.map(Number);
                return total + (hours * 3600) + (minutes * 60) + (seconds || 0);
              }
            } else if (duration.includes('m') && duration.includes('s')) {
              const minutes = parseInt(duration.match(/(\d+)m/)?.[1] || '0');
              const seconds = parseInt(duration.match(/(\d+)s/)?.[1] || '0');
              return total + (minutes * 60) + seconds;
            } else if (duration.startsWith('PT')) {
              // ISO 8601 duration format
              const minutes = parseInt(duration.match(/(\d+)M/)?.[1] || '0');
              const seconds = parseInt(duration.match(/(\d+)S/)?.[1] || '0');
              return total + (minutes * 60) + seconds;
            }
            return total;
          }, 0);
          
          // Convert to hours:minutes:seconds format
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          
          if (hours > 0) {
            totalDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            totalDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
        }

        return {
          id: course.id,
          title: course.title || 'Untitled Course',
          description: course.description || 'No description available',
          level: course.level || 'beginner',
          cover_photo_url: course.cover_photo_url,
          created_by: course.created_by,
          created_at: course.created_at || new Date().toISOString(),
          updated_at: course.updated_at || new Date().toISOString(),
          totalDuration
        };
      });

      setCourses(transformedCourses);
      console.log('Fetched courses:', transformedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses from database');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    
    return matchesSearch && matchesLevel;
  });

  const getLevelBadge = (level: string) => {
    const levelConfig = {
      beginner: { color: 'bg-green-100 text-green-800', text: 'Lv 1 – Beginner' },
      intermediate: { color: 'bg-yellow-100 text-yellow-800', text: 'Lv 2 – Intermediate' },
      advanced: { color: 'bg-red-100 text-red-800', text: 'Lv 3 – Advanced' },
      expert: { color: 'bg-purple-100 text-purple-800', text: 'Lv 4 – Expert' },
      mastery: { color: 'bg-indigo-100 text-indigo-800', text: 'Lv 5 – Mastery' }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.beginner;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/admin/courses/${courseId}/edit`);
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/admin/courses/${courseId}/view`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        // Delete from Supabase database
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', courseId);

        if (error) {
          throw error;
        }

        // Remove from local state
        setCourses(prev => prev.filter(course => course.id !== courseId));
        console.log(`Course ${courseId} deleted successfully`);
      } catch (err) {
        console.error('Error deleting course:', err);
        setError('Failed to delete course from database');
      }
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Admin
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
                <p className="mt-2 text-gray-600">Create, edit, and manage your course catalog</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/courses/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Course
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Courses
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, description, or instructor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Level
              </label>
              <select
                id="level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
                <option value="mastery">Mastery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Courses ({filteredCourses.length})
              </h3>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterLevel !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first course.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {course.cover_photo_url ? (
                                <img className="h-10 w-10 rounded-lg object-cover" src={course.cover_photo_url} alt={course.title} />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{course.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{course.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getLevelBadge(course.level)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {course.totalDuration || '0:00'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(course.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewCourse(course.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditCourse(course.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCourses;
