import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ClassSession {
  id: string;
  live_class_id: string;
  course_video_id: string;
  session_type: 'morning' | 'afternoon' | 'evening';
  scheduled_datetime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  started_at?: string;
  is_free: boolean;
  current_slots: number;
  max_slots: number;
  course_title?: string;
  lesson_name?: string;
}

interface Course {
  id: string;
  title: string;
  hasLiveBooth?: boolean;
}

interface LiveClass {
  id: string;
  course_id?: string;
  title?: string;
  cover_photo_url?: string | null;
  access_type?: 'free' | 'paid';
  is_active: boolean;
  course_title?: string;
  created_at: string;
}

const LiveClassesAll: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showStandaloneModal, setShowStandaloneModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [converting, setConverting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  interface StandaloneVideo {
    id: string;
    name: string;
    video_url: string;
    video_title?: string;
    video_description?: string;
    duration?: string;
  }

  const [standaloneForm, setStandaloneForm] = useState({
    title: '',
    description: '',
    access_type: 'paid' as 'free' | 'paid', // 'free' = all free, 'paid' = first 2 free
    coverPhoto: undefined as File | undefined,
    videos: [] as StandaloneVideo[]
  });
  
  const [newVideo, setNewVideo] = useState({
    name: '',
    video_url: '',
    video_title: '',
    video_description: '',
    duration: ''
  });
  const [filterDate, setFilterDate] = useState('');
  const [filterSessionType, setFilterSessionType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSessions();
      fetchCourses();
      fetchLiveClasses();
    }
  }, [user, filterDate, filterSessionType, filterStatus]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('class_sessions')
        .select(`
          id,
          live_class_id,
          course_video_id,
          video_url,
          video_title,
          video_description,
          session_type,
          scheduled_datetime,
          status,
          started_at,
          available_slots,
          current_slots,
          is_free,
          live_classes!inner(
            course_id,
            title,
            description,
            is_active,
            courses(title)
          ),
          course_videos(name, order_index)
        `)
        .order('scheduled_datetime', { ascending: true })
        .limit(100);

      // Apply filters
      if (filterDate) {
        const startOfDay = new Date(filterDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filterDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query
          .gte('scheduled_datetime', startOfDay.toISOString())
          .lte('scheduled_datetime', endOfDay.toISOString());
      } else {
        // Default: show future sessions
        query = query.gte('scheduled_datetime', new Date().toISOString());
      }

      if (filterSessionType !== 'all') {
        query = query.eq('session_type', filterSessionType);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      // Transform data and filter out sessions from inactive live classes
      const transformedSessions: ClassSession[] = (data || [])
        .filter((session: any) => session.live_classes?.is_active !== false) // Only active live classes
        .map((session: any) => {
        // Handle both course-based and standalone live classes
        const isStandalone = !session.live_classes?.course_id;
        
        // Course title: from courses table (course-based) or title field (standalone)
        const courseTitle = isStandalone 
          ? session.live_classes?.title || 'Standalone Live Class'
          : session.live_classes?.courses?.title || 'Unknown Course';
        
        // Lesson name: from course_videos (course-based) or video_title (standalone)
        const lessonName = isStandalone
          ? session.video_title || session.live_classes?.title || 'Live Session'
          : session.course_videos?.name || 'Unknown Lesson';
        
        // Determine if session is free
        // For course-based: first 2 lessons are free
        // For standalone: use is_free column (defaults to true)
        const orderIndex = session.course_videos?.order_index ?? 999;
        const isFree = session.is_free !== undefined 
          ? session.is_free 
          : (isStandalone ? true : orderIndex < 2);
        
        // Handle slots
        const availableSlots = session.available_slots || 25;
        
        return {
          id: session.id,
          live_class_id: session.live_class_id,
          course_video_id: session.course_video_id,
          session_type: session.session_type,
          scheduled_datetime: session.scheduled_datetime,
          status: session.status,
          started_at: session.started_at,
          is_free: isFree,
          current_slots: session.current_slots || availableSlots,
          max_slots: availableSlots,
          course_title: courseTitle,
          lesson_name: lessonName
        };
      });

      setSessions(transformedSessions);
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('title', { ascending: true });

      if (error) throw error;

      // Check which courses already have Live Booth
      const { data: liveClasses, error: liveClassesError } = await supabase
        .from('live_classes')
        .select('course_id');

      if (!liveClassesError && liveClasses) {
        const liveBoothCourseIds = new Set(liveClasses.map(lc => lc.course_id).filter(Boolean));
        const coursesWithStatus = (data || []).map(course => ({
          ...course,
          hasLiveBooth: liveBoothCourseIds.has(course.id)
        }));
        setCourses(coursesWithStatus);
      } else {
        setCourses(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchLiveClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('live_classes')
        .select(`
          id,
          course_id,
          title,
          cover_photo_url,
          is_active,
          created_at,
          courses(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched live classes raw data:', data);

      const transformedLiveClasses: LiveClass[] = (data || []).map((lc: any) => {
        const isStandalone = !lc.course_id;
        const title = isStandalone ? (lc.title || null) : null;
        const courseTitle = !isStandalone ? (lc.courses?.title || null) : null;
        
        console.log('Processing live class:', { 
          id: lc.id, 
          course_id: lc.course_id, 
          title: lc.title, 
          courses_title: lc.courses?.title,
          isStandalone,
          finalTitle: title,
          finalCourseTitle: courseTitle
        });
        
        return {
          id: lc.id,
          course_id: lc.course_id || null,
          title: title,
          cover_photo_url: lc.cover_photo_url || null, // Cover image URL
          access_type: lc.access_type || 'paid', // Access type: 'free' or 'paid'
          is_active: lc.is_active,
          course_title: courseTitle,
          created_at: lc.created_at
        };
      });

      console.log('Transformed live classes:', transformedLiveClasses);
      setLiveClasses(transformedLiveClasses);
    } catch (err: any) {
      console.error('Error fetching live classes:', err);
    }
  };

  const toggleLiveClassActive = async (liveClassId: string, currentStatus: boolean) => {
    try {
      setToggling(liveClassId);
      setError('');
      setSuccess('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/admin/live-booth/toggle-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          liveClassId,
          isActive: !currentStatus
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update live class status');
      }

      setSuccess(result.message || (currentStatus ? 'Live class stopped' : 'Live class activated'));
      fetchLiveClasses();
      fetchSessions();
    } catch (err: any) {
      console.error('Error toggling live class status:', err);
      setError(err.message || 'Failed to update live class status');
    } finally {
      setToggling(null);
    }
  };

  const convertCourse = async (courseId: string) => {
    // Prevent multiple simultaneous conversions
    if (converting) {
      console.warn('Conversion already in progress, ignoring request');
      return;
    }

    try {
      setConverting(true);
      setError('');
      setSuccess('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Use Express server API URL for local development
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/admin/live-booth/convert-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ courseId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to convert course');
      }

      setSuccess(`Course converted successfully! ${result.data.sessionsCreated} sessions created.`);
      setShowConvertModal(false);
      fetchSessions();
      fetchCourses();
      fetchLiveClasses();
    } catch (err: any) {
      console.error('Error converting course:', err);
      setError(err.message || 'Failed to convert course');
    } finally {
      setConverting(false);
    }
  };

  const addStandaloneVideo = () => {
    if (!newVideo.name.trim() || !newVideo.video_url.trim()) {
      setError('Video name and URL are required');
      return;
    }

    const video: StandaloneVideo = {
      id: Math.random().toString(36).substr(2, 9),
      name: newVideo.name.trim(),
      video_url: newVideo.video_url.trim(),
      video_title: newVideo.video_title.trim() || undefined,
      video_description: newVideo.video_description.trim() || undefined,
      duration: newVideo.duration.trim() || undefined
    };

    setStandaloneForm(prev => ({
      ...prev,
      videos: [...prev.videos, video]
    }));

    setNewVideo({ name: '', video_url: '', video_title: '', video_description: '', duration: '' });
    setError('');
  };

  const removeStandaloneVideo = (videoId: string) => {
    setStandaloneForm(prev => ({
      ...prev,
      videos: prev.videos.filter(v => v.id !== videoId)
    }));
  };

  const moveStandaloneVideoUp = (index: number) => {
    if (index === 0) return;
    setStandaloneForm(prev => {
      const newVideos = [...prev.videos];
      [newVideos[index], newVideos[index - 1]] = [newVideos[index - 1], newVideos[index]];
      return { ...prev, videos: newVideos };
    });
  };

  const moveStandaloneVideoDown = (index: number) => {
    setStandaloneForm(prev => {
      if (index === prev.videos.length - 1) return prev;
      const newVideos = [...prev.videos];
      [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
      return { ...prev, videos: newVideos };
    });
  };

  const createStandaloneLiveClass = async () => {
    try {
      setConverting(true);
      setError('');
      setSuccess('');

      if (!standaloneForm.title.trim()) {
        setError('Title is required');
        return;
      }

      if (standaloneForm.videos.length === 0) {
        setError('At least one video is required');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Upload cover photo if provided
      let coverPhotoUrl = null;
      if (standaloneForm.coverPhoto) {
        try {
          const fileExt = standaloneForm.coverPhoto.name.split('.').pop();
          const fileName = `live-class-${Date.now()}.${fileExt}`;
          const filePath = fileName;

          console.log('Uploading cover photo:', {
            name: standaloneForm.coverPhoto.name,
            type: standaloneForm.coverPhoto.type,
            size: standaloneForm.coverPhoto.size,
            path: filePath
          });

          // Convert to ArrayBuffer
          const arrayBuffer = await standaloneForm.coverPhoto.arrayBuffer();
          
          const { error: uploadError } = await supabase.storage
            .from('course-covers')
            .upload(filePath, arrayBuffer);

          if (uploadError) {
            console.warn('Cover photo upload failed, continuing without it:', uploadError.message);
            // Don't throw error, just continue without cover photo
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('course-covers')
              .getPublicUrl(filePath);

            coverPhotoUrl = publicUrl;
            console.log('Cover photo uploaded successfully:', coverPhotoUrl);
          }
        } catch (uploadErr) {
          console.warn('Cover photo upload failed, continuing without it:', uploadErr);
          // Don't throw error, just continue without cover photo
        }
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/admin/live-booth/create-standalone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: standaloneForm.title,
          description: standaloneForm.description,
          access_type: standaloneForm.access_type,
          coverPhotoUrl: coverPhotoUrl,
          videos: standaloneForm.videos.map(v => ({
            name: v.name,
            video_url: v.video_url,
            video_title: v.video_title,
            video_description: v.video_description,
            duration: v.duration
          }))
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create standalone live class');
      }

      setSuccess(`Standalone live class created successfully! ${result.data.sessionsCreated} sessions created.`);
      setShowStandaloneModal(false);
      setStandaloneForm({
        title: '',
        description: '',
        access_type: 'paid',
        coverPhoto: undefined,
        videos: []
      });
      setNewVideo({ name: '', video_url: '', video_title: '', video_description: '', duration: '' });
      fetchSessions();
      fetchLiveClasses();
    } catch (err: any) {
      console.error('Error creating standalone live class:', err);
      setError(err.message || 'Failed to create standalone live class');
    } finally {
      setConverting(false);
    }
  };

  const activateScheduling = async () => {
    try {
      setActivating(true);
      setError('');
      setSuccess('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Use Express server API URL for local development
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/cron/auto-schedule-live-booth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to activate scheduling');
      }

      setSuccess(`Scheduling activated! ${result.scheduled || 0} sessions created.`);
      fetchSessions();
    } catch (err: any) {
      console.error('Error activating scheduling:', err);
      setError(err.message || 'Failed to activate scheduling');
    } finally {
      setActivating(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSessionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      morning: '🌅 Morning',
      afternoon: '☀️ Afternoon',
      evening: '🌙 Evening'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
    };
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Classes - All Sessions</h1>
          <p className="text-gray-600">Manage and view all scheduled Live Booth classes</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
            <button
              onClick={() => setShowConvertModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Convert Courses to Live Booth
            </button>
          <button
            onClick={() => setShowStandaloneModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Standalone Live Class
          </button>
          <button
            onClick={activateScheduling}
            disabled={activating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activating ? 'Activating...' : 'Activate Now'}
          </button>
          <button
            onClick={fetchSessions}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        {/* Live Classes Management Section */}
        {liveClasses.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Live Classes Management</h2>
              <p className="text-sm text-gray-600 mt-1">Stop or activate live classes</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {liveClasses.map((liveClass) => (
                    <tr key={liveClass.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          liveClass.course_id 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {liveClass.course_id ? 'Course-Based' : 'Standalone'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {liveClass.course_id 
                            ? (liveClass.course_title || 'Untitled Course')
                            : (liveClass.title || (
                              <span className="text-red-500 italic">⚠️ Title Missing</span>
                            ))
                          }
                        </div>
                        {!liveClass.course_id && !liveClass.title && (
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {liveClass.id.substring(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!liveClass.course_id ? (
                          <>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              liveClass.access_type === 'free'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {liveClass.access_type === 'free' ? 'FREE' : 'PAID'}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {liveClass.access_type === 'free' 
                                ? 'All classes free'
                                : 'First 2 classes free'}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          liveClass.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {liveClass.is_active ? 'Active' : 'Stopped'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleLiveClassActive(liveClass.id, liveClass.is_active)}
                          disabled={toggling === liveClass.id}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            liveClass.is_active
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {toggling === liveClass.id 
                            ? 'Updating...' 
                            : liveClass.is_active 
                              ? 'Stop' 
                              : 'Activate'
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
              <select
                value={filterSessionType}
                onChange={(e) => setFilterSessionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading classes...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Found</h3>
            <p className="text-gray-600 mb-6">Convert a course to Live Booth to start scheduling classes.</p>
            <button
              onClick={() => setShowConvertModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Convert Courses to Live Booth
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slots</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Free</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{session.course_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.lesson_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDateTime(session.scheduled_datetime)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getSessionTypeLabel(session.session_type)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.current_slots} / {session.max_slots || 25}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.is_free ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Free</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Standalone Live Class Modal */}
        {showStandaloneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Create Standalone Live Class</h2>
                <button
                  onClick={() => setShowStandaloneModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Create a live class that appears only in the live classes section, not in courses.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={standaloneForm.title}
                    onChange={(e) => setStandaloneForm({ ...standaloneForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Special Workshop: Advanced Techniques"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={standaloneForm.description}
                    onChange={(e) => setStandaloneForm({ ...standaloneForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3}
                    placeholder="Brief description of the live class..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!file.type.startsWith('image/')) {
                          setError('Please select a valid image file');
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          setError('Image file is too large. Please select a file smaller than 10MB');
                          return;
                        }
                        setStandaloneForm({ ...standaloneForm, coverPhoto: file });
                        setError('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {standaloneForm.coverPhoto && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Selected: {standaloneForm.coverPhoto.name}</p>
                      <img
                        src={URL.createObjectURL(standaloneForm.coverPhoto)}
                        alt="Cover preview"
                        className="mt-2 w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                </div>

                {/* Videos Section */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Videos <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-2">(At least one video required)</span>
                  </label>

                  {/* Video List */}
                  {standaloneForm.videos.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {standaloneForm.videos.map((video, index) => (
                        <div key={video.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">{video.name}</div>
                            <div className="text-xs text-gray-500 truncate">{video.video_url}</div>
                            {video.duration && (
                              <div className="text-xs text-gray-400">Duration: {video.duration}</div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveStandaloneVideoUp(index)}
                              disabled={index === 0}
                              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStandaloneVideoDown(index)}
                              disabled={index === standaloneForm.videos.length - 1}
                              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStandaloneVideo(video.id)}
                              className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Video Form */}
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Video Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newVideo.name}
                          onChange={(e) => setNewVideo({ ...newVideo, name: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., Introduction to Advanced Techniques"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Video URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={newVideo.video_url}
                          onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="https://youtube.com/watch?v=... or direct video URL"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Video Title (Optional)
                          </label>
                          <input
                            type="text"
                            value={newVideo.video_title}
                            onChange={(e) => setNewVideo({ ...newVideo, video_title: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Optional display title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Duration (Optional)
                          </label>
                          <input
                            type="text"
                            value={newVideo.duration}
                            onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="e.g., 15:30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Video Description (Optional)
                        </label>
                        <textarea
                          value={newVideo.video_description}
                          onChange={(e) => setNewVideo({ ...newVideo, video_description: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          rows={2}
                          placeholder="Additional details about this video..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addStandaloneVideo}
                        className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        + Add Video
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={createStandaloneLiveClass}
                    disabled={converting || !standaloneForm.title || standaloneForm.videos.length === 0}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {converting ? 'Creating...' : 'Create Live Class'}
                  </button>
                  <button
                    onClick={() => setShowStandaloneModal(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Convert Course Modal */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Convert Course to Live Booth</h2>
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Select a course to convert to Live Booth. Classes will be automatically scheduled for the next 30 days.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      {course.hasLiveBooth && (
                        <p className="text-sm text-green-600">Already converted</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!course.hasLiveBooth && !converting) {
                          convertCourse(course.id);
                        }
                      }}
                      disabled={course.hasLiveBooth || converting}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {course.hasLiveBooth ? 'Converted' : 'Convert'}
                    </button>
                  </div>
                ))}
              </div>
              {courses.length === 0 && (
                <p className="text-gray-600 text-center py-8">No courses available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClassesAll;

