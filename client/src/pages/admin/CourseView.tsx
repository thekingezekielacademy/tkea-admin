import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdvancedVideoPlayer from '../../components/AdvancedVideoPlayer';

interface Video {
  id: string;
  name: string;
  duration: string;
  link: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  cover_photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const CourseView: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  console.log('CourseView render:', { courseId });
  
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);



  useEffect(() => {
    console.log('useEffect triggered with courseId:', courseId);
    if (courseId) {
      // Define the fetch function inline to avoid dependency issues
      const fetchData = async () => {
        console.log('Starting to fetch data for courseId:', courseId);
        try {
          setLoading(true);
          setError('');

          const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

          if (courseError) throw courseError;
          console.log('Course data fetched:', courseData);

          const { data: videosData, error: videosError } = await supabase
            .from('course_videos')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index');

          if (videosError) throw videosError;
          console.log('Videos data fetched:', videosData);

          setCourse(courseData);
          setVideos(videosData || []);
          
          if (videosData && videosData.length > 0) {
            setSelectedVideo(videosData[0]);
          }
        } catch (err) {
          console.error('Error fetching course:', err);
          setError('Failed to load course data');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [courseId]);



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

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  };

  const formatDuration = (duration: string) => {
    if (duration.includes(':')) {
      return duration;
    } else if (duration.includes('m') && duration.includes('s')) {
      return duration;
    } else if (duration.startsWith('PT')) {
      const minutes = duration.match(/(\d+)M/)?.[1] || '0';
      const seconds = duration.match(/(\d+)S/)?.[1] || '0';
      return `${minutes}:${seconds.padStart(2, '0')}`;
    }
    return duration;
  };

  const isYouTubeVideo = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com');
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested course could not be found.'}</p>
            <button
              onClick={() => navigate('/admin/courses')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>

      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/admin/courses')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Courses
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Course Preview</h1>
                  <p className="mt-2 text-gray-600">Viewing course as a student would see it</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate(`/admin/courses/${courseId}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Course
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="md:flex">
              <div className="md:flex-shrink-0">
                {course.cover_photo_url ? (
                  <img 
                    className="h-48 w-full object-cover md:w-48" 
                    src={course.cover_photo_url} 
                    alt={course.title} 
                  />
                ) : (
                  <div className="h-48 w-full md:w-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <svg className="h-24 w-24 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-8">
                <div className="flex items-center space-x-2 mb-4">
                  {getLevelBadge(course.level)}
                  <span className="text-sm text-gray-500">
                    Created {new Date(course.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">{course.description}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>{videos.length} lessons</span>
                  <span>•</span>
                  <span>Admin Preview Mode</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Lesson Player</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Preview videos exactly as students will see them
                  <span className="ml-2 text-xs text-green-600">
                    ✨ YouTube streaming player with zero branding
                  </span>
                  <span className="ml-2 text-blue-600">
                    💡 Use unlisted YouTube videos to prevent suggestions
                  </span>
                </p>
                {selectedVideo ? (
                  <div className="-mx-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-2 px-6">{selectedVideo.name}</h4>
                    <div className="w-full overflow-hidden" style={{ minHeight: '280px', height: '55vh', maxHeight: '580px', margin: 0, padding: 0, marginBottom: 0 }}>
                        {isYouTubeVideo(selectedVideo.link) ? (
                          <AdvancedVideoPlayer
                            src={getYouTubeVideoId(selectedVideo.link)}
                            type="youtube"
                            title={selectedVideo.name}
                            autoplay={false}
                            onPlay={() => console.log('Video started playing')}
                            onPause={() => console.log('Video paused')}
                            onEnded={() => console.log('Video ended')}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
                            <div className="text-center">
                              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <p className="text-lg font-medium mb-2">Video Player</p>
                              <p className="text-sm text-gray-300">
                                {selectedVideo.link.includes('http') ? 'Direct video link detected' : 'Video source not supported'}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                Currently supporting YouTube videos only
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 px-6 -mt-2">
                      <span>Duration: {formatDuration(selectedVideo.duration)}</span>
                      <span>Lesson {videos.findIndex(v => v.id === selectedVideo.id) + 1} of {videos.length}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p>Select a lesson to start learning</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Course Lessons</h3>
                <div className="space-y-3">
                  {videos.map((video, index) => (
                    <button
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                        selectedVideo?.id === video.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              selectedVideo?.id === video.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${
                                selectedVideo?.id === video.id ? 'text-indigo-900' : 'text-indigo-900'
                              }`}>
                                {video.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDuration(video.duration)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {selectedVideo?.id === video.id && (
                          <svg className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseView;
